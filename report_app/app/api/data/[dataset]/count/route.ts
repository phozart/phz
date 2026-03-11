import { NextRequest, NextResponse } from 'next/server';
import { dataPool as pool } from '@/lib/db';
import { proxyToDataService } from '@/lib/data-service';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ dataset: string }> },
) {
  const { dataset } = await params;
  if (!['sales_orders', 'employees'].includes(dataset)) {
    return NextResponse.json({ error: 'Invalid dataset' }, { status: 400 });
  }

  // Try Rust data-service first
  const rustRes = await proxyToDataService(`/api/data/${dataset}/count`);
  if (rustRes && rustRes.ok) {
    const body = await rustRes.text();
    return new Response(body, { headers: { 'Content-Type': 'application/json' } });
  }

  // Fallback: direct PG
  try {
    const result = await pool.query(`SELECT COUNT(*) FROM "${dataset}"`);
    return NextResponse.json({ count: Number(result.rows[0].count) });
  } catch (err: any) {
    if (err.message?.includes('does not exist')) {
      return NextResponse.json({ count: 0 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
