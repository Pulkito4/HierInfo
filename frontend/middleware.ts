import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Define protected routes
  const protectedRoutes = ['/home', '/categories'];
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
    // Fast short-circuit using cookies: avoid calling Supabase if unnecessary
    const accessToken = request.cookies.get('sb-access-token')?.value;
    const hasSessionCookie = Boolean(accessToken);

    // If accessing auth routes while having a session cookie, skip SSR auth call and redirect
    if (isAuthRoute && hasSessionCookie) {
      const redirectTo = request.nextUrl.searchParams.get('redirect');
      const homeUrl = new URL(redirectTo && redirectTo.startsWith('/') ? redirectTo : '/home', request.url);
      return NextResponse.redirect(homeUrl);
    }

    // If accessing protected route without any session cookie, immediately redirect
    if (isProtectedRoute && !hasSessionCookie) {
      // Back navigation or direct access: send to landing
      return NextResponse.redirect(new URL('/', request.url));
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
          set(name: string, value: string, options: any) {
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
          remove(name: string, options: any) {
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
      const { data: { user } } = hasSessionCookie && isProtectedRoute
        ? await supabase.auth.getUser()
        : { data: { user: null } as any };

      // If no user and trying to access protected route, redirect to home
      if (isProtectedRoute && !user) {
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
    '/login',
    '/sign-up',
  ],
};