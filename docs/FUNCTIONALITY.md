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
the selected financial period: **2025-2026** opens calendar year **2026**,
and **2023-2024** opens **2024**. It never advances past the present calendar
year: the current financial year opens the current calendar year.
The reverse mapping is symmetric: calendar year **2027** opens **2026-2027**.

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

## Expenses

Every workspace page, including Expense category and nested subcategory pages,
shares the same centered application content width, 32px/48px/80px responsive
left/right gutters, and equal 32px top/bottom spacing. The shared page
container owns this spacing, so future workspace pages align without custom
outer padding at every viewport size.

The four Bill Overview summary cards use a compact horizontal label/value
layout with 8px internal padding, 16px bold labels matching the Month and
month-name headers, and 20px numeric figures. They retain the same financial
values while preserving vertical space for the complete annual grid in a
1440x900 viewport without a page scrollbar.

All interactive transitions use the same 420ms ease-out motion as category
reordering. This includes the delete-action reveal, so showing or hiding a
destructive control moves at the same observable pace as its reorder control.

Where a workspace page offers both a direct year picker and Financial/Calendar
view options, the year picker appears first (to the left of the view options).
The Financial/Calendar view control uses the shared 44px pill geometry, while
the year picker uses the same 16px-radius dropdown geometry as all other
dropdowns. Bill Overview, Expense Entry, and Expense Summary all include the
same previous/next year controls and keyboard-operable Financial/Calendar
toggle.

All table headers, including Section and month names, use the same larger bold
ink header style across the workspace. Expense Summary is the standard: 16px
semibold ink text on the soft canvas fill with matching cell padding; Bill
Overview and Expense Entry use this same treatment for every table header.

All financial and expense grid rows (headers, data, and totals) share a fixed compact
48px height, whether a cell is blank or has an entered amount, so entries never cause
rows to jump.

Expense Entry includes a Total column for every section, a Total row for every
month, and a bottom-right grand total. Its category legend uses compact 8px
markers beside the category labels.
The legend container has 4px vertical padding, while its category links retain
44px minimum-height accessible touch targets.
Category and subcategory page headings use their parent category's green,
yellow, or red text color. Nested item names use standard ink text.
When navigating directly between subcategories, the prior page title is never
shown while the selected subcategory loads; the destination title appears only
after its data is available.
When a user opens a subcategory from its parent list, its known label is carried
into the destination route and displayed immediately; the API response remains
the authoritative source for the loaded section and its category.
Every nested expense page exposes an explicit parent link: category pages return
to all categories, and item pages return to their owning category.
Income is recorded in an annual month grid. Users can switch between Financial
and Calendar years, directly select or navigate a year, enter income for each
month in a vertical Month/Income table, and review the annual income total.
Closed historical years are read-only until the user explicitly enables editing,
matching Expense Entry. The selected period controls provide the year, so month
rows show only the month name. The compact table caps at 480px on wider screens and
retains the shared rounded table-card corners.
Its body and total rows use the shared 48px table height.
Light theme uses brighter but balanced green, yellow, and red pastel category
surfaces, while dark theme retains deeper counterparts. Both keep the legend
and category marker visible alongside their text labels.
The Expense Entry table's scrolling viewport preserves the card's rounded
bottom corners around its Total footer.

The Expenses module tracks monthly aggregate spending separately from credit
card bills. It has three fixed categories: Investment, Need, and Want. On a
user's first Expenses visit, when their Expenses workspace has no sections, the
app creates the agreed starting sections:
Need (Food, Snacks, Fruits, Transportation, House, OTT), Want (Trips,
Shopping, Gifts, Miscellaneous), and Investment (Investments, with Mutual
Funds, Stocks, and Gold line items). Users may add, rename, or permanently delete sections and
optional line items; category names remain fixed. Each section and line item
uses a clean default list. **Delete Sub category** (for its subcategories) or **Delete
items** (for a section's line items) enters a deletion mode and reveals a red
icon-only **Delete** action at the far right; the amount shifts left as its
space expands. Its accessible label names the item being deleted. It requires
in-app and
server-validated confirmation: deleting a line item deletes its monthly
entries, while deleting a section cascades to its line items and all associated
monthly entries. Default sections are seeded only once, so a deleted default
section is not recreated on a later page load.

The workspace uses **Income** consistently for money received; it does not use
the narrower **Salary** term. The Expense Summary therefore displays Income and
the percentage of income used.

Each category page also provides **Reorder Sub category** at the end of the list.
It reveals only drag handles for direct manipulation; each handle also supports
Arrow Up and Arrow Down keyboard reordering. The saved order is persistent and
is used in the category page and annual Expense Entry grid. Reordering and
deletion modes cannot be active together. The handle reveals with the same
smooth transition as delete mode; dragging over another item previews the
resulting order and gives the target a slight movement before the drop saves it.
The reorder reveal and row transition take 420ms, making the changing position
easy to follow.

The main Expenses page defaults to the current calendar year (unlike the credit
card Bill Overview, which defaults to the financial year). Its header keeps the
Financial year / Calendar year segmented control, previous/next year controls,
and compact direct year selector use the same ordering, keyboard behavior, and
labels as Bill Overview. Its monthly columns alternate the neutral canvas-soft
and canvas surfaces for easier year-long scanning in both themes; the Section
header uses the canvas surface to match the dark alternate month column. The
category legend remains fixed above the table, and category and Section headers
stay pinned while month columns scroll horizontally. Month headers show their
month only because the selected year is already shown in the period control;
that selector has a fixed width for financial-year labels. It is a selected financial
or calendar year grid, ordered Investment, Need, then Want. The main grid shows
sections only: a section with underlying items, such as Investments, is
clickable and opens those items on its dedicated page. A section is permanently
either direct-entry or
line-item based: direct section amounts and line items cannot be combined.
Amounts are one non-negative value per month and are edited directly in their
grid cell. Items become available from their creation month onward and inactive
items remain visible only where historical data exists. A missing amount is a
blank cell, not ₹0; a user-entered zero remains visible as ₹0.

The grid's narrow leftmost column uses a compact color-coded marker that spans
and groups each category's rows, next to a **Section** column. A
visible top-left legend identifies green as Investments, yellow as Needs, and
red as Wants; its category labels are clickable links to section management,
where sections such as Mutual Funds and Stocks can be added. Category names do
not repeat inside the grid. Their fixed row order also retains meaning without
colour. The Summary
page uses the same saved
expense-entry and income records;
it does not collect a second set of values. Its seven summary columns have
equal widths and scroll within their table container on narrow screens.

Past completed years are read-only by default. Selecting **Edit this year** and
confirming temporarily unlocks that displayed year for the current visit; a
year change re-locks it. The separate Income page records one monthly income
amount, and the Expense Summary page reports Need, Want, Investment, total
spent, income, and percentage of income used for every month and the selected
year total.

## Bill Overview

The home page is the Bill Overview: a 12-month grid of every bill. A segmented control selects **Financial year** (the default) or **Calendar year**. A financial year runs from 1 April of the selected year through 31 March of the next; a calendar year runs from 1 January through 31 December.

Years are chosen directly from a dropdown rather than stepped one at a time. The list is bounded by the data: it starts at the year of the earliest recorded bill and ends at the current year, and the previous/next arrows disable at those bounds, so the user cannot navigate into a range that can hold no data.

The **Active cards** metric is also period-specific: it counts only cards that
are open and have at least one bill in the selected calendar or financial year.
This keeps the overview metrics aligned with its displayed card columns.

For financial years, records from January through March belong to the financial
year that began in the preceding calendar year. For example, January 2026 makes
**2025-2026** available in the selector.

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