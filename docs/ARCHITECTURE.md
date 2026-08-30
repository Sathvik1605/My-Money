# Architecture

## Shared page layout

Primary workspace pages use the `.app-page` global CSS primitive from
`src/app/globals.css`. It centralizes the centered 1440px content maximum and
responsive inline gutters; each primary page applies the shared 32px vertical
spacing. This allows individual table cards to retain their own horizontal
scrolling without inconsistent page-level spacing.

The same stylesheet provides `.table-header`, the shared 16px semibold style
used by financial and expense table header cells.

It also provides `.table-data-row`, a fixed 48px row-height primitive applied
to the Bill Overview, Expense Entry, and Expense Summary table bodies.

## Shared dropdowns

`src/components/Select.tsx` provides the application's shared dropdown control
for card, bank, network, and year selection. It intentionally replaces native
`<select>` elements: their opened menus are operating-system UI and cannot
follow the app's documented DESIGN.md surfaces and theming.

The component renders a labelled button trigger and an in-app WAI-ARIA listbox.
It owns expanded and selected state, click-away dismissal, and keyboard
operation (Enter, Space, Escape, and arrow keys). Styling resides in
`src/app/globals.css` and uses only DESIGN.md tokens: field for the trigger,
canvas and hairline for the menu, canvas-soft for selected/hovered options, and
the shared inline SVG chevron.

## Overview

This is a Next.js 16 App Router application written in TypeScript and styled with Tailwind CSS. It follows a single-project frontend-to-backend pattern: browser components call Next.js route handlers under `src/app/api`, and route handlers access Supabase Postgres through server-side Supabase clients. Browser code uses Supabase directly only for authentication actions.

## Frontend

- `src/app/page.tsx`: client-rendered year grid and statement workflow.
- `src/app/cards/page.tsx`: client-rendered card workflow.
- `src/app/login/page.tsx`: email/password authentication.
- `src/components/CardForm.tsx` and `src/components/StatementForm.tsx`: shared create/edit forms.
- `src/components/NavBar.tsx`: authenticated navigation and sign-out.

The frontend fetches JSON from `/api/cards`, `/api/statements`, and `/api/year-grid`. Forms retain errors locally and refresh affected grid/card data after successful writes.

## Backend and data flow

Route handlers authenticate the request with `supabase.auth.getUser()`, validate JSON input with schemas in `src/lib/validation/schemas.ts`, explicitly filter or verify ownership, then read/write Supabase tables. Responses use a `{ data }` envelope on success and `{ error, details }` on failures.

`src/lib/ownership.ts` verifies a card belongs to the requesting user before filtered statement access or statement creation. This code-level authorization is intentionally paired with database RLS as defense in depth.

## Session handling

`src/proxy.ts` invokes `src/lib/supabase/middleware.ts` for most non-static requests. The middleware refreshes Supabase session cookies, redirects unauthenticated users to `/login`, and redirects authenticated users away from the login page. `src/lib/supabase/server.ts` creates cookie-backed clients for route handlers, while `src/lib/supabase/client.ts` creates the browser auth client.

## Design decisions

- Route handlers, rather than browser-to-database reads/writes, keep application business rules in reviewable server code and provide a base for future server-only integrations.
- Supabase Auth owns user records in `auth.users`; no separate `public.users` or profile table currently exists.
- A statement is owned indirectly through its parent card rather than carrying a duplicate `user_id`.
- `src/types/database.ts` is hand-maintained to mirror the migration. Regenerate it with `supabase gen types typescript --local` after schema changes, or update it carefully.