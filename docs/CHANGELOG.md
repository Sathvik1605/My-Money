# Changelog

## 2026-08-30

- Made Bill Overview card columns distribute equally above a shared 240px
  minimum, with narrower 160px pinned Month and Total columns and contained
  horizontal scrolling for wider card sets.
- Added directional Bill Overview edge cues so people can see when card columns
  remain off-screen to the left or right.
- Expanded Bill Overview edge cues into full-height surface gradients so hidden
  left and right card columns have a stronger visual affordance.
- Anchored Bill Overview overflow shadows to the fixed Month and Total columns
  and removed moving arrow cues.
- Corrected the fixed-column shadow geometry so the hidden-column affordance is
  visibly rendered at either table edge.
- Replaced the subtle Bill Overview shadows with static pinned-column gradient
  bands.
- Reduced the Bill Overview fixed edge-gradient cue to 24px and card-column
  minimum to 216px while retaining pinned edge widths.
- Narrowed the fixed Bill Overview edge-gradient cue to 16px.
- Reduced the Bill Overview card-column minimum to 208px while retaining the
  fixed Month and Total widths.
- Further reduced the Bill Overview card-column minimum to 192px.
- Made a final small reduction to the Bill Overview card-column minimum: 184px.
- Added the Expenses module with user-scoped sections, optional line items,
  monthly amounts/income, selected-year entry and summary views, temporary
  closed-year unlocking, and RLS-protected API routes.
- Renamed the Expenses grid's primary row heading to Category.
- Made incremental local migrations the documented default so independent
  tables and existing application data are preserved without database resets.
- Made Expense Entry default to Calendar year and render missing expense values
  as blank cells rather than zero amounts.
- Made Expense category labels on the yearly grid colour-coded and explicitly
  linked to section management; standardized equal-width Summary columns that
  report the same saved expense and income data.
- Renamed Expense labels to Investments, Needs, and Wants; grouped sections and
  items beneath their category in the leftmost grid column; and applied those
  category colours consistently to management and Summary views.
- Split the Expenses grid's left edge into grouped Category and Section or item
  columns, removing standalone category data rows.
- Replaced Expense deactivation with confirmed permanent deletion. Deleting a
  section cascades to its line items and entries; deleting a line item removes
  its associated entries.
- Moved Expense deletion controls beside section and line-item names so they
  remain visible independently of the monthly amount column.
- Replaced text deletion controls with red, accessible icon-only controls and
  made every Expense section open its line-item page.
- Fixed starter-section seeding so a confirmed deletion is permanent rather
  than being recreated on the next Expenses page load.
- Kept Expense lists clean by revealing red delete icons only after the user
  enters the appropriate Delete category or Delete items mode.
- Replaced repeated Expense category names in the grid with narrow color-coded
  category markers and an explicit top-left text legend.
- Removed the remaining category text from grid markers, leaving only the
top-left legend to explain their colors.
- Halved the width of Expenses category markers and made the top legend labels
  clickable links to their respective section-management pages.
- Fixed modal focus so Add section inputs accept typing. Consolidated default
  Investment sections into Investments with Mutual Funds, Stocks, and Gold line
  items, migrating those retained entries and removing PPF/Silver as approved.
- Collapsed the main Expenses grid to clickable sections only and moved
  delete-mode trash icons to an animated right-edge action slot after amounts.
- Kept the Expense Entry period controls together while removing its deferred
  Income action, and standardized permanent-deletion confirmations as solid red
  destructive buttons.
- Kept Expense Entry's year mode and compact year picker side by side and
  alternated neutral month-column surfaces for clearer annual scanning.
- Standardized Expense Entry with Bill Overview's full year-control pattern,
  reduced its selector width, and aligned the Section header with the dark
  alternating month surface.
- Kept the Expense Entry category legend outside the horizontal scroll viewport
  and pinned its category and Section headers above the month columns.
- Standardized Bill Overview, Cards, and Expense Entry on the shared balanced
  application page gutter.
- Increased the shared workspace page gutters and top spacing for more visual
  breathing room.
- Increased the shared primary-page side gutters again to 32px on small
  screens, 48px at `sm`, and 80px at `lg`.
- Extended the shared page container to every workspace route, including
  category and nested subcategory pages, with matching 32px top and bottom
  spacing.
- Reduced internal padding in all four Bill Overview summary cards to make the
  period overview more compact.
- Further compacted the Bill Overview summary cards with 12px internal padding
  and 24px headline figures.
- Converted Bill Overview summary cards to compact horizontal label/value rows,
  preserving the no-vertical-scroll 1440x900 annual grid requirement.
- Matched Bill Overview summary-card label sizing and weight to its table
  headers.
- Made Expense Entry's Section and month header typography, muted color, soft
  fill, and padding match the Bill Overview table-header standard.
- Standardized every table header on Expense Summary's bold ink treatment,
  including Bill Overview and Expense Entry.
- Added section, month, and grand totals to Expense Entry and reduced its
  category legend markers to 8px.
- Reduced Expense Entry's category legend container height while preserving
  44px touch targets for its category links.
- Restored the Expense Entry table card's rounded lower corners around the
  Total footer.
- Strengthened light-theme category green, yellow, and red surfaces for clearer
  legend and row-marker visibility.
- Rebalanced light-theme category surfaces as bright pastels after the
  dark-theme-strength treatment proved too heavy on the white canvas.
- Applied semantic category colors to category and subcategory page titles;
  line-item names retain standard ink.
- Prevented stale or placeholder subcategory titles from flashing during
  navigation between nested expense pages.
- Made nested expense titles appear immediately from their parent navigation
  link while the section data loads.
- Expanded Income into a Financial/Calendar annual month grid with monthly and
  yearly totals.
- Rotated the Income grid into a vertical Month/Income table.
- Constrained the Income table to a compact width and aligned its clipped
  corners with the shared table-card treatment.
- Simplified Income month labels and widened the compact table.
- Aligned Income body and total rows to the shared 48px table-row height.
- Added explicit parent-navigation links from expense category and item pages.
- Renamed the Expense Summary's remaining Salary labels to Income; database,
  API, and types already used the `income` terminology.
- Aligned Expense Summary's year controls and keyboard-operable
  Financial/Calendar toggle with the other yearly workspace pages.
- Moved direct year selection to the left of Financial/Calendar controls across
  workspace period controls.
- Aligned year selectors with the standard dropdown geometry while retaining
  the shared action-pill shape for Financial/Calendar controls.
- Standardized application transitions on the 420ms ease-out reorder motion,
  including category and line-item delete-action reveals.
- Reduced the dedicated light/dark palette cross-fade to 240ms.
- Halved the Expense Entry category-strip width and realigned its pinned
  Section column.
- Added the centered compact-table rule for two-column tables and applied it
  to Income.
- Applied the centered compact-table rule to category and line-item data lists.
- Aligned compact-page headers, titles, notices, and footer actions with their
  two-column data surfaces.
- Widened the centered compact two-column layout to 720px.
- Increased and standardized table headers, including Section and month labels,
  with the shared semibold 16px treatment.
- Simplified Expense Entry month headers to month names and widened its fixed
  year selector to fit financial-year labels without layout changes.
- Replaced abbreviated financial-year labels with the full `YYYY-YYYY` form
  across Bill Overview, Expenses, and Expense Summary.
- Added persistent per-category section ordering with drag-and-drop and
  accessible move controls in a dedicated reorder mode.
- Simplified reorder mode to a single dot handle per section, with Arrow Up and
  Arrow Down keyboard movement instead of visible arrow controls.
- Matched the reorder-handle reveal to delete-mode motion and added an
  immediate drag-over order preview for spatial feedback.
- Renamed category management actions to Sub category and slowed reorder
  transitions so the changing order is more visible.
- Standardized populated and empty financial/expense grid rows to the shared
  fixed 48px data-row height.

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