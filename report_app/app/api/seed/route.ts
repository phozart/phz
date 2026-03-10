import { NextResponse } from 'next/server';
import { initSchema, seedSalesOrders, seedEmployees } from '@/lib/seed';

// Allow up to 5 minutes for large seeds (10M+ rows)
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const count = Math.min(Number(body.count) || 100_000, 150_000_000);

    await initSchema();
    const salesCount = await seedSalesOrders(count);
    const empCount = await seedEmployees(200);

    return NextResponse.json({ ok: true, salesCount, empCount });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
