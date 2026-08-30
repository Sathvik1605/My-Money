"use client";

import { useEffect, useState } from "react";
import { CardForm } from "@/components/CardForm";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { CreditCardIcon, PlusIcon } from "@/components/icons";
import { hasUnpaidStatements, type CardRow, type StatementRow } from "@/lib/client-types";

export default function CardsPage() {
  const [cards, setCards] = useState<CardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState<CardRow | null>(null);
  const [includeClosed, setIncludeClosed] = useState(false);
  const [closeBlockedCardName, setCloseBlockedCardName] = useState<string | null>(null);
  const [statements, setStatements] = useState<StatementRow[]>([]);
  const [cardPendingClose, setCardPendingClose] = useState<CardRow | null>(null);
  const [cardPendingDeletion, setCardPendingDeletion] = useState<CardRow | null>(null);

  async function loadCards() {
    setLoading(true);
    setError(null);
    try {
      const [cardsResponse, statementsResponse] = await Promise.all([
        fetch("/api/cards?includeInactive=true"),
        fetch("/api/statements"),
      ]);
      if (!cardsResponse.ok) throw new Error("Failed to load cards");
      const { data } = await cardsResponse.json();
      setCards(data);
      if (!statementsResponse.ok) throw new Error("Failed to load card bill history");
      const { data: statementData } = await statementsResponse.json();
      setStatements(statementData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional data fetch on mount
    loadCards();
  }, []);

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
    credit_limit: number;
    statement_day: number;
    due_day: number;
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
    if (hasUnpaidStatements(statements.filter((statement) => statement.card_id === card.id))) {
      setCloseBlockedCardName(card.nickname);
      return;
    }
    setError(null);
    const res = await fetch(`/api/cards/${card.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: false }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setCloseBlockedCardName(card.nickname);
      } else {
        setError(body.error ?? "Failed to close card");
      }
      return;
    }
    await loadCards();
  }

  async function handleReopen(card: CardRow) {
    const res = await fetch(`/api/cards/${card.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: true }),
    });
    if (res.ok) await loadCards();
  }

  async function handleDelete(card: CardRow) {
    setError(null);
    const res = await fetch(`/api/cards/${card.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm_delete: true }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to delete card");
      return;
    }
    setEditingCard(null);
    await loadCards();
  }

  // Filtering happens in memory so flipping the toggle is instant — no refetch,
  // no loading flash.
  const visibleCards = (includeClosed ? cards : cards.filter((c) => c.is_active)).toSorted(
    (a, b) => Number(b.is_active) - Number(a.is_active),
  );
  const closedCount = cards.length - cards.filter((c) => c.is_active).length;

  return (
    <main className="app-page mx-auto">
      <PageHeader
        title="Your Cards"
        description="Manage the credit cards you track bills for."
        actions={
          <>
            {closedCount > 0 && (
              <button
                type="button"
                role="switch"
                aria-checked={includeClosed}
                onClick={() => setIncludeClosed((v) => !v)}
                className="flex min-h-11 items-center gap-2.5 rounded-full px-1 text-sm text-[var(--color-text-muted)]"
              >
                <span className="switch" aria-hidden="true" data-state={includeClosed} />
                <span>
                  Show closed cards
                  <span className="numeric ml-1.5 opacity-70">({closedCount})</span>
                </span>
              </button>
            )}
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <PlusIcon />
              New card
            </button>
          </>
        }
      />

      {showForm && (
        <Modal title="Add new card" onClose={() => setShowForm(false)}>
          <CardForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </Modal>
      )}

      {editingCard && (
        <Modal title="Edit card" onClose={() => setEditingCard(null)}>
          <CardForm
            initial={editingCard}
            onSubmit={handleCardSubmit}
            onCancel={() => setEditingCard(null)}
            onDelete={() => setCardPendingDeletion(editingCard)}
          />
        </Modal>
      )}

      {closeBlockedCardName && (
        <Modal title="Card cannot be closed" onClose={() => setCloseBlockedCardName(null)}>
          <p role="alert" className="text-[var(--color-ink)]">
            {closeBlockedCardName} cannot be closed because bill payment is still pending. Mark every bill as paid before closing this card.
          </p>
          <div className="mt-6 flex justify-end">
            <button type="button" onClick={() => setCloseBlockedCardName(null)} className="btn-primary">
              Okay
            </button>
          </div>
        </Modal>
      )}

      {cardPendingClose && (
        <Modal title="Close card" onClose={() => setCardPendingClose(null)}>
          <p>
            Close {cardPendingClose.nickname}? Its paid bill history will remain available, but the card cannot receive new bills until reopened.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={() => setCardPendingClose(null)} className="btn-ghost">Cancel</button>
            <button
              type="button"
              onClick={async () => {
                const card = cardPendingClose;
                setCardPendingClose(null);
                await handleDeactivate(card);
              }}
              className="btn-primary"
            >
              Close card
            </button>
          </div>
        </Modal>
      )}

      {cardPendingDeletion && (
        <Modal title="Delete card permanently" onClose={() => setCardPendingDeletion(null)}>
          <p role="alert">
            Delete {cardPendingDeletion.nickname} and all of its bills permanently? This cannot be undone.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={() => setCardPendingDeletion(null)} className="btn-ghost">Cancel</button>
            <button
              type="button"
              onClick={async () => {
                const card = cardPendingDeletion;
                setCardPendingDeletion(null);
                await handleDelete(card);
              }}
              className="btn-destructive"
            >
              Delete permanently
            </button>
          </div>
        </Modal>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-[var(--color-destructive)]">
          {error}
        </p>
      )}

      {loading && <p className="mt-6 text-sm text-[var(--color-text-muted)]">Loading…</p>}

      {!loading && visibleCards.length === 0 && (
        <div className="card-surface mt-6 p-8 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">
            No cards yet — add your first one with the New card button.
          </p>
        </div>
      )}

      {!loading && visibleCards.length > 0 && (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleCards.map((card) => (
            <li key={card.id} className={`card-surface p-4 ${card.is_active ? "" : "opacity-65"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="squircle mt-0.5 grid h-9 w-9 shrink-0 place-items-center bg-[var(--color-canvas-soft)] text-[var(--color-ink)]">
                    <CreditCardIcon />
                  </span>
                  <div>
                    <p className="font-semibold">{card.nickname}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {card.bank_name} · {card.network} · <span className="numeric">•••• {card.last4_digits}</span>
                    </p>
                  </div>
                </div>
                {!card.is_active && (
                  <span className="rounded-full border border-[var(--color-hairline)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]">
                    Closed
                  </span>
                )}
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-y-1.5 border-t border-[var(--color-hairline)] pt-3 text-xs">
                <dt className="text-[var(--color-text-muted)]">Credit limit</dt>
                <dd className="numeric text-right">₹{card.credit_limit.toLocaleString("en-IN")}</dd>
                <dt className="text-[var(--color-text-muted)]">Statement day</dt>
                <dd className="numeric text-right">{card.statement_day}</dd>
                <dt className="text-[var(--color-text-muted)]">Due date</dt>
                <dd className="numeric text-right">{card.due_day}</dd>
              </dl>

              <div className="mt-3 flex gap-2">
                {card.is_active ? (
                  <>
                    <button
                     onClick={() => {
                       setShowForm(false);
                       setEditingCard(card);
                     }}
                     className="btn-ghost min-h-9 px-3 text-xs"
                    >
                     Edit
                    </button>
                    <button
                     onClick={() => {
                       if (hasUnpaidStatements(statements.filter((statement) => statement.card_id === card.id))) {
                         setCloseBlockedCardName(card.nickname);
                       } else {
                         setCardPendingClose(card);
                       }
                     }}
                     className="btn-ghost min-h-9 px-3 text-xs text-[var(--color-destructive)]"
                    >
                      Close card
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleReopen(card)}
                    className="btn-ghost min-h-9 px-3 text-xs text-[var(--color-accent)]"
                  >
                    Reopen card
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
