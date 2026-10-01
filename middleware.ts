import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/register', '/api/auth/login', '/api/auth/register'];

// API routes that need auth check (done at the API level, not middleware)
const API_PREFIX = '/api/';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow API auth routes
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // Check session cookie for page routes
  const sessionCookie = request.cookies.get('tile_warehouse_session');

  // For API routes, let the API handler check auth (so it can return proper JSON errors)
  if (pathname.startsWith(API_PREFIX)) {
    return NextResponse.next();
  }

  // For page routes, redirect to login if no session
  if (!sessionCookie?.value) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, manifest.json, etc.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|.*\\.svg$).*)',
  ],
};
