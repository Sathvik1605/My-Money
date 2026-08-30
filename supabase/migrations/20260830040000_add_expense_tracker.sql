create type public.expense_category as enum ('Need', 'Want', 'Investment');

create table public.expense_sections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category public.expense_category not null,
  name text not null check (char_length(trim(name)) > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category, name)
);

create table public.expense_line_items (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.expense_sections (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (section_id, name)
);

create table public.expense_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  section_id uuid not null references public.expense_sections (id) on delete cascade,
  line_item_id uuid references public.expense_line_items (id) on delete cascade,
  month date not null check (month = date_trunc('month', month)::date),
  amount numeric(12, 2) not null check (amount >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index expense_entries_section_month_unique
  on public.expense_entries (section_id, month)
  where line_item_id is null;
create unique index expense_entries_line_item_month_unique
  on public.expense_entries (line_item_id, month)
  where line_item_id is not null;

create table public.monthly_income (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  month date not null check (month = date_trunc('month', month)::date),
  amount numeric(12, 2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month)
);

create index expense_sections_user_category_idx on public.expense_sections (user_id, category);
create index expense_line_items_section_idx on public.expense_line_items (section_id);
create index expense_entries_user_month_idx on public.expense_entries (user_id, month);
create index monthly_income_user_month_idx on public.monthly_income (user_id, month);

create or replace function public.validate_expense_entry()
returns trigger
language plpgsql
as $$
declare
  section_owner uuid;
  item_section_id uuid;
begin
  select user_id into section_owner from public.expense_sections where id = new.section_id;
  if section_owner is null or section_owner <> new.user_id then
    raise exception 'Expense entry must belong to the section owner';
  end if;

  if new.line_item_id is not null then
    select section_id into item_section_id from public.expense_line_items where id = new.line_item_id;
    if item_section_id is null or item_section_id <> new.section_id then
      raise exception 'Line item must belong to the expense section';
    end if;
    if exists (
      select 1 from public.expense_entries
      where section_id = new.section_id
        and month = new.month
        and line_item_id is null
        and id <> coalesce(new.id, gen_random_uuid())
    ) then
      raise exception 'A direct section amount already exists for this month';
    end if;
  elsif exists (
    select 1 from public.expense_entries
    where section_id = new.section_id
      and month = new.month
      and line_item_id is not null
      and id <> coalesce(new.id, gen_random_uuid())
  ) then
    raise exception 'Line-item amounts already exist for this month';
  end if;

  return new;
end;
$$;

create trigger expense_entries_validate before insert or update on public.expense_entries
  for each row execute function public.validate_expense_entry();

create trigger expense_sections_set_updated_at before update on public.expense_sections
  for each row execute function public.set_updated_at();
create trigger expense_line_items_set_updated_at before update on public.expense_line_items
  for each row execute function public.set_updated_at();
create trigger expense_entries_set_updated_at before update on public.expense_entries
  for each row execute function public.set_updated_at();
create trigger monthly_income_set_updated_at before update on public.monthly_income
  for each row execute function public.set_updated_at();

alter table public.expense_sections enable row level security;
alter table public.expense_line_items enable row level security;
alter table public.expense_entries enable row level security;
alter table public.monthly_income enable row level security;

create policy "expense_sections_own" on public.expense_sections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "expense_line_items_own" on public.expense_line_items
  for all using (exists (
    select 1 from public.expense_sections section
    where section.id = expense_line_items.section_id and section.user_id = auth.uid()
  )) with check (exists (
    select 1 from public.expense_sections section
    where section.id = expense_line_items.section_id and section.user_id = auth.uid()
  ));
create policy "expense_entries_own" on public.expense_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "monthly_income_own" on public.monthly_income
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);