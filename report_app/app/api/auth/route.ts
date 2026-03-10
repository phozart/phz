import { NextRequest, NextResponse } from 'next/server';

function expectedToken(password: string): string {
  let hash = 0;
  const str = `phz_session_${password}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

export async function POST(req: NextRequest) {
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) {
    return NextResponse.json({ error: 'Auth not configured' }, { status: 500 });
  }

  const { password } = await req.json();
  if (password !== appPassword) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  }

  const token = expectedToken(appPassword);
  const res = NextResponse.json({ ok: true });
  res.cookies.set('phz_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('phz_session');
  return res;
}
