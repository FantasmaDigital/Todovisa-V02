import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const protectedPaths = [
    '/profile',
    '/profile/accreditation',
    '/profile/commissions',
    '/profile/payouts',
    '/profile/team',
    '/agents/portal',
  ];

  const isProtected = protectedPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isProtected) {
    const hasAuthToken = 
      request.cookies.get('sb-access-token') || 
      request.cookies.get('supabase-auth-token') ||
      request.cookies.get('todovisa_auth_token') ||
      request.cookies.get('next-auth.session-token');

    const authHeader = request.headers.get('authorization');
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/profile/:path*',
    '/agents/portal/:path*',
    '/vipro-form/evaluation/:path*',
  ],
};
