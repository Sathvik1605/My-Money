"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/Modal";
import { MonthlyAmount } from "@/components/MonthlyAmount";
import { PageHeader } from "@/components/PageHeader";
import { Select } from "@/components/Select";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { formatCurrency } from "@/lib/client-types";
import type { MonthlyIncomeRow } from "@/lib/client-types";

type YearType = "financial" | "calendar";

function periodMonths(year: number, yearType: YearType) {
  const start = yearType === "financial" ? 3 : 0;
  return Array.from({ length: 12 }, (_, index) => new Date(Date.UTC(year, start + index, 1)).toISOString().slice(0, 10));
}

function periodIsClosed(months: string[]) {
  return months[11] < `${new Date().toISOString().slice(0, 7)}-01`;
}

export default function IncomePage() {
  const now = new Date();
  const [yearType, setYearType] = useState<YearType>("calendar");
  const [year, setYear] = useState(now.getFullYear());
  const [income, setIncome] = useState<MonthlyIncomeRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [confirmUnlock, setConfirmUnlock] = useState(false);
  const months = useMemo(() => periodMonths(year, yearType), [year, yearType]);
  const closed = periodIsClosed(months);
  const selectableYears = Array.from({ length: 11 }, (_, index) => now.getFullYear() - index);
  const minYear = selectableYears[selectableYears.length - 1];
  const maxYear = selectableYears[0];

  function handleYearTypeChange(nextYearType: YearType) {
    if (yearType === "financial" && nextYearType === "calendar") setYear((financialYearStart) => Math.min(financialYearStart + 1, now.getFullYear()));
    if (yearType === "calendar" && nextYearType === "financial") setYear((calendarYear) => calendarYear - 1);
    setYearType(nextYearType);
    setUnlocked(false);
  }

  async function load() {
    const response = await fetch("/api/income");
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Unable to load income");
    setIncome(body.data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial API load
    void load().catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load income"));
  }, []);

  async function save(month: string, amount: number) {
    const response = await fetch("/api/income", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ month, amount, unlock_closed_year: unlocked }) });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Unable to save income");
    await load();
  }

  const total = months.reduce((sum, month) => sum + Number(income.find((row) => row.month === month)?.amount ?? 0), 0);

  return <main className="app-page mx-auto">
    <PageHeader title="Income" description="Record monthly income in a yearly view." actions={<><div className="flex items-center gap-1"><button type="button" onClick={() => { setYear((value) => value - 1); setUnlocked(false); }} disabled={year <= minYear} className="btn-ghost w-11 px-0 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Previous year"><ChevronLeftIcon /></button><Select value={year} onChange={(nextYear) => { setYear(nextYear); setUnlocked(false); }} ariaLabel="Select income year" className="year-select w-36" options={selectableYears.map((option) => ({ value: option, label: yearType === "financial" ? `${option}-${option + 1}` : String(option) }))} /><button type="button" onClick={() => { setYear((value) => value + 1); setUnlocked(false); }} disabled={year >= maxYear} className="btn-ghost w-11 px-0 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Next year"><ChevronRightIcon /></button></div><div role="radiogroup" aria-label="Year type" className="segmented" onKeyDown={(event) => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); handleYearTypeChange(yearType === "financial" ? "calendar" : "financial"); } }}>{(["financial", "calendar"] as const).map((type) => <button key={type} type="button" role="radio" aria-checked={type === yearType} tabIndex={type === yearType ? 0 : -1} className="segmented-option" onClick={() => handleYearTypeChange(type)}>{type === "financial" ? "Financial year" : "Calendar year"}</button>)}</div></>} />
    {closed && !unlocked && <div className="card-soft mt-4 flex flex-wrap items-center justify-between gap-3 p-4"><p>This year is closed. Income is read-only until you choose to edit it.</p><button type="button" className="btn-ghost" onClick={() => setConfirmUnlock(true)}>Edit this year</button></div>}
    {error && <p role="alert" className="mt-4 text-[var(--color-destructive)]">{error}</p>}
    <div className="card-surface mt-6 w-full max-w-[calc(var(--space-section)*6)] overflow-hidden"><table className="w-full text-sm"><caption className="sr-only">Income by month</caption><thead><tr className="table-data-row border-b border-[var(--color-hairline)] bg-[var(--color-canvas-soft)]"><th className="table-header px-4 py-2.5 text-left">Month</th><th className="table-header px-4 py-2.5 text-right">Income</th></tr></thead><tbody>{months.map((month) => { const row = income.find((candidate) => candidate.month === month); return <tr key={month} className="table-data-row border-b border-[var(--color-hairline)]"><th scope="row" className="px-4 py-0 text-left font-semibold">{new Intl.DateTimeFormat("en-IN", { month: "long", timeZone: "UTC" }).format(new Date(`${month}T00:00:00Z`))}</th><td className="px-2 py-0 text-right"><MonthlyAmount amount={row ? Number(row.amount) : null} disabled={closed && !unlocked} accessibleName={`Income for ${month}`} onSave={(amount) => save(month, amount)} /></td></tr>; })}</tbody><tfoot><tr className="table-data-row border-t border-[var(--color-hairline)] bg-[var(--color-canvas-soft)] font-semibold"><th scope="row" className="px-4 py-0 text-left">Total income</th><td className="numeric px-4 py-0 text-right">{formatCurrency(total)}</td></tr></tfoot></table></div>
    {confirmUnlock && <Modal title="Edit closed year" onClose={() => setConfirmUnlock(false)}><p>This year is closed — edit anyway?</p><div className="mt-6 flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => setConfirmUnlock(false)}>Cancel</button><button type="button" className="btn-primary" onClick={() => { setUnlocked(true); setConfirmUnlock(false); }}>Edit this year</button></div></Modal>}
  </main>;
}
