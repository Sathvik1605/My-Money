import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CardForm } from "@/components/CardForm";
import type { CardRow } from "@/lib/client-types";

const existing: CardRow = {
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

describe("CardForm", () => {
  it("offers banks in the shared accessible dropdown rather than free text", async () => {
    const user = userEvent.setup();
    render(<CardForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Issuing bank" }));
    expect(screen.getByRole("listbox", { name: "Issuing bank" })).toBeInTheDocument();
    expect(screen.getAllByRole("option").length).toBeGreaterThan(10);
  });

  // Full legal names: most end in "Bank", but "Bank of Baroda" and
  // "State Bank of India" legitimately carry it elsewhere in the name.
  it("uses full bank names that include the word Bank", async () => {
    const user = userEvent.setup();
    render(<CardForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Issuing bank" }));
    const options = screen.getAllByRole("option").map((option) => option.textContent ?? "");
    expect(options.length).toBeGreaterThan(0);
    for (const name of options) {
      expect(name, `${name} should be a full bank name`).toMatch(/Bank/);
    }
  });

  it("does not collect the removed billing cycle start day", () => {
    render(<CardForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByLabelText(/billing cycle/i)).toBeNull();
  });

  it("submits the entered values", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<CardForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText("Credit limit (₹)"), "500000");
    await user.type(screen.getByLabelText("Nickname"), "Magnus");
    await user.type(screen.getByLabelText("Last 4 digits"), "9876");
    await user.click(screen.getByRole("button", { name: "Add card" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ nickname: "Magnus", last4_digits: "9876" });
  });

  it("strips non-digits from the last 4 digits field", async () => {
    const user = userEvent.setup();
    render(<CardForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const input = screen.getByLabelText("Last 4 digits");
    await user.type(input, "12ab34");
    expect(input).toHaveValue("1234");
  });

  it("caps the last 4 digits at four characters", async () => {
    const user = userEvent.setup();
    render(<CardForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const input = screen.getByLabelText("Last 4 digits");
    await user.type(input, "123456789");
    expect(input).toHaveValue("1234");
  });

  it("prefills every field when editing an existing card", () => {
    render(<CardForm initial={existing} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText("Nickname")).toHaveValue("Regalia Gold");
    expect(screen.getByRole("button", { name: "Issuing bank" })).toHaveTextContent("HDFC Bank");
    expect(screen.getByLabelText("Last 4 digits")).toHaveValue("1234");
    expect(screen.getByLabelText("Statement date (1–31)")).toHaveValue(15);
  });

  it("shows a Save changes action when editing", () => {
    render(<CardForm initial={existing} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });

  it("shows delete only inside the edit-card form", () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    render(<CardForm initial={existing} onSubmit={vi.fn()} onCancel={vi.fn()} onDelete={onDelete} />);

    expect(screen.getByRole("button", { name: "Delete card" })).toBeInTheDocument();
  });

  it("surfaces a submission failure as an alert", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("Card already exists"));
    const user = userEvent.setup();
    render(<CardForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText("Credit limit (₹)"), "500000");
    await user.type(screen.getByLabelText("Nickname"), "Magnus");
    await user.type(screen.getByLabelText("Last 4 digits"), "9876");
    await user.click(screen.getByRole("button", { name: "Add card" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Card already exists");
  });

  it("calls onCancel when the cancel button is pressed", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<CardForm onSubmit={vi.fn()} onCancel={onCancel} />);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("requires a credit limit", () => {
    render(<CardForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText("Credit limit (₹)")).toBeRequired();
  });

  it("orders card fields as identifying details then billing settings", () => {
    render(<CardForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const labels = Array.from(document.querySelectorAll("label > span")).map((element) => element.textContent);
    expect(labels).toEqual([
      "Nickname",
      "Issuing bank",
      "Network",
      "Last 4 digits",
      "Credit limit (₹)",
      "Statement date (1–31)",
      "Due date (1–31)",
    ]);
  });
});
