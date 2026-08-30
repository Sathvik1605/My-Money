-- Historical statements can be marked paid without fabricating a payment date.
ALTER TABLE public.statements
  ADD COLUMN historical_payment_confirmed boolean NOT NULL DEFAULT false;

UPDATE public.statements
SET historical_payment_confirmed = true,
    payment_date = NULL
WHERE statement_date < date_trunc('month', current_date)::date
  AND payment_date IS NOT NULL;
