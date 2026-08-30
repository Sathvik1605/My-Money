import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { statementInputSchema } from "@/lib/validation/schemas";
import { jsonError, unauthorized } from "@/lib/api-helpers";
import { assertOwnsCard } from "@/lib/ownership";
import { dueDateForStatement, isWithinCreditLimit } from "@/lib/card-rules";

// GET /api/statements — list statements for the caller's cards.
// Query params: ?card_id=... (optional filter), ?year=2025&yearType=financial|calendar
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const cardId = request.nextUrl.searchParams.get("card_id");

  if (cardId) {
    const owns = await assertOwnsCard(supabase, cardId, user.id);
    if (!owns) return jsonError("Card not found", 404);
  }

  // Scope to the caller's own cards via an inner join, regardless of filter,
  // so this never leaks another user's statements even if RLS were bypassed.
  let query = supabase
    .from("statements")
    .select("*, cards!inner(id, user_id, nickname)")
    .eq("cards.user_id", user.id)
    .order("cycle_start_date", { ascending: false });

  if (cardId) {
    query = query.eq("card_id", cardId);
  }

  const { data, error } = await query;
  if (error) return jsonError(error.message, 500);

  return NextResponse.json({ data });
}

// POST /api/statements — create a new bill/statement entry for one of the
// caller's cards (§5.2). One entry per card per billing cycle is enforced
// by a unique DB constraint on (card_id, cycle_start_date).
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = statementInputSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid statement data", 400, parsed.error.flatten());
  }

  const { data: card, error: cardError } = await supabase
    .from("cards")
    .select("credit_limit, due_day, is_active")
    .eq("id", parsed.data.card_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (cardError) return jsonError(cardError.message, 500);
  if (!card) return jsonError("Card not found", 404);
  if (!card.is_active) return jsonError("Closed cards cannot receive new bills.", 409);
  if (!isWithinCreditLimit(parsed.data.total_amount_due, Number(card.credit_limit))) {
    return jsonError("Total amount due cannot exceed this card's credit limit.", 400);
  }

  const statementDate = parsed.data.statement_date;

  const { data, error } = await supabase
    .from("statements")
    .insert({
      ...parsed.data,
      cycle_start_date: statementDate,
      cycle_end_date: statementDate,
      due_date: dueDateForStatement(statementDate, card.due_day),
      payment_date: null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return jsonError("A statement already exists for this card and cycle start date", 409);
    }
    return jsonError(error.message, 500);
  }

  return NextResponse.json({ data }, { status: 201 });
}
