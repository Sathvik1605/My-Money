# Functionality

## Authentication

Visitors are redirected to `/login` unless they have a valid Supabase session. They can sign up or sign in with an email address and password. After sign-in they are sent to the year grid; signing out ends the session and returns them to `/login`.

Local development accepts new email/password accounts and disables email confirmation. Each account is isolated from every other account's cards and statements.

## Card management

The **Cards** page lists active cards by default. Users can opt in to showing
closed cards; when visible, they always appear after active cards. Users
create or edit cards with a required credit limit, statement day, fixed monthly
due date, nickname, issuing bank, supported network, and last four digits.

The Add card and Edit card dialogs are ordered left-to-right as nickname,
issuing bank, network, last four digits, credit limit, statement date, then due
date. The due date is a fixed day of each month (1–31), not a number of days
after the statement. If the due day is later than the statement day, it remains
in that month (statement day 3, due day 20); if it is the same or earlier, it
moves to the next month (statement day 28, due day 15). Days 29–31 clamp to the
last day of shorter months.

Supported networks are Visa, Mastercard, Amex, RuPay, and Diners. Credit limit,
nickname, and bank are required; last four digits must be exactly four numeric
characters; and statement and due days are limited to 1–31. Cards are not
permanently deleted: closing a card sets `is_active` to false, preserving its
bills and allowing it to be reopened later.

Cards can only be closed once every bill is paid. The app shows an in-app dialog
explaining that outstanding bills must be settled first. Close and permanent
deletion confirmations also use the application dialog design rather than
browser prompts. Cards can be permanently deleted from the **Edit card** dialog. The user must
explicitly confirm that deletion is irreversible: deleting a card also
permanently removes all of its bills.

## Bill management

From the Bill Overview, users add a bill for an active card through a modal dialog ("Add new bill"). A bill records its card, statement and due dates, total due, and its automatic payment date when it is paid.

The Bill Overview displays only card columns with at least one bill in the
selected calendar or financial year. A card whose first bill belongs to 2026
does not appear while viewing calendar year 2025, and cards with no bills do
not appear in reporting periods.

Switching from a financial year to a calendar year preserves the ending year of
the selected financial period: **FY 2025-26** opens calendar year **2026**,
and **FY 2023-24** opens **2024**. It never advances past the present calendar
year: the current financial year opens the current calendar year.
The reverse mapping is symmetric: calendar year **2027** opens **FY 2026-27**.

**Only total due is user-entered.** The card and dates are derived from the
card and shown as read-only static text:

- **Card** — a dropdown when creating, static text when editing, so a bill can never move between cards.
- **Statement period** — users directly choose a statement year and month from
  the current year and the preceding ten years. New bills default to the
  current month and year. The app derives the date from the card's statement
  day, including month-end clamping, so historical bills are fast to enter
  without manually typing a date.
- **Due date** — always recomputed from the card's fixed `due_day`, including
  when editing an existing bill, so a stale stored value can never contradict
  its card.

In a new bill dialog, Statement month and Statement year appear together
immediately after Card. The derived Statement date and Due date appear together
on the next row.

The form is laid out top-down in the order the values are derived: the card alone on the first row, then the statement and due dates paired on the next, since both follow from the card. The dates are presented as concise static values without explanatory subtext.

Monetary values cannot be negative, and only one bill can exist per card and statement date. Numeric fields retain native number validation and a numeric mobile keyboard, but browser increment/decrement spinner controls are hidden because bills and card settings are deliberately typed values. Selecting a populated cell opens that bill to mark it Paid or permanently remove
the entry. Once paid, its total is static read-only text and can no longer be
changed. A bill belonging to a closed card is strictly view-only: no new bill,
payment, or removal action is available.
The total due may not exceed the selected card's required credit limit.
Individual unpaid bill amounts use the destructive colour; their accessible
names state their payment status. Row, card, and grand totals always use the
standard ink colour. This is
checked in the dialog for immediate feedback and again by the API on creates and
updates. Reducing a card's credit limit below an existing bill total is rejected.
Removing a bill entry requires a final confirmation in the application-styled
modal dialog, which clearly states that the removal is permanent.

Dropdowns use the application's shared keyboard-accessible listbox rather than
native browser selects, so their field surface and option menu follow the same
DESIGN.md tokens in light and dark themes rather than inheriting operating-system
UI.

### Payment state

Payment state is **never manually stored**; it is computed from `payment_date`:

- `Unpaid` when `payment_date` is null; its entire `total_amount_due` is outstanding.
- `Paid` when a payment date exists; the outstanding amount is zero.
- Selecting **Paid** is available for any unpaid bill on an active card. For
  statements before the current calendar month, it records paid state without a
  payment date; for current and future statements, it records the current date
  on the server. There is no payment-date input and no partial-payment workflow.
- A paid bill alone exposes **Mark unpaid**, which clears its payment date and
  restores the unpaid state. Unpaid bills do not show this action.
- Payment can be recorded only when today is from the statement date through the
  due date and the statement is less than one month old. This prevents a payment
  date before its statement date or outside its billing window.
- Payment eligibility always derives the due date from the card's current
  statement and due-day configuration, rather than trusting a stale due date
  stored on a historical bill.

This prevents a manually-selected status, payment amount, or payment date from contradicting the bill.

Closed cards are retained for history but cannot be edited. The only available
action is **Reopen card**; after reopening, editing and closing actions return.

## Bill Overview

The home page is the Bill Overview: a 12-month grid of every bill. A segmented control selects **Financial year** (the default) or **Calendar year**. A financial year runs from 1 April of the selected year through 31 March of the next; a calendar year runs from 1 January through 31 December.

Years are chosen directly from a dropdown rather than stepped one at a time. The list is bounded by the data: it starts at the year of the earliest recorded bill and ends at the current year, and the previous/next arrows disable at those bounds, so the user cannot navigate into a range that can hold no data.

The **Active cards** metric is also period-specific: it counts only cards that
are open and have at least one bill in the selected calendar or financial year.
This keeps the overview metrics aligned with its displayed card columns.

For financial years, records from January through March belong to the financial
year that began in the preceding calendar year. For example, January 2026 makes
**FY 2025-26** available in the selector.

Rows are months and columns are the user's cards. A cell is the sum of `total_amount_due` for that card's bills whose `statement_date` falls in that month. The page shows row totals, column totals, and a grand total. Closed cards stay in the grid, including zero-value columns, so historical context is retained.

Every card column has a stable 240px fixed width whether or not it contains bill
data, so amounts remain aligned as bills are added. The card columns scroll
inside the table container when needed, while the Month column remains pinned
on the left and the narrower Total column remains pinned on the right.

### Outstanding markers

The summary tiles show total billed, total outstanding, active cards, and
**Cards with payments due**. The last is the count of distinct cards with at
least one outstanding bill in the selected period; a card is counted once even
when it has multiple unpaid bills, and historical closed cards are
included if they still owe money.

A cell is tinted `destructive` when money is still owed on it — driven by a missing `payment_date`, never by a label. Because colour alone must not carry meaning, each marked cell also shows a glyph — `•` for outstanding, `!` for a bill past its due date — with the state named in the cell's accessible name ("…₹9,000, unpaid") and in the glyph's hover title.

There is no standing legend beneath the grid: it was chrome that is read once and then ignored while permanently occupying vertical space, so each marker explains itself instead.

The whole page is sized to fit a 1440×900 viewport without a scrollbar, since a full financial year of 12 rows plus totals is the densest it ever becomes.

## Errors and empty states

The UI displays failed load or submission messages returned by the API. It shows an onboarding message when no cards exist and disables bill creation until an active card is available. Closing a card and removing a bill entry require browser confirmation.