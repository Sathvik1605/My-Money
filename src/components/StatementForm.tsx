"use client";

import { useState } from "react";
import { Select } from "@/components/Select";
import { dueDateForStatement, isWithinCreditLimit } from "@/lib/card-rules";
import { isFullyPaid, type CardRow, type StatementRow } from "@/lib/client-types";

interface StatementFormProps {
  cards: CardRow[];
  initial?: StatementRow;
  defaultCardId?: string;
  onSubmit: (values: {
    card_id: string;
    statement_date: string;
    due_date: string;
    total_amount_due: number;
    mark_paid?: true;
    mark_unpaid?: true;
  }) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
  onMarkUnpaid?: () => Promise<void>;
}

/** Human-readable form of a yyyy-mm-dd value, for read-only display. */
export function formatDateDisplay(dateString: string): string {
  if (!dateString) return "—";
  const date = new Date(dateString + "T00:00:00Z");
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function statementDateForMonth(year: number, month: number, statementDay: number): string {
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return formatDateInput(new Date(Date.UTC(year, month, Math.min(statementDay, lastDay))));
}

export function getNextStatementDate(card: CardRow | undefined, statements: StatementRow[] = []): string {
  if (!card) return "";

  const now = new Date();
  let cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const lastStatement = statements
    .filter((statement) => statement.card_id === card.id && statement.statement_date)
    .map((statement) => new Date(statement.statement_date + "T00:00:00Z"))
    .sort((a, b) => b.getTime() - a.getTime())[0];

  if (lastStatement) {
    cursor = new Date(Date.UTC(lastStatement.getUTCFullYear(), lastStatement.getUTCMonth() + 1, 1));
  }

  for (let i = 0; i < 24; i += 1) {
    const monthLastDay = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0)).getUTCDate();
    const statementDay = Math.min(card.statement_day || 1, monthLastDay);
    const candidate = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), statementDay));

    if (candidate >= now) {
      return formatDateInput(candidate);
    }

    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
  }

  return formatDateInput(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, card.statement_day || 1)));
}

export function StatementForm({ cards, initial, defaultCardId, onSubmit, onCancel, onDelete, onMarkUnpaid }: StatementFormProps) {
  const defaultCard = initial?.card_id ?? defaultCardId ?? cards[0]?.id ?? "";
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const [cardId, setCardId] = useState(defaultCard);
  const [statementDate, setStatementDate] = useState(() => {
    if (initial?.statement_date) return initial.statement_date;
    const card = cards.find((item) => item.id === defaultCard);
    if (!card) return "";
    return statementDateForMonth(currentYear, currentMonth, card.statement_day);
  });
  const initialStatement = initial?.statement_date ?? statementDateForMonth(
    currentYear,
    currentMonth,
    cards.find((item) => item.id === defaultCard)?.statement_day ?? 1,
  );
  const [statementYear, setStatementYear] = useState(() => Number(initialStatement.slice(0, 4)));
  const [statementMonth, setStatementMonth] = useState(() => Number(initialStatement.slice(5, 7)) - 1);
  /*
   * Always derived from the statement date and the card's fixed due day,
   * including when editing. Trusting a stored due_date would let a stale row
   * contradict the card it belongs to.
   */
  const [dueDate, setDueDate] = useState(() => {
    const card = cards.find((item) => item.id === defaultCard);
    if (!card) return initial?.due_date ?? "";
    const base = initial?.statement_date ?? statementDateForMonth(currentYear, currentMonth, card.statement_day);
    return base ? dueDateForStatement(base, card.due_day) : "";
  });
  const [totalDue, setTotalDue] = useState(initial?.total_amount_due?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedCard = cards.find((card) => card.id === cardId);
  const isClosedCard = initial !== undefined && selectedCard?.is_active === false;
  const isPaid = initial !== undefined && isFullyPaid(initial);

  function handleCardChange(nextCardId: string) {
    setCardId(nextCardId);
    if (initial) return;
    const nextCard = cards.find((card) => card.id === nextCardId);
    if (!nextCard) return;
    const nextStatementDate = statementDateForMonth(statementYear, statementMonth, nextCard.statement_day);
    setStatementDate(nextStatementDate);
    setDueDate(dueDateForStatement(nextStatementDate, nextCard.due_day));
  }

  function handleStatementPeriodChange(nextYear: number, nextMonth: number) {
    setStatementYear(nextYear);
    setStatementMonth(nextMonth);
    if (initial) return;
    const card = cards.find((item) => item.id === cardId);
    if (!card) return;
    const nextStatementDate = statementDateForMonth(nextYear, nextMonth, card.statement_day);
    setStatementDate(nextStatementDate);
    setDueDate(dueDateForStatement(nextStatementDate, card.due_day));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const totalAmount = Number(totalDue);
    if (!isWithinCreditLimit(totalAmount, selectedCard?.credit_limit ?? 0)) {
      setError("Total amount due cannot exceed this card's credit limit.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        card_id: cardId,
        statement_date: statementDate,
        due_date: dueDate,
        total_amount_due: totalAmount,
        ...(initial && !isPaid ? { mark_paid: true } : {}),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/*
        * The card owns every other value on this form, so it sits alone on the
        * first row rather than sharing one with a value derived from it.
        */}
      {initial ? (
        <ReadOnlyField label="Card" value={selectedCard?.nickname ?? "—"} />
      ) : (
        <Field label="Card">
          <Select
            value={cardId}
            onChange={handleCardChange}
            ariaLabel="Card"
            options={cards.map((card) => ({ value: card.id, label: card.nickname }))}
          />
        </Field>
      )}

      {!initial && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Statement month">
              <Select
                value={statementMonth}
                onChange={(nextMonth) => handleStatementPeriodChange(statementYear, nextMonth)}
                ariaLabel="Statement month"
                options={Array.from({ length: 12 }, (_, month) => ({
                  value: month,
                  label: new Date(Date.UTC(2026, month, 1)).toLocaleString("en-IN", { month: "long", timeZone: "UTC" }),
                }))}
              />
            </Field>
            <Field label="Statement year">
              <Select
                value={statementYear}
                onChange={(nextYear) => handleStatementPeriodChange(nextYear, statementMonth)}
                ariaLabel="Statement year"
                options={Array.from({ length: 11 }, (_, index) => new Date().getFullYear() - index).map((year) => ({
                  value: year,
                  label: String(year),
                }))}
              />
            </Field>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ReadOnlyField label="Statement date" value={formatDateDisplay(statementDate)} />
        <ReadOnlyField label="Due date" value={formatDateDisplay(dueDate)} />
        {isPaid || isClosedCard ? (
          <ReadOnlyField label="Total amount due (₹)" value={totalDue} />
        ) : (
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
        )}
        {initial?.payment_date && (
          <ReadOnlyField label="Payment date" value={formatDateDisplay(initial.payment_date)} />
        )}
      </div>

      {error && <p role="alert" className="text-sm text-[var(--color-destructive)]">{error}</p>}

      <div className="flex justify-between">
        <div className="flex flex-wrap gap-2">
          {onDelete && initial && !isClosedCard && (
            <button
              type="button"
              onClick={onDelete}
              className="btn-ghost text-[var(--color-destructive)]"
            >
              Remove entry
            </button>
          )}
          {onMarkUnpaid && isPaid && !isClosedCard && (
            <button
              type="button"
              onClick={onMarkUnpaid}
              className="btn-ghost"
            >
              Mark unpaid
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
          {(!initial || (!isPaid && !isClosedCard)) && (
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
            >
              {submitting ? "Saving…" : initial ? "Paid" : "Add bill"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="block">
      <span className="block text-sm font-medium text-[var(--color-text-muted)]">{label}</span>
      <div className="mt-1">
        <p className="value-static">{value}</p>
      </div>
    </div>
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
