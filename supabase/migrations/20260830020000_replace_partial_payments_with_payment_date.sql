-- Payment is now an all-or-nothing action. Preserve only existing payments
-- with a recorded date; amounts for partial payments are intentionally discarded.
update public.statements
set payment_date = null
where amount_paid < total_amount_due
   or payment_date is null;

alter table public.statements
  drop column amount_paid;
