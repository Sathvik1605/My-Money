"use client";

import { useState } from "react";
import type { CardRow, StatementRow, StatementStatus } from "@/lib/client-types";

const STATUSES: StatementStatus[] = ["Unpaid", "Partially Paid", "Paid"];

interface StatementFormProps {
  cards: CardRow[];
  initial?: StatementRow;
  defaultCardId?: string;
  onSubmit: (values: {
    card_id: string;
    cycle_start_date: string;
    cycle_end_date: string;
    statement_date: string;
    due_date: string;
    total_amount_due: number;
    amount_paid: number;
    payment_date: string | null;
    status: StatementStatus;
  }) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
}

export function StatementForm({ cards, initial, defaultCardId, onSubmit, onCancel, onDelete }: StatementFormProps) {
  const [cardId, setCardId] = useState(initial?.card_id ?? defaultCardId ?? cards[0]?.id ?? "");
  const [cycleStart, setCycleStart] = useState(initial?.cycle_start_date ?? "");
  const [cycleEnd, setCycleEnd] = useState(initial?.cycle_end_date ?? "");
  const [statementDate, setStatementDate] = useState(initial?.statement_date ?? "");
  const [dueDate, setDueDate] = useState(initial?.due_date ?? "");
  const [totalDue, setTotalDue] = useState(initial?.total_amount_due?.toString() ?? "");
  const [amountPaid, setAmountPaid] = useState(initial?.amount_paid?.toString() ?? "0");
  const [paymentDate, setPaymentDate] = useState(initial?.payment_date ?? "");
  const [status, setStatus] = useState<StatementStatus>(initial?.status ?? "Unpaid");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function prefillFromCard(id: string) {
    setCardId(id);
    if (initial) return; // don't clobber existing values when editing
    const card = cards.find((c) => c.id === id);
    if (!card || !statementDate) return;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        card_id: cardId,
        cycle_start_date: cycleStart,
        cycle_end_date: cycleEnd,
        statement_date: statementDate,
        due_date: dueDate,
        total_amount_due: Number(totalDue),
        amount_paid: Number(amountPaid),
        payment_date: paymentDate.trim() === "" ? null : paymentDate,
        status,
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
        <Field label="Card">
          <select
            value={cardId}
            onChange={(e) => prefillFromCard(e.target.value)}
            disabled={!!initial}
            required
            className="input"
          >
            {cards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nickname}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select value={status} onChange={(e) => setStatus(e.target.value as StatementStatus)} className="input">
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Cycle start date">
          <input
            type="date"
            required
            value={cycleStart}
            onChange={(e) => setCycleStart(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Cycle end date">
          <input
            type="date"
            required
            value={cycleEnd}
            onChange={(e) => setCycleEnd(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Statement date">
          <input
            type="date"
            required
            value={statementDate}
            onChange={(e) => setStatementDate(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Due date">
          <input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" />
        </Field>
        <Field label="Total amount due (₹)">
          <input
            type="number"
            required
            min={0}
            step="0.01"
            value={totalDue}
            onChange={(e) => setTotalDue(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Amount paid (₹)">
          <input
            type="number"
            min={0}
            step="0.01"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Payment date (optional)">
          <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="input" />
        </Field>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-between">
        <div>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Delete entry
            </button>
          )}
        </div>
        <div className="flex gap-2">
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
            {submitting ? "Saving…" : initial ? "Save changes" : "Add bill"}
          </button>
        </div>
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
