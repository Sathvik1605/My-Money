# API

All endpoints are Next.js route handlers under `/api`. They require an authenticated Supabase session cookie. Successful responses are JSON with a `data` property, except `DELETE /api/statements/:id`, which returns `204 No Content`. Error responses use `{ "error": string, "details"?: unknown }`.

## Cards

| Method | Endpoint | Behavior |
| --- | --- | --- |
| GET | `/api/cards?includeInactive=true` | Lists the caller's active cards, optionally including closed cards. |
| POST | `/api/cards` | Creates a card for the caller; returns `201`. |
| GET | `/api/cards/:id` | Returns one caller-owned card. |
| PATCH | `/api/cards/:id` | Updates permitted card fields, including `is_active`; closing (`is_active: false`) is rejected while any linked bill is unpaid. |
| DELETE | `/api/cards/:id` | Permanently deletes a caller-owned card and its cascading bills when the body includes `confirm_delete: true`; returns `204`. |

Card create input requires `nickname`, `bank_name`, `network`, `last4_digits`,
non-negative `credit_limit`, `statement_day`, and `due_day`. Both day fields are
1–31. Updates accept any subset plus optional `is_active`; active cards are
listed before closed cards. A closed card accepts only `is_active: true` to
reopen it; any other update is rejected with `409`.
Deleting a card that has bills returns `409`; users must close it instead to
retain its history.

## Statements

| Method | Endpoint | Behavior |
| --- | --- | --- |
| GET | `/api/statements?card_id=:id` | Lists caller-owned statements, optionally for one caller-owned card. |
| POST | `/api/statements` | Creates a statement for a caller-owned card; returns `201`. |
| GET | `/api/statements/:id` | Returns one caller-owned statement with card details. |
| PATCH | `/api/statements/:id` | Updates statement fields other than `card_id`. |
| DELETE | `/api/statements/:id` | Permanently deletes one caller-owned statement. |

Statement create input is `card_id`, `statement_date`, and `total_amount_due`.
There is no client-editable `due_date`, payment date, payment amount, or status
field. `PATCH` accepts `mark_paid: true`: before the current calendar month it
sets `historical_payment_confirmed` and leaves `payment_date` null; otherwise
it records the server's current date as `payment_date`. `mark_unpaid: true`
clears both paid representations. It never accepts a
client-chosen payment date, and rejects a request that includes both actions.
The API rejects invalid dates, negative
amounts, an unowned card, and duplicate `(card_id, cycle_start_date)` pairs.
The duplicate case returns `409`.

The API rejects a new bill, any bill update, or bill removal for a closed card
with `409`. A `mark_paid` request also returns `409` unless the current date is
on or after the statement date, on or before the due date, and the statement is
less than one month old. This check derives the due date from the linked card's
current `due_day`, not the stored statement value.

Paid statement totals are immutable: a `PATCH` that supplies
`total_amount_due` after a payment date has been recorded returns `409`.

`statement_date` and `due_date` are card-derived. The client derives the due
date from the card's fixed monthly `due_day` on every write, including edits, so
a stale stored value can never contradict its card.

The API is authoritative: it derives `due_date` from the card's fixed `due_day`
on every create and update, and rejects `total_amount_due` values above the
card's `credit_limit` with `400`. Card create requests require a non-negative
`credit_limit`, `statement_day`, and `due_day` (all monthly days are 1–31).
Card updates that would lower a limit below an existing bill total also return
`400`.

## Year grid

`GET /api/year-grid?year=2025&yearType=financial|calendar` returns the selected range, user cards, twelve month rows, card totals, and grand total. `yearType` defaults to `financial`; only `calendar` selects the calendar mode. An invalid numeric year returns `400`.

## Status codes

`400` is malformed or invalid input; `401` is no authenticated user; `404` is an absent or unowned resource; `409` is a duplicate statement cycle; and `500` represents a database or unexpected route-handler failure.