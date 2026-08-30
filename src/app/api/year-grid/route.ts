import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { jsonError, unauthorized } from "@/lib/api-helpers";
import { buildYearGrid, cardsWithStatementsInPeriod, type GridStatement } from "@/lib/year-grid";

// GET /api/year-grid?year=2025&yearType=financial|calendar
//
// Returns the §5.3 year grid: rows = months, columns = the caller's
// active + closed cards that have a statement in the selected range, cells =
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
    .select("card_id, statement_date, total_amount_due, payment_date, historical_payment_confirmed, cards!inner(user_id)")
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

  const periodCards = cardsWithStatementsInPeriod(cards ?? [], statements ?? []);
  const cardIds = periodCards.map((card) => card.id);
  const { rows, cardTotals, grandTotal, unpaidTotal } = buildYearGrid(
    months,
    cardIds,
    (statements ?? []) as GridStatement[],
  );

  // Earliest recorded bill — the UI uses this to stop the user navigating to
  // years that can never contain data.
  const { data: earliest } = await supabase
    .from("statements")
    .select("statement_date, cards!inner(user_id)")
    .eq("cards.user_id", user.id)
    .order("statement_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  const earliestStatementDate = earliest?.statement_date ?? null;

  return NextResponse.json({
    data: {
      year,
      yearType,
      rangeStart: startStr,
      rangeEnd: endStr,
      earliestStatementDate,
      cards: periodCards,
      months: rows,
      cardTotals,
      grandTotal,
      unpaidTotal,
    },
  });
}
