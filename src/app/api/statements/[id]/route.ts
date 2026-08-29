import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { statementUpdateSchema } from "@/lib/validation/schemas";
import { jsonError, notFound, unauthorized } from "@/lib/api-helpers";

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

// PATCH /api/statements/:id — edit a statement after the fact
// (mark paid later, fix a typo'd amount — §5.2).
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
    .select("id, cards!inner(user_id)")
    .eq("id", id)
    .eq("cards.user_id", user.id)
    .maybeSingle();

  if (fetchError) return jsonError(fetchError.message, 500);
  if (!existing) return notFound("Statement");

  const { data, error } = await supabase
    .from("statements")
    .update(parsed.data)
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
    .select("id, cards!inner(user_id)")
    .eq("id", id)
    .eq("cards.user_id", user.id)
    .maybeSingle();

  if (fetchError) return jsonError(fetchError.message, 500);
  if (!existing) return notFound("Statement");

  const { error } = await supabase.from("statements").delete().eq("id", id);
  if (error) return jsonError(error.message, 500);

  return new NextResponse(null, { status: 204 });
}
