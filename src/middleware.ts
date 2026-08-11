import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only guard /admin routes (except /admin/login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const adminSession = request.cookies.get('sss_admin_session')?.value;

    // Presence-only gate: a non-empty sss_admin_session cookie is treated as
    // authenticated here. The authoritative validation (DB lookup + expiry)
    // is performed server-side by AdminShell via getSession(), keeping the
    // middleware a cheap redirect without blocking on a DB round-trip.
    if (!adminSession) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
