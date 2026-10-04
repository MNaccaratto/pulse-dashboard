import { NextResponse, type NextRequest } from 'next/server';

// Basic auth gate so a deployed dashboard isn't readable by anyone with the URL.
// Fails closed in production: no credentials configured => 503, unless demo mode is on
// (demo mode only shows fake data, so there's nothing private to protect).

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function proxy(req: NextRequest) {
  const user = process.env.DASHBOARD_USER;
  const pass = process.env.DASHBOARD_PASSWORD;

  if (!user || !pass) {
    if (process.env.NODE_ENV === 'production' && process.env.USE_MOCK_DATA !== 'true') {
      return new NextResponse('Dashboard auth is not configured.', { status: 503 });
    }
    return NextResponse.next();
  }

  const header = req.headers.get('authorization');
  if (header?.startsWith('Basic ')) {
    try {
      const decoded = atob(header.slice(6));
      const sep = decoded.indexOf(':');
      const okUser = safeEqual(decoded.slice(0, sep), user);
      const okPass = safeEqual(decoded.slice(sep + 1), pass);
      if (sep > -1 && okUser && okPass) return NextResponse.next();
    } catch {
      /* malformed header => fall through to 401 */
    }
  }

  return new NextResponse('Authentication required.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Pulse Dashboard", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};