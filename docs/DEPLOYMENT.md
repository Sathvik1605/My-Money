# Deployment

## Architecture

Deploy the Next.js application to a Node-compatible platform such as Vercel and use a hosted Supabase project for Postgres and Auth. The deployed browser communicates with the Next.js application for card, statement, and year-grid data; API route handlers communicate with hosted Supabase using the visitor's cookie-backed session.

## Process

1. Create a hosted Supabase project.
2. From this repository, use `supabase link` to select the project and `supabase db push` to apply the migration. Alternatively, apply the migration in the Supabase SQL editor.
3. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the application host using the hosted project values.
4. Configure the Supabase Auth site URL and exact redirect URLs for the deployed application URL.
5. Build and deploy with the platform’s Next.js workflow, then verify sign-up/sign-in, cross-user isolation, card management, statement management, and both year modes.

## Production requirements

Use HTTPS, keep service-role credentials server-only, enable email confirmation as appropriate, configure a production SMTP provider when confirmation or recovery email is needed, and review Supabase Auth rate limits and password requirements. Do not deploy local URLs or local anonymous keys to production.