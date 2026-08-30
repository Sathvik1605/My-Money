import { NextRequest, NextResponse } from "next/server";
import { jsonError, unauthorized } from "@/lib/api-helpers";
import { createClient } from "@/lib/supabase/server";
import { destructiveConfirmSchema, expenseLineItemUpdateSchema } from "@/lib/validation/schemas";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();
  const parsed = expenseLineItemUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return jsonError("Invalid expense line item update", 400, parsed.success ? undefined : parsed.error.flatten());
  }
  const { id } = await params;
  const { data: item, error: itemError } = await supabase.from("expense_line_items").select("section_id").eq("id", id).single();
  if (itemError || !item) return jsonError("Line item not found", 404);
  const { data: section } = await supabase.from("expense_sections").select("id").eq("id", item.section_id).eq("user_id", user.id).single();
  if (!section) return jsonError("Line item not found", 404);
  const { data, error } = await supabase.from("expense_line_items").update(parsed.data).eq("id", id).select().single();
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ data });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();
  const confirmation = destructiveConfirmSchema.safeParse(await request.json().catch(() => null));
  if (!confirmation.success) return jsonError("Deletion must be explicitly confirmed", 400);
  const { id } = await params;
  const { data: item, error: itemError } = await supabase
    .from("expense_line_items")
    .select("section_id")
    .eq("id", id)
    .single();
  if (itemError || !item) return jsonError("Line item not found", 404);
  const { data: section } = await supabase
    .from("expense_sections")
    .select("id")
    .eq("id", item.section_id)
    .eq("user_id", user.id)
    .single();
  if (!section) return jsonError("Line item not found", 404);
  const { error } = await supabase.from("expense_line_items").delete().eq("id", id);
  if (error) return jsonError(error.message, 500);
  return new NextResponse(null, { status: 204 });
}
