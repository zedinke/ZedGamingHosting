import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Skip middleware for Next internals and static assets
  const skipPrefixes = ['/api', '/_next', '/_vercel'];
  if (skipPrefixes.some((prefix) => pathname.startsWith(prefix)) || /\.[\w]+$/.test(pathname)) {
    const response = NextResponse.next();
    response.headers.set('Content-Type', 'text/html; charset=utf-8');
    return response;
  }

  const locales = ['hu', 'en'];
  const segments = pathname.split('/').filter(Boolean);
  const hasLocale = segments.length > 0 && locales.includes(segments[0]);

  // If no locale prefix, redirect to default (hu) preserving path/query
  if (!hasLocale) {
    const target = `/hu${pathname.startsWith('/') ? pathname : '/' + pathname}${search}`;
    return NextResponse.redirect(new URL(target, request.url));
  }

  const response = NextResponse.next();
  response.headers.set('Content-Type', 'text/html; charset=utf-8');
  return response;
}

export const config = {
  matcher: ['/(.*)'],
};


