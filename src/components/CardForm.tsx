"use client";

import { useState } from "react";
import type { CardNetwork, CardRow } from "@/lib/client-types";

const NETWORKS: CardNetwork[] = ["Visa", "Mastercard", "Amex", "RuPay", "Diners"];

interface CardFormProps {
  initial?: CardRow;
  onSubmit: (values: {
    nickname: string;
    bank_name: string;
    network: CardNetwork;
    last4_digits: string;
    credit_limit: number | null;
    billing_cycle_start_day: number;
    statement_day: number;
    typical_due_days_after_statement: number;
  }) => Promise<void>;
  onCancel: () => void;
}

export function CardForm({ initial, onSubmit, onCancel }: CardFormProps) {
  const [nickname, setNickname] = useState(initial?.nickname ?? "");
  const [bankName, setBankName] = useState(initial?.bank_name ?? "");
  const [network, setNetwork] = useState<CardNetwork>(initial?.network ?? "Visa");
  const [last4, setLast4] = useState(initial?.last4_digits ?? "");
  const [creditLimit, setCreditLimit] = useState(initial?.credit_limit?.toString() ?? "");
  const [cycleStartDay, setCycleStartDay] = useState(initial?.billing_cycle_start_day?.toString() ?? "1");
  const [statementDay, setStatementDay] = useState(initial?.statement_day?.toString() ?? "1");
  const [dueDaysAfter, setDueDaysAfter] = useState(
    initial?.typical_due_days_after_statement?.toString() ?? "20"
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        nickname,
        bank_name: bankName,
        network,
        last4_digits: last4,
        credit_limit: creditLimit.trim() === "" ? null : Number(creditLimit),
        billing_cycle_start_day: Number(cycleStartDay),
        statement_day: Number(statementDay),
        typical_due_days_after_statement: Number(dueDaysAfter),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nickname">
          <input
            required
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="e.g. HDFC Regalia"
            className="input"
          />
        </Field>
        <Field label="Issuing bank">
          <input
            required
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="e.g. HDFC Bank"
            className="input"
          />
        </Field>
        <Field label="Network">
          <select value={network} onChange={(e) => setNetwork(e.target.value as CardNetwork)} className="input">
            {NETWORKS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Last 4 digits">
          <input
            required
            value={last4}
            onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
            pattern="[0-9]{4}"
            title="Exactly 4 digits"
            className="input"
          />
        </Field>
        <Field label="Credit limit (optional)">
          <input
            type="number"
            min={0}
            value={creditLimit}
            onChange={(e) => setCreditLimit(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Billing cycle start day (1–31)">
          <input
            type="number"
            required
            min={1}
            max={31}
            value={cycleStartDay}
            onChange={(e) => setCycleStartDay(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Statement day (1–31)">
          <input
            type="number"
            required
            min={1}
            max={31}
            value={statementDay}
            onChange={(e) => setStatementDay(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Typical days after statement until due">
          <input
            type="number"
            required
            min={0}
            max={90}
            value={dueDaysAfter}
            onChange={(e) => setDueDaysAfter(e.target.value)}
            className="input"
          />
        </Field>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {submitting ? "Saving…" : initial ? "Save changes" : "Add card"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
