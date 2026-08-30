import { NextRequest, NextResponse } from "next/server";
import { jsonError, unauthorized } from "@/lib/api-helpers";
import { createClient } from "@/lib/supabase/server";
import { expenseSectionInputSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();
  const parsed = expenseSectionInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid expense section", 400, parsed.error.flatten());
  const { count, error: countError } = await supabase
    .from("expense_sections")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("category", parsed.data.category);
  if (countError) return jsonError(countError.message, 500);
  const { data, error } = await supabase
    .from("expense_sections")
    .insert({ ...parsed.data, user_id: user.id, sort_order: count ?? 0 })
    .select()
    .single();
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ data }, { status: 201 });
}
