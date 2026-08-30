# Security

## Authentication

Supabase Auth performs email/password sign-up and sign-in. Authentication state is held in cookies and refreshed by `src/proxy.ts` plus `src/lib/supabase/middleware.ts`. Protected pages redirect unauthenticated visitors to `/login`; each API route repeats the authenticated-user check and returns `401` when it fails.

## Authorization

Cards have a required `user_id` tied to `auth.users.id`; statements inherit ownership through `card_id`. Route handlers explicitly constrain card queries to the authenticated user and use card joins or `assertOwnsCard` for statement operations. A missing ownership match is presented as `404`, avoiding disclosure of another user's record.

Postgres RLS mirrors this policy for every select, insert, update, and delete on `cards` and `statements`. API authorization and RLS are deliberately independent layers: an application query defect should still be constrained by the database.

## Data protection

The database rejects card values other than exactly four digits, and no full card number, CVV, expiry date, or password is stored by application tables. Inputs are validated server-side with Zod before writes, including date ordering and non-negative financial values. Unique statement cycles are protected by a database constraint.

The only browser-visible credential is the Supabase anonymous key. It does not bypass RLS. A service-role key bypasses RLS and must remain server-only if introduced for future background work; it must never be added to client code or committed environment files.

## Current limits

There are no application roles, shared accounts, MFA, CAPTCHA, password recovery UI, rate-limit customization, or audit-log feature at present. Supabase local configuration contains development-friendly email settings and must be hardened for a public deployment.