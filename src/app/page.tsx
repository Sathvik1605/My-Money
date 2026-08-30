"use client";

import { useEffect, useState, useCallback } from "react";
import { StatementForm } from "@/components/StatementForm";
import { Select } from "@/components/Select";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "@/components/icons";
import { formatCurrency, isOverdue, paymentState } from "@/lib/client-types";
import { cardsWithPaymentsDue, financialYearStartForDate } from "@/lib/year-grid";
import type { CardRow, StatementRow } from "@/lib/client-types";

type YearType = "financial" | "calendar";

interface YearGridData {
  year: number;
  yearType: YearType;
  cards: { id: string; nickname: string; is_active: boolean }[];
  months: {
    month: string;
    amounts: Record<string, number>;
    unpaidAmounts: Record<string, number>;
    total: number;
    unpaidTotal: number;
  }[];
  cardTotals: Record<string, number>;
  grandTotal: number;
  unpaidTotal: number;
  earliestStatementDate: string | null;
}

export default function BillOverviewPage() {
  const now = new Date();
  const defaultYear = now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();

  const [year, setYear] = useState(defaultYear);
  const [yearType, setYearType] = useState<YearType>("financial");
  const [grid, setGrid] = useState<YearGridData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [allCards, setAllCards] = useState<CardRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [statements, setStatements] = useState<StatementRow[]>([]);
  const [editingStatement, setEditingStatement] = useState<StatementRow | null>(null);
  const [statementPendingRemoval, setStatementPendingRemoval] = useState<StatementRow | null>(null);

  const loadGrid = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/year-grid?year=${year}&yearType=${yearType}`);
      if (!res.ok) throw new Error("Failed to load year grid");
      const { data } = await res.json();
      setGrid(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [year, yearType]);

  const loadCardsAndStatements = useCallback(async () => {
    const [cardsRes, statementsRes] = await Promise.all([
      fetch("/api/cards?includeInactive=true"),
      fetch("/api/statements"),
    ]);
    if (cardsRes.ok) setAllCards((await cardsRes.json()).data);
    if (statementsRes.ok) setStatements((await statementsRes.json()).data);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional data fetch on mount/year change
    loadGrid();
  }, [loadGrid]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional data fetch on mount
    loadCardsAndStatements();
  }, [loadCardsAndStatements]);

  async function postStatement(values: {
    card_id: string;
    statement_date: string;
    due_date: string;
    total_amount_due: number;
    mark_paid?: true;
  }) {
    const res = await fetch("/api/statements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Failed to save statement");
    }
  }

  async function handleCreateStatement(values: Parameters<typeof postStatement>[0]) {
    await postStatement(values);
    setShowForm(false);
    await Promise.all([loadGrid(), loadCardsAndStatements()]);
  }

  async function handleUpdateStatement(values: Parameters<typeof postStatement>[0]) {
    if (!editingStatement) return;
    const res = await fetch(`/api/statements/${editingStatement.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Failed to update statement");
    }
    setEditingStatement(null);
    await Promise.all([loadGrid(), loadCardsAndStatements()]);
  }

  async function handleDeleteStatement() {
    if (!editingStatement) return;
    const res = await fetch(`/api/statements/${editingStatement.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Failed to remove bill entry");
    }
    setEditingStatement(null);
    await Promise.all([loadGrid(), loadCardsAndStatements()]);
  }

  async function handleMarkUnpaid() {
    if (!editingStatement) return;
    const res = await fetch(`/api/statements/${editingStatement.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mark_unpaid: true }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Failed to mark bill unpaid");
    }
    setEditingStatement(null);
    await Promise.all([loadGrid(), loadCardsAndStatements()]);
  }

  function findStatementForCell(cardId: string, monthLabel: string): StatementRow | undefined {
    return statements.find((s) => {
      if (s.card_id !== cardId) return false;
      const d = new Date(s.statement_date + "T00:00:00Z");
      const label = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }) + " " + d.getUTCFullYear();
      return label === monthLabel;
    });
  }

  const activeCards = allCards.filter((c) => c.is_active);
  const activeCardsInSelectedPeriod = grid?.cards.filter((card) => card.is_active).length ?? 0;
  const cardsWithOutstandingPayments = cardsWithPaymentsDue(grid?.months ?? []);

  // Never offer years that cannot contain data: the range starts at the
  // earliest recorded bill (or the current year if there are none) and ends at
  // the current year, +1 for financial years that span into the next one.
  const currentYear = now.getFullYear();
  const earliestYear = grid?.earliestStatementDate
    ? yearType === "financial"
      ? financialYearStartForDate(grid.earliestStatementDate)
      : new Date(grid.earliestStatementDate + "T00:00:00Z").getUTCFullYear()
    : defaultYear;
  const minYear = Math.min(earliestYear, defaultYear, year);
  const maxYear = Math.max(currentYear, year);
  const selectableYears: number[] = [];
  for (let y = maxYear; y >= minYear; y--) selectableYears.push(y);

  const formatYearLabel = (y: number) =>
    yearType === "financial" ? `${y}-${y + 1}` : String(y);

  function handleYearTypeChange(nextYearType: YearType) {
    if (yearType === "financial" && nextYearType === "calendar") {
      setYear((financialYearStart) => Math.min(financialYearStart + 1, now.getFullYear()));
    }
    if (yearType === "calendar" && nextYearType === "financial") {
      setYear((currentYear) => currentYear - 1);
    }
    setYearType(nextYearType);
  }

  return (
    <main className="app-page mx-auto">
      <PageHeader
        title="Bill Overview"
        description={`Every credit card bill for ${formatYearLabel(year)}, month by month.`}
        actions={
          <>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setYear((y) => y - 1)}
                disabled={year <= minYear}
                className="btn-ghost w-11 px-0 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous year"
              >
                <ChevronLeftIcon />
              </button>
              <Select
                value={year}
                onChange={setYear}
                ariaLabel="Select year"
                className="year-select w-auto min-w-36"
                options={selectableYears.map((yearOption) => ({
                  value: yearOption,
                  label: formatYearLabel(yearOption),
                }))}
              />
              <button
                onClick={() => setYear((y) => y + 1)}
                disabled={year >= maxYear}
                className="btn-ghost w-11 px-0 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next year"
              >
                <ChevronRightIcon />
              </button>
            </div>
            <div
              role="radiogroup"
              aria-label="Year type"
              className="segmented"
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                  e.preventDefault();
                  handleYearTypeChange(yearType === "financial" ? "calendar" : "financial");
                }
              }}
            >
              {(
                [
                  ["financial", "Financial year"],
                  ["calendar", "Calendar year"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={yearType === value}
                  tabIndex={yearType === value ? 0 : -1}
                  onClick={() => handleYearTypeChange(value)}
                  className="segmented-option"
                >
                  {label}
                </button>
              ))}
            </div>

            {activeCards.length > 0 && (
              <button onClick={() => setShowForm(true)} className="btn-primary">
                <PlusIcon />
                New bill
              </button>
            )}
          </>
        }
      />

      {grid && grid.cards.length > 0 && (
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card-soft flex items-center justify-between gap-2 p-2">
            <dt className="table-header text-[var(--color-text-muted)]">
              Total billed
            </dt>
            <dd className="numeric text-[20px] font-[652] leading-[1.3]">
              {formatCurrency(grid.grandTotal)}
            </dd>
          </div>
          <div className="card-soft flex items-center justify-between gap-2 p-2">
            <dt className="table-header text-[var(--color-text-muted)]">
              Outstanding
            </dt>
            <dd
              className={`numeric text-[20px] font-[652] leading-[1.3] ${
                grid.unpaidTotal > 0 ? "text-[var(--color-destructive)]" : ""
              }`}
            >
              {formatCurrency(grid.unpaidTotal)}
            </dd>
          </div>
          <div className="card-soft flex items-center justify-between gap-2 p-2">
            <dt className="table-header text-[var(--color-text-muted)]">
              Active cards
            </dt>
            <dd className="numeric text-[20px] font-[652] leading-[1.3]">
              {activeCardsInSelectedPeriod}
            </dd>
          </div>
          <div className="card-soft flex items-center justify-between gap-2 p-2">
            <dt className="table-header text-[var(--color-text-muted)]">
              Cards with payments due
            </dt>
            <dd
              className={`numeric text-[20px] font-[652] leading-[1.3] ${
                cardsWithOutstandingPayments > 0 ? "text-[var(--color-destructive)]" : ""
              }`}
            >
              {cardsWithOutstandingPayments}
            </dd>
          </div>
        </dl>
      )}

      {activeCards.length === 0 && !loading && (
        <div className="card-soft mt-6 p-12 text-center">
          <p className="text-[var(--color-text-muted)]">
            You don&apos;t have any cards yet. Add your first one from the Cards page.
          </p>
        </div>
      )}

      {showForm && (
        <Modal title="Add new bill" onClose={() => setShowForm(false)}>
          <StatementForm
            cards={activeCards}
            onSubmit={handleCreateStatement}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}

      {editingStatement && (
        <Modal title="Edit bill entry" onClose={() => setEditingStatement(null)}>
          <StatementForm
            cards={allCards}
            initial={editingStatement}
            onSubmit={handleUpdateStatement}
            onCancel={() => setEditingStatement(null)}
            onDelete={async () => setStatementPendingRemoval(editingStatement)}
            onMarkUnpaid={handleMarkUnpaid}
          />
        </Modal>
      )}

      {statementPendingRemoval && (
        <Modal title="Remove bill entry" onClose={() => setStatementPendingRemoval(null)}>
          <p role="alert">
            Remove this bill entry permanently? This cannot be undone.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={() => setStatementPendingRemoval(null)} className="btn-ghost">
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                setStatementPendingRemoval(null);
                await handleDeleteStatement();
              }}
              className="btn-destructive"
            >
              Remove permanently
            </button>
          </div>
        </Modal>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-[var(--color-destructive)]">
          {error}
        </p>
      )}

      {loading && <p className="mt-6 text-[var(--color-text-muted)]">Loading…</p>}

      {!loading && grid && grid.cards.length > 0 && (
        <div className="card-surface mt-4 overflow-x-auto">
          <table className="min-w-full w-max table-fixed text-sm">
            <caption className="sr-only">Credit card bills by month</caption>
            <thead>
              <tr className="table-data-row border-b border-[var(--color-hairline)] bg-[var(--color-canvas-soft)]">
                <th
                  scope="col"
                  className="table-header sticky left-0 z-20 bg-[var(--color-canvas-soft)] px-4 py-2.5 text-left"
                >
                  Month
                </th>
                {grid.cards.map((c) => (
                  <th
                    key={c.id}
                    scope="col"
                    className="table-header w-[var(--table-card-column-width)] px-4 py-2.5 text-right"
                  >
                    {c.nickname}
                    {!c.is_active && <span className="ml-1 opacity-60">(closed)</span>}
                  </th>
                ))}
                <th
                  scope="col"
                  className="table-header sticky right-0 z-20 w-[var(--table-total-column-width)] bg-[var(--color-canvas-soft)] px-4 py-2.5 text-right"
                >
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {grid.months.map((row) => (
                <tr key={row.month} className="table-data-row border-b border-[var(--color-hairline)] last:border-0">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 bg-[var(--color-surface)] px-4 py-2 text-left text-[14px] font-[600]"
                  >
                    {row.month}
                  </th>
                  {grid.cards.map((c) => {
                    const amount = row.amounts[c.id] ?? 0;
                    const cellStatement = findStatementForCell(c.id, row.month);
                    const unpaid = (row.unpaidAmounts?.[c.id] ?? 0) > 0;
                    const overdue = cellStatement ? isOverdue(cellStatement) : false;
                    return (
                      <td key={c.id} className="w-[var(--table-card-column-width)] px-2 py-1.5 text-right">
                        {cellStatement ? (
                          <button
                            onClick={() => setEditingStatement(cellStatement)}
                            className={`numeric min-h-9 w-full rounded-full px-2 text-right font-semibold hover:bg-[var(--color-canvas-soft)] ${
                              unpaid ? "text-[var(--color-destructive)]" : ""
                            }`}
                            aria-label={`Edit ${c.nickname} bill for ${row.month}, ${formatCurrency(amount)}, ${
                              overdue ? "overdue" : paymentState(cellStatement).toLowerCase()
                            }`}
                          >
                            {formatCurrency(amount)}
                          </button>
                        ) : (
                                          <span className="numeric px-2 text-[var(--color-text-faint)]">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="numeric sticky right-0 z-10 w-[var(--table-total-column-width)] bg-[var(--color-surface)] px-4 py-2.5 text-right font-semibold">
                    {formatCurrency(row.total)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="table-data-row border-t border-[var(--color-hairline)] bg-[var(--color-canvas-soft)] font-[600]">
                <th scope="row" className="sticky left-0 z-10 bg-[var(--color-canvas-soft)] px-4 py-3 text-left">
                  Total
                </th>
                {grid.cards.map((c) => (
                  <td key={c.id} className="numeric w-[var(--table-card-column-width)] px-4 py-3 text-right">
                    {formatCurrency(grid.cardTotals[c.id] ?? 0)}
                  </td>
                ))}
                <td className="numeric sticky right-0 z-10 w-[var(--table-total-column-width)] bg-[var(--color-canvas-soft)] px-4 py-3 text-right">
                  {formatCurrency(grid.grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </main>
  );
}
