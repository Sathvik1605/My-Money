import { describe, expect, it, beforeEach, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  ThemeProvider,
  THEME_STORAGE_KEY,
  themeInitScript,
} from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";

function setSystemDark(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function renderToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    setSystemDark(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("offers light, system and dark options", () => {
    renderToggle();
    expect(screen.getByRole("radiogroup", { name: "Colour theme" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Light" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "System" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Dark" })).toBeInTheDocument();
  });

  it("defaults to system when nothing is stored", () => {
    renderToggle();
    expect(screen.getByRole("radio", { name: "System" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("applies dark to the document element when dark is chosen", async () => {
    const user = userEvent.setup();
    renderToggle();
    await user.click(screen.getByRole("radio", { name: "Dark" }));
    await waitFor(() =>
      expect(document.documentElement.dataset.theme).toBe("dark"),
    );
  });

  it("persists the preference to localStorage", async () => {
    const user = userEvent.setup();
    renderToggle();
    await user.click(screen.getByRole("radio", { name: "Dark" }));
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("restores a stored preference on mount", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    renderToggle();
    expect(screen.getByRole("radio", { name: "Dark" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("resolves system preference to dark when the OS is dark", () => {
    setSystemDark(true);
    window.localStorage.setItem(THEME_STORAGE_KEY, "system");
    renderToggle();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("moves between options with arrow keys", async () => {
    const user = userEvent.setup();
    renderToggle();
    const system = screen.getByRole("radio", { name: "System" });
    system.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Dark" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("wraps around when arrowing past the last option", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    renderToggle();
    screen.getByRole("radio", { name: "Dark" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Light" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("exposes only the active option to the tab sequence", () => {
    renderToggle();
    expect(screen.getByRole("radio", { name: "System" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("radio", { name: "Dark" })).toHaveAttribute("tabindex", "-1");
  });

  it("ignores an unrecognised stored value and falls back to system", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "chartreuse");
    renderToggle();
    expect(screen.getByRole("radio", { name: "System" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });
});

describe("themeInitScript", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("applies the stored theme synchronously to prevent a flash", () => {
    setSystemDark(false);
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    eval(themeInitScript);
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("falls back to the system preference when set to system", () => {
    setSystemDark(true);
    window.localStorage.setItem(THEME_STORAGE_KEY, "system");
    eval(themeInitScript);
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("defaults to light when storage is empty", () => {
    setSystemDark(false);
    eval(themeInitScript);
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});
