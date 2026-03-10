import { NextRequest, NextResponse } from 'next/server';
import { settingsPool as pool } from '@/lib/db';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const reportId = sp.get('report_id');
  const dashboardId = sp.get('dashboard_id');

  try {
    let result;
    if (reportId) {
      result = await pool.query(
        'SELECT * FROM filter_presets WHERE report_id = $1 ORDER BY created_at DESC',
        [reportId],
      );
    } else if (dashboardId) {
      result = await pool.query(
        'SELECT * FROM filter_presets WHERE dashboard_id = $1 ORDER BY created_at DESC',
        [dashboardId],
      );
    } else {
      result = await pool.query('SELECT * FROM filter_presets ORDER BY created_at DESC');
    }
    return NextResponse.json(result.rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, report_id, dashboard_id, values_json } = body;
    if (!name) {
      return NextResponse.json({ error: 'name required' }, { status: 400 });
    }
    const result = await pool.query(
      'INSERT INTO filter_presets (name, report_id, dashboard_id, values_json) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, report_id ?? null, dashboard_id ?? null, JSON.stringify(values_json ?? {})],
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }
  try {
    await pool.query('DELETE FROM filter_presets WHERE id = $1', [id]);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
