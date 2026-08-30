import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BillOverviewPage from "@/app/page";
import { ThemeProvider } from "@/components/ThemeProvider";

const card = { id: "card-1", nickname: "Regalia Gold", is_active: true };

const cardRow = {
  id: "card-1",
  nickname: "Regalia Gold",
  bank_name: "HDFC Bank",
  network: "Visa",
  last4_digits: "1234",
  credit_limit: 250000,
  statement_day: 1,
  due_day: 21,
  is_active: true,
};

const statement = {
  id: "s1",
  card_id: "card-1",
  cycle_start_date: "2026-09-01",
  cycle_end_date: "2026-09-01",
  statement_date: "2026-09-01",
  due_date: "2026-09-21",
  total_amount_due: 9000,
  payment_date: null,
};

function months() {
  const labels = [
    "Apr 2026", "May 2026", "Jun 2026", "Jul 2026", "Aug 2026", "Sep 2026",
    "Oct 2026", "Nov 2026", "Dec 2026", "Jan 2027", "Feb 2027", "Mar 2027",
  ];
  return labels.map((month) => {
    const billed = month === "Sep 2026";
    return {
      month,
      amounts: { "card-1": billed ? 9000 : 0 },
      unpaidAmounts: { "card-1": billed ? 9000 : 0 },
      total: billed ? 9000 : 0,
      unpaidTotal: billed ? 9000 : 0,
    };
  });
}

const grid = {
  year: 2026,
  yearType: "financial",
  cards: [card],
  months: months(),
  cardTotals: { "card-1": 9000 },
  grandTotal: 9000,
  unpaidTotal: 9000,
  earliestStatementDate: "2026-09-01",
};

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date("2026-09-10T12:00:00Z"));

  vi.stubGlobal(
    "fetch",
    vi.fn((input: string) => {
      const url = String(input);
      const body = url.includes("/api/year-grid")
        ? grid
        : url.includes("/api/cards")
          ? [cardRow]
          : [statement];
      // Every route wraps its payload as { data }.
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: body }) } as Response);
    }),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function renderPage() {
  return render(
    <ThemeProvider>
      <BillOverviewPage />
    </ThemeProvider>,
  );
}

describe("Bill Overview", () => {
  it("renders each month of the financial year with its billed total", async () => {
    renderPage();
    expect(await screen.findByRole("rowheader", { name: "Sep 2026" })).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "Apr 2026" })).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "Mar 2027" })).toBeInTheDocument();
  });

  it("counts the distinct cards with an outstanding bill in the selected year", async () => {
    renderPage();
    expect(await screen.findByText("Cards with payments due")).toBeInTheDocument();
    expect(screen.getByText("Cards with payments due").nextElementSibling).toHaveTextContent("1");
  });

  it("counts only active cards that have bills in the selected year", async () => {
    const inactiveCard = { id: "card-2", nickname: "Closed card", is_active: false };
    grid.cards = [card, inactiveCard];
    try {
      renderPage();
      expect(await screen.findByText("Active cards")).toBeInTheDocument();
      expect(screen.getByText("Active cards").nextElementSibling).toHaveTextContent("1");
    } finally {
      grid.cards = [card];
    }
  });

  it("shows no standing legend beneath the grid", async () => {
    renderPage();
    await screen.findByRole("rowheader", { name: "Sep 2026" });
    expect(screen.queryByText(/legend/i)).toBeNull();
    expect(screen.queryByText(/unpaid or partially paid/i)).toBeNull();
    expect(screen.queryByText(/past due date/i)).toBeNull();
  });

  it("still states an outstanding bill's payment state in words, without a legend to decode it", async () => {
    renderPage();
    const cell = await screen.findByRole("button", { name: /Regalia Gold bill for Sep 2026/ });
    expect(cell.getAttribute("aria-label")).toContain("unpaid");
  });

  it("uses no visual marker for an unpaid bill", async () => {
    renderPage();

    const bill = await screen.findByRole("button", { name: /Regalia Gold bill for Sep 2026/ });
    expect(bill).not.toHaveTextContent("!");
    expect(bill).not.toHaveTextContent("•");
  });

  it("uses an application dialog to confirm removing a bill", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: /Regalia Gold bill for Sep 2026/ }));
    await user.click(screen.getByRole("button", { name: "Remove entry" }));

    expect(await screen.findByRole("dialog", { name: "Remove bill entry" })).toHaveTextContent(
      "Remove this bill entry permanently? This cannot be undone.",
    );
  });

  it("selects the financial year's ending calendar year without passing the present year", async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByRole("rowheader", { name: "Sep 2026" });
    await user.click(screen.getByRole("radio", { name: "Calendar year" }));

    expect(await screen.findByText("2026")).toBeInTheDocument();
  });

  it("selects the financial year ending in the current calendar year", async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByRole("rowheader", { name: "Sep 2026" });
    await user.click(screen.getByRole("radio", { name: "Calendar year" }));
    await screen.findByText("2026");
    await user.click(screen.getByRole("radio", { name: "Financial year" }));

    expect(await screen.findByText("2025-2026")).toBeInTheDocument();
  });
});
