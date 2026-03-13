import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('authToken')?.value;
  
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
                     request.nextUrl.pathname.startsWith('/signup') ||
                     request.nextUrl.pathname.startsWith('/forgot-password') ||
                     request.nextUrl.pathname.startsWith('/reset-password');
  
  const isProfileSetupPage = request.nextUrl.pathname.startsWith('/whoareyou') ||
                             request.nextUrl.pathname.startsWith('/complete-profile');
  
  const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard') ||
                          request.nextUrl.pathname.startsWith('/royalty') ||
                          request.nextUrl.pathname.startsWith('/expenses') ||
                          request.nextUrl.pathname.startsWith('/advance') ||
                          request.nextUrl.pathname.startsWith('/settings') ||
                          request.nextUrl.pathname.startsWith('/faq');

  // Redirect unauthenticated users trying to access protected routes
  if ((isDashboardPage || isProfileSetupPage) && !authToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users trying to access auth pages (but allow profile setup)
  if (isAuthPage && authToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, svgs, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
