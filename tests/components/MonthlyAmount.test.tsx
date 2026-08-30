import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MonthlyAmount } from "@/components/MonthlyAmount";

describe("MonthlyAmount", () => {
  it("renders no currency value when no monthly entry exists", () => {
    render(
      <MonthlyAmount
        amount={null}
        disabled={false}
        accessibleName="Food for 2026-08-01"
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /no amount entered/i })).toHaveTextContent("");
    expect(screen.queryByText("₹0")).toBeNull();
  });

  it("keeps an intentionally saved zero visible", () => {
    render(
      <MonthlyAmount
        amount={0}
        disabled={false}
        accessibleName="Food for 2026-08-01"
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /₹0/i })).toHaveTextContent("₹0");
  });
});
