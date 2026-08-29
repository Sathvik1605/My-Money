import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cardUpdateSchema } from "@/lib/validation/schemas";
import { jsonError, notFound, unauthorized } from "@/lib/api-helpers";

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

// PATCH /api/cards/:id — edit a card, or deactivate it (is_active: false).
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
