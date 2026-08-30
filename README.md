# Your Money

A unified personal finance workspace. Credit card bill tracking is the first module; expenses, mutual funds and stocks follow.

## Credit Cards — MVP1

Track what each of your credit cards billed, cycle by cycle, and see it laid
out by year. See `credit-card-tracker-mvp1-requirements.md` (in the original
request) for the full product spec this implements.

## Stack

- **Frontend + Backend:** Next.js 16 (App Router), TypeScript, Tailwind CSS.
  The backend is the `/api` route handlers in this same project (Pattern 2
  from the spec's §10) — the frontend never talks to Supabase directly for
  reads/writes of cards or statements.
- **Database + Auth:** Supabase (Postgres + Auth). Locally this runs via the
  Supabase CLI (`supabase start`, backed by Docker/Colima); point the same
  env vars at a hosted Supabase project for production.
- **Validation:** Zod schemas shared by all API routes.

## Getting started (local development)

1. **Prerequisites:** Node 20+, Docker (or Colima), the Supabase CLI
   (`brew install supabase/tap/supabase`).
2. **Start the local Supabase stack** (Postgres, Auth, Studio, etc.):
   ```bash
   supabase start
   ```
   This applies the schema in `supabase/migrations/` automatically. Note
   the `API_URL`, `ANON_KEY`/`PUBLISHABLE_KEY` it prints — see `.env.example`.
3. **Configure env vars:** copy `.env.example` to `.env.local` and fill in
   the values from `supabase status`.
4. **Install deps and run the app:**
   ```bash
   npm install
   npm run dev
   ```
5. Open http://localhost:3000, sign up with any email/password (email
   confirmation is disabled for local dev in `supabase/config.toml`), and
   start adding cards.

Supabase Studio (a GUI for the local database) is available at
http://127.0.0.1:54323 while `supabase start` is running.

## Moving to production

1. Create a hosted Supabase project at supabase.com.
2. Run `supabase link` and `supabase db push` to apply
   `supabase/migrations/` to the hosted project (or paste the migration SQL
   into the Supabase SQL editor).
3. In your hosting provider (e.g. Vercel), set `NEXT_PUBLIC_SUPABASE_URL`
   and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from the hosted project's API
   settings. Never set `SUPABASE_SERVICE_ROLE_KEY` in a client-exposed
   context — it isn't currently used by any route, but is reserved for
   future server-only/background work.
4. Consider re-enabling email confirmation (`enable_confirmations = true`
   under `[auth.email]`) for the hosted project, since local dev disables it
   for convenience only.

## Architecture notes

- **Every API route checks both auth *and* ownership** before touching data
  (see `src/lib/ownership.ts` and the `eq("user_id", user.id)` /
  `eq("cards.user_id", user.id)` filters throughout `src/app/api/`), on top
  of Postgres Row Level Security policies in the migration. Either layer
  alone should already prevent cross-account data access; both exist
  per §11 of the spec as defense in depth.
- **Cards are soft-deleted** (`is_active`) rather than removed, so bill
  history is preserved (§5.1).
- **One statement per card per billing cycle** is enforced by a unique
  index on `(card_id, cycle_start_date)`.
- **Only the last 4 digits of a card are ever stored** — this is enforced
  by a check constraint requiring exactly 4 digits, not just app-level
  convention.
- Auth session refresh and route protection both live in `src/proxy.ts`
  (Next.js's evolution of `middleware.ts`) plus `src/lib/supabase/middleware.ts`.

## Project structure

```
src/
  app/
    api/               # Backend route handlers (cards, statements, year-grid)
    cards/             # Card management UI
    login/             # Sign in / sign up
    page.tsx           # Year grid (home page)
  components/          # Shared React components (forms, nav)
  lib/
    supabase/          # Client/server/middleware Supabase client factories
    validation/        # Zod schemas
    ownership.ts        # Shared "does this user own this card" check
  types/database.ts     # Hand-written types mirroring the DB schema
supabase/
  migrations/           # SQL schema, RLS policies, triggers
  config.toml           # Local Supabase stack configuration
```

## What's deliberately not in MVP1

Per the spec's §3: stats/analytics, CSV import/export, Gmail-based bill
detection, and card colour tags are all out of scope for this version.
