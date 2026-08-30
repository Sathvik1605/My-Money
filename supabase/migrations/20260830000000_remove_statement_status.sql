-- Payment status is no longer stored.
--
-- Status was a manually-selected field that could contradict the amounts on
-- the same row (e.g. marked "Paid" while amount_paid was 0). Payment state is
-- fully determined by total_amount_due vs amount_paid, so it is now derived in
-- application code and the stored column is removed as the redundant, and less
-- trustworthy, source of truth.
--
-- Before dropping, reconcile amount_paid for rows whose status was the more
-- accurate value, so no payment information is lost:
--   * status 'Paid' but underpaid  -> settle amount_paid to the full amount due
update public.statements
set amount_paid = total_amount_due
where status = 'Paid'
  and amount_paid < total_amount_due;

--   * status 'Unpaid' but amount_paid > 0 is a genuine partial payment; the
--     amount is authoritative, so those rows are left untouched.

alter table public.statements
  drop column status;

drop type if exists statement_status;
