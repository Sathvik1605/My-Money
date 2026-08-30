import { describe, expect, it } from "vitest";
import {
  buildYearGrid,
  cardsWithStatementsInPeriod,
  cardsWithPaymentsDue,
  financialYearStartForDate,
  outstandingAmount,
  type GridMonth,
  type GridStatement,
} from "@/lib/year-grid";

const months: GridMonth[] = [
  { label: "Sep 2026", year: 2026, month: 8 },
  { label: "Oct 2026", year: 2026, month: 9 },
];

function bill(overrides: Partial<GridStatement> = {}): GridStatement {
  return {
    card_id: "card-1",
    statement_date: "2026-09-15",
    total_amount_due: 3500,
    payment_date: null,
    ...overrides,
  };
}

describe("outstandingAmount", () => {
  it("is zero for a fully paid bill", () => {
    expect(outstandingAmount(bill({ payment_date: "2026-09-20" }))).toBe(0);
  });

  it("ignores stale status fields and trusts the payment date", () => {
    expect(outstandingAmount(bill({ payment_date: null }))).toBe(3500);
  });

  it("is the full amount for an untouched unpaid bill", () => {
    expect(outstandingAmount(bill())).toBe(3500);
  });

  it("coerces numeric strings from the database", () => {
    expect(outstandingAmount(bill({ total_amount_due: "3500" }))).toBe(3500);
  });
});

describe("financialYearStartForDate", () => {
  it("places January through March in the financial year that began the prior April", () => {
    expect(financialYearStartForDate("2026-01-15")).toBe(2025);
    expect(financialYearStartForDate("2026-03-31")).toBe(2025);
    expect(financialYearStartForDate("2026-04-01")).toBe(2026);
  });
});

describe("cardsWithStatementsInPeriod", () => {
  it("excludes cards without a bill in the selected period", () => {
    const cards = [{ id: "card-1" }, { id: "card-2" }];
    const statements = [{ card_id: "card-2" }];

    expect(cardsWithStatementsInPeriod(cards, statements)).toEqual([{ id: "card-2" }]);
  });
});

describe("cardsWithPaymentsDue", () => {
  it("counts each card once even when it has unpaid bills in multiple months", () => {
    expect(
      cardsWithPaymentsDue([
        {
          month: "Sep 2026",
          amounts: { "card-1": 1000, "card-2": 2000 },
          unpaidAmounts: { "card-1": 1000, "card-2": 0 },
          total: 3000,
          unpaidTotal: 1000,
        },
        {
          month: "Oct 2026",
          amounts: { "card-1": 500, "card-2": 2000 },
          unpaidAmounts: { "card-1": 500, "card-2": 1200 },
          total: 2500,
          unpaidTotal: 1700,
        },
      ]),
    ).toBe(2);
  });

  it("returns zero when every bill is settled", () => {
    expect(
      cardsWithPaymentsDue([
        {
          month: "Sep 2026",
          amounts: { "card-1": 1000 },
          unpaidAmounts: { "card-1": 0 },
          total: 1000,
          unpaidTotal: 0,
        },
      ]),
    ).toBe(0);
  });
});

describe("buildYearGrid", () => {
  it("returns a row per month with zeroed cells when there are no bills", () => {
    const grid = buildYearGrid(months, ["card-1"], []);
    expect(grid.rows).toHaveLength(2);
    expect(grid.rows[0].amounts["card-1"]).toBe(0);
    expect(grid.grandTotal).toBe(0);
    expect(grid.unpaidTotal).toBe(0);
  });

  it("places a bill in the month matching its statement date", () => {
    const grid = buildYearGrid(months, ["card-1"], [bill()]);
    expect(grid.rows[0].amounts["card-1"]).toBe(3500);
    expect(grid.rows[1].amounts["card-1"]).toBe(0);
  });

  it("counts an unpaid bill towards the outstanding total", () => {
    const grid = buildYearGrid(months, ["card-1"], [bill()]);
    expect(grid.rows[0].unpaidAmounts["card-1"]).toBe(3500);
    expect(grid.unpaidTotal).toBe(3500);
  });

  it("excludes a paid bill from outstanding but keeps it in the billed total", () => {
    const grid = buildYearGrid(months, ["card-1"], [bill({ payment_date: "2026-09-20" })]);
    expect(grid.grandTotal).toBe(3500);
    expect(grid.unpaidTotal).toBe(0);
  });

  it("sums several bills for the same card in the same month", () => {
    const grid = buildYearGrid(months, ["card-1"], [
      bill({ total_amount_due: 1000 }),
      bill({ statement_date: "2026-09-20", total_amount_due: 500 }),
    ]);
    expect(grid.rows[0].amounts["card-1"]).toBe(1500);
  });

  it("keeps each card in its own column", () => {
    const grid = buildYearGrid(months, ["card-1", "card-2"], [
      bill({ card_id: "card-1", total_amount_due: 1000 }),
      bill({ card_id: "card-2", total_amount_due: 2000 }),
    ]);
    expect(grid.rows[0].amounts).toEqual({ "card-1": 1000, "card-2": 2000 });
    expect(grid.cardTotals).toEqual({ "card-1": 1000, "card-2": 2000 });
  });

  it("mixes paid and unpaid cards correctly within one month", () => {
    const grid = buildYearGrid(months, ["card-1", "card-2"], [
      bill({ card_id: "card-1", total_amount_due: 1000, payment_date: "2026-09-20" }),
      bill({ card_id: "card-2", total_amount_due: 2000 }),
    ]);
    expect(grid.rows[0].total).toBe(3000);
    expect(grid.rows[0].unpaidTotal).toBe(2000);
    expect(grid.rows[0].unpaidAmounts["card-1"]).toBe(0);
  });

  it("ignores bills for cards outside the grid", () => {
    const grid = buildYearGrid(months, ["card-1"], [bill({ card_id: "ghost-card" })]);
    expect(grid.grandTotal).toBe(0);
  });

  it("ignores bills dated outside the month range", () => {
    const grid = buildYearGrid(months, ["card-1"], [bill({ statement_date: "2026-11-15" })]);
    expect(grid.grandTotal).toBe(0);
  });

  it("does not confuse the same month in a different year", () => {
    const grid = buildYearGrid(months, ["card-1"], [bill({ statement_date: "2025-09-15" })]);
    expect(grid.grandTotal).toBe(0);
  });

  it("accumulates the grand total across months and cards", () => {
    const grid = buildYearGrid(months, ["card-1", "card-2"], [
      bill({ card_id: "card-1", statement_date: "2026-09-15", total_amount_due: 1000 }),
      bill({ card_id: "card-2", statement_date: "2026-10-15", total_amount_due: 2000 }),
    ]);
    expect(grid.grandTotal).toBe(3000);
    expect(grid.rows[0].total).toBe(1000);
    expect(grid.rows[1].total).toBe(2000);
  });

  it("sums outstanding across multiple months", () => {
    const grid = buildYearGrid(months, ["card-1"], [
      bill({ statement_date: "2026-09-15", total_amount_due: 1000 }),
      bill({ statement_date: "2026-10-15", total_amount_due: 2000 }),
    ]);
    expect(grid.unpaidTotal).toBe(3000);
  });
});
