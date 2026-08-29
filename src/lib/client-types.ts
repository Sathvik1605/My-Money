export type CardNetwork = "Visa" | "Mastercard" | "Amex" | "RuPay" | "Diners";
export type StatementStatus = "Unpaid" | "Partially Paid" | "Paid";

export interface CardRow {
  id: string;
  nickname: string;
  bank_name: string;
  network: CardNetwork;
  last4_digits: string;
  credit_limit: number | null;
  billing_cycle_start_day: number;
  statement_day: number;
  typical_due_days_after_statement: number;
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
  amount_paid: number;
  payment_date: string | null;
  status: StatementStatus;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function isOverdue(statement: Pick<StatementRow, "due_date" | "status">): boolean {
  if (statement.status === "Paid") return false;
  return new Date(statement.due_date + "T00:00:00Z") < new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
}
