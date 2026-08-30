"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "your-money-theme";

/*
 * Runs before first paint so the correct palette is on <html> when the browser
 * paints — otherwise a dark-mode user sees a white flash on every load.
 * Kept in sync with resolveTheme() below.
 */
export const themeInitScript = `(function(){try{var p=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(p!=="light"&&p!=="dark"&&p!=="system")p="system";var t=p==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):p;document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme="light";}})();`;

type ThemeContextValue = {
  /** What the user chose, including "system". */
  preference: ThemePreference;
  /** What is actually painted right now. */
  theme: ResolvedTheme;
  setPreference: (next: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function readPreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system"
    ? stored
    : "system";
}

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  return preference === "system" ? systemTheme() : preference;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  /*
   * First render must be deterministic: the server has no localStorage, so
   * reading it during render would make the client disagree with the
   * server-rendered markup and trip a hydration mismatch on the toggle's
   * checked state. Start from the neutral default and reconcile on mount.
   * The palette itself is already correct by then — themeInitScript set it
   * before paint — so this costs no visible flash.
   */
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [theme, setTheme] = useState<ResolvedTheme>("light");

  const apply = useCallback((next: ResolvedTheme) => {
    document.documentElement.dataset.theme = next;
    setTheme(next);
  }, []);

  const setPreference = useCallback(
    (next: ThemePreference) => {
      setPreferenceState(next);
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
      apply(resolveTheme(next));
    },
    [apply],
  );

  /*
   * Reconcile the DOM on mount. The inline script normally wins the race, but
   * this keeps the provider self-sufficient wherever that script does not run
   * (tests, or a subtree rendered without the root layout).
   */
  useEffect(() => {
    const stored = readPreference();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreferenceState(stored);
    apply(resolveTheme(stored));
    // Mount-only sync; later changes flow through setPreference.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Follow the OS while the preference is "system", including live changes.
  useEffect(() => {
    if (preference !== "system") return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply(query.matches ? "dark" : "light");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [preference, apply]);

  return (
    <ThemeContext.Provider value={{ preference, theme, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
