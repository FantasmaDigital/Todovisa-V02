import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';

// Specific rate limit rules per endpoint (requests per 60 seconds)
const CUSTOM_RATE_LIMITS: Record<string, { windowMs: number; max: number }> = {
  '/api/auth/signin': { windowMs: 60000, max: 5 },
  '/api/auth/signup': { windowMs: 60000, max: 3 },
  '/api/auth/forgot-password': { windowMs: 60000, max: 3 },
  '/api/auth/update-user': { windowMs: 60000, max: 10 },
};

const DEFAULT_AUTH_RATE_LIMIT = { windowMs: 60000, max: 10 };

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // 1. Rate Limiting for Auth APIs
  if (pathname.startsWith('/api/auth')) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    const rule = CUSTOM_RATE_LIMITS[pathname] || DEFAULT_AUTH_RATE_LIMIT;
    const rateLimitKey = `${ip}:${pathname}`;
    const result = checkRateLimit(rateLimitKey, rule);

    if (!result.allowed) {
      return NextResponse.json(
        {
          error: 'Demasiadas solicitudes. Por favor, reintente en unos momentos.',
          retryAfterSeconds: Math.ceil(result.resetMs / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(result.resetMs / 1000)),
            'X-RateLimit-Limit': String(rule.max),
            'X-RateLimit-Remaining': String(result.remaining),
          },
        }
      );
    }
  }

  // 2. CSRF / Origin Validation for API Mutation Requests
  if (pathname.startsWith('/api/') && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');

    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        const isMatch =
          originUrl.host === host ||
          originUrl.hostname === 'localhost' ||
          originUrl.hostname === '127.0.0.1';

        if (!isMatch) {
          return NextResponse.json(
            { error: 'Origen de la solicitud no permitido (CSRF/Origin check failed)' },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json({ error: 'Origen inválido' }, { status: 400 });
      }
    }
  }

  // 3. Protected Client Routes: Handled client-side via authStore / Supabase session in LocalStorage

  // 4. Response with Standard Security Headers
  const response = NextResponse.next();

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/profile/:path*',
    '/agents/portal/:path*',
    '/vipro-form/evaluation/:path*',
  ],
};
