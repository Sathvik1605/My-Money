import { NextRequest, NextResponse } from "next/server";
import { jsonError, unauthorized } from "@/lib/api-helpers";
import { createClient } from "@/lib/supabase/server";
import { expenseLineItemInputSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();
  const parsed = expenseLineItemInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid expense line item", 400, parsed.error.flatten());
  const { data: section, error: sectionError } = await supabase
    .from("expense_sections").select("id").eq("id", parsed.data.section_id).eq("user_id", user.id).single();
  if (sectionError || !section) return jsonError("Expense section not found", 404);
  const { count, error: entriesError } = await supabase
    .from("expense_entries").select("id", { count: "exact", head: true }).eq("section_id", section.id).is("line_item_id", null);
  if (entriesError) return jsonError(entriesError.message, 500);
  if (count && count > 0) return jsonError("Sections with direct amounts cannot add line items", 409);
  const { count: lineItemCount, error: countError } = await supabase
    .from("expense_line_items")
    .select("id", { count: "exact", head: true })
    .eq("section_id", section.id);
  if (countError) return jsonError(countError.message, 500);
  const { data, error } = await supabase.from("expense_line_items").insert({ ...parsed.data, sort_order: lineItemCount ?? 0 }).select().single();
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ data }, { status: 201 });
}
