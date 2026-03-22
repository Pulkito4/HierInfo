This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Local auth bypass (without Supabase dashboard access)

If OAuth/email redirects are forcing you to a deployed domain and you cannot edit Supabase Auth settings right now, you can bypass auth checks locally:

1. In `frontend/.env.local`, add:

```bash
NEXT_PUBLIC_DEV_AUTH_BYPASS=true
DEV_AUTH_BYPASS=true
```

2. Restart the dev server.

This bypass only activates on `localhost` / `127.0.0.1` and lets you access protected pages for UI/testing work.
Do not enable this in production.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Backend prerequisites (Supabase)

This app expects a Supabase backend with the following database objects already created:

- Table: `profiles` with columns at minimum: `id uuid primary key references auth.users`, `username text`, `preferences jsonb`.
- SQL functions used by the Explore feed:
	- `get_similar_articles(liked_article_ids uuid[], excluded_article_ids uuid[], result_limit int)`
	- `get_discovery_articles(excluded_article_ids uuid[], result_limit int)`

Make sure Row Level Security (RLS) policies allow authenticated users to read from your article tables and the cache tables used by Trending/Critical feeds.

Without these functions/tables, the Explore feed and personalization features will not work. See the backend README or database setup docs in this repo for the exact SQL definitions.
