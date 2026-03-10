import { NextResponse } from 'next/server';
import { settingsPool as pool } from '@/lib/db';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const result = await pool.query('SELECT * FROM saved_dashboards WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { name, description, config_json } = body;
    const result = await pool.query(
      'UPDATE saved_dashboards SET name=$1, description=$2, config_json=$3, updated_at=NOW() WHERE id=$4 RETURNING *',
      [name, description, JSON.stringify(config_json ?? {}), id],
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await pool.query('DELETE FROM saved_dashboards WHERE id = $1', [id]);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
