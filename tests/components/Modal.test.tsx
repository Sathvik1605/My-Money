import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "@/components/Modal";

describe("Modal", () => {
  it("renders as an accessible dialog labelled by its title", () => {
    render(
      <Modal title="Add new card" onClose={vi.fn()}>
        <p>Body</p>
      </Modal>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName("Add new card");
  });

  it("renders its children", () => {
    render(
      <Modal title="Add new bill" onClose={vi.fn()}>
        <p>Form goes here</p>
      </Modal>,
    );
    expect(screen.getByText("Form goes here")).toBeInTheDocument();
  });

  it("closes when Escape is pressed", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Modal title="Edit card" onClose={onClose}>
        <p>Body</p>
      </Modal>,
    );
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when the close button is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Modal title="Edit card" onClose={onClose}>
        <p>Body</p>
      </Modal>,
    );
    await user.click(screen.getAllByRole("button", { name: "Close dialog" })[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("locks background scroll while open and restores it on unmount", () => {
    const { unmount } = render(
      <Modal title="Add new card" onClose={vi.fn()}>
        <p>Body</p>
      </Modal>,
    );
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("moves focus into the dialog when opened", () => {
    render(
      <Modal title="Add new card" onClose={vi.fn()}>
        <p>Body</p>
      </Modal>,
    );
    expect(screen.getByRole("dialog")).toHaveFocus();
  });
});
