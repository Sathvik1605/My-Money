import { describe, expect, it } from "vitest";
import {
  amountForSection,
  buildExpenseSummary,
  isAvailableInMonth,
  isMonthEditable,
  sectionUsesLineItems,
  totalExpenseAmounts,
} from "@/lib/expense-grid";

const section = { id: "section-1", category: "Need" as const, name: "Food", is_active: true, created_at: "2026-04-12T00:00:00Z" };
const item = { id: "item-1", section_id: "section-1", name: "Groceries", is_active: true, created_at: "2026-04-12T00:00:00Z" };

describe("expense grid helpers", () => {
  it("makes a section available from its creation month but not before", () => {
    expect(isAvailableInMonth(section.created_at, "2026-04-01")).toBe(true);
    expect(isAvailableInMonth(section.created_at, "2026-03-01")).toBe(false);
  });

  it("treats earlier months as closed and the current month as editable", () => {
    const now = new Date("2026-08-30T12:00:00Z");
    expect(isMonthEditable("2026-07-01", now)).toBe(false);
    expect(isMonthEditable("2026-08-01", now)).toBe(true);
    expect(isMonthEditable("2026-09-01", now)).toBe(true);
  });

  it("uses line-item amounts to calculate a section total", () => {
    const entries = [
      { id: "entry-1", section_id: "section-1", line_item_id: "item-1", month: "2026-08-01", amount: 1200 },
      { id: "entry-2", section_id: "section-1", line_item_id: "item-1", month: "2026-09-01", amount: 500 },
    ];
    expect(sectionUsesLineItems(section.id, [item])).toBe(true);
    expect(amountForSection(section.id, entries, [item])).toBe(1700);
  });

  it("totals zero, positive, and database-string amounts without changing their meaning", () => {
    expect(totalExpenseAmounts([0, 1200, Number("450.5")])).toBe(1650.5);
  });

  it("builds category totals, income, and income-use percentage for every month", () => {
    const rows = buildExpenseSummary(
      ["2026-04-01", "2026-05-01"],
      [section, { ...section, id: "section-2", category: "Investment", name: "PPF" }],
      [],
      [
        { id: "entry-1", section_id: "section-1", line_item_id: null, month: "2026-04-01", amount: 4000 },
        { id: "entry-2", section_id: "section-2", line_item_id: null, month: "2026-04-01", amount: 6000 },
      ],
      [{ id: "income-1", month: "2026-04-01", amount: 20000 }],
    );
    expect(rows[0]).toMatchObject({ Need: 4000, Want: 0, Investment: 6000, total: 10000, income: 20000, incomeUsedPercent: 50 });
    expect(rows[1].incomeUsedPercent).toBeNull();
  });
});