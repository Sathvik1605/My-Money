import { NextRequest, NextResponse } from "next/server";
import { jsonError, unauthorized } from "@/lib/api-helpers";
import { createClient } from "@/lib/supabase/server";
import { destructiveConfirmSchema, expenseSectionUpdateSchema } from "@/lib/validation/schemas";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();
  const parsed = expenseSectionUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return jsonError("Invalid expense section update", 400, parsed.success ? undefined : parsed.error.flatten());
  }
  const { id } = await params;
  const { data, error } = await supabase
    .from("expense_sections")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();
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
  const { error } = await supabase
    .from("expense_sections")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return jsonError(error.message, 500);
  return new NextResponse(null, { status: 204 });
}
