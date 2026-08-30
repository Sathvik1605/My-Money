# Changelog

## 2026-08-30

- Replaced partial bill payments with a binary Paid action. Migration
  `20260830020000_replace_partial_payments_with_payment_date.sql` removes
  `amount_paid`; the API records the payment date automatically when a bill is
  marked paid. Historical partial payments are intentionally treated as unpaid.
- Renamed all user-facing inactive/deactivated card terminology to closed cards.
- Locked paid bill totals and closed-card details from further edits. A paid
  amount is now read-only, and a closed card must be reopened before it can be
  edited.
- Reordered card forms to identification-first fields and made closed-card bills
  view-only. Automatic payments are now available only from statement date
  through due date for bills less than one month old.
- Pinned the Bill Overview's Month and Total columns so card columns can scroll
  between them without losing period or aggregate context.
- Fixed Bill Overview card-column widths and added direct historical statement
  year/month selection to New bill.
- Widened fixed Bill Overview card columns to 240px for clearer card names and
  values.
- Reduced the pinned Bill Overview Total column width independently of card
  columns.
- Grouped New bill statement month/year selectors below Card and kept derived
  statement/due dates together on the following row.
- Defaulted New bill statement period selectors to the current month and year.
- Clarified and enforced fixed due-day month placement: later due days stay in
  the statement month; the same or earlier days roll to the following month.
- Fixed New bill initialization so its derived due date always uses the same
  current statement period as the initially displayed statement date.
- Added protected card deletion for cards with no bill history.
- Corrected stale derived date handling when marking a bill paid: the API now
  validates payment eligibility against the card's current derived due date,
  never a stale stored due date.
- Fixed financial-year navigation for January–March records and added a
  Mark unpaid action for paid bills.
- Removed payment-window restrictions. Historical statements can now be marked
  paid without a payment date, while current and future statements retain their
  automatic payment date.
- Moved protected card deletion into the Edit card dialog and spaced its bill
  actions consistently.
- Allowed explicit destructive deletion of cards with their associated bills.
- Kept bill amounts neutral across payment states and prevented cards with
  unpaid bills from being closed.
- Restored destructive styling to individual unpaid bill amounts, kept totals
  neutral, and added an explanatory close-card dialog.
- Replaced native card confirmations with application-styled dialogs and moved
  unpaid-bill close feedback before the close request.
- Strengthened shared surface borders and structural separators across both
  themes while preserving the shadow-free design.
- Reinstalled the canonical Mobbin `DESIGN.md` reference and documented the
  approved direct-polarity dark theme contract.
- Retained contrast-safe red destructive tokens in both themes and removed the
  exclamation marker from unpaid bill cells.
- Removed the remaining unpaid-bill dot marker while preserving accessible
  payment-status text.
- Replaced the native Remove entry confirmation with the application-styled
  destructive confirmation modal.
- Removed project-specific design additions from `DESIGN.md`, retaining only
  the explicitly approved Light/Dark theming contract.
- Aligned shared surfaces, typography tracking, labels, and interactive
  geometry to the installed Mobbin DESIGN.md reference.
- Made the Bill Overview active-card metric period-aware and changed the dark
  destructive token to a true red rather than a pink-leaning shade.
- Limited Bill Overview card columns to cards with bills in the selected
  calendar or financial year.
- Made the Financial year to Calendar year switch select the financial period's
  ending calendar year.
- Made the Calendar year to Financial year switch select the matching financial
  period that ends in the current calendar year.
- Capped the Financial year to Calendar year mapping at the present year.

## 2026-08-30

- Replaced the relative card due-date offset with a fixed monthly `due_day` and
  made credit limits required for new and updated cards
  (`20260830010000_require_credit_limit_and_due_day.sql`). Bill totals are now
  checked against the selected card's limit in the dialog and API, and cards
  sort active-first.
- Added the Bill Overview “Cards with payments due” summary metric. It counts
  distinct cards with an outstanding balance in the selected period from the
  already loaded grid data.
- Replaced native browser dropdowns with a shared accessible listbox so menus
  follow DESIGN.md rather than inheriting macOS/Apple UI. The trigger and option
  panel use the field, canvas, hairline, and radius tokens in both themes.
- Removed redundant derived-date captions from bill dialogs and hid native browser spinner controls from all numeric inputs while retaining number validation and mobile numeric keyboards.
- Removed the stored bill `status` column and the `statement_status` enum
  (migration `20260830000000_remove_statement_status.sql`), an earlier step
  toward the current payment-date-only workflow.
- Outstanding highlighting now tracks the amounts rather than a label, and the Status dropdown was removed from the bill form.
- Gave selects a custom chevron inset by one spacing step, drawn as a CSS mask so it takes a colour token and follows the light/dark inversion with a single asset.
- Bill form: the card now sits alone on the first row with the statement and due dates paired beneath it, matching the order in which the values are derived.
- Removed the standing legend beneath the Bill Overview grid; each status marker now carries its own hover title and accessible name.
- Documented all of the above in `DESIGN.md` under `Status Colour`, `Derived Values` and `Selects` (project additions).

## 2026-08-29

- Added the initial documentation set describing the implemented MVP: application behavior, workflows, architecture, API, database, local configuration, security controls, development setup, and deployment guidance.
- Documented the current multi-user Supabase Auth design, including `auth.users` ownership and Row Level Security for cards and statements.