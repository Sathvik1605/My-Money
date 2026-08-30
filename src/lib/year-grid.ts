import { outstandingAmount as outstanding } from "@/lib/client-types";

export interface GridStatement {
  card_id: string;
  statement_date: string;
  total_amount_due: number | string;
  payment_date: string | null;
  historical_payment_confirmed?: boolean;
}

export interface GridMonth {
  label: string;
  year: number;
  month: number;
}

export interface GridRow {
  month: string;
  amounts: Record<string, number>;
  unpaidAmounts: Record<string, number>;
  total: number;
  unpaidTotal: number;
}

/** Keeps the overview focused on cards that have a bill in the selected period. */
export function cardsWithStatementsInPeriod<T extends { id: string }>(
  cards: T[],
  statements: Pick<GridStatement, "card_id">[],
): T[] {
  const statementCardIds = new Set(statements.map((statement) => statement.card_id));
  return cards.filter((card) => statementCardIds.has(card.id));
}

/** Returns the starting calendar year for the Indian financial year containing a date. */
export function financialYearStartForDate(date: string): number {
  const parsed = new Date(`${date}T00:00:00Z`);
  return parsed.getUTCFullYear() - (parsed.getUTCMonth() < 3 ? 1 : 0);
}

/** Number of distinct cards with money still owed in the displayed period. */
export function cardsWithPaymentsDue(rows: GridRow[]): number {
  return new Set(
    rows.flatMap((row) =>
      Object.entries(row.unpaidAmounts)
        .filter(([, amount]) => amount > 0)
        .map(([cardId]) => cardId),
    ),
  ).size;
}

/**
 * Outstanding balance for a single bill, derived from its paid/unpaid state.
 * Re-exported from the shared helper so the grid and the UI can never diverge.
 */
export function outstandingAmount(statement: GridStatement): number {
  return outstanding({
    total_amount_due: Number(statement.total_amount_due),
    payment_date: statement.payment_date,
    historical_payment_confirmed: statement.historical_payment_confirmed,
  });
}

/**
 * Builds the month-by-card grid, tracking billed and outstanding amounts in
 * parallel so the UI can highlight what still needs paying.
 */
export function buildYearGrid(
  months: GridMonth[],
  cardIds: string[],
  statements: GridStatement[],
): { rows: GridRow[]; cardTotals: Record<string, number>; grandTotal: number; unpaidTotal: number } {
  const cardTotals: Record<string, number> = Object.fromEntries(cardIds.map((id) => [id, 0]));

  const rows = months.map((m) => {
    const amounts: Record<string, number> = Object.fromEntries(cardIds.map((id) => [id, 0]));
    const unpaidAmounts: Record<string, number> = Object.fromEntries(cardIds.map((id) => [id, 0]));

    for (const s of statements) {
      const d = new Date(s.statement_date + "T00:00:00Z");
      if (d.getUTCFullYear() !== m.year || d.getUTCMonth() !== m.month) continue;
      if (!(s.card_id in amounts)) continue;

      amounts[s.card_id] += Number(s.total_amount_due);
      unpaidAmounts[s.card_id] += outstandingAmount(s);
    }

    const total = Object.values(amounts).reduce((a, b) => a + b, 0);
    const unpaid = Object.values(unpaidAmounts).reduce((a, b) => a + b, 0);
    for (const id of cardIds) cardTotals[id] += amounts[id] ?? 0;

    return { month: m.label, amounts, unpaidAmounts, total, unpaidTotal: unpaid };
  });

  return {
    rows,
    cardTotals,
    grandTotal: Object.values(cardTotals).reduce((a, b) => a + b, 0),
    unpaidTotal: rows.reduce((sum, r) => sum + r.unpaidTotal, 0),
  };
}
