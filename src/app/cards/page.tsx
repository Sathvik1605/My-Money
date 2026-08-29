"use client";

import { useEffect, useState } from "react";
import { CardForm } from "@/components/CardForm";
import type { CardRow } from "@/lib/client-types";

export default function CardsPage() {
  const [cards, setCards] = useState<CardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState<CardRow | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  async function loadCards() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cards?includeInactive=${includeInactive}`);
      if (!res.ok) throw new Error("Failed to load cards");
      const { data } = await res.json();
      setCards(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional data fetch on mount/filter change
    loadCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeInactive]);

  async function handleCreate(values: Parameters<typeof handleCardSubmit>[0]) {
    const res = await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Failed to create card");
    }
    setShowForm(false);
    await loadCards();
  }

  async function handleCardSubmit(values: {
    nickname: string;
    bank_name: string;
    network: CardRow["network"];
    last4_digits: string;
    credit_limit: number | null;
    billing_cycle_start_day: number;
    statement_day: number;
    typical_due_days_after_statement: number;
  }) {
    if (!editingCard) return;
    const res = await fetch(`/api/cards/${editingCard.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Failed to update card");
    }
    setEditingCard(null);
    await loadCards();
  }

  async function handleDeactivate(card: CardRow) {
    if (!confirm(`Deactivate "${card.nickname}"? Its bill history will be kept.`)) return;
    const res = await fetch(`/api/cards/${card.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: false }),
    });
    if (res.ok) await loadCards();
  }

  async function handleReactivate(card: CardRow) {
    const res = await fetch(`/api/cards/${card.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: true }),
    });
    if (res.ok) await loadCards();
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Your Cards</h1>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            Show deactivated
          </label>
          {!showForm && !editingCard && (
            <button
              onClick={() => setShowForm(true)}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              + Add card
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="mt-4">
          <CardForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {editingCard && (
        <div className="mt-4">
          <CardForm initial={editingCard} onSubmit={handleCardSubmit} onCancel={() => setEditingCard(null)} />
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading && <p className="text-sm text-gray-500">Loading…</p>}
        {!loading && cards.length === 0 && (
          <p className="text-sm text-gray-500">No cards yet — add your first one above.</p>
        )}
        {cards.map((card) => (
          <div
            key={card.id}
            className={`rounded-lg border bg-white p-4 shadow-sm ${
              card.is_active ? "border-gray-200" : "border-gray-200 opacity-60"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">{card.nickname}</p>
                <p className="text-sm text-gray-500">
                  {card.bank_name} · {card.network} · •••• {card.last4_digits}
                </p>
              </div>
              {!card.is_active && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">Inactive</span>
              )}
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-1 text-xs text-gray-500">
              <dt>Cycle start day</dt>
              <dd className="text-right">{card.billing_cycle_start_day}</dd>
              <dt>Statement day</dt>
              <dd className="text-right">{card.statement_day}</dd>
              <dt>Due (days after stmt)</dt>
              <dd className="text-right">{card.typical_due_days_after_statement}</dd>
              {card.credit_limit != null && (
                <>
                  <dt>Credit limit</dt>
                  <dd className="text-right">₹{card.credit_limit.toLocaleString("en-IN")}</dd>
                </>
              )}
            </dl>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingCard(card);
                }}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
              >
                Edit
              </button>
              {card.is_active ? (
                <button
                  onClick={() => handleDeactivate(card)}
                  className="text-xs font-medium text-red-600 hover:text-red-500"
                >
                  Deactivate
                </button>
              ) : (
                <button
                  onClick={() => handleReactivate(card)}
                  className="text-xs font-medium text-green-600 hover:text-green-500"
                >
                  Reactivate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
