import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api/auth', '/api/seed'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth for login page, auth API, and static assets
  if (
    PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.endsWith('.ico')
  ) {
    return NextResponse.next();
  }

  // No password configured = auth disabled (local dev)
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) return NextResponse.next();

  // Check session cookie
  const session = request.cookies.get('phz_session')?.value;
  if (session && session === expectedToken(appPassword)) {
    return NextResponse.next();
  }

  // Redirect to login
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}

/**
 * Derive a session token from the password.
 * Simple hex hash — not crypto-grade but sufficient for a private gate.
 */
function expectedToken(password: string): string {
  let hash = 0;
  const str = `phz_session_${password}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|duckdb/).*)'],
};
