export type CardNetwork = "Visa" | "Mastercard" | "Amex" | "RuPay" | "Diners";

/** Historical bills preserve their paid state without inventing a payment date. */
export type PaymentState = "Unpaid" | "Paid";

export interface CardRow {
  id: string;
  nickname: string;
  bank_name: string;
  network: CardNetwork;
  last4_digits: string;
  credit_limit: number;
  statement_day: number;
  due_day: number;
  is_active: boolean;
}

export interface StatementRow {
  id: string;
  card_id: string;
  cycle_start_date: string;
  cycle_end_date: string;
  statement_date: string;
  due_date: string;
  total_amount_due: number;
  payment_date: string | null;
  historical_payment_confirmed?: boolean;
}

type Payment = Pick<StatementRow, "payment_date" | "historical_payment_confirmed">;
type BillAmount = { total_amount_due: number | string };

/** A bill is either wholly unpaid or wholly paid; partial payments are unsupported. */
export function outstandingAmount(statement: BillAmount & Payment): number {
  return isFullyPaid(statement) ? 0 : Number(statement.total_amount_due);
}

export function isFullyPaid(statement: Payment): boolean {
  return statement.payment_date !== null || statement.historical_payment_confirmed === true;
}

export function paymentState(statement: Payment): PaymentState {
  if (isFullyPaid(statement)) return "Paid";
  return "Unpaid";
}

export function hasUnpaidStatements(statements: Payment[]): boolean {
  return statements.some((statement) => !isFullyPaid(statement));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function isOverdue(statement: Pick<StatementRow, "due_date"> & Payment): boolean {
  if (isFullyPaid(statement)) return false;
  return new Date(statement.due_date + "T00:00:00Z") < new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
}
