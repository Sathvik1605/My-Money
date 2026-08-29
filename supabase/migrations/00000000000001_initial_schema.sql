-- Credit Card Bill Tracker — MVP1 initial schema
-- See requirements §7 (Data Model) and §11 (Security).

-- Enums -----------------------------------------------------------------

create type card_network as enum ('Visa', 'Mastercard', 'Amex', 'RuPay', 'Diners');
create type statement_status as enum ('Unpaid', 'Partially Paid', 'Paid');

-- cards -------------------------------------------------------------------
-- §6/§11: every card is scoped to a user via user_id + RLS, so one
-- account can never read or write another account's cards or statements.

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nickname text not null check (char_length(trim(nickname)) > 0),
  bank_name text not null check (char_length(trim(bank_name)) > 0),
  network card_network not null,
  last4_digits text not null check (last4_digits ~ '^[0-9]{4}$'),
  credit_limit numeric(12, 2) check (credit_limit is null or credit_limit >= 0),
  billing_cycle_start_day int not null check (billing_cycle_start_day between 1 and 31),
  statement_day int not null check (statement_day between 1 and 31),
  typical_due_days_after_statement int not null check (typical_due_days_after_statement >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cards_user_id_idx on public.cards (user_id);

-- statements ----------------------------------------------------------------

create table public.statements (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards (id) on delete cascade,
  cycle_start_date date not null,
  cycle_end_date date not null check (cycle_end_date >= cycle_start_date),
  statement_date date not null,
  due_date date not null,
  total_amount_due numeric(12, 2) not null check (total_amount_due >= 0),
  amount_paid numeric(12, 2) not null default 0 check (amount_paid >= 0),
  payment_date date,
  status statement_status not null default 'Unpaid',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index statements_card_id_idx on public.statements (card_id);
create index statements_statement_date_idx on public.statements (statement_date);
-- One statement per card per billing cycle.
create unique index statements_card_cycle_unique on public.statements (card_id, cycle_start_date);

-- updated_at maintenance ----------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger cards_set_updated_at
  before update on public.cards
  for each row execute function public.set_updated_at();

create trigger statements_set_updated_at
  before update on public.statements
  for each row execute function public.set_updated_at();

-- Row Level Security ---------------------------------------------------------
-- §11: RLS is a second line of defense even though every API route also
-- checks auth + ownership explicitly.

alter table public.cards enable row level security;
alter table public.statements enable row level security;

create policy "cards_select_own" on public.cards
  for select using (auth.uid() = user_id);

create policy "cards_insert_own" on public.cards
  for insert with check (auth.uid() = user_id);

create policy "cards_update_own" on public.cards
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "cards_delete_own" on public.cards
  for delete using (auth.uid() = user_id);

-- statements are scoped through their parent card's user_id
create policy "statements_select_own" on public.statements
  for select using (
    exists (
      select 1 from public.cards c
      where c.id = statements.card_id and c.user_id = auth.uid()
    )
  );

create policy "statements_insert_own" on public.statements
  for insert with check (
    exists (
      select 1 from public.cards c
      where c.id = statements.card_id and c.user_id = auth.uid()
    )
  );

create policy "statements_update_own" on public.statements
  for update using (
    exists (
      select 1 from public.cards c
      where c.id = statements.card_id and c.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.cards c
      where c.id = statements.card_id and c.user_id = auth.uid()
    )
  );

create policy "statements_delete_own" on public.statements
  for delete using (
    exists (
      select 1 from public.cards c
      where c.id = statements.card_id and c.user_id = auth.uid()
    )
  );
