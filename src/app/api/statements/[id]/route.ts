import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { statementUpdateSchema } from "@/lib/validation/schemas";
import { jsonError, notFound, unauthorized } from "@/lib/api-helpers";
import { dueDateForStatement, isHistoricalStatement, isWithinCreditLimit } from "@/lib/card-rules";

type Params = { params: Promise<{ id: string }> };

// GET /api/statements/:id
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const { data, error } = await supabase
    .from("statements")
    .select("*, cards!inner(id, user_id, nickname)")
    .eq("id", id)
    .eq("cards.user_id", user.id)
    .maybeSingle();

  if (error) return jsonError(error.message, 500);
  if (!data) return notFound("Statement");

  return NextResponse.json({ data });
}

// PATCH /api/statements/:id — correct a bill or mark it fully paid.
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = statementUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid statement data", 400, parsed.error.flatten());
  }

  // Confirm ownership before writing, in addition to relying on RLS (§11).
  const { data: existing, error: fetchError } = await supabase
    .from("statements")
    .select("id, card_id, statement_date, due_date, payment_date, historical_payment_confirmed, cards!inner(user_id, credit_limit, due_day, is_active)")
    .eq("id", id)
    .eq("cards.user_id", user.id)
    .maybeSingle();

  if (fetchError) return jsonError(fetchError.message, 500);
  if (!existing) return notFound("Statement");
  if (parsed.data.mark_paid && parsed.data.mark_unpaid) {
    return jsonError("Choose either mark_paid or mark_unpaid, not both.", 400);
  }

  const card = Array.isArray(existing.cards) ? existing.cards[0] : existing.cards;
  if (!card) return notFound("Card");
  if (!card.is_active) return jsonError("Bills for closed cards are view-only.", 409);

  if ((existing.payment_date || existing.historical_payment_confirmed) && parsed.data.total_amount_due !== undefined) {
    return jsonError("Paid bill totals cannot be changed.", 409);
  }
  if (
    parsed.data.total_amount_due !== undefined &&
    !isWithinCreditLimit(parsed.data.total_amount_due, Number(card.credit_limit))
  ) {
    return jsonError("Total amount due cannot exceed this card's credit limit.", 400);
  }

  const statementDate = parsed.data.statement_date ?? existing.statement_date;
  const { mark_paid, mark_unpaid, ...statementUpdates } = parsed.data;
  const dueDate = dueDateForStatement(statementDate, card.due_day);
  const paidUpdate = mark_paid
    ? isHistoricalStatement(statementDate)
      ? { payment_date: null, historical_payment_confirmed: true }
      : { payment_date: new Date().toISOString().slice(0, 10), historical_payment_confirmed: false }
    : mark_unpaid
      ? { payment_date: null, historical_payment_confirmed: false }
      : {};
  const { data, error } = await supabase
    .from("statements")
    .update({
      ...statementUpdates,
      due_date: dueDate,
      ...paidUpdate,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return jsonError(error.message, 500);

  return NextResponse.json({ data });
}

// DELETE /api/statements/:id — remove a mistaken entry entirely.
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const { data: existing, error: fetchError } = await supabase
    .from("statements")
    .select("id, cards!inner(user_id, is_active)")
    .eq("id", id)
    .eq("cards.user_id", user.id)
    .maybeSingle();

  if (fetchError) return jsonError(fetchError.message, 500);
  if (!existing) return notFound("Statement");
  const card = Array.isArray(existing.cards) ? existing.cards[0] : existing.cards;
  if (!card?.is_active) return jsonError("Bills for closed cards are view-only.", 409);

  const { error } = await supabase.from("statements").delete().eq("id", id);
  if (error) return jsonError(error.message, 500);

  return new NextResponse(null, { status: 204 });
}
