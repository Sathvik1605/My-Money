"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Select } from "@/components/Select";
import { ScrollableTable } from "@/components/ScrollableTable";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { formatCurrency } from "@/lib/client-types";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/expense-grid";
import type { ExpenseSummaryRow } from "@/lib/expense-grid";

type YearType = "financial" | "calendar";
const CATEGORY_HEADER_CLASSES: Record<string, string> = {
  Need: "text-[var(--color-expense-need)]",
  Want: "text-[var(--color-expense-want)]",
  Investment: "text-[var(--color-expense-investment)]",
};

export default function ExpensesSummaryPage() {
  const now = new Date();
  const [yearType, setYearType] = useState<YearType>("financial");
  const [year, setYear] = useState(now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear());
  const [rows, setRows] = useState<ExpenseSummaryRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const years = Array.from({ length: 11 }, (_, index) => now.getFullYear() - index);
  const minYear = years[years.length - 1];
  const maxYear = years[0];
  function handleYearTypeChange(nextYearType: YearType) {
    if (yearType === "financial" && nextYearType === "calendar") {
      setYear((financialYearStart) => Math.min(financialYearStart + 1, now.getFullYear()));
    }
    if (yearType === "calendar" && nextYearType === "financial") {
      setYear((calendarYear) => calendarYear - 1);
    }
    setYearType(nextYearType);
  }
  useEffect(() => {
    fetch(`/api/expenses/summary?year=${year}&yearType=${yearType}`)
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Unable to load summary");
        return body.data.months;
      })
      .then(setRows)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load summary"));
  }, [year, yearType]);
  const total = (key: keyof ExpenseSummaryRow) => rows.reduce((sum, row) => sum + Number(row[key] ?? 0), 0);

  return <main className="app-page mx-auto">
    <PageHeader title="Expense Summary" description="Yearly spending and income by category." actions={<><div className="flex items-center gap-1"><button type="button" onClick={() => setYear((value) => value - 1)} disabled={year <= minYear} className="btn-ghost w-11 px-0 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Previous year"><ChevronLeftIcon /></button><Select value={year} onChange={setYear} ariaLabel="Select summary year" className="year-select w-auto min-w-36" options={years.map((option) => ({ value: option, label: yearType === "financial" ? `${option}-${option + 1}` : String(option) }))} /><button type="button" onClick={() => setYear((value) => value + 1)} disabled={year >= maxYear} className="btn-ghost w-11 px-0 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Next year"><ChevronRightIcon /></button></div><div role="radiogroup" aria-label="Year type" className="segmented" onKeyDown={(event) => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); handleYearTypeChange(yearType === "financial" ? "calendar" : "financial"); } }}>{(["financial", "calendar"] as const).map((type) => <button key={type} type="button" role="radio" aria-checked={type === yearType} tabIndex={type === yearType ? 0 : -1} className="segmented-option" onClick={() => handleYearTypeChange(type)}>{type === "financial" ? "Financial year" : "Calendar year"}</button>)}</div></>} />
    {error && <p role="alert" className="mt-4 text-[var(--color-destructive)]">{error}</p>}
    <ScrollableTable className="card-surface mt-6"><table className="min-w-[980px] w-full table-fixed text-sm"><caption className="sr-only">Expense summary by month</caption><thead><tr className="table-data-row border-b border-[var(--color-hairline)] bg-[var(--color-canvas-soft)]">{["Month", "Need", "Want", "Investment", "Total", "Income", "% of income used"].map((header) => <th key={header} className={`table-header w-1/7 px-4 py-3 text-right first:text-left ${CATEGORY_HEADER_CLASSES[header] ?? ""}`}>{header in CATEGORY_HEADER_CLASSES ? EXPENSE_CATEGORY_LABELS[header as keyof typeof EXPENSE_CATEGORY_LABELS] : header}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.month} className="table-data-row border-b border-[var(--color-hairline)]"><th scope="row" className="w-1/7 px-4 py-3 text-left">{new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${row.month}T00:00:00Z`))}</th>{(["Need", "Want", "Investment", "total", "income"] as const).map((key) => <td key={key} className="numeric w-1/7 px-4 py-3 text-right">{formatCurrency(Number(row[key]))}</td>)}<td className="numeric w-1/7 px-4 py-3 text-right">{row.incomeUsedPercent === null ? "—" : `${row.incomeUsedPercent.toFixed(1)}%`}</td></tr>)}</tbody><tfoot><tr className="table-data-row bg-[var(--color-canvas-soft)] font-semibold"><th className="w-1/7 px-4 py-3 text-left">Total</th>{(["Need", "Want", "Investment", "total", "income"] as const).map((key) => <td key={key} className="numeric w-1/7 px-4 py-3 text-right">{formatCurrency(total(key))}</td>)}<td className="w-1/7" /></tr></tfoot></table></ScrollableTable>
  </main>;
}
