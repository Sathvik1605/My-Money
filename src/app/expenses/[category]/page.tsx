"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/Modal";
import { MonthlyAmount } from "@/components/MonthlyAmount";
import { PageHeader } from "@/components/PageHeader";
import { DragHandleIcon, TrashIcon } from "@/components/icons";
import {
  amountForSection,
  EXPENSE_CATEGORY_LABELS,
  isAvailableInMonth,
  sectionUsesLineItems,
} from "@/lib/expense-grid";
import type { ExpenseCategory, ExpenseEntryRow, ExpenseLineItemRow, ExpenseSectionRow } from "@/lib/client-types";

const categories = new Set<ExpenseCategory>(["Need", "Want", "Investment"]);
const categoryColors: Record<ExpenseCategory, string> = {
  Investment: "text-[var(--color-expense-investment)]",
  Need: "text-[var(--color-expense-need)]",
  Want: "text-[var(--color-expense-want)]",
};

function currentMonth() {
  return new Date().toISOString().slice(0, 7) + "-01";
}

export default function ExpenseCategoryPage() {
  const { category: rawCategory } = useParams<{ category: string }>();
  const category = `${rawCategory.slice(0, 1).toUpperCase()}${rawCategory.slice(1)}` as ExpenseCategory;
  const [sections, setSections] = useState<ExpenseSectionRow[]>([]);
  const [lineItems, setLineItems] = useState<ExpenseLineItemRow[]>([]);
  const [entries, setEntries] = useState<ExpenseEntryRow[]>([]);
  const [adding, setAdding] = useState(false);
  const [deletingSections, setDeletingSections] = useState(false);
  const [reorderingSections, setReorderingSections] = useState(false);
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const [draggedOverSectionId, setDraggedOverSectionId] = useState<string | null>(null);
  const [sectionPendingDeletion, setSectionPendingDeletion] = useState<ExpenseSectionRow | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const month = useMemo(() => currentMonth(), []);

  async function load() {
    const response = await fetch(`/api/expenses?month=${month}`);
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Unable to load expenses");
    setSections(body.data.sections);
    setLineItems(body.data.lineItems);
    setEntries(body.data.entries);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial API load
    void load().catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load expenses"));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- this initial load is intentionally one-time
  }, []);

  async function save(sectionId: string, amount: number) {
    const response = await fetch("/api/expenses", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section_id: sectionId, line_item_id: null, month, amount }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Unable to save amount");
    await load();
  }

  async function addSection(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/expenses/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, name }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? "Unable to add section");
      return;
    }

    setAdding(false);
    setName("");
    await load();
  }

  async function deleteSection() {
    if (!sectionPendingDeletion) return;
    const response = await fetch(`/api/expenses/sections/${sectionPendingDeletion.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm_delete: true }),
    });
    if (!response.ok) {
      const body = await response.json();
      setError(body.error ?? "Unable to delete section");
      return;
    }

    setSectionPendingDeletion(null);
    await load();
  }

  if (!categories.has(category)) return null;
  const visibleSections = sections.filter((section) =>
    section.category === category &&
    isAvailableInMonth(section.created_at, month) &&
    (section.is_active || entries.some((entry) => entry.section_id === section.id)),
  ).sort((first, second) => (first.sort_order ?? 0) - (second.sort_order ?? 0));

  async function reorderSections(nextSections: ExpenseSectionRow[]) {
    setSections((current) => {
      const positions = new Map(nextSections.map((section, index) => [section.id, index]));
      return current.map((section) => positions.has(section.id) ? { ...section, sort_order: positions.get(section.id)! } : section);
    });
    const responses = await Promise.all(nextSections.map((section, index) => fetch(`/api/expenses/sections/${section.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sort_order: index }),
    })));
    if (responses.some((response) => !response.ok)) {
      setError("Unable to save section order");
      await load();
    }
  }

  function moveSection(section: ExpenseSectionRow, direction: -1 | 1) {
    const index = visibleSections.findIndex((candidate) => candidate.id === section.id);
    const target = index + direction;
    if (target < 0 || target >= visibleSections.length) return;
    const next = [...visibleSections];
    [next[index], next[target]] = [next[target], next[index]];
    void reorderSections(next);
  }

  function previewSectionOrder(targetSectionId: string) {
    if (!draggedSectionId || draggedSectionId === targetSectionId) return;
    const dragged = visibleSections.find((section) => section.id === draggedSectionId);
    if (!dragged) return;
    const next = visibleSections.filter((section) => section.id !== dragged.id);
    next.splice(next.findIndex((section) => section.id === targetSectionId), 0, dragged);
    setSections((current) => {
      const positions = new Map(next.map((section, index) => [section.id, index]));
      return current.map((section) => positions.has(section.id) ? { ...section, sort_order: positions.get(section.id)! } : section);
    });
    setDraggedOverSectionId(targetSectionId);
  }

  return (
    <main className="app-page mx-auto">
      <PageHeader
        title={EXPENSE_CATEGORY_LABELS[category]}
        titleClassName={categoryColors[category]}
        description={`Enter amounts for ${new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}T00:00:00Z`))}.`}
        actions={<Link className="btn-ghost" href="/expenses">Back to all categories</Link>}
      />
      {error && <p role="alert" className="mt-4 text-[var(--color-destructive)]">{error}</p>}
      <ul className="card-surface mt-6 divide-y divide-[var(--color-hairline)]">
        {visibleSections.map((section) => {
          const usesLineItems = sectionUsesLineItems(section.id, lineItems);
          const amount = amountForSection(section.id, entries, lineItems);
          return (
            <li key={section.id} className={`flex min-h-16 items-center justify-between gap-4 px-5 py-3 transition-[transform,opacity] duration-[var(--duration-reorder)] ease-out ${draggedSectionId === section.id ? "opacity-50" : ""} ${draggedOverSectionId === section.id ? "translate-y-1" : ""}`} draggable={reorderingSections} onDragStart={() => setDraggedSectionId(section.id)} onDragOver={(event) => { if (reorderingSections) { event.preventDefault(); previewSectionOrder(section.id); } }} onDragEnd={() => { setDraggedSectionId(null); setDraggedOverSectionId(null); }} onDrop={() => { if (!draggedSectionId) return; void reorderSections(visibleSections); setDraggedSectionId(null); setDraggedOverSectionId(null); }}>
              <span className={`overflow-hidden transition-[width,opacity] duration-[var(--duration-reorder)] ease-out ${reorderingSections ? "w-11 opacity-100" : "w-0 opacity-0"}`}>
                <button
                  type="button"
                  className="btn-ghost h-11 w-11 shrink-0 border-0 px-0 text-[var(--color-text-muted)]"
                  aria-label={`Reorder ${section.name}; use Arrow Up or Arrow Down to move`}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                      event.preventDefault();
                      moveSection(section, event.key === "ArrowUp" ? -1 : 1);
                    }
                  }}
                >
                  <DragHandleIcon className="h-5 w-5" />
                </button>
              </span>
              {usesLineItems ? (
                <Link href={{ pathname: `/expenses/${rawCategory}/${section.id}`, query: { title: section.name } }} className="min-h-11 flex-1 py-2 font-semibold hover:underline">
                  {section.name}
                </Link>
              ) : (
                <Link href={{ pathname: `/expenses/${rawCategory}/${section.id}`, query: { title: section.name } }} className="min-h-11 flex-1 py-2 font-semibold hover:underline">
                  {section.name}
                </Link>
              )}
              {usesLineItems
                ? <span className="numeric font-semibold">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount)}</span>
                : <MonthlyAmount amount={amount} disabled={!section.is_active} accessibleName={`${section.name} for ${month}`} onSave={(next) => save(section.id, next)} />}
              <span className={`overflow-hidden transition-[width,opacity] duration-[var(--duration-standard)] ease-out ${deletingSections ? "w-11 opacity-100" : "w-0 opacity-0"}`}>
                <button
                  type="button"
                  className="btn-ghost h-11 w-11 shrink-0 border-0 px-0 !text-[var(--color-destructive)]"
                  onClick={() => setSectionPendingDeletion(section)}
                  aria-label={`Delete ${section.name}`}
                >
                  <TrashIcon />
                </button>
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex items-center justify-between gap-3">
        <button type="button" className="btn-ghost" onClick={() => setAdding(true)}>Add Sub category</button>
        <div className="flex gap-2">
          <button type="button" className="btn-ghost" onClick={() => { setReorderingSections((current) => !current); setDeletingSections(false); }} aria-pressed={reorderingSections}>{reorderingSections ? "Done reordering" : "Reorder Sub category"}</button>
          <button type="button" className={`btn-ghost ${deletingSections ? "text-[var(--color-destructive)]" : ""}`} onClick={() => { setDeletingSections((current) => !current); setReorderingSections(false); }} aria-pressed={deletingSections}>{deletingSections ? "Done deleting" : "Delete Sub category"}</button>
        </div>
      </div>
      {adding && (
        <Modal title={`Add ${category} Sub category`} onClose={() => setAdding(false)}>
          <form onSubmit={addSection}>
            <label className="label" htmlFor="section-name">Sub category name</label>
            <input id="section-name" className="input mt-2" value={name} onChange={(event) => setName(event.target.value)} />
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
              <button className="btn-primary" type="submit">Add Sub category</button>
            </div>
          </form>
        </Modal>
      )}
      {sectionPendingDeletion && (
        <Modal title="Delete Sub category" onClose={() => setSectionPendingDeletion(null)}>
          <p role="alert">
            Delete {sectionPendingDeletion.name} and all of its line items and monthly entries permanently? This cannot be undone.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setSectionPendingDeletion(null)}>Cancel</button>
            <button type="button" className="btn-destructive" onClick={() => void deleteSection()}>Delete permanently</button>
          </div>
        </Modal>
      )}
    </main>
  );
}
