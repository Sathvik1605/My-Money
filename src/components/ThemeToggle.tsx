"use client";

import { useTheme, type ThemePreference } from "@/components/ThemeProvider";
import { MonitorIcon, MoonIcon, SunIcon } from "@/components/icons";

const OPTIONS: {
  value: ThemePreference;
  label: string;
  Icon: (props: { className?: string }) => React.ReactElement;
}[] = [
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "system", label: "System", Icon: MonitorIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
];

/*
 * Three-way theme control. "System" is included deliberately — a two-state
 * toggle would strip a user's OS preference the moment they touched it.
 * Uses the same radiogroup + arrow-key pattern as the year-type toggle.
 */
export function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
    const back = event.key === "ArrowLeft" || event.key === "ArrowUp";
    if (!forward && !back) return;
    event.preventDefault();
    const index = OPTIONS.findIndex((option) => option.value === preference);
    const next =
      (index + (forward ? 1 : -1) + OPTIONS.length) % OPTIONS.length;
    setPreference(OPTIONS[next].value);
  }

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="segmented"
      onKeyDown={onKeyDown}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const isActive = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            title={`${label} theme`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => setPreference(value)}
            className="segmented-option segmented-option--icon"
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
