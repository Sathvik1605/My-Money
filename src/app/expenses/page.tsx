"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/Modal";
import { MonthlyAmount } from "@/components/MonthlyAmount";
import { PageHeader } from "@/components/PageHeader";
import { Select } from "@/components/Select";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import {
  amountForSection,
  EXPENSE_CATEGORY_LABELS,
  isAvailableInMonth,
  sectionUsesLineItems,
  totalExpenseAmounts,
} from "@/lib/expense-grid";
import { formatCurrency } from "@/lib/client-types";
import type {
  ExpenseCategory,
  ExpenseEntryRow,
  ExpenseLineItemRow,
  ExpenseSectionRow,
} from "@/lib/client-types";

type YearType = "financial" | "calendar";
const CATEGORY_ORDER: ExpenseCategory[] = ["Investment", "Need", "Want"];
const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Investment: "text-[var(--color-expense-investment)]",
  Need: "text-[var(--color-expense-need)]",
  Want: "text-[var(--color-expense-want)]",
};
const CATEGORY_SURFACES: Record<ExpenseCategory, string> = {
  Investment: "bg-[var(--color-expense-investment-surface)]",
  Need: "bg-[var(--color-expense-need-surface)]",
  Want: "bg-[var(--color-expense-want-surface)]",
};

function periodMonths(year: number, yearType: YearType) {
  const start = yearType === "financial" ? 3 : 0;
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.UTC(year, start + index, 1));
    return date.toISOString().slice(0, 10);
  });
}

function periodIsClosed(months: string[]) {
  return months[11] < `${new Date().toISOString().slice(0, 7)}-01`;
}

export default function ExpensesPage() {
  const now = new Date();
  const [yearType, setYearType] = useState<YearType>("calendar");
  const [year, setYear] = useState(now.getFullYear());
  const [sections, setSections] = useState<ExpenseSectionRow[]>([]);
  const [lineItems, setLineItems] = useState<ExpenseLineItemRow[]>([]);
  const [entries, setEntries] = useState<ExpenseEntryRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [confirmUnlock, setConfirmUnlock] = useState(false);
  const months = useMemo(() => periodMonths(year, yearType), [year, yearType]);
  const closed = periodIsClosed(months);
  const selectableYears = Array.from({ length: 11 }, (_, index) => now.getFullYear() - index);
  const minYear = selectableYears[selectableYears.length - 1];
  const maxYear = selectableYears[0];

  function handleYearTypeChange(nextYearType: YearType) {
    if (yearType === "financial" && nextYearType === "calendar") {
      setYear((financialYearStart) => Math.min(financialYearStart + 1, now.getFullYear()));
    }
    if (yearType === "calendar" && nextYearType === "financial") {
      setYear((calendarYear) => calendarYear - 1);
    }
    setYearType(nextYearType);
    setUnlocked(false);
  }

  async function load() {
    const response = await fetch("/api/expenses");
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Unable to load expenses");
    setSections(body.data.sections);
    setLineItems(body.data.lineItems);
    setEntries(body.data.entries);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial API load
    void load().catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load expenses"));
  }, []);

  async function save(sectionId: string, lineItemId: string | null, month: string, amount: number) {
    const response = await fetch("/api/expenses", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section_id: sectionId,
        line_item_id: lineItemId,
        month,
        amount,
        unlock_closed_year: unlocked,
      }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Unable to save amount");
    await load();
  }

  const categoryGroups = CATEGORY_ORDER.map((category) => ({
    category,
    rows: sections
      .filter((section) =>
        section.category === category && months.some((month) => isAvailableInMonth(section.created_at, month)),
      ).map((section) => ({ id: section.id, name: section.name, section })),
  })).filter((group) => group.rows.length > 0);
  const visibleRows = categoryGroups.flatMap((group) => group.rows);
  const sectionAmount = (sectionId: string, month?: string) =>
   amountForSection(
     sectionId,
     month ? entries.filter((entry) => entry.month === month) : entries.filter((entry) => months.includes(entry.month)),
     lineItems,
   );
  const monthTotal = (month: string) => totalExpenseAmounts(visibleRows.map((row) => sectionAmount(row.section.id, month)));
  const sectionTotal = (sectionId: string) => sectionAmount(sectionId);
  const grandTotal = totalExpenseAmounts(months.map(monthTotal));

  return (
    <main className="app-page mx-auto">
      <PageHeader
        title="Expenses"
        description="Record monthly Investments, Needs, and Wants in one yearly view."
        actions={
          <>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => { setYear((value) => value - 1); setUnlocked(false); }} disabled={year <= minYear} className="btn-ghost w-11 px-0 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Previous year"><ChevronLeftIcon /></button>
              <Select value={year} onChange={(nextYear) => { setYear(nextYear); setUnlocked(false); }} ariaLabel="Select expense year" className="year-select w-36" options={selectableYears.map((option) => ({ value: option, label: yearType === "financial" ? `${option}-${option + 1}` : String(option) }))} />
              <button type="button" onClick={() => { setYear((value) => value + 1); setUnlocked(false); }} disabled={year >= maxYear} className="btn-ghost w-11 px-0 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Next year"><ChevronRightIcon /></button>
            </div>
            <div
              role="radiogroup"
              aria-label="Year type"
              className="segmented"
              onKeyDown={(event) => {
                if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                  event.preventDefault();
                  handleYearTypeChange(yearType === "financial" ? "calendar" : "financial");
                }
              }}
            >
              {([["financial", "Financial year"], ["calendar", "Calendar year"]] as const).map(([value, label]) => (
                <button key={value} type="button" role="radio" aria-checked={yearType === value} tabIndex={yearType === value ? 0 : -1} className="segmented-option" onClick={() => handleYearTypeChange(value)}>
                  {label}
                </button>
              ))}
            </div>
          </>
        }
      />
      {closed && !unlocked && (
        <div className="card-soft mt-4 flex flex-wrap items-center justify-between gap-3 p-4">
          <p>This year is closed. Amounts are read-only until you choose to edit it.</p>
          <button type="button" className="btn-ghost" onClick={() => setConfirmUnlock(true)}>Edit this year</button>
        </div>
      )}
      {error && <p role="alert" className="mt-4 text-[var(--color-destructive)]">{error}</p>}
      <div className="card-surface mt-6">
        <div className="flex items-center gap-3 border-b border-[var(--color-hairline)] px-4 py-1" aria-label="Expense category color legend">
          {CATEGORY_ORDER.map((category) => (
            <Link key={category} href={`/expenses/${category.toLowerCase()}`} className="flex min-h-11 items-center gap-1.5 text-sm hover:underline">
              <span className={`h-2 w-2 rounded-full ${CATEGORY_SURFACES[category]}`} aria-hidden="true" />
              <span className={CATEGORY_COLORS[category]}>{EXPENSE_CATEGORY_LABELS[category]}</span>
            </Link>
          ))}
        </div>
        <div className="overflow-x-auto rounded-b-[var(--radius-md)]">
          <table className="min-w-max w-full text-sm">
          <caption className="sr-only">Expenses by category, section, and month</caption>
          <thead><tr className="table-data-row border-b border-[var(--color-hairline)] bg-[var(--color-canvas-soft)]">
            <th className="table-header sticky left-0 z-20 w-3 bg-[var(--color-canvas-soft)] px-1 py-2.5 text-left">
              <span className="sr-only">Expense category</span>
            </th>
            <th className="table-header sticky left-3 z-20 min-w-52 bg-[var(--color-canvas-soft)] px-4 py-2.5 text-left">Section</th>
            {months.map((month) => <th key={month} className="table-header min-w-32 bg-[var(--color-canvas-soft)] px-4 py-2.5 text-right">{new Intl.DateTimeFormat("en-IN", { month: "short", timeZone: "UTC" }).format(new Date(`${month}T00:00:00Z`))}</th>)}
            <th className="table-header sticky right-0 z-20 min-w-36 bg-[var(--color-canvas-soft)] px-4 py-2.5 text-right">Total</th>
          </tr></thead>
          <tbody>{categoryGroups.flatMap(({ category, rows }) => rows.map((row, rowIndex) => (
            <tr key={row.id} className="table-data-row border-b border-[var(--color-hairline)]">
              {rowIndex === 0 && (
                <th scope="rowgroup" rowSpan={rows.length} className={`sticky left-0 z-10 w-3 px-1 py-3 text-left align-top ${CATEGORY_SURFACES[category]}`}>
                  <span className="sr-only">{EXPENSE_CATEGORY_LABELS[category]}</span>
                </th>
              )}
              <th scope="row" className="sticky left-3 z-10 bg-[var(--color-canvas)] px-4 py-3 text-left">
                {sectionUsesLineItems(row.section.id, lineItems) ? (
                  <Link href={`/expenses/${row.section.category.toLowerCase()}/${row.section.id}`} className="font-semibold hover:underline">
                    {row.name}
                  </Link>
                ) : row.name}
              </th>
              {months.map((month, index) => {
                const columnSurface = index % 2 === 0 ? "bg-[var(--color-canvas-soft)]" : "bg-[var(--color-canvas)]";
                if (sectionUsesLineItems(row.section.id, lineItems)) {
                  const monthEntries = entries.filter((entry) => entry.month === month);
                  const total = sectionAmount(row.section.id, month);
                  const hasEntry = monthEntries.some((entry) => entry.section_id === row.section.id);
                  return <td key={month} className={`numeric px-3 py-2 text-right font-semibold ${columnSurface}`}>{hasEntry ? formatCurrency(total) : ""}</td>;
                }
                const entry = entries.find((candidate) => candidate.month === month && candidate.section_id === row.section.id && candidate.line_item_id === null);
                const disabled = (!unlocked && closed) || !row.section.is_active || !isAvailableInMonth(row.section.created_at, month);
                return <td key={month} className={`px-2 py-1 ${columnSurface}`}><MonthlyAmount amount={entry ? Number(entry.amount) : null} disabled={disabled} accessibleName={`${row.name} for ${month}`} onSave={(value) => save(row.section.id, null, month, value)} /></td>;
              })}
              <td className="numeric sticky right-0 z-10 bg-[var(--color-canvas)] px-4 py-2 text-right font-semibold">{formatCurrency(sectionTotal(row.section.id))}</td>
            </tr>
          )))}</tbody>
          <tfoot><tr className="table-data-row border-t border-[var(--color-hairline)] bg-[var(--color-canvas-soft)] font-semibold">
            <th colSpan={2} scope="row" className="sticky left-0 z-10 bg-[var(--color-canvas-soft)] px-4 py-2.5 text-left">Total</th>
            {months.map((month) => <td key={month} className="numeric bg-[var(--color-canvas-soft)] px-4 py-2.5 text-right">{formatCurrency(monthTotal(month))}</td>)}
            <td className="numeric sticky right-0 z-10 bg-[var(--color-canvas-soft)] px-4 py-2.5 text-right">{formatCurrency(grandTotal)}</td>
          </tr></tfoot>
          </table>
        </div>
      </div>
      {confirmUnlock && <Modal title="Edit closed year" onClose={() => setConfirmUnlock(false)}><p>This year is closed — edit anyway?</p><div className="mt-6 flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => setConfirmUnlock(false)}>Cancel</button><button type="button" className="btn-primary" onClick={() => { setUnlocked(true); setConfirmUnlock(false); }}>Edit this year</button></div></Modal>}
    </main>
  );
}
