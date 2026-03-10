import { NextResponse } from 'next/server';
import { settingsPool as pool } from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(
      'SELECT * FROM saved_reports ORDER BY updated_at DESC',
    );
    return NextResponse.json(result.rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, dataset, config_json } = body;
    if (!name || !dataset) {
      return NextResponse.json({ error: 'name and dataset required' }, { status: 400 });
    }
    const result = await pool.query(
      'INSERT INTO saved_reports (name, description, dataset, config_json) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description ?? '', dataset, JSON.stringify(config_json ?? {})],
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
