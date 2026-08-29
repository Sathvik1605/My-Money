import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { jsonError, unauthorized } from "@/lib/api-helpers";

// GET /api/year-grid?year=2025&yearType=financial|calendar
//
// Returns the §5.3 year grid: rows = months, columns = the caller's
// active + inactive cards that have any statement in the range, cells =
// total amount billed (sum of total_amount_due) for statements whose
// statement_date falls in that month. Row/column/grand totals included.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const yearParam = request.nextUrl.searchParams.get("year");
  const yearType = request.nextUrl.searchParams.get("yearType") === "calendar" ? "calendar" : "financial";

  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
  if (!Number.isFinite(year)) {
    return jsonError("Invalid year", 400);
  }

  // Financial Year (India, §4): Apr Y — Mar Y+1. Calendar Year: Jan Y — Dec Y.
  const rangeStart = yearType === "financial" ? new Date(Date.UTC(year, 3, 1)) : new Date(Date.UTC(year, 0, 1));
  const rangeEnd =
    yearType === "financial" ? new Date(Date.UTC(year + 1, 2, 31)) : new Date(Date.UTC(year, 11, 31));

  const startStr = rangeStart.toISOString().slice(0, 10);
  const endStr = rangeEnd.toISOString().slice(0, 10);

  const { data: cards, error: cardsError } = await supabase
    .from("cards")
    .select("id, nickname, is_active")
    .eq("user_id", user.id)
    .order("created_at");

  if (cardsError) return jsonError(cardsError.message, 500);

  const { data: statements, error: statementsError } = await supabase
    .from("statements")
    .select("card_id, statement_date, total_amount_due, cards!inner(user_id)")
    .eq("cards.user_id", user.id)
    .gte("statement_date", startStr)
    .lte("statement_date", endStr);

  if (statementsError) return jsonError(statementsError.message, 500);

  // Build the 12 month labels in range order.
  const months: { label: string; year: number; month: number }[] = [];
  const cursor = new Date(rangeStart);
  while (cursor <= rangeEnd) {
    months.push({
      label: cursor.toLocaleString("en-US", { month: "short", timeZone: "UTC" }) + " " + cursor.getUTCFullYear(),
      year: cursor.getUTCFullYear(),
      month: cursor.getUTCMonth(),
    });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  const cardIds = (cards ?? []).map((c) => c.id);
  const cardTotals: Record<string, number> = Object.fromEntries(cardIds.map((id) => [id, 0]));
  const grid = months.map((m) => {
    const row: Record<string, number> = Object.fromEntries(cardIds.map((id) => [id, 0]));
    for (const s of statements ?? []) {
      const d = new Date(s.statement_date + "T00:00:00Z");
      if (d.getUTCFullYear() === m.year && d.getUTCMonth() === m.month) {
        row[s.card_id] = (row[s.card_id] ?? 0) + Number(s.total_amount_due);
      }
    }
    const rowTotal = Object.values(row).reduce((a, b) => a + b, 0);
    for (const id of cardIds) cardTotals[id] += row[id] ?? 0;
    return { month: m.label, amounts: row, total: rowTotal };
  });

  const grandTotal = Object.values(cardTotals).reduce((a, b) => a + b, 0);

  return NextResponse.json({
    data: {
      year,
      yearType,
      rangeStart: startStr,
      rangeEnd: endStr,
      cards: cards ?? [],
      months: grid,
      cardTotals,
      grandTotal,
    },
  });
}
