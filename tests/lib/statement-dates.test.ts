import { afterEach, describe, expect, it, vi } from "vitest";
import { formatDateInput, getNextStatementDate, statementDateForMonth } from "@/components/StatementForm";
import { dueDateForStatement, isHistoricalStatement } from "@/lib/card-rules";
import type { CardRow, StatementRow } from "@/lib/client-types";

const card: CardRow = {
  id: "card-1",
  nickname: "Regalia Gold",
  bank_name: "HDFC Bank",
  network: "Visa",
  last4_digits: "1234",
  credit_limit: 250000,
  statement_day: 15,
  due_day: 5,
  is_active: true,
};

function statement(overrides: Partial<StatementRow>): StatementRow {
  return {
    id: "s1",
    card_id: "card-1",
    cycle_start_date: "2026-09-15",
    cycle_end_date: "2026-09-15",
    statement_date: "2026-09-15",
    due_date: "2026-10-05",
    total_amount_due: 3500,
    payment_date: null,
      ...overrides,
  };
}

function freeze(date: string) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(`${date}T12:00:00Z`));
}

afterEach(() => vi.useRealTimers());

describe("formatDateInput", () => {
  it("produces a YYYY-MM-DD string suitable for a date input", () => {
    expect(formatDateInput(new Date(Date.UTC(2026, 8, 5)))).toBe("2026-09-05");
  });

  describe("statementDateForMonth", () => {
    it("derives the configured statement day for a selected historical month", () => {
      expect(statementDateForMonth(2024, 6, 15)).toBe("2024-07-15");
    });

    it("clamps a configured day to the final day of the selected month", () => {
      expect(statementDateForMonth(2024, 1, 31)).toBe("2024-02-29");
    });
  });

  it("zero-pads single-digit months and days", () => {
    expect(formatDateInput(new Date(Date.UTC(2026, 0, 1)))).toBe("2026-01-01");
  });
});

describe("dueDateForStatement", () => {
  it("uses the due day in the statement month when it follows the statement", () => {
    expect(dueDateForStatement("2026-09-01", 20)).toBe("2026-09-20");
  });

  it("keeps a day-20 due date in the month of a day-3 statement", () => {
    expect(dueDateForStatement("2026-09-03", 20)).toBe("2026-09-20");
  });

  it("rolls forward when the due day is before the statement day", () => {
    expect(dueDateForStatement("2026-09-25", 10)).toBe("2026-10-10");
  });

  describe("isHistoricalStatement", () => {
    const at = (date: string) => new Date(`${date}T12:00:00Z`);

    it("treats only completed calendar months as historical", () => {
      expect(isHistoricalStatement("2026-07-31", at("2026-08-30"))).toBe(true);
      expect(isHistoricalStatement("2026-08-01", at("2026-08-30"))).toBe(false);
      expect(isHistoricalStatement("2026-09-01", at("2026-08-30"))).toBe(false);
    });
  });

  it("moves a day-15 due date into the next month after a day-28 statement", () => {
    expect(dueDateForStatement("2026-09-28", 15)).toBe("2026-10-15");
  });

  it("keeps a day-31 due date in the same month after a day-10 statement", () => {
    expect(dueDateForStatement("2026-08-10", 31)).toBe("2026-08-31");
  });

  it("rolls forward when the due day equals the statement day", () => {
    expect(dueDateForStatement("2026-12-25", 25)).toBe("2027-01-25");
  });

  it("clamps day 31 to the end of February in a leap year", () => {
    expect(dueDateForStatement("2028-02-01", 31)).toBe("2028-02-29");
  });
});

describe("getNextStatementDate", () => {
  it("returns an empty string when no card is selected", () => {
    expect(getNextStatementDate(undefined)).toBe("");
  });

  it("picks this month's statement day when it is still upcoming", () => {
    freeze("2026-09-05");
    expect(getNextStatementDate(card, [])).toBe("2026-09-15");
  });

  it("skips to next month when this month's statement day has passed", () => {
    freeze("2026-09-20");
    expect(getNextStatementDate(card, [])).toBe("2026-10-15");
  });

  it("continues from the month after the most recent recorded bill", () => {
    freeze("2026-09-01");
    const result = getNextStatementDate(card, [statement({ statement_date: "2026-09-15" })]);
    expect(result).toBe("2026-10-15");
  });

  it("ignores bills belonging to other cards", () => {
    freeze("2026-09-05");
    const other = statement({ card_id: "card-2", statement_date: "2026-12-15" });
    expect(getNextStatementDate(card, [other])).toBe("2026-09-15");
  });

  it("uses the latest bill when several exist out of order", () => {
    freeze("2026-09-01");
    const result = getNextStatementDate(card, [
      statement({ id: "a", statement_date: "2026-07-15" }),
      statement({ id: "b", statement_date: "2026-09-15" }),
      statement({ id: "c", statement_date: "2026-08-15" }),
    ]);
    expect(result).toBe("2026-10-15");
  });

  it("clamps a day-31 statement day to the last day of a short month", () => {
    freeze("2026-11-05");
    const day31 = { ...card, statement_day: 31 };
    expect(getNextStatementDate(day31, [])).toBe("2026-11-30");
  });

  it("clamps to 28 in a non-leap February", () => {
    freeze("2026-02-01");
    const day31 = { ...card, statement_day: 31 };
    expect(getNextStatementDate(day31, [])).toBe("2026-02-28");
  });

  it("clamps to 29 in a leap February", () => {
    freeze("2028-02-01");
    const day31 = { ...card, statement_day: 31 };
    expect(getNextStatementDate(day31, [])).toBe("2028-02-29");
  });

  it("crosses the year boundary when December has passed", () => {
    freeze("2026-12-20");
    expect(getNextStatementDate(card, [])).toBe("2027-01-15");
  });

  it("falls back to day 1 when statement_day is missing", () => {
    freeze("2026-09-05");
    const noDay = { ...card, statement_day: 0 };
    expect(getNextStatementDate(noDay, [])).toBe("2026-10-01");
  });
});

describe("statement + due date pairing", () => {
  it("derives the due date from the card's fixed due day", () => {
    freeze("2026-09-05");
    const statementDate = getNextStatementDate(card, []);
    expect(dueDateForStatement(statementDate, card.due_day)).toBe("2026-10-05");
  });
});
