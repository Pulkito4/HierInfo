# Localhost Auth Recovery Guide

This guide explains:
1. How to remove the localhost-only auth bypass changes.
2. How to run real user authentication on localhost.
3. How to validate behavior locally and on the deployed site.

---

## Why you are seeing auto-login behavior on localhost

Your current code has a dev bypass that activates on localhost in non-production mode.

Current bypass points:
- `src/lib/authContext.tsx`
- `src/components/landingpage/LoginForm.tsx`
- `src/components/landingpage/SignupForm.tsx`
- `middleware.ts`
- `.env.local`

Important: in multiple files the bypass condition includes `process.env.NODE_ENV !== 'production'`, which is always true in `next dev`. So auth is bypassed even if env flags are false.

---

## Part A: Remove localhost-only bypass changes

### 1) Remove bypass logic from auth context

File: `src/lib/authContext.tsx`

Remove:
- `DEV_BYPASS_USER`
- `isLocalhostHost(...)`
- `isDevAuthBypassEnabled(...)`
- `shouldBypassAuth` checks in `fetchUser()` and `handleSignOut()`

After cleanup, `fetchUser()` should always call `getAuthenticatedUser()`, and sign out should always call `signOut()` from `supabaseAuth`.

---

### 2) Remove bypass shortcuts in login form

File: `src/components/landingpage/LoginForm.tsx`

Remove:
- `shouldBypassAuth` variable
- early return in `handleGoogleSignIn` that pushes to `/home`
- early return in `handleEmailSignIn` that pushes to `/home`

All sign-in flows should always call Supabase auth methods.

---

### 3) Remove bypass shortcuts in signup form

File: `src/components/landingpage/SignupForm.tsx`

Remove:
- `shouldBypassAuth` variable
- early return in `handleSubmit` that pushes to `/home`
- early return in `handleGoogleSignup` that pushes to `/home`

All signup flows should always call Supabase auth methods.

---

### 4) Remove middleware bypass

File: `middleware.ts`

Remove:
- `isLocalhostHost(...)`
- `isDevAuthBypassEnabled(...)`
- top-level early return:

```ts
if (isDevAuthBypassEnabled() && isLocalhostHost(request.nextUrl.hostname)) {
  return NextResponse.next();
}
```

This ensures protected routes are actually guarded on localhost too.

---

### 5) Remove bypass env flags

File: `.env.local`

Remove these lines (or set both to `false` if you still want to keep the code path for future use):

```env
NEXT_PUBLIC_DEV_BYPASS_AUTH=true
DEV_BYPASS_AUTH=true
```

Note: your code currently checks `NEXT_PUBLIC_DEV_AUTH_BYPASS` in some files, while `.env` uses `NEXT_PUBLIC_DEV_BYPASS_AUTH`. That naming mismatch is another source of confusion. If you keep a bypass feature later, standardize on one variable name.

---

## Part B: Configure real Supabase auth for localhost

### 1) Keep real Supabase project env vars

File: `.env.local`

You should keep:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Use the same Supabase project as production if you want production-like users/data.

---

### 2) Add localhost callback URL in Supabase dashboard

In Supabase dashboard:
- Go to Authentication -> URL Configuration
- Add localhost redirect URL(s), for example:
  - `http://localhost:3000/auth/callback`
  - optional wildcard: `http://localhost:3000/**`

Your app uses `window.location.origin` for redirect, so localhost must be allowlisted.

---

### 3) Check provider setup (Google)

If using Google OAuth:
- Ensure Google provider is enabled in Supabase Authentication -> Providers.
- Ensure provider credentials are valid.
- Keep Supabase callback URI configured in Google Cloud exactly as Supabase shows.

---

## Part C: Run and verify locally with real auth

From `frontend`:

```bash
npm install
npm run dev
```

Then test:
1. Open `http://localhost:3000/login`.
2. Sign in with email/password and Google.
3. Confirm callback returns to `http://localhost:3000/auth/callback` then `/home`.
4. Confirm protected route behavior:
   - logged out user cannot access `/home`
   - logged in user can access `/home`
5. Sign out and verify session clears.

If behavior seems cached, clear site data for localhost (cookies + local/session storage) and retry.

---

## Part D: See changes on the actual deployed site

Local code changes do not affect production until deployed.

To verify on deployed site:
1. Push branch with bypass-removal changes.
2. Deploy (preview or production).
3. Confirm hosting env vars are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Confirm Supabase URL allowlist includes deployed domain callback.
5. Run sign-in and sign-out flow on deployed URL.

---

## Quick rollback option (Git)

If you want to undo only the bypass edits quickly and keep your UI changes, restore just these files from a known good commit:

- `src/lib/authContext.tsx`
- `src/components/landingpage/LoginForm.tsx`
- `src/components/landingpage/SignupForm.tsx`
- `middleware.ts`
- `.env.local`

Use your preferred Git restore flow for selected files from the commit where auth worked as expected.
