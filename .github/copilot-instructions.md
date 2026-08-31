# Application Development Rules

You are responsible for both implementing this application and maintaining
its documentation.

The documentation is the source of truth for understanding the application's
functional behavior and technical implementation.

Do not remove existing functionality unless the user explicitly requests its
removal. When a requested change affects an existing action or workflow,
preserve it or relocate it to the requested surface.

Cards cannot be closed while any of their bills remain unpaid. Individual
unpaid bill amounts use the destructive token; their accessible names state the
payment status. Aggregate row, card, and grand totals always use the normal ink
token. Do not show a visual marker next to unpaid bill amounts.

Use the soft hairline token for resting card boundaries and the strong hairline
token only for structural separators; do not add shadows.

The Bill Overview is period-specific: show a card column only when that card
has at least one bill in the selected calendar or financial year.
Its Active cards metric counts only open cards represented in that selected
period.

Use a true red destructive token in both themes. The dark token must not
appear pink; retain a minimum 4.5:1 contrast ratio against the dark canvas.

Expenses uses a selected-year grid ordered Investments, Needs, then Wants, with
sections and line items expanded beneath each category. A section is either
direct-entry or line-item based and must never mix the two. Seed the agreed
starting sections on first use. Closed expense years are read-only until the
user explicitly unlocks the displayed year for that visit.
Expense Entry defaults to Calendar year; Credit Card Bill Overview continues to
default to Financial year. Empty expense cells are blank, never a fabricated
zero. A deliberately saved zero remains visible as ₹0.
Use green for Investments, yellow for Needs, and red for Wants wherever those
category labels appear in the Expenses module.
In the compact Expenses grid, do not repeat category names inside the colored
row markers; use the visible top legend as their mapping.
The top Expenses legend category labels are links to their section-management
pages (for example, Investments manages Mutual Funds and Stocks).
Default Investment setup is one Investments section with Mutual Funds, Stocks,
and Gold line items; do not reseed deleted defaults.
The main Expenses grid displays only sections. Sections with items are
clickable and open a dedicated item page; never show their nested items in the
main grid. In deletion mode, the red trash action occupies the far right and
the amount moves left with the transition.
Expense Entry keeps Financial year, Calendar year, and direct year selection
together in its header. Do not add an Income action there until requested.
Every irreversible permanent-delete confirmation uses the shared solid red
`btn-destructive` action; ordinary delete-mode entry controls stay outlined.
Expense Entry must use the exact same period-control composition as Bill
Overview: Financial year / Calendar year segmented control, previous arrow,
compact direct year selector, and next arrow. Reuse matching ordering, labels,
accessible behavior, and tokens for equivalent UI elements across the app; do
not create page-specific variations without an explicit user request. Alternate
Expense Entry month columns between `canvas-soft` and `canvas` tokens; this is
grey/white in light mode and grey/black in dark mode, never a raw colour. The
sticky Section header uses `canvas`, matching the dark alternate month surface.
On horizontally scrolling grids, legends stay outside the scroll viewport and
context columns/headers remain pinned with opaque tokenized surfaces above the
scrolling data.
Every workspace page, including category and nested subcategory pages, uses the
same `.app-page` centered content width and responsive inline gutter. Reuse this
primitive for all new workspace pages rather than introducing page-specific
outer padding or widths. `.app-page` owns its 32px top and bottom padding; its
inline gutters are 32px, 48px, and 80px across responsive breakpoints for
consistent breathing room.
Bill Overview's four summary cards use a compact horizontal label/value layout
with 8px internal padding, 16px bold labels matching the Month and month-name
headers, and 20px numeric figures. This preserves the shared outer-page
spacing and lets the complete 12-month Bill Overview fit a 1440x900 viewport
without vertical page scrolling.
All application transitions use the shared 420ms ease-out reorder motion,
including delete reveals, navigation feedback, and control state changes. Do
not introduce a different transition duration or easing without changing this
document and `DESIGN.md`.
The light/dark palette cross-fade is the explicit exception: it uses a dedicated
240ms ease-out duration so full-workspace repainting feels immediate. Preserve
the global reduced-motion override.
All table headers use the shared `.table-header` treatment: 16px semibold.
Apply it to every header cell, including Section, Month, and named month
columns; headers must always be bold and visually consistent across tables.
All financial and expense grid rows, including headers, body rows, and totals, use
`.table-data-row` with the shared fixed compact 48px height, regardless of whether a
cell has an entered amount. Reuse it for any new application grid so populated and
blank rows always align.
Expense Summary is the canonical table-header standard for every workspace
grid: 16px semibold `--color-ink` text on `--color-canvas-soft` with
`px-4 py-2.5` cell padding. New grids must reuse it; data-only alternating
column surfaces must not alter a table header's typography, color, fill, or
padding.
Expense Entry includes a pinned Total column for every section, a Total row
for every month, and a bottom-right grand total. Its category legend uses
compact 8px markers beside the category labels.
Use **Income** everywhere for money received, including UI labels,
documentation, API terminology, types, and database fields. Do not introduce
the narrower **Salary** term.
Keep the Expense Entry category legend visually compact with 4px vertical
container padding and 12px gaps, while preserving 44px minimum-height category
links for accessibility.
Expense Entry's horizontal-scroll table viewport must clip to the parent
card's 24px lower radius so the Total footer retains rounded bottom corners.
Use brighter balanced green, yellow, and red pastel category surfaces in light
theme and deeper counterparts in dark theme, so markers remain clearly visible
without overpowering either canvas. Retain visible text labels because color is
never the sole category identifier.
Color category and subcategory page headings with their parent category's
green, yellow, or red semantic text token. Keep line-item names in standard
ink.
When navigating between nested subcategory pages, never flash a previous,
generic, or placeholder title; render the destination title only after its
section data has loaded.
When opening a nested subcategory from its parent list, carry its known title in
the route and render it immediately while the API loads authoritative section
data, avoiding a blank title gap.
Expense category pages must provide a visible link back to all categories, and
item pages must provide a visible link back to their parent category.
Income must use the same annual Financial/Calendar period controls and
month-by-month treatment as Expense Entry, with visible monthly and annual
income totals. Income uses a vertical Month/Income table rather than a
wide month-column grid. Month rows omit the selected year. The compact table
caps at 720px on wider screens,
expands on narrow screens, and clips its header and footer to the shared 24px
table-card corners.
Income body and total cells must use zero vertical padding around the 44px
amount control so every grid row honors the shared 48px table-row height.
Expense Entry category strips are 12px wide. Keep its sticky Section header
and cells pinned at the matching 12px offset whenever the strip changes.
Two-column data surfaces, including tables and category or line-item lists, use
the shared `.table-compact` primitive: full width on narrow screens, capped at
720px and centered on wider screens, while retaining the standard card corners,
table headers, and 48px rows where applicable.
Wrap each compact page's header, title, notices, and footer actions in the
matching non-clipping `.content-compact` width so they align with the table or
list without clipping menus or modals.
When direct year selection and Financial/Calendar view controls are shown
together, the year picker always comes first, to the left of the segmented
view control. Apply this period-control order consistently across the app.
All yearly workspace pages include the shared previous/next year buttons and
keyboard Arrow Left/Right interaction for their Financial/Calendar segmented
control.
Financial/Calendar controls use the shared 44px stadium-pill geometry of
primary action buttons. A direct year selector is a dropdown and must use the
standard 16px dropdown radius, not a pill shape.
On Expense Entry, month headers show month names only because the selected year
is already visible in the period control. Its fixed-width selector must fit the
longest financial-year label so switching year modes never changes layout.
Always display financial years in full `YYYY-YYYY` form (for example,
`2025-2026`), never as `FY 2025-26`.
To conserve tokens, do not run validation after every small change. Batch
related edits and run the targeted/full validation cycle after approximately
four to five user-requested changes, unless an immediate test is necessary to
resolve a failure or validate a high-risk behavior.
Expense sections within each of Investments, Needs, and Wants are persistently
reorderable. Put the Reorder Sub category action at the end of the category page;
its mode reveals only a drag handle. The focused handle supports Arrow Up/Arrow
Down as the accessible alternative; never make drag-and-drop the only reorder
path, and keep reorder mode mutually exclusive with delete mode.
The reorder handle reveals with the same smooth width-and-opacity transition as
the delete action. During dragging, preview the new order and subtly move the
target row so adjacent items visibly make room before the drop is saved.
Use the dedicated 420ms reorder duration for the handle reveal and row movement
so users can clearly follow the changed order. Name the category-management
actions Add Sub category, Reorder Sub category, and Delete Sub category.
Expense section and line-item removal permanently deletes the item and all of
its associated entries. Require explicit server-validated confirmation and use
the shared destructive-confirmation modal.
Keep Expense deletion icons hidden by default. A bottom-right Delete category
or Delete items control must explicitly enter deletion mode before revealing a
red, icon-only 44px action beside the item name, with an accessible label. The
section name is the navigation action that opens its line-item page.
Seed Expense starter sections only when a user's Expense workspace is empty;
never recreate a user-deleted section on a later request.

When switching Bill Overview from a financial year to a calendar year, select
the financial year's ending calendar year without exceeding the present calendar
year (2025-2026 becomes calendar 2026).
When switching from calendar to financial, select the financial year ending in
the current calendar year (calendar 2027 becomes 2026-2027).

## Core Rule

EVERY time you implement, modify, remove, refactor, fix, or improve anything
in the application, you MUST review and update the documentation before
considering the task complete.

Do not treat documentation as optional.

The application and its documentation must always remain synchronized.

---

# Documentation Structure

The project maintains documentation under `/docs`.

Use the following documents:

- docs/APPLICATION.md
  - Overall description of the application
  - Business purpose
  - Major capabilities
  - Users and use cases
  - Overall system behavior

- docs/FUNCTIONALITY.md
  - Every user-facing feature
  - Functional workflows
  - Business rules
  - User interactions
  - Feature dependencies
  - Expected behavior

- docs/ARCHITECTURE.md
  - Overall technical architecture
  - Frontend architecture
  - Backend architecture
  - Communication between components
  - Important design decisions
  - Data flow
  - External integrations

- docs/API.md
  - REST APIs
  - Endpoints
  - Request/response structures
  - Authentication
  - Error handling

- docs/DATABASE.md
  - Tables
  - Columns
  - Relationships
  - Indexes
  - Database rules
  - Data flow

- docs/CONFIGURATION.md
  - Environment variables
  - Application configuration
  - Feature flags
  - External services

- docs/SECURITY.md
  - Authentication
  - Authorization
  - Roles and permissions
  - Security-related implementation

- docs/DEVELOPMENT.md
  - How to run the project
  - Build commands
  - Test commands
  - Development workflow

- docs/DEPLOYMENT.md
  - Deployment architecture
  - Deployment process
  - Environment requirements
  - Production configuration

- docs/CHANGELOG.md
  - Chronological record of important changes

---

# Documentation Requirements

After implementing a change, determine which documentation is affected.

Examples:

New UI feature:
-> Update FUNCTIONALITY.md

New backend service:
-> Update ARCHITECTURE.md

New API:
-> Update API.md

Database change:
-> Update DATABASE.md

Configuration change:
-> Update CONFIGURATION.md

Authentication/authorization change:
-> Update SECURITY.md

Deployment change:
-> Update DEPLOYMENT.md

New feature affecting multiple areas:
-> Update all relevant documents.

---

# Documentation Quality

Documentation must explain both:

1. WHAT the application does.
2. HOW the application technically does it.

Do not document only the code structure.

For every significant feature explain:

- Purpose
- User behavior
- Business rules
- Inputs
- Outputs
- Main workflow
- Frontend behavior
- Backend behavior
- Database interaction
- APIs involved
- Important dependencies
- Error scenarios
- Security considerations
- Important technical decisions

Write documentation so that a developer who has never seen the
application can understand the feature without reading the source code.

---

# Keep Documentation Current

When modifying existing functionality:

DO NOT simply append a new description.

Update the existing documentation so that it describes the CURRENT
implementation.

Remove or correct obsolete information.

Never allow documentation to describe behavior that no longer exists.

---

# Architecture Documentation

Whenever a new component, service, module, integration, database entity,
or significant technical pattern is introduced, document:

- What it is
- Why it exists
- What it is responsible for
- What it communicates with
- Where it is located in the codebase
- Important dependencies
- Data flow
- Important design decisions

---

# Decision Documentation

When making a significant architectural or technical decision, document:

- Problem
- Decision
- Reason
- Alternatives considered
- Consequences

This is important because future developers and AI agents need to understand
WHY the application was implemented this way.

---

# Before Completing ANY Task

Perform this checklist:

1. Implement the requested change.
2. Verify the implementation.
3. Review the existing documentation.
4. Identify documentation affected by the change.
5. Update all affected documentation.
6. Remove obsolete documentation.
7. Verify that documentation matches the actual implementation.
8. Update CHANGELOG.md for significant changes.
9. Only then consider the task complete.

Never finish an implementation while knowingly leaving documentation
outdated.

---

# Important

Documentation is part of the Definition of Done.

A feature is NOT complete when only the code is implemented.

A feature is complete when:

Code
+
Tests
+
Documentation
+
Architecture information
+
Relevant API/database/configuration information

are all updated and consistent.
## UI & Design Rules

The app is **Your Money** — a unified personal finance workspace. Credit cards is the
first module; expenses, mutual funds and stocks follow. Every UI decision must
assume more modules are coming.

### Design system
- All design tokens live in `src/app/globals.css`. **Never hardcode a hex colour,
  shadow or radius in a component** — use `var(--color-*)`, `var(--radius-*)`,
  `var(--space-*)`.
- The product is **dark-first**: `--color-background` is the page, `--color-surface`
  is a panel, `--color-surface-raised` is an inset/hover.
- Shared classes: `.card-surface` (panels), `.btn-primary`, `.btn-ghost`, `.input`,
  `.numeric`.
- Typography is Fira Sans (UI) + Fira Code (numbers), wired via
  `--font-fira-sans` / `--font-fira-code` in `src/app/layout.tsx`.
- **Every monetary or numeric value must use `.numeric`** so figures align in
  tabular columns.

### Navigation
- Navigation is a **persistent left sidebar** (`src/components/Sidebar.tsx`), grouped
  by money domain. New modules are added as a new group or a new item in an existing
  group — never as extra top-level tabs.
- Below `lg` the sidebar collapses to a drawer opened from a mobile top bar.
- The active route must carry `aria-current="page"` plus visible active styling.
- Roadmap modules render as disabled entries with a "Soon" badge so the information
  architecture is visible without misleading the user.
- `/login` renders standalone with no sidebar (handled in `src/components/AppShell.tsx`).

### Components
- Icons are **inline SVG only** from `src/components/icons.tsx`. Never use emoji as
  icons. Decorative icons are `aria-hidden="true"`; icon-only buttons need an
  `aria-label`.
- All dialogs use `src/components/Modal.tsx`, which provides `role="dialog"`,
  `aria-modal`, `aria-labelledby`, Escape-to-close, scroll lock and focus restore.
  Forms rendered inside must **not** repeat the title.
- Page titles/actions use `src/components/PageHeader.tsx`.

### Accessibility & interaction (non-negotiable)
- Text contrast ≥ 4.5:1; never rely on colour alone to convey meaning.
- Interactive targets ≥ 44×44px (`min-h-11`).
- Never remove focus rings — the global `:focus-visible` outline must stay visible.
- Honour `prefers-reduced-motion` (already handled globally).
- Errors use `role="alert"`, success uses `role="status"`, next to the relevant field.
- Verify layouts at 375 / 768 / 1024 / 1440px. No horizontal page scroll; wide tables
  scroll inside their own container.

### Process
- Use the project-local `ui-ux-pro-max` skill for any UI work:
  `python3 .github/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain <domain>`
- The 21st.dev MCP server is configured project-locally in `.vscode/mcp.json` and
  reads `${env:TWENTY_FIRST_API_KEY}`. **Never commit a literal API key.**
- **Standing rule:** whenever the user gives a new instruction or preference, append
  it to this file so it persists across sessions.

## Schema & Data Consistency Rules

**Any change to a tracked value must be carried through the whole stack.** When a
field is added, removed or renamed, all of the following must be updated in the same
change — never just the UI:

1. **Migration** — add a timestamped file in `supabase/migrations/`. Never edit an
   existing migration that has already been applied; always add a new one.
2. **Types** — `src/types/database.ts` and `src/lib/client-types.ts`.
3. **Validation** — `src/lib/validation/schemas.ts` (Zod).
4. **API routes** — the relevant handlers in `src/app/api/**`, including any
   derived/defaulted values.
5. **UI** — forms, detail views and any list/grid that renders the field.
6. **Docs** — `docs/API.md` and `docs/APPLICATION.md`.

Additional rules:
- A field removed from the UI must not be left orphaned in the database. Either drop
  the column in a migration, or document explicitly why it is retained.
- Dropping a column is destructive — call it out to the user before doing it.
- Apply new local migrations incrementally to the existing database; never use
  `supabase db reset` merely to add independent tables or non-destructive
  schema changes. Existing users and application data must survive every
  migration. Use a reset only when the user has explicitly approved data loss
  and no safe incremental migration is possible.
- Never leave a `NOT NULL` column without a value path. If the UI stops collecting it,
  the API must derive it or the migration must drop/relax it.

## Interaction Rules

- **Filtering must not refetch.** If a dataset is already loaded, filter it in memory
  so toggles apply instantly. A loading state that flashes for under a second is worse
  than no loading state.
- Prefer a **segmented control** over a `<select>` for 2–3 mutually exclusive options,
  and a **switch** over a bare checkbox for on/off filters.
- Range/period pickers must never force repeated single-step clicks. Provide direct
  selection, and disable navigation beyond the range where data can exist.
- Financial-year bounds must map January–March records to the financial year
  that began the preceding calendar year, so every recorded bill is reachable.
- The Bill Overview's Month and Total columns must remain pinned while its card
  columns scroll horizontally within the table container.
- Bill Overview card columns have a shared 184px minimum and distribute remaining
  table width equally. The pinned Month and Total columns have a narrower 160px
  minimum; otherwise, preserve the rounded table surface's internal horizontal
  scroll.
- When Bill Overview has card columns off-screen, apply a static, visible 16px
  hairline-to-transparent gradient directly to the relevant pinned column:
  Total extends leftward for hidden later columns and Month extends rightward
  after users scroll. Remove arrows, and show the gradient only while columns
  remain in that direction.

## Testing Rules

**Every new functionality ships with tests in the same change.** A feature is not
complete until it is covered. This is not optional and does not wait for a later pass.

- Runner: **Vitest** + React Testing Library (jsdom). Run with `npm test`
  (`npm run test:watch` while developing). Tests live in `tests/`, mirroring `src/`:
  `tests/lib/`, `tests/components/`, `tests/api/`.
- **What must be covered when adding or changing anything:**
  - Pure logic (money math, dates, aggregation, status) — the happy path *and* the
    edge cases: zero, negative, month-end, leap years, year boundaries, null/missing
    values, and values arriving as strings from the database.
  - Zod schemas — a valid payload, each rejection rule, and defaults.
  - Components — what the user sees and does: rendered values, submit payloads,
    error states, disabled/conditional controls.
  - Accessibility contracts — roles, `aria-current`, `aria-modal`, accessible names,
    focus behaviour, Escape handling.
  - Removed fields — assert they are *gone*, so a deletion cannot silently regress.
- **Business logic must be extracted into a testable pure module** rather than left
  inline in a route handler or component. `src/lib/year-grid.ts` is the pattern: the
  API imports it, so the tested code is the code that runs.
- Query by accessible role/label, never by CSS class or test id.
- Freeze time with `vi.setSystemTime` for anything date-dependent; never let a test
  depend on the real clock.
- Name tests as a behaviour statement ("skips to next month when this month's
  statement day has passed"), not "works correctly".
- **Never weaken a test to make it pass.** If a test fails, fix the code — or, if the
  assertion was genuinely wrong, correct it and say so explicitly.
- `npm test`, `npm run lint` and `npm run build` must all pass before presenting work.
- Run the full validation suite every 3–4 implementation changes rather than
  after each small change, unless a targeted failure needs immediate fixing or
  the user requests an earlier run.

## Status & Colour Rules

- Unpaid and partially paid bills must be visually distinct from settled ones.
- **Never convey status by colour alone** (WCAG 1.4.1). Always pair colour with a
  glyph, label or text, and expose the status in the accessible name.
- **No standing legend.** A legend below a grid is chrome the user reads once and
  then ignores, while permanently consuming vertical space. Each status marker
  explains itself through its `title` and through the accessible name of the
  control it sits in.

## Design Reference Precedence

**`DESIGN.md` is the single, mandatory source of truth for every design element in
this application.** It is installed via `npx getdesign@latest add mobbin` and
documents the Mobbin design system: a light, gallery-white monochrome system built
on near-black ink over a white canvas, elevation expressed through hairlines and a
tint ladder rather than shadows, and stadium-pill geometry for all controls.

When references disagree, follow this order:

1. **`DESIGN.md`** — mandatory. All colour, typography, radius, spacing and
   component geometry originate here.
2. **`src/app/globals.css`** — the *implementation* of `DESIGN.md` as CSS custom
   properties and utility classes. It never introduces design values of its own.
3. **`.github/copilot-instructions.md`** (this file) — product and behaviour rules.
4. **`.github/skills/ui-ux-pro-max`** — searchable UX/accessibility guidance, used
   to validate accessibility and interaction quality, never to override `DESIGN.md`.

### Rules

- Do not add project-specific visual patterns or design sections to
`DESIGN.md` unless the user explicitly directs it. The installed reference is
the visual source of truth; this file holds application behaviour rules.
- **No design value may exist without a `DESIGN.md` origin.** Every token in
  `globals.css` carries a comment naming the `DESIGN.md` key it comes from.
- **Never hardcode a raw hex, px radius or font size in a component.** Reference the
  token: `text-[var(--color-text-muted)]`, not `text-[#666666]`.
- **No shadows.** `DESIGN.md` is shadow-free; separate surfaces with
  `--color-hairline` / `--color-hairline-soft` or the `--color-canvas-soft` tint.
- **Geometry:** controls, nav rows, badges and toggles are full stadium pills
  (`rounded-full`); containers/cards are 24px; inputs and media are 16px; app-icon
  tiles use the `.squircle` class.
- **Spacing** comes from the `DESIGN.md` scale only: 4 / 8 / 12 / 16 / 24 / 32 / 48
  / 80 / 120.
- **Typography** uses `--font-saans` at the `DESIGN.md` weights — 652 for headings,
  456 for body, 300 for light text. Saans is a commercial licence and is not on
  Google Fonts, so `Inter` is loaded as the documented substitute in
  `src/app/layout.tsx`; if Saans is ever licensed, swap only that one import.
- **`--color-primary` (`#0066ff`) is reserved** for commercial and decision signals
  (primary actions, brand mark). It is not a decorative accent — do not scatter it.
- **Documented extensions.** `DESIGN.md` ships no status palette, so
  `--color-destructive` and `--color-positive` are defined in `globals.css` as an
  explicitly commented EXTENSION, chosen to clear 4.5:1 on the white canvas. Any
  future value with no `DESIGN.md` origin must be added the same way: in
  `globals.css`, under a comment saying it extends `DESIGN.md` and why, and
  contrast-checked before use.
- **When adding or changing any UI, read `DESIGN.md` first** and cite the key you
  are implementing.
- The root `DESIGN.md` is replaced whenever the user explicitly installs a new
  design reference. Follow only that installed reference and its explicitly
  approved project additions; do not retain or invent prior design decisions.

  Follow every applicable requirement in the installed `DESIGN.md`; when it
  conflicts with an earlier project visual preference, ask the user rather than
  choosing a design direction.

All design tooling is installed **project-locally**. Never install these globally.

## Theming Rules

Every page ships **both a light and a dark theme**, and every page exposes a way
to switch. The canonical spec is the "Theming — Light & Dark" section of
`DESIGN.md`; read it before touching colour.

- **Dark mode is polarity inversion, not a new palette.** Tokens keep their role
  and flip their value. Never add a dark-only colour that has no light-mode
  counterpart.
- **Never hardcode a colour in a component** — this now includes scrims and
  overlays (`bg-black/65` is a bug; use `bg-[var(--color-scrim)]`). Anything
  hardcoded will look wrong in one of the two themes.
- **Adding a palette token means adding it to both `:root` and
  `[data-theme="dark"]`,** and contrast-checking it on that theme's `canvas`
  *and* `canvas-soft`. `tests/theme/tokens.test.ts` enforces both.
- **The theme control is Light / System / Dark**, never a two-state switch —
  dropping "System" would discard the user's OS preference. It lives in the
  sidebar footer; any page rendered outside `AppShell` (e.g. `/login`) must
  render its own `<ThemeToggle />`.
- **The preference must be applied before first paint** via the inline script in
  `layout.tsx`. If you change how the theme resolves, change `themeInitScript`
  and `resolveTheme` together — they must agree or the page will flash.
- **`prefers-reduced-motion` is honoured globally.** Do not add a transition
  that escapes that guard.
- When adding UI, **check it in both themes before calling it done.**

## Derived Values & Layout Rules

**Card-owned values are never editable on a bill.** A bill's card, statement
date and due date are all determined by the card, so the bill form shows them as
read-only text via `.value-static` — never as a disabled input.

- A disabled input reads as "temporarily blocked". These values are *permanently*
  derived, so render them as static text with the `.value-static` class.
- Do **not** add explanatory subtext below derived dates (for example, "Day 15
  of the month" or "20 days after statement"). Their permanent static treatment
  and the card field above establish that they are card-derived; the additional
  copy competes with the date values.
- **Recompute derived values; never trust a stored one.** Compare configured
  monthly days: a due day later than the statement day remains in the same
  month; the same or earlier due day rolls into the next month. Apply this when
  editing too, so a stale row cannot contradict its card.
- The card selector appears **only when creating** a bill. When editing it is
  static text, so a bill can never jump between cards.

**The Bill Overview must fit a 1440×900 viewport with no page scrollbar.** A
full financial year is 12 rows plus a totals row; that is the densest the page
gets, and it must fit. When adding anything to this page, re-measure
`scrollHeight` vs `clientHeight` and reclaim space from the spacing scale rather
than introducing an inner scroll area.

## Payment State Is Derived, Never Stored

There is **no `status` or `amount_paid` column** on `statements`, and neither
may be reintroduced. Payment state is derived solely from the recorded
`payment_date`; it is never manually chosen.

- `outstandingAmount` is the full `total_amount_due` until payment is recorded,
  then zero.
- `paymentState()` returns `Paid` when `payment_date` exists, otherwise
  `Unpaid`. Partial payments are unsupported.
- The UI exposes a single **Paid** action for an unpaid bill. It can always be
  used for an active-card bill. Statements before the current calendar month
  persist `historical_payment_confirmed` with no payment date; current and
  future statements record the current server date. Never accept a
  client-supplied payment date.
- Show **Mark unpaid** only for a paid bill. It clears the recorded payment date
  and restores the unpaid state; never show it for an unpaid bill.
- Permit the Paid action only while the bill is less than one month old and
  today's date falls inclusively between its statement and due dates. Enforce
  this in the UI and API so an automatic payment date cannot fall outside the
  billing window. The API must derive the due date from the linked card during
  this check, never trust a historical stored due date.
- Once a bill is paid, render its total due as `.value-static`, not an input,
  and reject any API attempt to change `total_amount_due`.
- **Red (`--color-destructive`) always means "money is still owed"** — it is
  driven by the outstanding amount, never by a label. Overdue (`!`) additionally
  requires the due date to have passed.
- These helpers live in `src/lib/client-types.ts` and are the single source of
  truth. `year-grid.ts` re-exports rather than reimplements them, so the grid
  totals and the row styling can never diverge.

**Summary counts must be derived from the grid already loaded for the selected
period.** “Cards with payments due” counts distinct card IDs whose outstanding
amount is greater than zero, including a closed card with a historical
unpaid bill. Never make a second request merely to calculate a summary metric.

## Select / Dropdown Styling

Native `<select>` menus are operating-system UI (notably macOS/Apple UI) and
cannot conform to DESIGN.md. Every dropdown must use the shared
`src/components/Select.tsx` accessible listbox rather than a native select.

- The trigger follows DESIGN.md's `text-input` primitive: `--color-field`,
  `--radius-sm`, `--space-sm` / `--space-md`, and a 44px minimum target.
- The menu is a `--color-canvas` panel with `--color-hairline` boundary,
  `--radius-sm` corners, and `--color-canvas-soft` selected/hover state.
- Use the shared inline SVG chevron from `icons.tsx`; never an operating-system
  arrow, CSS mask, or `background-image`.
- Preserve listbox accessibility: visible label/accessible name, expanded and
  selected states, keyboard operation (Escape, Enter, Space, Arrow keys), and
  click-away dismissal.

## Number Input Styling

Keep `type="number"` for numerical validation and mobile numeric keyboards, but
hide native browser spinner controls everywhere. Financial amounts and card
configuration are deliberate typed values, not unit-stepper controls. Apply the
cross-browser spinner reset in `globals.css`; do not replace number inputs with
text inputs or add custom spinner buttons.

## Card Credit Limits and Due Dates

- Card `credit_limit` is required and non-negative. It appears first in both
  Add card and Edit card dialogs, and every bill's `total_amount_due` must not
  exceed it. Enforce this in the bill form **and** API routes; the API
  recomputes card-derived dates and must never trust a client-provided one.
- Cards store `due_day` (1–31), a fixed monthly due date — never a relative
  “days after statement” offset. A due day later than the statement day is in
  the statement month; the same or earlier day is in the following month. Clamp
  day 29–31 to the final day of a shorter month.
- List active cards before closed cards. Keep closed cards in
  historical reporting but never intermingle them before active cards.

## Card Closure Terminology

- Use **closed card** in all user-facing copy for a card whose `is_active` value
  is false. Preserve the boolean field and its API compatibility; only the
  product language changes.
- A closed card is immutable. Hide its Edit action, expose only Reopen card,
  and reject every API update other than a sole `is_active: true` reopen.
- Cards with no bill history may be permanently deleted after confirmation.
  Never offer deletion for a card with bills; preserve that history by closing
  the card instead, and enforce this in the API.
- Bills for a closed card are view-only. Do not offer new-bill, Paid, or Remove
  entry actions for it, and reject those writes in the API.
- New-bill entry must provide direct statement year and month selection for the
  current year plus historical years, then derive the exact date from the
  selected card's statement day. Default both selectors to the current month
  and year; never require sequential month navigation.
- In the New bill dialog, place Statement month and Statement year as a paired
  row immediately below Card; place the derived Statement date and Due date
  together on the following row.
