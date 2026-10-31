import { type NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/sign-in', '/sign-up'];
// Better Auth's default session cookie (prefixed with __Secure- when served over HTTPS).
const SESSION_COOKIES = ['better-auth.session_token', '__Secure-better-auth.session_token'];

/**
 * Optimistic redirect only: checks that a session cookie exists. The API validates the
 * session on every request, so this is a UX shortcut, not a security boundary.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!hasSession && !isPublic) {
    const url = new URL('/sign-in', request.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  if (hasSession && isPublic) {
    return NextResponse.redirect(new URL('/meetings', request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Skip API proxy routes, Next internals and static files.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
