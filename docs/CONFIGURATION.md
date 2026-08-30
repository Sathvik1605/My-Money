# Configuration

## Application variables

The app requires these browser-exposed Supabase variables in `.env.local` for local development and in the deployment environment for production:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API base URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable anonymous key used by browser and session-aware server clients. |

Get local values with `supabase status` after starting the stack. The anonymous key is designed for client use and relies on RLS. Do not expose or commit a Supabase service-role key; this application does not use one.

## Local Supabase

`supabase/config.toml` configures the local project. The relevant endpoints are API `http://127.0.0.1:54321`, Postgres port `54322`, Studio `http://127.0.0.1:54323`, and the local mail viewer `http://127.0.0.1:54324`.

Email/password sign-up is enabled. Email confirmation is disabled locally, the minimum password length is six characters, and local auth sessions use a one-hour JWT expiry with refresh-token rotation. Production should review these development-oriented choices, especially re-enabling email confirmation and configuring SMTP.