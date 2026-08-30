import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cardInputSchema } from "@/lib/validation/schemas";
import { jsonError, unauthorized } from "@/lib/api-helpers";

// GET /api/cards — list the caller's cards (active by default).
// Query params: ?includeInactive=true
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const includeInactive = request.nextUrl.searchParams.get("includeInactive") === "true";

  let query = supabase
    .from("cards")
    .select("*")
    .eq("user_id", user.id)
    .order("is_active", { ascending: false })
    .order("created_at");
  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) return jsonError(error.message, 500);

  return NextResponse.json({ data });
}

// POST /api/cards — create a new card for the logged-in user.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = cardInputSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid card data", 400, parsed.error.flatten());
  }

  const { data, error } = await supabase
    .from("cards")
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single();

  if (error) return jsonError(error.message, 500);

  return NextResponse.json({ data }, { status: 201 });
}
