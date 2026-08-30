# Database

Supabase provides PostgreSQL and stores authentication identities in `auth.users`. Application tables are created by `supabase/migrations/00000000000001_initial_schema.sql`.

## `auth.users`

Supabase Auth manages user identifiers, email data, password hashes, and auth metadata. The application references `auth.users.id` and never stores passwords. There is no application-owned user table.

## `public.cards`

`cards` stores user-owned credit-card metadata: UUID `id`; required `user_id`
foreign key to `auth.users`; nickname, bank, network, and exactly four card
digits; required non-negative credit limit; statement day; fixed monthly due
day (both 1–31); active flag; and timestamps. The former
`typical_due_days_after_statement` offset was removed by migration
`20260830010000_require_credit_limit_and_due_day.sql`.

The same migration adds `cards_credit_limit_required`. It is `NOT VALID` so an
old deployment with historical unknown limits is not assigned an invented
amount, while all new or updated rows must have a non-null non-negative limit.

`card_network` is constrained to Visa, Mastercard, Amex, RuPay, or Diners. `cards_user_id_idx` supports per-user access. `cards_set_updated_at` maintains `updated_at` before updates. Deleting an auth user cascades to their cards.

## `public.statements`

`statements` stores each bill: UUID `id`; required `card_id` foreign key; cycle,
statement, due, and optional payment dates; `historical_payment_confirmed`; a
non-negative total amount; and timestamps.

There is deliberately **no payment amount column**. Payment state is derived by
`paymentState()` in `src/lib/client-types.ts`: a payment date means fully paid,
and `historical_payment_confirmed` means a statement from a completed calendar
month is paid without fabricating a payment date. A null payment date and a
false historical confirmation means unpaid.
Migration `20260830020000_replace_partial_payments_with_payment_date.sql` drops
`amount_paid`. It deliberately clears payment dates for partially paid rows,
because partial payments are no longer a supported state; existing fully paid
rows retain their recorded payment date. Migration
`20260830030000_support_historical_paid_bills.sql` moves payment dates from
already historical statements into `historical_payment_confirmed`.

Paid bill totals are immutable in the API once either paid representation exists. Closed
cards (`is_active = false`) retain their data and history, but the API permits
only reopening until `is_active` is restored to true. A card cannot transition
to closed while a linked statement has both a null `payment_date` and
`historical_payment_confirmed = false`.

The table checks that cycle end is on or after cycle start. `statements_card_id_idx` supports card lookups, `statements_statement_date_idx` supports date filtering, and `statements_card_cycle_unique` enforces one statement per card and cycle start. Removing a card cascades to statements after the API receives an explicit deletion confirmation.

## Access control and data flow

Both tables use Row Level Security. A user can only select, insert, update, or delete cards where `cards.user_id = auth.uid()`. Statement policies derive ownership by checking that the linked card is owned by `auth.uid()`. API handlers attach the authenticated Supabase session to their database client, so RLS receives the correct `auth.uid()`.
# Expenses tables

`expense_sections`, `expense_line_items`, `expense_entries`, and
`monthly_income` are all scoped to `auth.users` using RLS. Sections belong to a
fixed Need, Want, or Investment category; line items belong to sections; and
entries belong to a user, section, optional line item, and first-of-month date.
Unique indexes allow one direct section entry or one entry per line item for a
month. The `validate_expense_entry` trigger verifies ownership, parentage, and
prevents mixing direct and line-item entries in a section/month.
Each section has a `sort_order` that is unique in practice within its user's
category; each line item has a `sort_order` within its section. Migration
`20260830060000_add_expense_sort_order.sql` backfills both values from the
existing creation order and indexes their parent/order keys for ordered reads.
Migration `20260830050000_restructure_investment_defaults.sql` consolidates
the default Investment sections into an Investments section and converts
Mutual Funds, Stocks, and Gold entries to their respective line items. It
permanently removes PPF and Silver sections and their entries.
