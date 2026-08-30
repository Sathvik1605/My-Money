"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/client-types";

type MonthlyAmountProps = {
  amount: number | null;
  disabled: boolean;
  accessibleName: string;
  onSave: (amount: number) => Promise<void>;
};

export function MonthlyAmount({ amount, disabled, accessibleName, onSave }: MonthlyAmountProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(amount === null ? "" : String(amount));
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const next = Number(value || 0);
    if (!Number.isFinite(next) || next < 0) {
      setError("Enter a non-negative amount.");
      return;
    }
    try {
      await onSave(next);
      setError(null);
      setEditing(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save amount.");
    }
  }

  if (!editing || disabled) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setValue(amount === null ? "" : String(amount));
          setEditing(true);
        }}
        aria-label={`${accessibleName}: ${amount === null ? "no amount entered" : formatCurrency(amount)}${disabled ? ", editing unavailable" : ", edit amount"}`}
        className="numeric min-h-11 rounded-full px-3 text-right font-semibold hover:bg-[var(--color-canvas-soft)] disabled:cursor-default disabled:hover:bg-transparent"
      >
        {amount === null ? "" : formatCurrency(amount)}
      </button>
    );
  }

  return (
    <div>
      <input
        autoFocus
        aria-label={accessibleName}
        className="input numeric min-h-11 text-right"
        inputMode="decimal"
        type="number"
        min="0"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => void save()}
        onKeyDown={(event) => {
          if (event.key === "Enter") void save();
          if (event.key === "Escape") setEditing(false);
        }}
      />
      {error && <p className="caption mt-1 text-[var(--color-destructive)]" role="alert">{error}</p>}
    </div>
  );
}
