import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const isLocalhostHost = (hostname: string) =>
  hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';

const isDevAuthBypassEnabled = () =>
  process.env.DEV_AUTH_BYPASS === 'true' ||
  process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true' ||
  process.env.NODE_ENV !== 'production';

export async function middleware(request: NextRequest) {
  // Local-only bypass for frontend work when Supabase auth config/dashboard access is unavailable.
  if (isDevAuthBypassEnabled() && isLocalhostHost(request.nextUrl.hostname)) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith('/api/');
  
  // Define protected routes
  const protectedRoutes = ['/home', '/categories', '/api/feed', '/api/user-activity', '/api/explore'];
  const authRoutes = ['/login', '/sign-up'];
  // Note: Public routes are not processed by middleware to avoid extra work
  
  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  if (isProtectedRoute || isAuthRoute) {
  // Fast short-circuit using cookies or Authorization header: avoid calling Supabase if unnecessary
  // @supabase/ssr uses different cookie names - check for any auth-related cookies
  const cookies = request.cookies;
  const hasSessionCookie = cookies.getAll().some(cookie => 
    cookie.name.startsWith('sb-') && cookie.value
  );
  const authHeader = request.headers.get('authorization') || '';
  const hasBearer = authHeader.startsWith('Bearer ');

    // If accessing auth routes while having a session cookie, skip SSR auth call and redirect
    if (isAuthRoute && hasSessionCookie) {
      const redirectTo = request.nextUrl.searchParams.get('redirect');
      const homeUrl = new URL(redirectTo && redirectTo.startsWith('/') ? redirectTo : '/home', request.url);
      return NextResponse.redirect(homeUrl);
    }

    // If accessing a protected API route without any session cookie or bearer, immediately block.
    // For page routes, allow the request to continue; the client-side guard will handle redirects
    // when the session is only in localStorage and not yet in cookies.
    if (isProtectedRoute && !hasSessionCookie && !hasBearer) {
      if (isApiRoute) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      // Allow page navigation to proceed; client-side guards will redirect if needed.
    }

    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value,
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    try {
      // Only call Supabase for protected routes when a session cookie exists to validate it,
      // or for auth routes without a cookie we already handled above.
      let user: User | null = null;

      // For API routes with Bearer, skip server-side validation (route will handle getUser) to avoid extra call
      const shouldValidate = isProtectedRoute && (hasSessionCookie && !hasBearer);
      if (shouldValidate) {
        // Use getSession() instead of getUser() with @supabase/ssr to properly read from cookies
        const { data } = await supabase.auth.getSession();
        user = data.session?.user ?? null;
      }

      // If no user and trying to access protected route, redirect to home
      if (isProtectedRoute && !user && !(isApiRoute && hasBearer)) {
        if (isApiRoute) {
          return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        // Check if this is a navigation from a logged-out state
        const referer = request.headers.get('referer');
        const isBackNavigation = referer && new URL(referer).pathname === pathname;
        
        // For back navigation or direct access to protected routes without auth,
        // redirect to home instead of login to prevent loop
        if (isBackNavigation || pathname.startsWith('/home') || pathname.startsWith('/categories')) {
          return NextResponse.redirect(new URL('/', request.url));
        }
        
        // For other protected routes, redirect to login with redirect parameter
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // If user is logged in and trying to access auth routes, redirect appropriately
      if (isAuthRoute && (user || hasSessionCookie)) {
        const redirectTo = request.nextUrl.searchParams.get('redirect');
        const homeUrl = new URL(redirectTo && redirectTo.startsWith('/') ? redirectTo : '/home', request.url);
        return NextResponse.redirect(homeUrl);
      }

      return response;
    } catch (error) {
      console.error('Middleware authentication error:', error);
      
      // If there's an error and trying to access protected route, redirect to login
      if (isProtectedRoute) {
        if (isApiRoute) {
          return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
      
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Only run middleware where we truly need auth checks to minimize Auth requests
    '/home/:path*',
    '/(onboarding)/categories/:path*',
    '/categories/:path*',
    '/api/feed/:path*',
    '/api/user-activity',
    '/api/explore',
    '/login',
    '/sign-up',
  ],
};