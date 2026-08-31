"use client";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { MonthlyAmount } from "@/components/MonthlyAmount";
import { PageHeader } from "@/components/PageHeader";
import { TrashIcon } from "@/components/icons";
import type { ExpenseCategory, ExpenseEntryRow, ExpenseLineItemRow, ExpenseSectionRow } from "@/lib/client-types";

const month = new Date().toISOString().slice(0, 7) + "-01";
const categoryColors: Record<ExpenseCategory, string> = {
  Investment: "text-[var(--color-expense-investment)]",
  Need: "text-[var(--color-expense-need)]",
  Want: "text-[var(--color-expense-want)]",
};
const categoryRouteColors: Record<string, string> = {
  investments: categoryColors.Investment,
  needs: categoryColors.Need,
  wants: categoryColors.Want,
};
export default function ExpenseSectionPage() {
  const { category, sectionId } = useParams<{ category: string; sectionId: string }>();
  const searchParams = useSearchParams();
  return <ExpenseSectionContent key={sectionId} category={category} sectionId={sectionId} initialTitle={searchParams.get("title")} />;
}

function ExpenseSectionContent({ category, sectionId, initialTitle }: { category: string; sectionId: string; initialTitle: string | null }) {
  const [section, setSection] = useState<ExpenseSectionRow | null>(null);
  const [items, setItems] = useState<ExpenseLineItemRow[]>([]);
  const [entries, setEntries] = useState<ExpenseEntryRow[]>([]);
  const [adding, setAdding] = useState(false);
  const [deletingItems, setDeletingItems] = useState(false);
  const [itemPendingDeletion, setItemPendingDeletion] = useState<ExpenseLineItemRow | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const displayTitle = section?.name ?? initialTitle;

  const load = useCallback(async () => {
    const response = await fetch(`/api/expenses?month=${month}`);
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Unable to load section");
    setSection(body.data.sections.find((candidate: ExpenseSectionRow) => candidate.id === sectionId) ?? null);
    setItems(body.data.lineItems.filter((candidate: ExpenseLineItemRow) => candidate.section_id === sectionId));
    setEntries(body.data.entries);
  }, [sectionId]);
  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial API load
    void load()
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Unable to load section"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [load]);

  async function save(lineItemId: string, amount: number) {
    const response = await fetch("/api/expenses", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section_id: sectionId, line_item_id: lineItemId, month, amount }) });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Unable to save amount");
    await load();
  }
  async function addLineItem(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/expenses/line-items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section_id: sectionId, name }) });
    const body = await response.json();
    if (!response.ok) { setError(body.error ?? "Unable to add line item"); return; }
    setName(""); setAdding(false); await load();
  }
  async function deleteLineItem() {
    if (!itemPendingDeletion) return;
    const response = await fetch(`/api/expenses/line-items/${itemPendingDeletion.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm_delete: true }),
    });
    if (!response.ok) {
      const body = await response.json();
      setError(body.error ?? "Unable to delete line item");
      return;
    }
    setItemPendingDeletion(null);
    await load();
  }

  return <main className="app-page mx-auto">
    <div className="content-compact">
    {displayTitle
      ? <PageHeader title={displayTitle} titleClassName={section ? categoryColors[section.category] : categoryRouteColors[category]} description={`Enter line-item amounts for ${new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}T00:00:00Z`))}.`} actions={<Link className="btn-ghost" href={`/expenses/${category}`}>Back to {section?.category ?? category}</Link>} />
      : loading && <p role="status" aria-live="polite" aria-busy="true" className="sr-only">Loading category details</p>}
    {error && <p role="alert" className="mt-4 text-[var(--color-destructive)]">{error}</p>}
    <ul className="card-surface table-compact mt-6 divide-y divide-[var(--color-hairline)]">{items.map((item) => { const entry = entries.find((candidate) => candidate.line_item_id === item.id); return <li key={item.id} className="flex min-h-16 items-center justify-between gap-4 px-5 py-3"><span className="flex-1 font-semibold">{item.name}</span><MonthlyAmount amount={entry ? Number(entry.amount) : null} disabled={!item.is_active} accessibleName={`${item.name} for ${month}`} onSave={(amount) => save(item.id, amount)} /><span className={`overflow-hidden transition-[width,opacity] duration-[var(--duration-standard)] ease-out ${deletingItems ? "w-11 opacity-100" : "w-0 opacity-0"}`}><button type="button" className="btn-ghost h-11 w-11 shrink-0 border-0 px-0 !text-[var(--color-destructive)]" onClick={() => setItemPendingDeletion(item)} aria-label={`Delete ${item.name}`}><TrashIcon /></button></span></li>; })}</ul>
    <div className="mt-4 flex items-center justify-between gap-3">
      <button type="button" className="btn-ghost" onClick={() => setAdding(true)}>Add line item</button>
      <button type="button" className={`btn-ghost ${deletingItems ? "text-[var(--color-destructive)]" : ""}`} onClick={() => setDeletingItems((current) => !current)} aria-pressed={deletingItems}>{deletingItems ? "Done deleting" : "Delete items"}</button>
    </div>
    </div>
    {adding && <Modal title="Add line item" onClose={() => setAdding(false)}><form onSubmit={addLineItem}><label className="label" htmlFor="line-item-name">Line item name</label><input id="line-item-name" className="input mt-2" value={name} onChange={(event) => setName(event.target.value)} /><div className="mt-6 flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => setAdding(false)}>Cancel</button><button type="submit" className="btn-primary">Add line item</button></div></form></Modal>}
    {itemPendingDeletion && <Modal title="Delete line item" onClose={() => setItemPendingDeletion(null)}><p role="alert">Delete {itemPendingDeletion.name} and its monthly entries permanently? This cannot be undone.</p><div className="mt-6 flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => setItemPendingDeletion(null)}>Cancel</button><button type="button" className="btn-destructive" onClick={() => void deleteLineItem()}>Delete permanently</button></div></Modal>}
  </main>;
}
