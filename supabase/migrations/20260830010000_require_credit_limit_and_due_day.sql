-- A card's due date is a fixed day of the month, rather than a relative
-- number of days after a statement. Credit limits are required for every
-- newly created or updated card so bill totals can be validated reliably.

alter table public.cards
  add column due_day int check (due_day between 1 and 31);

-- Existing statements are the most reliable record of each card's established
-- due day. Cards without a bill retain their prior day-offset behavior as a
-- best-effort monthly day before the offset column is removed.
update public.cards card
set due_day = coalesce(
  (
    select extract(day from statement.due_date)::int
    from public.statements statement
    where statement.card_id = card.id
    order by statement.statement_date desc
    limit 1
  ),
  ((card.statement_day - 1 + card.typical_due_days_after_statement) % 31) + 1
);

alter table public.cards
  alter column due_day set not null,
  drop column typical_due_days_after_statement;

-- NOT VALID preserves any historical card whose limit was intentionally
-- unknown, while enforcing a required, non-negative limit on every future
-- insert or update. The application requires the field in all card forms.
alter table public.cards
  add constraint cards_credit_limit_required
  check (credit_limit is not null and credit_limit >= 0) not valid;
