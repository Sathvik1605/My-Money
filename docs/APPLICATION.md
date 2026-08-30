# Application

## Purpose

Your Money is a personal, multi-user web application for recording credit card
bills, expenses, and income across financial or calendar years. It provides a
unified manual workspace for core personal-finance tracking.

## Users and use cases

Each person creates an email/password account, then manages only their own
cards, bills, expense categories, and monthly income. A user can add cards,
record a statement for a card's billing cycle, mark a bill paid, maintain
expenses by category, record income, and compare monthly values in yearly
grids.

## Capabilities

- Email/password sign-up, sign-in, and sign-out through Supabase Auth.
- Card creation, editing, closing, and reopening with a required
  credit limit, statement day, and fixed monthly due day.
- Manual statement creation, editing, and deletion.
- Credit-limit protection: a bill cannot exceed its card's configured limit.
- A 12-month grid with per-month, per-card, and grand totals.
- Calendar-year and India financial-year (April through March) views.
- Expense tracking grouped into Investments, Needs, and Wants, including
  subcategories and optional line items.
- A month-by-month Income grid with Financial/Calendar year selection and
  monthly and annual totals.

The application does not currently provide analytics, reminders, CSV import/export, Gmail integration, card colour tags, or shared accounts.

## Overall behavior

The application starts with no cards. Users add card metadata and then manually
record the bill generated for each cycle. A bill's due date is derived from its
card's fixed monthly due day, and its total cannot exceed the card's credit
limit. The year grid groups bill amounts by `statement_date`, rather than cycle
dates, so each amount appears in the month when its statement was generated.
Historical statements remain visible after their card is closed.

Expenses and Income each use annual month grids. Users select a calendar or
India financial year (April through March), enter individual monthly amounts,
and see both monthly and annual totals. Historical periods are protected from
editing unless the user explicitly unlocks the selected year.

See [FUNCTIONALITY.md](FUNCTIONALITY.md) for workflows and [ARCHITECTURE.md](ARCHITECTURE.md) for implementation details.