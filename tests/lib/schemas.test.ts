import { describe, expect, it } from "vitest";
import {
  cardDeleteSchema,
  cardInputSchema,
  cardUpdateSchema,
  statementInputSchema,
  statementUpdateSchema,
} from "@/lib/validation/schemas";

const validCard = {
  nickname: "Regalia Gold",
  bank_name: "HDFC Bank",
  network: "Visa" as const,
  last4_digits: "1234",
  credit_limit: 250000,
  statement_day: 1,
  due_day: 20,
};

describe("cardInputSchema", () => {
  it("requires explicit confirmation before card deletion", () => {
    expect(cardDeleteSchema.safeParse({ confirm_delete: true }).success).toBe(true);
    expect(cardDeleteSchema.safeParse({}).success).toBe(false);
  });

  it("accepts a fully valid card", () => {
    expect(cardInputSchema.safeParse(validCard).success).toBe(true);
  });

  it("trims surrounding whitespace from text fields", () => {
    const parsed = cardInputSchema.parse({ ...validCard, nickname: "  Regalia Gold  " });
    expect(parsed.nickname).toBe("Regalia Gold");
  });

  it("rejects an empty nickname", () => {
    expect(cardInputSchema.safeParse({ ...validCard, nickname: "   " }).success).toBe(false);
  });

  it.each(["123", "12345", "12a4", ""])("rejects last4_digits %j", (last4) => {
    expect(cardInputSchema.safeParse({ ...validCard, last4_digits: last4 }).success).toBe(false);
  });

  it("accepts a null credit limit (optional field)", () => {
    expect(cardInputSchema.safeParse({ ...validCard, credit_limit: null }).success).toBe(false);
  });

  it("rejects a negative credit limit", () => {
    expect(cardInputSchema.safeParse({ ...validCard, credit_limit: -1 }).success).toBe(false);
  });

  it.each([0, 32, 1.5])("rejects statement_day %j", (day) => {
    expect(cardInputSchema.safeParse({ ...validCard, statement_day: day }).success).toBe(false);
  });

  it.each([1, 15, 31])("accepts statement_day %i", (day) => {
    expect(cardInputSchema.safeParse({ ...validCard, statement_day: day }).success).toBe(true);
  });

  it("rejects an unknown card network", () => {
    expect(cardInputSchema.safeParse({ ...validCard, network: "Discover" }).success).toBe(false);
  });

  it("rejects due days beyond 90", () => {
    expect(
      cardInputSchema.safeParse({ ...validCard, due_day: 32 }).success,
    ).toBe(false);
  });

  it("no longer accepts the removed billing_cycle_start_day field", () => {
    const parsed = cardInputSchema.parse({ ...validCard, billing_cycle_start_day: 5 });
    expect(parsed).not.toHaveProperty("billing_cycle_start_day");
  });
});

describe("cardUpdateSchema", () => {
  it("allows a partial update of a single field", () => {
    expect(cardUpdateSchema.safeParse({ nickname: "Renamed" }).success).toBe(true);
  });

  it("allows toggling is_active on its own", () => {
    expect(cardUpdateSchema.safeParse({ is_active: false }).success).toBe(true);
  });

  it("still validates the fields that are supplied", () => {
    expect(cardUpdateSchema.safeParse({ last4_digits: "12" }).success).toBe(false);
  });
});

const validStatement = {
  card_id: "3f4b2c1e-8a7d-4e5f-9b1a-2c3d4e5f6a7b",
  statement_date: "2026-09-01",
  due_date: "2026-09-21",
  total_amount_due: 3500,
  status: "Unpaid" as const,
};

describe("statementInputSchema", () => {
  it("accepts a fully valid statement", () => {
    expect(statementInputSchema.safeParse(validStatement).success).toBe(true);
  });

  it("strips client-supplied payment fields", () => {
    const parsed = statementInputSchema.parse({
      card_id: validStatement.card_id,
      statement_date: "2026-09-01",
      due_date: "2026-09-21",
      total_amount_due: 3500,
    });
    expect(parsed).not.toHaveProperty("amount_paid");
    expect(parsed).not.toHaveProperty("payment_date");
  });

  it("rejects a card_id that is not a UUID", () => {
    expect(statementInputSchema.safeParse({ ...validStatement, card_id: "not-a-uuid" }).success).toBe(false);
  });

  it("rejects a negative amount due", () => {
    expect(statementInputSchema.safeParse({ ...validStatement, total_amount_due: -1 }).success).toBe(false);
  });

  it("rejects an unparseable statement date", () => {
    expect(statementInputSchema.safeParse({ ...validStatement, statement_date: "not-a-date" }).success).toBe(
      false,
    );
  });

  it("no longer carries a status field — payment state is derived from the payment date", () => {
    const parsed = statementInputSchema.parse({ ...validStatement, status: "Paid" });
    expect(parsed).not.toHaveProperty("status");
  });

  it("no longer accepts the removed cycle date fields", () => {
    const parsed = statementInputSchema.parse({
      ...validStatement,
      cycle_start_date: "2026-08-01",
      cycle_end_date: "2026-08-31",
    });
    expect(parsed).not.toHaveProperty("cycle_start_date");
    expect(parsed).not.toHaveProperty("cycle_end_date");
  });
});

describe("statementUpdateSchema", () => {
  it("allows marking a bill paid without client-supplied dates or amounts", () => {
    const parsed = statementUpdateSchema.safeParse({ mark_paid: true });
    expect(parsed.success).toBe(true);
  });

  it("allows reverting a paid bill to unpaid", () => {
    expect(statementUpdateSchema.safeParse({ mark_unpaid: true }).success).toBe(true);
  });

  it("accepts the two payment actions for route-level conflict handling", () => {
    expect(statementUpdateSchema.safeParse({ mark_paid: true, mark_unpaid: true }).success).toBe(true);
  });

  it("strips a client-supplied payment date", () => {
    const parsed = statementUpdateSchema.parse({ payment_date: "2026-09-15" });
    expect(parsed).not.toHaveProperty("payment_date");
  });

  it("accepts an empty update object", () => {
    expect(statementUpdateSchema.safeParse({}).success).toBe(true);
  });
});
