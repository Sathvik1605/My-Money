"use client";

import { useEffect, useState, useCallback } from "react";
import { StatementForm } from "@/components/StatementForm";
import { formatCurrency } from "@/lib/client-types";
import type { CardRow, StatementRow, StatementStatus } from "@/lib/client-types";

type YearType = "financial" | "calendar";

interface YearGridData {
  year: number;
  yearType: YearType;
  cards: { id: string; nickname: string; is_active: boolean }[];
  months: { month: string; amounts: Record<string, number>; total: number }[];
  cardTotals: Record<string, number>;
  grandTotal: number;
}

export default function YearGridPage() {
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
    cycle_start_date: string;
    cycle_end_date: string;
    statement_date: string;
    due_date: string;
    total_amount_due: number;
    amount_paid: number;
    payment_date: string | null;
    status: StatementStatus;
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
    if (!confirm("Delete this bill entry? This cannot be undone.")) return;
    const res = await fetch(`/api/statements/${editingStatement.id}`, { method: "DELETE" });
    if (res.ok) {
      setEditingStatement(null);
      await Promise.all([loadGrid(), loadCardsAndStatements()]);
    }
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

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-lg font-semibold text-gray-900">Year Grid</h1>
        <div className="flex items-center gap-3">
          <select
            value={yearType}
            onChange={(e) => setYearType(e.target.value as YearType)}
            className="input w-auto"
          >
            <option value="financial">Financial Year (Apr–Mar)</option>
            <option value="calendar">Calendar Year (Jan–Dec)</option>
          </select>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setYear((y) => y - 1)}
              className="rounded-md border border-gray-300 px-2 py-1 text-sm hover:bg-gray-100"
              aria-label="Previous year"
            >
              ←
            </button>
            <span className="min-w-[4rem] text-center text-sm font-medium text-gray-700">
              {yearType === "financial" ? `FY ${year}-${(year + 1).toString().slice(-2)}` : year}
            </span>
            <button
              onClick={() => setYear((y) => y + 1)}
              className="rounded-md border border-gray-300 px-2 py-1 text-sm hover:bg-gray-100"
              aria-label="Next year"
            >
              →
            </button>
          </div>
          {activeCards.length > 0 && !showForm && !editingStatement && (
            <button
              onClick={() => setShowForm(true)}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              + Add bill
            </button>
          )}
        </div>
      </div>

      {activeCards.length === 0 && !loading && (
        <p className="mt-6 text-sm text-gray-500">
          You don&apos;t have any cards yet. Head to the Cards tab to add your first one.
        </p>
      )}

      {showForm && (
        <div className="mt-4">
          <StatementForm cards={activeCards} onSubmit={handleCreateStatement} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {editingStatement && (
        <div className="mt-4">
          <StatementForm
            cards={allCards}
            initial={editingStatement}
            onSubmit={handleUpdateStatement}
            onCancel={() => setEditingStatement(null)}
            onDelete={handleDeleteStatement}
          />
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {loading && <p className="mt-6 text-sm text-gray-500">Loading…</p>}

      {!loading && grid && grid.cards.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Month</th>
                {grid.cards.map((c) => (
                  <th key={c.id} className="px-4 py-2 text-right font-medium text-gray-600">
                    {c.nickname}
                    {!c.is_active && <span className="ml-1 text-gray-400">(inactive)</span>}
                  </th>
                ))}
                <th className="px-4 py-2 text-right font-semibold text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {grid.months.map((row) => (
                <tr key={row.month}>
                  <td className="px-4 py-2 font-medium text-gray-700">{row.month}</td>
                  {grid.cards.map((c) => {
                    const amount = row.amounts[c.id] ?? 0;
                    const cellStatement = findStatementForCell(c.id, row.month);
                    return (
                      <td
                        key={c.id}
                        onClick={() => cellStatement && setEditingStatement(cellStatement)}
                        className={`px-4 py-2 text-right tabular-nums ${
                          cellStatement ? "cursor-pointer hover:bg-indigo-50" : "text-gray-300"
                        }`}
                      >
                        {amount > 0 ? formatCurrency(amount) : "—"}
                      </td>
                    );
                  })}
                  <td className="px-4 py-2 text-right font-semibold tabular-nums">{formatCurrency(row.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold">
              <tr>
                <td className="px-4 py-2">Total</td>
                {grid.cards.map((c) => (
                  <td key={c.id} className="px-4 py-2 text-right tabular-nums">
                    {formatCurrency(grid.cardTotals[c.id] ?? 0)}
                  </td>
                ))}
                <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(grid.grandTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </main>
  );
}
