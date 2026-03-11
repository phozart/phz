import { NextRequest } from 'next/server';
import { dataPool } from '@/lib/db';
import { tableFromJSON, tableToIPC, RecordBatchStreamWriter } from 'apache-arrow';
import { proxyToDataService } from '@/lib/data-service';
import { getDataset } from '@/lib/datasets-registry';
import type pg from 'pg';

const VALID_DATASETS = ['sales_orders', 'employees'] as const;

// Streaming threshold: only use cursor-based streaming for very large exports
// to avoid OOM. For ≤500K rows, the direct path (single query + single Arrow
// conversion) is much faster than 50+ cursor batches.
const STREAM_THRESHOLD = 500_000;
const CURSOR_BATCH_FIRST = 10_000;
const CURSOR_BATCH = 50_000;

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Parse filter param into WHERE clause + values array */
function buildFilter(dataset: string, filterParam: string | null): { where: string; values: any[]; paramIdx: number } {
  if (!filterParam) return { where: '', values: [], paramIdx: 1 };

  const ds = getDataset(dataset);
  const validCols = new Set(ds?.pgColumns ?? []);
  const conditions: string[] = [];
  const values: any[] = [];
  let paramIdx = 1;

  for (const part of filterParam.split(',')) {
    const [col, op, ...rest] = part.split(':');
    const val = rest.join(':');
    if (!validCols.has(col)) continue;

    if (op === 'eq') {
      conditions.push(`"${col}" = $${paramIdx++}`);
      values.push(val);
    } else if (op === 'in') {
      const items = val.split('|');
      conditions.push(`"${col}" IN (${items.map(() => `$${paramIdx++}`).join(',')})`);
      values.push(...items);
    } else if (op === 'gte') {
      conditions.push(`"${col}" >= $${paramIdx++}`);
      values.push(isNaN(Number(val)) ? val : Number(val));
    } else if (op === 'lte') {
      conditions.push(`"${col}" <= $${paramIdx++}`);
      values.push(isNaN(Number(val)) ? val : Number(val));
    } else if (op === 'like') {
      conditions.push(`"${col}" ILIKE $${paramIdx++}`);
      values.push(`%${val}%`);
    }
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { where, values, paramIdx };
}

/**
 * Bulk export endpoint — serves data in CSV, JSON, or Arrow IPC format.
 * Uses cursor-based streaming for large datasets to avoid OOM.
 *
 * GET /api/data/sales_orders/export?format=csv&limit=100000&filter=region:eq:Europe
 * GET /api/data/sales_orders/export?format=json&limit=100000
 * GET /api/data/sales_orders/export?format=arrow&limit=100000
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ dataset: string }> },
) {
  const { dataset } = await params;
  if (!VALID_DATASETS.includes(dataset as any)) {
    return new Response(JSON.stringify({ error: 'Invalid dataset' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const sp = req.nextUrl.searchParams;
  const format = sp.get('format') ?? 'csv';
  const limit = Math.min(Math.max(1, Number(sp.get('limit')) || 100_000), 100_000_000);
  const offset = Math.max(0, Number(sp.get('offset')) || 0);
  const { where, values, paramIdx } = buildFilter(dataset, sp.get('filter'));

  const source = sp.get('source'); // 'rust' = Rust only, 'pg' = PG only, null = try Rust then PG
  const pool: pg.Pool = dataPool;

  // Try Rust data-service for Arrow IPC exports (fastest path) — stream-through
  if (format === 'arrow' && source !== 'pg') {
    const rustParams = new URLSearchParams({ format: 'arrow', limit: String(limit) });
    if (offset > 0) rustParams.set('offset', String(offset));
    if (sp.has('filter')) rustParams.set('filter', sp.get('filter')!);
    const rustRes = await proxyToDataService(`/api/data/${dataset}/export?${rustParams}`);
    if (rustRes && rustRes.ok && rustRes.body) {
      const rustSource = rustRes.headers.get('X-Data-Source') ?? 'rust';
      // Stream the Rust response body directly to the client — no buffering
      return new Response(rustRes.body as ReadableStream, {
        headers: {
          'Content-Type': 'application/vnd.apache.arrow.stream',
          'Content-Disposition': `attachment; filename="${dataset}.arrow"`,
          'Transfer-Encoding': 'chunked',
          'X-Data-Source': rustSource,
        },
      });
    }
    // Rust unavailable — fall through to PG Arrow streaming (same format, different backend)
  }

  // If source=rust was requested for non-arrow format, error (Rust only does Arrow)
  if (source === 'rust' && format !== 'arrow') {
    return new Response(JSON.stringify({ error: `Rust data-service only supports Arrow format, got '${format}'` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // For large datasets, stream with a PG cursor to avoid OOM
    if (limit > STREAM_THRESHOLD) {
      if (format === 'csv' || format === 'json') {
        return streamLargeExport(dataset, format, limit, offset, where, values, paramIdx);
      }
      if (format === 'arrow') {
        return cursorArrowExport(dataset, limit, offset, where, values, paramIdx);
      }
    }

    const result = await pool.query(
      `SELECT * FROM "${dataset}" ${where} ORDER BY id LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...values, limit, offset],
    );
    const rows = result.rows;

    // ── Arrow IPC ──
    if (format === 'arrow') {
      if (rows.length === 0) {
        return new Response(new Uint8Array(0), {
          headers: { 'Content-Type': 'application/vnd.apache.arrow.stream' },
        });
      }
      const cleaned = cleanDatesForArrow(rows);
      const table = tableFromJSON(cleaned);
      const ipcBuffer = tableToIPC(table);
      return new Response(ipcBuffer.buffer as ArrayBuffer, {
        headers: {
          'Content-Type': 'application/vnd.apache.arrow.stream',
          'Content-Disposition': `attachment; filename="${dataset}.arrow"`,
        },
      });
    }

    // ── JSON ──
    if (format === 'json') {
      return new Response(JSON.stringify(rows), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${dataset}.json"`,
        },
      });
    }

    // ── CSV (default) ──
    if (rows.length === 0) {
      return new Response('', { headers: { 'Content-Type': 'text/csv' } });
    }

    const columns = Object.keys(rows[0]);
    const lines: string[] = [columns.join(',')];
    for (const row of rows) {
      lines.push(columns.map(col => csvEscape(row[col])).join(','));
    }

    return new Response(lines.join('\n'), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${dataset}.csv"`,
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
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
 * Arrow IPC streaming export using PG cursor + RecordBatchStreamWriter.
 * Each cursor batch is independently converted to Arrow and streamed,
 * keeping peak memory bounded to ~one batch of JS objects.
 */
async function cursorArrowExport(dataset: string, limit: number, offset: number, where: string, values: any[], paramIdx: number) {
  const client = await pool.connect();
  const cursorName = 'arrow_cursor';
  let cancelled = false;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await client.query('BEGIN');
        await client.query(
          `DECLARE ${cursorName} CURSOR FOR SELECT * FROM "${dataset}" ${where} ORDER BY id LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
          [...values, limit, offset],
        );

        const writer = new RecordBatchStreamWriter();
        let totalFetched = 0;

        while (totalFetched < limit && !cancelled) {
          const fetchSize = totalFetched === 0 ? CURSOR_BATCH_FIRST : CURSOR_BATCH;
          const batch = await client.query(`FETCH ${fetchSize} FROM ${cursorName}`);
          if (batch.rows.length === 0) break;

          const batchTable = tableFromJSON(cleanDatesForArrow(batch.rows));
          writer.write(batchTable);
          totalFetched += batch.rows.length;

          // Flush accumulated bytes to the response stream
          const bytes = writer.toUint8Array(true);
          if (bytes.byteLength > 0) {
            controller.enqueue(bytes);
          }
        }

        writer.close();
        const finalBytes = writer.toUint8Array(true);
        if (finalBytes.byteLength > 0) {
          controller.enqueue(finalBytes);
        }

        await client.query('CLOSE ' + cursorName).catch(() => {});
        await client.query('COMMIT').catch(() => {});
        controller.close();
      } catch (err: any) {
        await client.query('ROLLBACK').catch(() => {});
        try { controller.error(err); } catch { /* already closed */ }
      } finally {
        client.release();
      }
    },
    cancel() {
      cancelled = true;
      client.query('ROLLBACK').catch(() => {}).finally(() => client.release());
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/vnd.apache.arrow.stream',
      'Content-Disposition': `attachment; filename="${dataset}.arrow"`,
      'Transfer-Encoding': 'chunked',
      'X-Data-Source': 'pg-arrow',
    },
  });
}

/**
 * Stream large exports using a PG cursor. Reads CURSOR_BATCH rows at a time
 * and writes them to a ReadableStream, keeping server memory constant.
 */
async function streamLargeExport(dataset: string, format: 'csv' | 'json', limit: number, offset: number, where: string, values: any[], paramIdx: number) {
  const client = await pool.connect();
  const cursorName = 'export_cursor';
  const isJson = format === 'json';
  const contentType = isJson ? 'application/json' : 'text/csv';
  const ext = isJson ? 'json' : 'csv';

  let cancelled = false;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await client.query('BEGIN');
        await client.query(
          `DECLARE ${cursorName} CURSOR FOR SELECT * FROM "${dataset}" ${where} ORDER BY id LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
          [...values, limit, offset],
        );

        let columns: string[] | null = null;
        let totalFetched = 0;
        let isFirst = true;

        if (isJson) controller.enqueue(new TextEncoder().encode('['));

        while (totalFetched < limit && !cancelled) {
          const fetchSize = totalFetched === 0 ? CURSOR_BATCH_FIRST : CURSOR_BATCH;
          const batch = await client.query(`FETCH ${fetchSize} FROM ${cursorName}`);
          if (batch.rows.length === 0) break;

          if (!columns) {
            columns = Object.keys(batch.rows[0]);
            if (!isJson) {
              controller.enqueue(new TextEncoder().encode(columns.join(',') + '\n'));
            }
          }

          const lines: string[] = [];
          for (const row of batch.rows) {
            if (isJson) {
              lines.push((isFirst ? '' : ',') + JSON.stringify(row));
              isFirst = false;
            } else {
              lines.push(columns!.map(col => csvEscape(row[col])).join(','));
            }
          }
          controller.enqueue(new TextEncoder().encode(lines.join(isJson ? '' : '\n') + (isJson ? '' : '\n')));
          totalFetched += batch.rows.length;
        }

        if (isJson && !cancelled) controller.enqueue(new TextEncoder().encode(']'));

        await client.query('CLOSE ' + cursorName).catch(() => {});
        await client.query('COMMIT').catch(() => {});
        controller.close();
      } catch (err: any) {
        await client.query('ROLLBACK').catch(() => {});
        try { controller.error(err); } catch { /* stream already closed */ }
      } finally {
        client.release();
      }
    },
    cancel() {
      cancelled = true;
      client.query('ROLLBACK').catch(() => {}).finally(() => client.release());
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${dataset}.${ext}"`,
      'Transfer-Encoding': 'chunked',
    },
  });
}

const pool = dataPool;
