import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CardsPage from "@/app/cards/page";

const card = {
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

beforeEach(() => {
  vi.stubGlobal("confirm", vi.fn(() => true));
  vi.stubGlobal(
    "fetch",
    vi.fn((input: string, init?: RequestInit) => {
      if (String(input).includes("/api/statements")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [{ card_id: "card-1", payment_date: null, historical_payment_confirmed: false }] }),
        } as Response);
      }
      if (init?.method === "PATCH") {
        return Promise.resolve({
          ok: false,
          status: 409,
          json: () => Promise.resolve({ error: "Pay every bill before closing this card." }),
        } as Response);
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [card] }) } as Response);
    }),
  );
});

afterEach(() => vi.unstubAllGlobals());

describe("Cards page", () => {
  it("explains in a dialog why an unpaid card cannot be closed", async () => {
    const user = userEvent.setup();
    render(<CardsPage />);

    await user.click(await screen.findByRole("button", { name: "Close card" }));

    expect(await screen.findByRole("dialog", { name: "Card cannot be closed" })).toHaveTextContent(
      "Regalia Gold cannot be closed because bill payment is still pending.",
    );
    expect(screen.getByRole("button", { name: "Okay" })).toBeInTheDocument();
  });
});
