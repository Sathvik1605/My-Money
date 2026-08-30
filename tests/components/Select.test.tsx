import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select } from "@/components/Select";

const options = [
  { value: "visa", label: "Visa" },
  { value: "mastercard", label: "Mastercard" },
];

describe("Select", () => {
  it("opens a labelled listbox and marks the selected option", async () => {
    const user = userEvent.setup();
    render(<Select value="visa" options={options} onChange={vi.fn()} ariaLabel="Network" />);

    const trigger = screen.getByRole("button", { name: "Network" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox", { name: "Network" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Visa" })).toHaveAttribute("aria-selected", "true");
  });

  it("renders application controls rather than a native select", () => {
    render(<Select value="visa" options={options} onChange={vi.fn()} ariaLabel="Network" />);

    expect(screen.getByRole("button", { name: "Network" })).toBeInTheDocument();
    expect(document.querySelector("select")).toBeNull();
  });

  it("selects an option and closes the menu", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Select value="visa" options={options} onChange={onChange} ariaLabel="Network" />);

    await user.click(screen.getByRole("button", { name: "Network" }));
    await user.click(screen.getByRole("option", { name: "Mastercard" }));

    expect(onChange).toHaveBeenCalledWith("mastercard");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("supports keyboard opening, navigation, and Escape", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Select value="visa" options={options} onChange={onChange} ariaLabel="Network" />);

    const trigger = screen.getByRole("button", { name: "Network" });
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.keyboard("{ArrowDown}");
    expect(onChange).toHaveBeenCalledWith("mastercard");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
