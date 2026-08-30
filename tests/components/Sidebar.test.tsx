import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sidebar } from "@/components/Sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";

const pathname = vi.hoisted(() => ({ value: "/" }));
const signOut = vi.hoisted(() => vi.fn());
const push = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.value,
  useRouter: () => ({ push, refresh: vi.fn() }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signOut } }),
}));

beforeEach(() => {
  pathname.value = "/";
  signOut.mockReset().mockResolvedValue({ error: null });
  push.mockReset();
});

function renderSidebar() {
  return render(
    <ThemeProvider>
      <Sidebar />
    </ThemeProvider>,
  );
}

describe("Sidebar", () => {
  it("shows the product brand", () => {
    renderSidebar();
    expect(screen.getAllByText("Your Money").length).toBeGreaterThan(0);
  });

  it("renders the credit card module links", () => {
    renderSidebar();
    expect(screen.getByRole("link", { name: /Bill Overview/ })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /Cards/ })).toHaveAttribute("href", "/cards");
  });

  it("marks the current route with aria-current", () => {
    pathname.value = "/cards";
    renderSidebar();
    expect(screen.getByRole("link", { name: /Cards/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Bill Overview/ })).not.toHaveAttribute("aria-current");
  });

  it("marks only the bill overview link as current on the root route", () => {
    renderSidebar();
    expect(screen.getByRole("link", { name: /Bill Overview/ })).toHaveAttribute("aria-current", "page");
  });

  it("renders roadmap modules as disabled rather than as links", () => {
    renderSidebar();
    for (const label of ["Expenses", "Mutual Funds", "Stocks"]) {
      expect(screen.queryByRole("link", { name: new RegExp(label) })).toBeNull();
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("groups navigation under module headings", () => {
    renderSidebar();
    expect(screen.getByRole("heading", { name: "Credit Cards" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Coming Soon" })).toBeInTheDocument();
  });

  it("signs the user out and redirects to login", async () => {
    const user = userEvent.setup();
    renderSidebar();
    await user.click(screen.getByRole("button", { name: /Sign out/ }));
    expect(signOut).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/login");
  });

  it("opens the mobile drawer from the menu button", async () => {
    const user = userEvent.setup();
    renderSidebar();
    const trigger = screen.getByRole("button", { name: "Open navigation menu" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("button", { name: "Close navigation menu" }).length).toBeGreaterThan(0);
  });

  it("does not render a drawer close button until the drawer is open", () => {
    renderSidebar();
    expect(screen.queryByRole("button", { name: "Close navigation menu" })).toBeNull();
  });
});
