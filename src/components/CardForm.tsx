"use client";

import { useState } from "react";
import { Select } from "@/components/Select";
import type { CardNetwork, CardRow } from "@/lib/client-types";

const NETWORKS: CardNetwork[] = ["Visa", "Mastercard", "Amex", "RuPay", "Diners"];
const BANKS = [
  "HDFC Bank",
  "ICICI Bank",
  "State Bank of India",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Yes Bank",
  "Bank of Baroda",
  "Canara Bank",
  "Punjab National Bank",
  "HSBC Bank",
  "Citi Bank",
  "Standard Chartered Bank",
  "American Express Bank",
  "IDFC FIRST Bank",
  "AU Small Finance Bank",
  "Other Bank",
];

interface CardFormProps {
  initial?: CardRow;
  onSubmit: (values: {
    nickname: string;
    bank_name: string;
    network: CardNetwork;
    last4_digits: string;
    credit_limit: number;
    statement_day: number;
    due_day: number;
  }) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => void | Promise<void>;
}

export function CardForm({ initial, onSubmit, onCancel, onDelete }: CardFormProps) {
  const [nickname, setNickname] = useState(initial?.nickname ?? "");
  const [bankName, setBankName] = useState(initial?.bank_name ?? BANKS[0]);
  const [network, setNetwork] = useState<CardNetwork>(initial?.network ?? "Visa");
  const [last4, setLast4] = useState(initial?.last4_digits ?? "");
  const [creditLimit, setCreditLimit] = useState(initial?.credit_limit.toString() ?? "");
  const [statementDay, setStatementDay] = useState(initial?.statement_day?.toString() ?? "1");
  const [dueDay, setDueDay] = useState(initial?.due_day?.toString() ?? "20");
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
        credit_limit: Number(creditLimit),
        statement_day: Number(statementDay),
        due_day: Number(dueDay),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          <Select
            value={bankName}
            onChange={setBankName}
            ariaLabel="Issuing bank"
            options={[...BANKS, ...(bankName && !BANKS.includes(bankName) ? [bankName] : [])].map((bank) => ({
              value: bank,
              label: bank,
            }))}
          />
        </Field>
        <Field label="Network">
          <Select
            value={network}
            onChange={setNetwork}
            ariaLabel="Network"
            options={NETWORKS.map((network) => ({ value: network, label: network }))}
          />
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
        <Field label="Credit limit (₹)">
          <input
            type="number"
            required
            min={0}
            value={creditLimit}
            onChange={(e) => setCreditLimit(e.target.value)}
            className="input numeric"
          />
        </Field>
        <Field label="Statement date (1–31)">
          <input
            type="number"
            required
            min={1}
            max={31}
            value={statementDay}
            onChange={(e) => setStatementDay(e.target.value)}
            className="input numeric"
          />
        </Field>
        <Field label="Due date (1–31)">
          <input
            type="number"
            required
            min={1}
            max={31}
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            className="input numeric"
          />
        </Field>
      </div>

      {error && <p role="alert" className="text-sm text-[var(--color-destructive)]">{error}</p>}

      <div className="flex justify-between gap-2">
        <div>
          {initial && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="btn-ghost text-[var(--color-destructive)]"
            >
              Delete card
            </button>
          )}
        </div>
        <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="btn-ghost"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary"
        >
          {submitting ? "Saving…" : initial ? "Save changes" : "Add card"}
        </button>
        </div>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-[var(--color-text-muted)]">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
