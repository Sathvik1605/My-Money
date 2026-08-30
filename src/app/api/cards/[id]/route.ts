import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cardDeleteSchema, cardUpdateSchema } from "@/lib/validation/schemas";
import { jsonError, notFound, unauthorized } from "@/lib/api-helpers";
import { hasUnpaidStatements } from "@/lib/client-types";

type Params = { params: Promise<{ id: string }> };

// GET /api/cards/:id
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  // Ownership is checked explicitly here (not just relied on via RLS) —
  // see §11: every route must check both auth AND ownership.
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return jsonError(error.message, 500);
  if (!data) return notFound("Card");

  return NextResponse.json({ data });
}

// PATCH /api/cards/:id — edit an active card, close it, or reopen a closed card.
// Cards are never hard-deleted so statement history stays intact (§5.1).
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = cardUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid card data", 400, parsed.error.flatten());
  }

  const { data: existingCard, error: existingCardError } = await supabase
    .from("cards")
    .select("is_active")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existingCardError) return jsonError(existingCardError.message, 500);
  if (!existingCard) return notFound("Card");

  if (!existingCard.is_active) {
    const canReopen = parsed.data.is_active === true && Object.keys(parsed.data).length === 1;
    if (!canReopen) {
      return jsonError("Closed cards must be reopened before they can be edited.", 409);
    }
  }

  if (parsed.data.is_active === false) {
    const { data: statements, error: unpaidStatementsError } = await supabase
      .from("statements")
      .select("payment_date, historical_payment_confirmed")
      .eq("card_id", id);
    if (unpaidStatementsError) return jsonError(unpaidStatementsError.message, 500);
    if (hasUnpaidStatements(statements ?? [])) {
      return jsonError("Pay every bill before closing this card.", 409);
    }
  }

  if (parsed.data.credit_limit !== undefined) {
    const { data: statements, error: statementError } = await supabase
      .from("statements")
      .select("total_amount_due")
      .eq("card_id", id);
    if (statementError) return jsonError(statementError.message, 500);

    if (statements.some((statement) => Number(statement.total_amount_due) > parsed.data.credit_limit!)) {
      return jsonError("Credit limit cannot be lower than an existing bill total.", 400);
    }
  }

  const { data, error } = await supabase
    .from("cards")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .maybeSingle();

  if (error) return jsonError(error.message, 500);
  if (!data) return notFound("Card");

  return NextResponse.json({ data });
}

// DELETE /api/cards/:id — permanently deletes the card and its cascading bill history.
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = cardDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Confirm permanent card deletion before continuing.", 400);
  }

  const { data: card, error: cardError } = await supabase
    .from("cards")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (cardError) return jsonError(cardError.message, 500);
  if (!card) return notFound("Card");

  const { error } = await supabase.from("cards").delete().eq("id", id).eq("user_id", user.id);
  if (error) return jsonError(error.message, 500);

  return new NextResponse(null, { status: 204 });
}
