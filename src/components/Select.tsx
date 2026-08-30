"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDownIcon } from "@/components/icons";

export interface SelectOption<T extends string | number> {
  value: T;
  label: string;
}

interface SelectProps<T extends string | number> {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}

export function Select<T extends string | number>({
  value,
  options,
  onChange,
  ariaLabel,
  className,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));

  useEffect(() => {
    function closeWhenFocusLeaves(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("pointerdown", closeWhenFocusLeaves);
    return () => document.removeEventListener("pointerdown", closeWhenFocusLeaves);
  }, []);

  function choose(index: number) {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen((isOpen) => !isOpen);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      choose(
        event.key === "ArrowDown"
          ? Math.min(selectedIndex + 1, options.length - 1)
          : Math.max(selectedIndex - 1, 0),
      );
    }
  }

  return (
    <div ref={rootRef} className={`dropdown ${className ?? ""}`}>
      <button
        type="button"
        className="dropdown-trigger"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((isOpen) => !isOpen)}
        onKeyDown={handleKeyDown}
      >
        <span className="truncate">{options[selectedIndex]?.label}</span>
        <ChevronDownIcon className={open ? "dropdown-chevron is-open" : "dropdown-chevron"} />
      </button>
      {open && (
        <div id={listboxId} role="listbox" aria-label={ariaLabel} className="dropdown-menu">
          {options.map((option) => (
            <button
              key={String(option.value)}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className="dropdown-option"
              onClick={() => choose(options.indexOf(option))}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
