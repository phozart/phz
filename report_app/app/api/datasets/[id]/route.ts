import { NextRequest, NextResponse } from 'next/server';
import { dataPool as pool } from '@/lib/db';
import { getDataset, listDatasets } from '@/lib/datasets-registry';
import { tableFromJSON, tableToIPC, RecordBatchStreamWriter } from 'apache-arrow';
import { readFileSync } from 'fs';
import { join } from 'path';
import { proxyToDataService } from '@/lib/data-service';
import { getAggregate } from '@/lib/aggregate-cache';

const CURSOR_BATCH = 50_000;
const STREAM_THRESHOLD = 500_000;

let schemaInitialized = false;

/** Ensure PG schema exists — runs once per server lifetime.
 *  NOTE: Does NOT refresh materialized views on startup (too slow for large tables).
 *  Views are refreshed by the seed script or manually via:
 *    REFRESH MATERIALIZED VIEW sales_orders_summary;
 *    REFRESH MATERIALIZED VIEW sales_orders_by_region;
 *    REFRESH MATERIALIZED VIEW sales_orders_by_category;
 */
async function ensureSchema() {
  if (schemaInitialized) return;
  try {
    const sql = readFileSync(join(process.cwd(), 'lib/schema-data.sql'), 'utf-8');
    await pool.query(sql);
    schemaInitialized = true;
  } catch {
    // PG might not be available — that's OK, queries will fail with a clear error
  }
}

function snakeToCamel(row: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    out[k] = k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    out[k] = v;
  }
  // Redo properly
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    result[k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())] = v;
  }
  return result;
}

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function cleanDatesForArrow(rows: Record<string, any>[]): Record<string, any>[] {
  return rows.map(row => {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(row)) {
      out[k] = v instanceof Date ? v.toISOString().slice(0, 10) : v;
    }
    return out;
  });
}

/**
 * Build the equivalent Rust data-service API path from Next.js query params.
 * Returns null for modes the Rust service doesn't handle (e.g. _list).
 */
function buildRustPath(source: string, sp: URLSearchParams, mode: string): string | null {
  if (source === '_list') return null;

  const params = new URLSearchParams();
  if (sp.has('filter')) params.set('filter', sp.get('filter')!);
  if (sp.has('sort')) params.set('sort', sp.get('sort')!);

  if (mode === 'count') {
    return `/api/data/${source}/count`;
  }
  // Aggregate mode is PG-only (no Rust equivalent)
  if (mode === 'aggregate') return null;
  if (mode === 'export') {
    const format = sp.get('format') ?? 'arrow';
    // Rust service only supports Arrow IPC export — CSV/JSON fall through to PG
    if (format !== 'arrow') return null;
    params.set('format', format);
    if (sp.has('limit')) params.set('limit', sp.get('limit')!);
    const qs = params.toString();
    return `/api/data/${source}/export${qs ? '?' + qs : ''}`;
  }
  // page mode (default)
  params.set('offset', sp.get('offset') ?? '0');
  params.set('limit', sp.get('limit') ?? '100');
  const qs = params.toString();
  return `/api/data/${source}?${qs}`;
}

/**
 * Unified dataset endpoint.
 *
 * Modes (via ?mode= query param):
 *   count    — returns { count }
 *   page     — returns { data, totalCount, executionTime } (default, paginated)
 *   export   — returns bulk data as CSV, JSON, or Arrow IPC
 *
 * Common params:
 *   sort     — field:asc|desc
 *   filter   — field:op:value (comma-separated)
 *
 * Page mode params:
 *   offset, limit (max 1000)
 *
 * Export mode params:
 *   format   — csv|json|arrow
 *   limit    — max 100_000_000
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Special case: list all datasets
  if (id === '_list') {
    return NextResponse.json(listDatasets().map(d => ({
      id: d.id, name: d.name, description: d.description,
    })));
  }

  const ds = getDataset(id);
  if (!ds) {
    return NextResponse.json({ error: `Unknown dataset: ${id}` }, { status: 400 });
  }

  // ── Try Rust data-service first ──
  const mode = req.nextUrl.searchParams.get('mode') ?? 'page';
  const rustPath = buildRustPath(id, req.nextUrl.searchParams, mode);
  if (rustPath) {
    const rustRes = await proxyToDataService(rustPath);
    if (rustRes && rustRes.ok) {
      // Forward the Rust response directly
      const contentType = rustRes.headers.get('content-type') ?? 'application/json';
      const body = await rustRes.arrayBuffer();
      return new Response(body, {
        headers: {
          'Content-Type': contentType,
          ...(rustRes.headers.get('content-disposition')
            ? { 'Content-Disposition': rustRes.headers.get('content-disposition')! }
            : {}),
        },
      });
    }
    // Rust service unavailable — fall through to direct PG
  }

  const sp = req.nextUrl.searchParams;
  const table = ds.sourceTable;
  const validCols = new Set(ds.pgColumns);

  // Build WHERE clause
  const conditions: string[] = [];
  const values: any[] = [];
  let paramIdx = 1;
  const filterParam = sp.get('filter');
  if (filterParam) {
    for (const part of filterParam.split(',')) {
      const [col, op, ...rest] = part.split(':');
      const val = rest.join(':');
      if (!validCols.has(col)) continue;
      if (op === 'eq') { conditions.push(`"${col}" = $${paramIdx++}`); values.push(val); }
      else if (op === 'in') {
        const items = val.split('|');
        conditions.push(`"${col}" IN (${items.map(() => `$${paramIdx++}`).join(',')})`);
        values.push(...items);
      }
      else if (op === 'gte') { conditions.push(`"${col}" >= $${paramIdx++}`); values.push(isNaN(Number(val)) ? val : Number(val)); }
      else if (op === 'lte') { conditions.push(`"${col}" <= $${paramIdx++}`); values.push(isNaN(Number(val)) ? val : Number(val)); }
      else if (op === 'like') { conditions.push(`"${col}" ILIKE $${paramIdx++}`); values.push(`%${val}%`); }
    }
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Sort
  let orderBy = 'ORDER BY id';
  const sortParam = sp.get('sort');
  if (sortParam) {
    const [col, dir] = sortParam.split(':');
    if (validCols.has(col)) orderBy = `ORDER BY "${col}" ${dir === 'desc' ? 'DESC' : 'ASC'}`;
  }

  try {
    // ── AGGREGATE ──  (fast KPIs + chart breakdowns)
    // Unfiltered: materialized views refreshed every 15 min (~1ms read).
    // Falls back to TABLESAMPLE (~50ms) if views don't exist yet.
    // Filtered: exact live queries.
    // Note: aggregate mode skips ensureSchema() — it uses its own views/queries.
    if (mode === 'aggregate') {
      const hasFilters = where.length > 0;

      if (!hasFilters && table === 'sales_orders') {
        // Fast path: cached aggregate (materialized view or TABLESAMPLE fallback)
        const agg = await getAggregate();
        return NextResponse.json(agg);
      }

      // Filtered: exact queries (slower but necessary for correct results)
      const start = performance.now();
      const [totals, byRegion, byCategory, byMonth] = await Promise.all([
        pool.query(
          `SELECT COUNT(*) as count, COALESCE(SUM(amount),0) as revenue, COALESCE(SUM(profit),0) as profit FROM "${table}" ${where}`,
          values,
        ),
        pool.query(
          `SELECT region, COALESCE(SUM(amount),0)::bigint as revenue FROM "${table}" ${where} GROUP BY region ORDER BY revenue DESC LIMIT 12`,
          values,
        ),
        pool.query(
          `SELECT category, COALESCE(SUM(amount),0)::bigint as revenue FROM "${table}" ${where} GROUP BY category ORDER BY revenue DESC LIMIT 8`,
          values,
        ),
        pool.query(
          `SELECT TO_CHAR(date, 'YYYY-MM') as month, COALESCE(SUM(amount),0)::bigint as revenue, COALESCE(SUM(profit),0)::bigint as profit FROM "${table}" ${where} GROUP BY TO_CHAR(date, 'YYYY-MM') ORDER BY month`,
          values,
        ),
      ]);
      const executionTime = Math.round(performance.now() - start);
      const row = totals.rows[0] ?? { count: 0, revenue: 0, profit: 0 };
      return NextResponse.json({
        count: Number(row.count),
        revenue: Number(row.revenue),
        profit: Number(row.profit),
        avgOrder: Number(row.count) > 0 ? Number(row.revenue) / Number(row.count) : 0,
        byRegion: byRegion.rows.map((r: any) => ({ region: r.region, revenue: Number(r.revenue) })),
        byCategory: byCategory.rows.map((r: any) => ({ category: r.category, revenue: Number(r.revenue) })),
        byMonth: byMonth.rows.map((r: any) => ({ month: r.month, revenue: Number(r.revenue), profit: Number(r.profit) })),
        executionTime,
        source: 'live_query',
      });
    }

    // Schema setup needed for detail queries (count, page, export) — not aggregate
    await ensureSchema();

    // ── COUNT ──
    if (mode === 'count') {
      const result = await pool.query(`SELECT COUNT(*) FROM "${table}" ${where}`, values);
      return NextResponse.json({ count: Number(result.rows[0].count) });
    }

    // ── PAGE (default) ──
    if (mode === 'page') {
      const offset = Math.max(0, Number(sp.get('offset')) || 0);
      const limit = Math.min(Math.max(1, Number(sp.get('limit')) || 100), 1000);

      const start = performance.now();
      const [dataResult, countResult] = await Promise.all([
        pool.query(
          `SELECT * FROM "${table}" ${where} ${orderBy} LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
          [...values, limit, offset],
        ),
        pool.query(`SELECT COUNT(*) FROM "${table}" ${where}`, values),
      ]);
      const executionTime = Math.round(performance.now() - start);
      return NextResponse.json({
        data: dataResult.rows.map(snakeToCamel),
        totalCount: Number(countResult.rows[0].count),
        executionTime,
      });
    }

    // ── EXPORT ──
    if (mode === 'export') {
      const format = sp.get('format') ?? 'json';
      const limit = Math.min(Math.max(1, Number(sp.get('limit')) || 100_000), 100_000_000);

      // Large datasets: stream CSV/JSON, cursor Arrow
      if (limit > STREAM_THRESHOLD) {
        if (format === 'csv' || format === 'json') {
          return streamExport(table, where, values, orderBy, paramIdx, format, limit);
        }
        if (format === 'arrow') {
          return cursorArrowExport(table, where, values, orderBy, paramIdx, limit);
        }
      }

      // Small datasets: load all at once
      const result = await pool.query(
        `SELECT * FROM "${table}" ${where} ${orderBy} LIMIT $${paramIdx}`,
        [...values, limit],
      );
      const rows = result.rows;

      if (format === 'arrow') {
        if (rows.length === 0) return new Response(new Uint8Array(0), { headers: { 'Content-Type': 'application/vnd.apache.arrow.stream' } });
        const tbl = tableFromJSON(cleanDatesForArrow(rows));
        const buf = tableToIPC(tbl);
        return new Response(buf.buffer as ArrayBuffer, {
          headers: { 'Content-Type': 'application/vnd.apache.arrow.stream', 'Content-Disposition': `attachment; filename="${id}.arrow"` },
        });
      }

      if (format === 'csv') {
        if (rows.length === 0) return new Response('', { headers: { 'Content-Type': 'text/csv' } });
        const cols = Object.keys(rows[0]);
        const lines = [cols.join(','), ...rows.map(r => cols.map(c => csvEscape(r[c])).join(','))];
        return new Response(lines.join('\n'), {
          headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="${id}.csv"` },
        });
      }

      // JSON (default export format)
      return new Response(JSON.stringify(rows), {
        headers: { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="${id}.json"` },
      });
    }

    return NextResponse.json({ error: `Unknown mode: ${mode}. Use: count, page, aggregate, export` }, { status: 400 });

  } catch (err: any) {
    // Table doesn't exist → return empty result with 0 count
    if (err.message?.includes('does not exist')) {
      if (mode === 'count') return NextResponse.json({ count: 0 });
      if (mode === 'aggregate') return NextResponse.json({ count: 0, revenue: 0, profit: 0, avgOrder: 0, byRegion: [], byCategory: [], executionTime: 0 });
      if (mode === 'page') return NextResponse.json({ data: [], totalCount: 0, executionTime: 0 });
      return new Response('[]', { headers: { 'Content-Type': 'application/json' } });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── Streaming helpers ──────────────────────────────────────────────────

function streamExport(
  table: string, where: string, values: any[], orderBy: string,
  paramIdx: number, format: 'csv' | 'json', limit: number,
) {
  const isJson = format === 'json';
  let clientReleased = false;

  const streamBody = new ReadableStream({
    async start(controller) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          `DECLARE export_cur CURSOR FOR SELECT * FROM "${table}" ${where} ${orderBy} LIMIT $${paramIdx}`,
          [...values, limit],
        );

        let columns: string[] | null = null;
        let totalFetched = 0;
        let isFirst = true;
        if (isJson) controller.enqueue(new TextEncoder().encode('['));

        while (totalFetched < limit) {
          const batch = await client.query(`FETCH ${CURSOR_BATCH} FROM export_cur`);
          if (batch.rows.length === 0) break;
          if (!columns) {
            columns = Object.keys(batch.rows[0]);
            if (!isJson) controller.enqueue(new TextEncoder().encode(columns.join(',') + '\n'));
          }
          const lines: string[] = [];
          for (const row of batch.rows) {
            if (isJson) { lines.push((isFirst ? '' : ',') + JSON.stringify(row)); isFirst = false; }
            else { lines.push(columns!.map(c => csvEscape(row[c])).join(',')); }
          }
          controller.enqueue(new TextEncoder().encode(lines.join(isJson ? '' : '\n') + (isJson ? '' : '\n')));
          totalFetched += batch.rows.length;
        }

        if (isJson) controller.enqueue(new TextEncoder().encode(']'));
        await client.query('CLOSE export_cur').catch(() => {});
        await client.query('COMMIT').catch(() => {});
        controller.close();
      } catch (err: any) {
        await client.query('ROLLBACK').catch(() => {});
        try { controller.error(err); } catch { /* already closed */ }
      } finally {
        if (!clientReleased) { clientReleased = true; client.release(); }
      }
    },
    cancel() {
      // Browser navigated away — release PG client
      clientReleased = true;
    },
  });

  return new Response(streamBody, {
    headers: {
      'Content-Type': isJson ? 'application/json' : 'text/csv',
      'Content-Disposition': `attachment; filename="${table}.${format}"`,
    },
  });
}

/**
 * Arrow IPC export using PG cursor + RecordBatchStreamWriter.
 * Converts each 50K-row batch to Arrow independently, keeping peak memory
 * bounded to ~one batch of JS objects + accumulated compact IPC bytes.
 */
async function cursorArrowExport(
  table: string, where: string, values: any[], orderBy: string,
  paramIdx: number, limit: number,
) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `DECLARE arrow_cur CURSOR FOR SELECT * FROM "${table}" ${where} ${orderBy} LIMIT $${paramIdx}`,
      [...values, limit],
    );

    const writer = new RecordBatchStreamWriter();
    let totalFetched = 0;

    while (totalFetched < limit) {
      const batch = await client.query(`FETCH ${CURSOR_BATCH} FROM arrow_cur`);
      if (batch.rows.length === 0) break;

      // Convert this batch to an Arrow table (schema is inferred)
      const batchTable = tableFromJSON(cleanDatesForArrow(batch.rows));
      // Write all record batches — schema is emitted on first write
      writer.write(batchTable);
      totalFetched += batch.rows.length;
    }

    await client.query('CLOSE arrow_cur').catch(() => {});
    await client.query('COMMIT').catch(() => {});

    if (totalFetched === 0) {
      writer.close();
      return new Response(new Uint8Array(0), {
        headers: { 'Content-Type': 'application/vnd.apache.arrow.stream' },
      });
    }

    writer.close();
    const buf = writer.toUint8Array(true);
    return new Response(buf.buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/vnd.apache.arrow.stream',
        'Content-Disposition': `attachment; filename="${table}.arrow"`,
      },
    });
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
