# Development

## Prerequisites

Install Node.js 20 or newer, Docker Desktop or Colima, and the Supabase CLI. The app uses Next.js 16, TypeScript, Tailwind CSS, Supabase, and Zod.

## Run locally

1. Start Docker or Colima.
2. Run `supabase start` from the repository root. It starts local Postgres, Auth, API, Studio, and related services, and applies migrations.
3. Run `supabase status`, then place the reported API URL and anonymous/publishable key in `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Run `npm install`.
5. Run `npm run dev` and open `http://localhost:3000`.

Use `http://127.0.0.1:54323` for Supabase Studio. Authentication users appear under **Authentication > Users**; application records appear in **Table Editor**.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run build` | Create a production build. |
| `npm run start` | Serve a completed production build. |
| `npm run lint` | Run ESLint. |
| `supabase start` | Start local Supabase services. |
| `supabase stop` | Stop local Supabase services. |
| `supabase status` | Display local endpoints and credentials. |

## Applying local migrations safely

Apply each new migration incrementally to the existing local database. Do not
use `supabase db reset` merely to add tables or make non-destructive schema
changes: it wipes authentication users and application data. Preserve existing
data across all routine changes. A reset is only appropriate when it is
unavoidable and the user has explicitly approved the resulting data loss.

There is currently no automated test script. Validate changes with the focused
lint/build command and manual browser checks for affected flows. After changing
`supabase/migrations`, apply the new migration without resetting data and keep
`src/types/database.ts` synchronized.