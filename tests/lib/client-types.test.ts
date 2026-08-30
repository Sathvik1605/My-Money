import { afterEach, describe, expect, it, vi } from "vitest";
import { formatCurrency, hasUnpaidStatements, isFullyPaid, isOverdue, outstandingAmount, paymentState } from "@/lib/client-types";

describe("formatCurrency", () => {
  it("formats whole rupees in the Indian numbering system", () => {
    expect(formatCurrency(250000)).toBe("₹2,50,000");
  });

  it("renders zero without decimals", () => {
    expect(formatCurrency(0)).toBe("₹0");
  });
});

describe("payment state", () => {
  afterEach(() => vi.useRealTimers());

  const paid = { total_amount_due: 1000, payment_date: "2026-05-20" };
  const unpaid = { total_amount_due: 1000, payment_date: null };

  it("treats a recorded payment date as fully paid", () => {
    expect(paymentState(paid)).toBe("Paid");
    expect(isFullyPaid(paid)).toBe(true);
    expect(outstandingAmount(paid)).toBe(0);
  });

  it("treats a missing payment date as wholly unpaid", () => {
    expect(paymentState(unpaid)).toBe("Unpaid");
    expect(isFullyPaid(unpaid)).toBe(false);
    expect(outstandingAmount(unpaid)).toBe(1000);
  });

  it("treats a historically confirmed payment without a date as paid", () => {
    const historicalPaid = { total_amount_due: 1000, payment_date: null, historical_payment_confirmed: true };

    expect(paymentState(historicalPaid)).toBe("Paid");
    expect(isFullyPaid(historicalPaid)).toBe(true);
    expect(outstandingAmount(historicalPaid)).toBe(0);
  });

  it("detects outstanding bills before a card can be closed", () => {
    expect(hasUnpaidStatements([paid, { payment_date: null, historical_payment_confirmed: true }])).toBe(false);
    expect(hasUnpaidStatements([paid, unpaid])).toBe(true);
  });

  it("coerces total amounts returned as database strings", () => {
    expect(outstandingAmount({ total_amount_due: "3500", payment_date: null })).toBe(3500);
  });

  it("is not overdue for a paid bill even long after the due date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T12:00:00Z"));
    expect(isOverdue({ due_date: "2026-01-01", ...paid })).toBe(false);
  });

  it("is overdue the day after its due date when unpaid", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-16T12:00:00Z"));
    expect(isOverdue({ due_date: "2026-06-15", ...unpaid })).toBe(true);
  });
});
