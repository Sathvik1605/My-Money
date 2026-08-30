import { NextRequest, NextResponse } from "next/server";
import { jsonError, unauthorized } from "@/lib/api-helpers";
import { createClient } from "@/lib/supabase/server";
import { monthlyIncomeInputSchema } from "@/lib/validation/schemas";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();
  const month = request.nextUrl.searchParams.get("month");
  let query = supabase.from("monthly_income").select("*").eq("user_id", user.id).order("month");
  if (month) query = query.eq("month", month);
  const { data, error } = await query;
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ data });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();
  const parsed = monthlyIncomeInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid monthly income", 400, parsed.error.flatten());
  if (parsed.data.month < `${new Date().toISOString().slice(0, 7)}-01` && !parsed.data.unlock_closed_year) {
    return jsonError("This month is closed. Edit its year before changing income.", 409);
  }
  const { data, error } = await supabase
    .from("monthly_income")
    .upsert({
      month: parsed.data.month,
      amount: parsed.data.amount,
      user_id: user.id,
    }, { onConflict: "user_id,month" })
    .select()
    .single();
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ data });
}
