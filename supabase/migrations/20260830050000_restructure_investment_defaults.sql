-- Replace the default Investment sections with one Investments section and
-- preserve Mutual Funds, Stocks, and Gold entries as its line-item entries.
do $$
declare
  owner record;
  investments_section_id uuid;
  mutual_funds_item_id uuid;
  stocks_item_id uuid;
  gold_item_id uuid;
begin
  for owner in select distinct user_id from public.expense_sections loop
    insert into public.expense_sections (user_id, category, name)
    values (owner.user_id, 'Investment', 'Investments')
    on conflict (user_id, category, name) do update set name = excluded.name
    returning id into investments_section_id;

    insert into public.expense_line_items (section_id, name)
    values
      (investments_section_id, 'Mutual Funds'),
      (investments_section_id, 'Stocks'),
      (investments_section_id, 'Gold')
    on conflict (section_id, name) do nothing;

    select id into mutual_funds_item_id from public.expense_line_items
      where section_id = investments_section_id and name = 'Mutual Funds';
    select id into stocks_item_id from public.expense_line_items
      where section_id = investments_section_id and name = 'Stocks';
    select id into gold_item_id from public.expense_line_items
      where section_id = investments_section_id and name = 'Gold';

    update public.expense_entries entry
    set section_id = investments_section_id,
        line_item_id = case section.name
          when 'Mutual Funds' then mutual_funds_item_id
          when 'Stocks' then stocks_item_id
          when 'Gold' then gold_item_id
        end
    from public.expense_sections section
    where entry.section_id = section.id
      and section.user_id = owner.user_id
      and section.category = 'Investment'
      and section.name in ('Mutual Funds', 'Stocks', 'Gold');

    delete from public.expense_sections
    where user_id = owner.user_id
      and category = 'Investment'
      and name in ('Mutual Funds', 'Stocks', 'PPF', 'Gold', 'Silver');
  end loop;
end;
$$;
