import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StatementForm } from "@/components/StatementForm";
import type { CardRow, StatementRow } from "@/lib/client-types";

const cards: CardRow[] = [
  {
    id: "card-1",
    nickname: "Regalia Gold",
    bank_name: "HDFC Bank",
    network: "Visa",
    last4_digits: "1234",
    credit_limit: 250000,
    statement_day: 15,
    due_day: 5,
    is_active: true,
  },
  {
    id: "card-2",
    nickname: "Magnus",
    bank_name: "Axis Bank",
    network: "Mastercard",
    last4_digits: "9876",
    credit_limit: 500000,
    statement_day: 5,
    due_day: 23,
    is_active: true,
  },
];

const existing: StatementRow = {
  id: "s1",
  card_id: "card-1",
  cycle_start_date: "2026-09-15",
  cycle_end_date: "2026-09-15",
  statement_date: "2026-09-15",
  due_date: "2026-10-05",
  total_amount_due: 3500,
  payment_date: "2026-09-20",
};

function freeze(date: string) {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date(`${date}T12:00:00Z`));
}

afterEach(() => vi.useRealTimers());

describe("StatementForm", () => {
  // The card determines the statement date, which determines the due date, so
  // the layout has to read top-down: card alone, then the pair it produces.
  it("puts the card on its own row, above the two dates which share one row", () => {
    render(<StatementForm cards={cards} initial={existing} onSubmit={vi.fn()} onCancel={vi.fn()} />);

    const fieldOf = (label: string) => screen.getByText(label, { exact: true }).parentElement!;
    const cardRowContainer = fieldOf("Card").parentElement;
    const statementRowContainer = fieldOf("Statement date").parentElement;
    const dueRowContainer = fieldOf("Due date").parentElement;

    expect(statementRowContainer).toBe(dueRowContainer);
    expect(cardRowContainer).not.toBe(statementRowContainer);
  });

  it("keeps the card on its own row when creating, where it is a dropdown", () => {
    render(<StatementForm cards={cards} onSubmit={vi.fn()} onCancel={vi.fn()} />);

    const fieldOf = (label: string) => screen.getByText(label, { exact: true }).parentElement!;
    expect(screen.getByRole("button", { name: "Card" })).toBeInTheDocument();
    expect(fieldOf("Card").parentElement).not.toBe(fieldOf("Statement date").parentElement);
  });

  it("does not collect the removed cycle start and end dates", () => {
    render(<StatementForm cards={cards} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByLabelText(/cycle start/i)).toBeNull();
    expect(screen.queryByLabelText(/cycle end/i)).toBeNull();
  });

  it("auto-fills the statement date from the card's statement day", () => {
    freeze("2026-09-01");
    render(<StatementForm cards={cards} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText("15 Sept 2026")).toBeInTheDocument();
  });

  it("lets a user select a historical statement year and month", async () => {
    freeze("2026-09-01");
    const user = userEvent.setup();
    render(<StatementForm cards={cards} onSubmit={vi.fn()} onCancel={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Statement year" }));
    await user.click(screen.getByRole("option", { name: "2024" }));
    await user.click(screen.getByRole("button", { name: "Statement month" }));
    await user.click(screen.getByRole("option", { name: "July" }));

    expect(screen.getByText("15 Jul 2024")).toBeInTheDocument();
  });

  it("auto-fills the due date using the card's fixed monthly due day", () => {
    freeze("2026-09-01");
    render(<StatementForm cards={cards} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText("5 Oct 2026")).toBeInTheDocument();
  });

  it("derives the initial due date from the same current statement period", () => {
    freeze("2026-09-01");
    const cardWithSameMonthDue = { ...cards[0], statement_day: 3, due_day: 20 };
    render(<StatementForm cards={[cardWithSameMonthDue]} onSubmit={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByText("3 Sept 2026")).toBeInTheDocument();
    expect(screen.getByText("20 Sept 2026")).toBeInTheDocument();
  });

  it("shows the statement and due dates as read-only, not as inputs", () => {
    freeze("2026-09-01");
    render(<StatementForm cards={cards} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    // Derived from the card; the user must never type over them.
    expect(screen.queryByLabelText("Statement date")).toBeNull();
    expect(screen.queryByLabelText("Due date")).toBeNull();
    expect(document.querySelectorAll('input[type="date"]:not([readonly])')).toHaveLength(0);
  });

  it("shows derived dates without redundant explanatory subtext", () => {
    freeze("2026-09-01");
    render(<StatementForm cards={cards} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByText("Day 15 of the month")).toBeNull();
    expect(screen.queryByText("20 days after statement")).toBeNull();
  });

  it("recalculates both dates when a different card is selected", async () => {
    freeze("2026-09-01");
    const user = userEvent.setup();
    render(<StatementForm cards={cards} onSubmit={vi.fn()} onCancel={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Card" }));
    await user.click(screen.getByRole("option", { name: "Magnus" }));

    expect(screen.getByText("5 Sept 2026")).toBeInTheDocument();
    expect(screen.getByText("23 Sept 2026")).toBeInTheDocument();
  });

  it("keeps the current month selected even when that card already has a bill", () => {
    freeze("2026-09-01");
    render(
      <StatementForm
        cards={cards}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText("15 Sept 2026")).toBeInTheDocument();
  });

  it("lists every supplied card as an option", async () => {
    const user = userEvent.setup();
    render(<StatementForm cards={cards} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Card" }));
    expect(screen.getAllByRole("option")).toHaveLength(2);
  });

  it("prefills the form when editing an existing bill", () => {
    render(<StatementForm cards={cards} initial={existing} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText("15 Sept 2026")).toBeInTheDocument();
    expect(screen.getByText("3500")).toBeInTheDocument();
    expect(screen.queryByLabelText("Amount paid (₹)")).toBeNull();
    expect(screen.getByText("20 Sept 2026")).toBeInTheDocument();
  });

  it("shows a paid bill total as read-only text", () => {
    render(<StatementForm cards={cards} initial={existing} onSubmit={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.queryByLabelText("Total amount due (₹)")).toBeNull();
    expect(screen.getByText("Total amount due (₹)")).toBeInTheDocument();
    expect(screen.getByText("3500")).toBeInTheDocument();
  });

  it("offers mark unpaid only for a paid bill", async () => {
    const onMarkUnpaid = vi.fn();
    const user = userEvent.setup();
    const { unmount } = render(
      <StatementForm
        cards={cards}
        initial={existing}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        onMarkUnpaid={onMarkUnpaid}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Mark unpaid" }));
    expect(onMarkUnpaid).toHaveBeenCalledOnce();

    unmount();
    render(<StatementForm cards={cards} initial={{ ...existing, payment_date: null }} onSubmit={vi.fn()} onCancel={vi.fn()} onMarkUnpaid={onMarkUnpaid} />);
    expect(screen.queryByRole("button", { name: "Mark unpaid" })).toBeNull();
  });

  it("does not show a payment date for a historically paid bill", () => {
    render(
      <StatementForm
        cards={cards}
        initial={{ ...existing, payment_date: null, historical_payment_confirmed: true }}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.queryByText("Payment date")).toBeNull();
    expect(screen.getByText("Total amount due (₹)")).toBeInTheDocument();
  });

  it("shows the card as read-only text when editing so bills cannot jump cards", () => {
    render(<StatementForm cards={cards} initial={existing} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByLabelText("Card")).toBeNull();
    expect(screen.getByText("Card")).toBeInTheDocument();
    expect(screen.getByText("Regalia Gold")).toBeInTheDocument();
  });

  it("recomputes a stale due date from the card instead of trusting the stored row", () => {
    // A stored due_date that precedes its statement date must not be shown.
    const stale = { ...existing, statement_date: "2026-09-15", due_date: "2026-08-20" };
    render(<StatementForm cards={cards} initial={stale} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText("5 Oct 2026")).toBeInTheDocument();
    expect(screen.queryByText("20 Aug 2026")).toBeNull();
  });

  it("prevents a total due above the selected card's credit limit", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<StatementForm cards={cards} onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText("Total amount due (₹)"), "250001");
    await user.click(screen.getByRole("button", { name: /add bill/i }));

    expect(screen.getByRole("alert")).toHaveTextContent("cannot exceed");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("offers a remove action only when editing", () => {
    const { unmount } = render(
      <StatementForm cards={cards} onSubmit={vi.fn()} onCancel={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.queryByRole("button", { name: /remove/i })).toBeNull();
    unmount();

    render(
      <StatementForm
        cards={cards}
        initial={existing}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument();
  });

  it("submits the captured values", async () => {
    freeze("2026-09-01");
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<StatementForm cards={cards} onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText("Total amount due (₹)"), "3500");
    await user.click(screen.getByRole("button", { name: /add bill/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      card_id: "card-1",
      statement_date: "2026-09-15",
      due_date: "2026-10-05",
      total_amount_due: 3500,
    });
  });

  it("marks an unpaid bill paid without collecting an amount or date", async () => {
    freeze("2026-09-20");
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    const unpaid = { ...existing, payment_date: null };
    render(<StatementForm cards={cards} initial={unpaid} onSubmit={onSubmit} onCancel={vi.fn()} />);

    expect(screen.queryByLabelText(/amount paid|payment date/i)).toBeNull();
    await user.click(screen.getByRole("button", { name: "Paid" }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ mark_paid: true }));
  });

  it("makes a closed card bill view-only", () => {
    const closedCard = { ...cards[0], is_active: false };
    const unpaid = { ...existing, payment_date: null };
    render(<StatementForm cards={[closedCard]} initial={unpaid} onSubmit={vi.fn()} onCancel={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.queryByLabelText("Total amount due (₹)")).toBeNull();
    expect(screen.queryByRole("button", { name: "Paid" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Remove entry" })).toBeNull();
  });

  it("surfaces a submission failure as an alert", async () => {
    freeze("2026-09-01");
    const onSubmit = vi.fn().mockRejectedValue(new Error("A bill already exists"));
    const user = userEvent.setup();
    render(<StatementForm cards={cards} onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText("Total amount due (₹)"), "3500");
    await user.click(screen.getByRole("button", { name: /add bill|save/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("A bill already exists");
  });
});
