# Application

## Purpose

Your Money is a personal, multi-user web application for recording credit card billing statements and reviewing billed amounts across a financial or calendar year. It keeps the initial scope intentionally focused on manual card and bill management.

## Users and use cases

Each person creates an email/password account, then manages only their own cards and statements. A user can add cards, record a statement for a card's billing cycle, mark a bill paid, and compare monthly billed amounts in the year grid.

## Capabilities

- Email/password sign-up, sign-in, and sign-out through Supabase Auth.
- Card creation, editing, closing, and reopening with a required
  credit limit, statement day, and fixed monthly due day.
- Manual statement creation, editing, and deletion.
- Credit-limit protection: a bill cannot exceed its card's configured limit.
- A 12-month grid with per-month, per-card, and grand totals.
- Calendar-year and India financial-year (April through March) views.

The application does not currently provide analytics, reminders, CSV import/export, Gmail integration, card colour tags, or shared accounts.

## Overall behavior

The application starts with no cards. Users add card metadata and then manually
record the bill generated for each cycle. A bill's due date is derived from its
card's fixed monthly due day, and its total cannot exceed the card's credit
limit. Bills are either unpaid or fully paid; marking a bill paid records that
day automatically. The year grid groups bill amounts by `statement_date`, rather
than cycle dates, so each amount appears in the month when its statement was
generated. Historical statements remain visible after their card is closed.

See [FUNCTIONALITY.md](FUNCTIONALITY.md) for workflows and [ARCHITECTURE.md](ARCHITECTURE.md) for implementation details.