import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import type { AuthError, SupabaseClient, User } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type CookieStore = Awaited<ReturnType<typeof cookies>>;

/**
 * Server-side Supabase helpers for API routes and SSR.
 *
 * Design:
 * - Build exactly one Supabase client per incoming request, bound to request cookies.
 * - Do NOT share clients across requests (stateless HTTP, token rotation, security boundaries).
 * - Call auth.getUser() at most once per request and only if the route needs identity.
 * - Cookies are the preferred transport for browser apps; no Authorization header handling here.
 */

function buildRouteClient(cookieStore: CookieStore): SupabaseClient {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options: cookieOptions }) => {
          cookieStore.set(name, value, cookieOptions as CookieOptions);
        });
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Create a Supabase client bound to this request's cookies.
 * Use this for routes that do NOT need to know the user (public data).
 */
export async function createRouteSupabaseClient(request: NextRequest): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  // Support Authorization: Bearer <token> for API calls that include it (e.g., client fetches)
  const authorization = request.headers.get('authorization');
  const bearer = authorization && authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : null;

  // If we have a bearer, prefer attaching it so auth.getUser() works even without cookies
  if (bearer) {
    // create a client with global header
    // We reuse buildRouteClient by temporarily augmenting cookieStore via a wrapper
    // Simpler: we clone buildRouteClient here to inject headers using createServerClient options
    return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options: cookieOptions }) => {
            cookieStore.set(name, value, cookieOptions as CookieOptions);
          });
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${bearer}`,
        },
      },
    });
  }

  return buildRouteClient(cookieStore);
}

/**
 * Convenience helper: build the per-request client and fetch the current user once.
 * Prefer calling createRouteSupabaseClient() + supabase.auth.getUser() inline if you want total control.
 */
export async function getRouteUser(request: NextRequest): Promise<{
  supabase: SupabaseClient;
  user: User | null;
  authError: AuthError | null;
}> {
  const supabase = await createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  return { supabase, user: data.user ?? null, authError: error ?? null };
}
