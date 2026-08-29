# Credit Card Bill Tracker — MVP1 Requirements

*Paste this into Claude Code (or another AI coding tool) as the build spec for the first version. §12 has notes specific to Claude Code's project customization.*

## 1. Overview

The first, simple version of a personal credit card bill tracker: add your cards, log what each one billed every month, and see it laid out by year — nothing more. Stats, email auto-fetch, and bulk import all come later; this version is deliberately minimal.

## 2. Goals

- Log what was billed on each card, every billing cycle, by hand
- See a clear month-by-month picture, per card and across all cards, for any year
- Browse multiple years of history
- Nothing else — keep MVP1 small enough to actually finish

## 3. What's In MVP1 (and What's Not)

**In MVP1:**
- Any number of cards — starts empty, add as many as you use
- Manual bill entry: amount, due date, paid / partially paid / unpaid
- A year grid (months × cards, with totals), switchable between Financial Year (Apr–Mar) and Calendar Year (Jan–Dec)
- Browsing across multiple years

**Deliberately left out of MVP1** (see the full roadmap document for these):
- Any stats or analytics dashboard — trend charts, card-wise breakdowns, credit utilization %, due-date reminders
- CSV export or import
- Gmail-based bill detection
- Card colour tags — still undecided, left out entirely for now
- More than one real account using the app (though the database is set up so this is a later switch, not a rebuild — see §6)

## 4. Key Definitions & Assumptions

- **Year view:** switchable between Calendar Year (Jan–Dec) and Financial Year (Apr–Mar, India convention) — Financial Year is the starting default.
- **Billing cycle:** each card has its own cycle (e.g., the 4th of one month to the 3rd of the next), independent of the calendar month. "Month by month" tracking follows each card's own statement date, not the calendar month.
- **Bill / Statement:** one record per card per billing cycle. "Bill" and "statement" mean the same thing throughout.

## 5. Functional Requirements

### 5.1 Card Management
- Add, edit, and deactivate a card (deactivate rather than delete, so history stays intact). Starts with zero cards.
- Fields: nickname, issuing bank, network (Visa / Mastercard / Amex / RuPay / Diners), last 4 digits only, credit limit *(optional — not used yet, but worth collecting now for later)*, billing cycle start day, statement day, typical payment-due offset.
- No hard limit on number of cards.

### 5.2 Manual Bill Entry
- One entry per card per billing cycle: cycle start/end dates, statement date, due date, total amount due, amount paid, payment date, status.
- Status: Paid / Partially Paid / Unpaid. (An entry can also just show as "Overdue" in the UI once today is past the due date and it isn't fully paid — no separate field needed, it's just a check against the due date.)
- Entries are editable after the fact (mark paid later, fix a typo'd amount).

### 5.3 Year Grid View
- Pick a year — Calendar or Financial, per §4 — see a grid: rows = months, columns = your cards, cells = amount billed.
- Row totals (per month, all cards), column totals (per card, full year), and one grand total.
- Illustrative example (3 cards shown, Financial Year view):

| Month | HDFC Regalia | Axis Magnus | ICICI Amazon Pay | Total |
|---|---|---|---|---|
| Apr 2025 | ₹12,500 | ₹8,200 | ₹3,100 | ₹23,800 |
| May 2025 | ₹15,300 | ₹6,700 | ₹4,500 | ₹26,500 |
| Jun 2025 | ₹9,800 | ₹11,200 | ₹2,900 | ₹23,900 |
| Jul 2025 | ₹18,200 | ₹7,100 | ₹5,600 | ₹30,900 |
| Aug 2025 | ₹11,400 | ₹9,800 | ₹3,300 | ₹24,500 |
| Sep 2025 | ₹22,100 | ₹15,600 | ₹6,200 | ₹43,900 |
| Oct 2025 | ₹19,700 | ₹12,300 | ₹8,900 | ₹40,900 |
| Nov 2025 | ₹14,200 | ₹8,900 | ₹4,100 | ₹27,200 |
| Dec 2025 | ₹25,600 | ₹18,200 | ₹9,500 | ₹53,300 |
| Jan 2026 | ₹13,100 | ₹7,600 | ₹3,800 | ₹24,500 |
| Feb 2026 | ₹10,900 | ₹6,400 | ₹2,700 | ₹20,000 |
| Mar 2026 | ₹16,800 | ₹9,100 | ₹4,200 | ₹30,100 |
| **Total** | **₹1,89,600** | **₹1,21,100** | **₹58,800** | **₹3,69,500** |

### 5.4 Multi-Year Support
- Switch between years (dropdown or tabs) — every past year stays fully browsable.

## 6. Designing for Future Multi-User Access

MVP1 is just for you, but you said you'd like to open this up to more people eventually. The cheapest time to plan for that is now, before any real data exists — retrofitting it afterward means migrating live data.

**What this means in practice:**
- A simple `users` table exists from day one, even though it'll only ever have one row (you) for a while.
- Every card belongs to a user (`user_id` on `cards`). Bills belong to a card, so they're automatically scoped to the right person too — no extra field needed on `statements`.
- Use your database provider's built-in login (Supabase's, for instance — see §9) rather than building authentication by hand.

**Result:** MVP1 has exactly one account — yours, created the normal way. Opening it up later just means letting more people sign up; nothing about the existing schema or your data needs to change.

## 7. Data Model

### `users`
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| email | text | |
| created_at | timestamp | |

*You'll likely get this table for free from your auth provider (e.g. Supabase Auth) rather than building it by hand.*

### `cards`
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users.id) | see §6 |
| nickname | text | e.g. "HDFC Regalia" |
| bank_name | text | e.g. "HDFC Bank" |
| network | text | Visa / Mastercard / Amex / RuPay / Diners |
| last4_digits | text(4) | identification only — never store the full card number |
| credit_limit | numeric, nullable | optional |
| billing_cycle_start_day | int (1–31) | |
| statement_day | int (1–31) | |
| typical_due_days_after_statement | int | used to prefill the due date on a new bill |
| is_active | boolean, default true | |
| created_at | timestamp | |

### `statements`
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| card_id | UUID (FK → cards.id) | |
| cycle_start_date | date | |
| cycle_end_date | date | |
| statement_date | date | when the bill was generated |
| due_date | date | |
| total_amount_due | numeric | |
| amount_paid | numeric, default 0 | |
| payment_date | date, nullable | |
| status | text/enum | Paid / Partially Paid / Unpaid |
| created_at | timestamp | |

## 8. Non-Functional Requirements
- **Mobile-friendly** — you'll likely check or enter bills from your phone.
- **Scale** — trivial: even 10+ cards × 12 months × several years is a few hundred rows. No performance work needed.
- **Backup** — make sure the data can be exported at the database level even without an in-app export button yet (e.g. a Supabase table export), so you're never fully locked in.

## 9. Suggested Tech Stack & Database

The data is relational — cards, their statements, and rollups by month/year are exactly what SQL is built for. Recommended: **PostgreSQL via Supabase.** It bundles the database with user accounts and login out of the box, which lines up directly with §6 — you're not building auth separately later, it's already there when you need it. Pairs well with any modern AI coding tool.

*(A local SQLite file would be simpler to start with, but has no natural path to multiple users — since that's part of your plan, it's worth starting on Supabase instead of switching later.)*

## 10. Architecture: How the Pieces Fit Together

Most real applications do keep the frontend and backend as separate layers, and it's worth being explicit about that here, so whichever AI tool ends up building this does it the same way instead of quietly picking its own default.

**Two legitimate patterns are in play, worth knowing both exist:**

1. **Frontend talks straight to Supabase** ("backend-as-a-service") — the frontend uses Supabase's client library to read and write data directly; Supabase's Row Level Security policies and built-in Auth do the job a hand-written backend normally would. Fast to build, and genuinely used in production apps — but the "backend logic" ends up as configuration/policies rather than code you can read start to finish.
2. **Frontend → your own backend → database** — the frontend never touches the database directly. It calls your backend's API; the backend is the only thing that talks to Postgres, and every rule about who can see or change what lives in code you can actually read.

**For this project: Pattern 2 — here's why it's the better fit, not just a default preference:**
- It matches what you'll expect to see when reviewing the AI's output
- Phase 2/3 (Gmail, OAuth tokens, decrypting statement PDFs) has to run somewhere that isn't the browser anyway — none of that can safely live in frontend code. Building the backend layer now means Phase 2/3 just adds endpoints to something that already exists, rather than introducing a whole new layer later.

**What the backend actually is, practically:** it doesn't need to be a second, separately-hosted application. The simplest version — and what's recommended here — is Next.js **API routes**: a `/api` folder inside the same project as the frontend, where each file is one backend endpoint (e.g. `/api/cards`, `/api/statements`). The frontend calls these; these are the only code that touches Supabase directly. This gives the separation you're picturing, without standing up and hosting two separate services.

*(A fully separate backend — its own repo, its own hosting, talking to the frontend purely over the network — is also possible, and is what larger engineering teams often do. For a personal tool like this it adds real operational overhead — two things to deploy, CORS to configure, two things that can go down — without a matching benefit at this scale. Worth knowing it exists; not worth doing here.)*

## 11. Security

This handles real financial data and — eventually — a Gmail connection, so it's worth being deliberate here rather than an afterthought.

**Access control:**
- Every API route must check two separate things, not just one: that the request is authenticated (someone is logged in), *and* that the data being requested actually belongs to that logged-in user. Checking only the first is a common mistake that would let one account see another account's data.
- Add Supabase Row Level Security (RLS) policies on `cards` and `statements` as a second line of defense — even if an API route has a bug, RLS stops one user's data from reaching another user's request at the database level. This matters more, not less, once §6's multi-user design is actually used.

**Secrets:**
- Supabase's service-role key (if the backend uses it) bypasses RLS entirely and must only ever live on the server — never in frontend code, never committed to the repo. Use environment variables, and make sure `.env` files are listed in `.gitignore`.
- Same rule will apply to Gmail OAuth credentials once Phase 2/3 starts (see the master document's §4.3 and §7 for the full handling of that).

**Data handling:**
- Only ever store the last 4 digits of a card number — never the full number. This is a hard rule, not just a field choice.
- HTTPS by default — Vercel and Supabase both provide this out of the box; just don't disable it.
- Validate input on every API route (amounts are numbers, dates are real dates) rather than trusting whatever the frontend sends.

## 12. Working With Claude Code's Project Customization

*(Specific to Claude Code — if you switch to a different AI tool later, this section won't carry over the same way.)*

You'll see several customization options in Claude Code's project settings — agents, skills, instructions, hooks, MCP servers, plugins, and tools. Claude Code should feel free to create and use any of these as the project grows; this document isn't the final word on tooling, and more will likely get added over time. Roughly what each is for, so it's recognizable when one becomes the right choice:

- **Instructions** (typically a `CLAUDE.md` file) — standing project context: conventions, decisions like the ones in §10, anything that should be true across every session. Worth keeping current as decisions get made, so future sessions don't rediscover them from scratch.
- **Agents (subagents)** — a specialized helper for a recurring kind of task (e.g. one focused on writing tests, one focused on reviewing changes against §11's security rules). Worth setting up once a task type comes up often enough to justify it.
- **Skills** — packaged, reusable instructions for a specific kind of work. Same idea as the SKILL.md pattern you may have seen elsewhere.
- **Hooks** — commands that run automatically at points in the workflow (e.g. a linter before a commit, or a block on editing a sensitive file). Review any hook before turning it on, since it runs without asking each time it triggers.
- **MCP servers** — connections to outside tools or data sources beyond Claude Code's defaults. This is likely how Gmail access (§4.3 in the master doc) eventually gets wired in — only connect ones you actually trust, since this project touches financial data.
- **Plugins** — bundles of the above packaged together for reuse. More relevant once there's a set of tooling worth sharing or reinstalling as a unit than for a single personal project, but there if useful.
- **Tools** — custom tool definitions Claude Code can call directly.

**Recommended approach:** don't pre-build all of this now. Add an agent, hook, or MCP server when a real, repeated need for one actually shows up, rather than setting everything up speculatively for MVP1. Exact configuration syntax for each changes as Claude Code evolves, so check Claude Code's current documentation (docs.claude.com/en/docs/claude-code) at the point you're setting one up, rather than relying only on what's written here.

## 13. What Comes After MVP1

Once this works, the natural next steps — covered in the full roadmap document — are a stats dashboard (including credit utilization) and CSV export, then, as separate and larger efforts, Gmail-based bill detection and CSV import for backfilling old data. None of that needs to exist for MVP1 to be useful on its own.
