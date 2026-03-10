import { NextRequest, NextResponse } from 'next/server';
import { dataPool as pool } from '@/lib/db';

/**
 * Execute a read-only SQL query against the data pool.
 * Only SELECT queries are allowed (safety guard).
 *
 * POST /api/sql  { query: "SELECT ..." }
 * Returns { data: [...], columns: [...], rowCount, executionTime }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = (body.query ?? '').trim();

    if (!query) {
      return NextResponse.json({ error: 'Empty query' }, { status: 400 });
    }

    // Safety: only allow SELECT / WITH (CTE) queries
    const first = query.toUpperCase().replace(/^[\s(]+/, '');
    if (!first.startsWith('SELECT') && !first.startsWith('WITH')) {
      return NextResponse.json(
        { error: 'Only SELECT queries are allowed. Use SELECT or WITH ... SELECT.' },
        { status: 400 },
      );
    }

    const start = performance.now();
    const result = await pool.query(query);
    const executionTime = Math.round(performance.now() - start);

    const columns = result.fields.map((f: any) => f.name);
    return NextResponse.json({
      data: result.rows,
      columns,
      rowCount: result.rows.length,
      executionTime,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
