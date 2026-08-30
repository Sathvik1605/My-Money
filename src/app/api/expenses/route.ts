import { NextRequest, NextResponse } from "next/server";
import { jsonError, unauthorized } from "@/lib/api-helpers";
import { createClient } from "@/lib/supabase/server";
import {
  EXPENSE_CATEGORIES,
  STARTER_LINE_ITEMS,
  STARTER_SECTIONS,
} from "@/lib/expense-grid";
import { expenseEntryInputSchema } from "@/lib/validation/schemas";

function isPastMonth(month: string): boolean {
  return month < new Date().toISOString().slice(0, 7) + "-01";
}

async function seedStarterSections(userId: string) {
  const supabase = await createClient();
  const { count, error: countError } = await supabase
    .from("expense_sections")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (countError || (count ?? 0) > 0) return countError;

  const rows = EXPENSE_CATEGORIES.flatMap((category) =>
    STARTER_SECTIONS[category].map((name) => ({ user_id: userId, category, name })),
  );
  const { error } = await supabase.from("expense_sections").insert(rows);
  if (error) return error;

  const { data: investmentSection, error: investmentError } = await supabase
    .from("expense_sections")
    .select("id")
    .eq("user_id", userId)
    .eq("category", "Investment")
    .eq("name", "Investments")
    .single();
  if (investmentError) return investmentError;
  const { error: lineItemsError } = await supabase.from("expense_line_items").insert(
    STARTER_LINE_ITEMS.Investments.map((name) => ({
      section_id: investmentSection.id,
      name,
    })),
  );
  return lineItemsError;
}

// GET /api/expenses?month=YYYY-MM-01 lists the caller's editable monthly expense structure.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const seedError = await seedStarterSections(user.id);
  if (seedError) return jsonError(seedError.message, 500);

  const month = request.nextUrl.searchParams.get("month");
  const [sections, lineItems, entries] = await Promise.all([
    supabase.from("expense_sections").select("*").eq("user_id", user.id).order("category").order("sort_order"),
    supabase.from("expense_line_items").select("*").order("sort_order"),
    month
      ? supabase.from("expense_entries").select("*").eq("user_id", user.id).eq("month", month)
      : supabase.from("expense_entries").select("*").eq("user_id", user.id),
  ]);
  const error = sections.error ?? lineItems.error ?? entries.error;
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ data: { sections: sections.data, lineItems: lineItems.data, entries: entries.data } });
}

// PUT /api/expenses upserts the single direct or line-item amount for a month.
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const parsed = expenseEntryInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid expense entry", 400, parsed.error.flatten());
  const values = parsed.data;
  if (isPastMonth(values.month) && !values.unlock_closed_year) {
    return jsonError("This month is closed. Edit its year before changing entries.", 409);
  }

  const { data: section, error: sectionError } = await supabase
    .from("expense_sections").select("*").eq("id", values.section_id).eq("user_id", user.id).single();
  if (sectionError || !section) return jsonError("Expense section not found", 404);
  if (!section.is_active) return jsonError("This expense section is inactive", 409);
  if (values.month < `${new Date(section.created_at).getUTCFullYear()}-${String(new Date(section.created_at).getUTCMonth() + 1).padStart(2, "0")}-01`) {
    return jsonError("This section was not available in the selected month", 409);
  }

  const { data: lineItems, error: itemsError } = await supabase
    .from("expense_line_items").select("*").eq("section_id", section.id);
  if (itemsError) return jsonError(itemsError.message, 500);
  if (values.line_item_id === null && lineItems.length > 0) {
    return jsonError("Sections with line items cannot have a direct amount", 409);
  }
  if (values.line_item_id !== null) {
    const lineItem = lineItems.find((item) => item.id === values.line_item_id);
    if (!lineItem) return jsonError("Line item not found", 404);
    if (!lineItem.is_active) return jsonError("This line item is inactive", 409);
  }

  const query = supabase.from("expense_entries").select("id").eq("section_id", values.section_id).eq("month", values.month);
  const { data: existing, error: existingError } = values.line_item_id
    ? await query.eq("line_item_id", values.line_item_id).maybeSingle()
    : await query.is("line_item_id", null).maybeSingle();
  if (existingError) return jsonError(existingError.message, 500);

  const { data, error } = existing
    ? await supabase.from("expense_entries").update({ amount: values.amount }).eq("id", existing.id).select().single()
    : await supabase.from("expense_entries").insert({
      section_id: values.section_id,
      line_item_id: values.line_item_id,
      month: values.month,
      amount: values.amount,
      user_id: user.id,
    }).select().single();
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ data });
}