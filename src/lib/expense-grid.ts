import type {
  ExpenseCategory,
  ExpenseEntryRow,
  ExpenseLineItemRow,
  ExpenseSectionRow,
  MonthlyIncomeRow,
} from "@/lib/client-types";

export const EXPENSE_CATEGORIES: ExpenseCategory[] = ["Need", "Want", "Investment"];
export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  Investment: "Investments",
  Need: "Needs",
  Want: "Wants",
};

export const STARTER_SECTIONS: Record<ExpenseCategory, string[]> = {
  Need: ["Food", "Snacks", "Fruits", "Transportation", "House", "OTT"],
  Want: ["Trips", "Shopping", "Gifts", "Miscellaneous"],
  Investment: ["Investments"],
};

export const STARTER_LINE_ITEMS: Record<string, string[]> = {
  Investments: ["Mutual Funds", "Stocks", "Gold"],
};

export function monthStart(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export function isMonthEditable(month: string, now = new Date()): boolean {
  return month >= monthStart(now);
}

export function isAvailableInMonth(createdAt: string, month: string): boolean {
  return month >= monthStart(new Date(createdAt));
}

export function sectionUsesLineItems(
  sectionId: string,
  lineItems: ExpenseLineItemRow[],
): boolean {
  return lineItems.some((item) => item.section_id === sectionId);
}

export function amountForSection(
  sectionId: string,
  entries: ExpenseEntryRow[],
  lineItems: ExpenseLineItemRow[],
): number {
  const ids = new Set(lineItems.filter((item) => item.section_id === sectionId).map((item) => item.id));
  return entries
    .filter((entry) => entry.section_id === sectionId && (entry.line_item_id === null || ids.has(entry.line_item_id)))
    .reduce((sum, entry) => sum + Number(entry.amount), 0);
}

export function totalExpenseAmounts(amounts: Iterable<number>): number {
  return Array.from(amounts).reduce((sum, amount) => sum + amount, 0);
}

export type ExpenseSummaryRow = {
  month: string;
  Need: number;
  Want: number;
  Investment: number;
  total: number;
  income: number;
  incomeUsedPercent: number | null;
};

export function buildExpenseSummary(
  months: string[],
  sections: ExpenseSectionRow[],
  lineItems: ExpenseLineItemRow[],
  entries: ExpenseEntryRow[],
  income: MonthlyIncomeRow[],
): ExpenseSummaryRow[] {
  return months.map((month) => {
    const categoryTotals = Object.fromEntries(
      EXPENSE_CATEGORIES.map((category) => [
        category,
        sections
          .filter((section) => section.category === category)
          .reduce((sum, section) => sum + amountForSection(section.id, entries.filter((entry) => entry.month === month), lineItems), 0),
      ]),
    ) as Record<ExpenseCategory, number>;
    const total = categoryTotals.Need + categoryTotals.Want + categoryTotals.Investment;
    const monthIncome = Number(income.find((entry) => entry.month === month)?.amount ?? 0);
    return {
      month,
      ...categoryTotals,
      total,
      income: monthIncome,
      incomeUsedPercent: monthIncome > 0 ? (total / monthIncome) * 100 : null,
    };
  });
}