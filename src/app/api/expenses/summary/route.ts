import { NextRequest, NextResponse } from "next/server";
import { jsonError, unauthorized } from "@/lib/api-helpers";
import { createClient } from "@/lib/supabase/server";
import { buildExpenseSummary } from "@/lib/expense-grid";
import { financialYearStartForDate } from "@/lib/year-grid";

function monthsForPeriod(year: number, yearType: string): string[] {
  const startMonth = yearType === "financial" ? 3 : 0;
  return Array.from({ length: 12 }, (_, offset) => {
    const date = new Date(Date.UTC(year, startMonth + offset, 1));
    return date.toISOString().slice(0, 10);
  });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();
  const year = Number(request.nextUrl.searchParams.get("year"));
  const yearType = request.nextUrl.searchParams.get("yearType");
  if (!Number.isInteger(year) || !["financial", "calendar"].includes(yearType ?? "")) {
    return jsonError("A valid year and year type are required", 400);
  }
  const months = monthsForPeriod(year, yearType!);
  const [sections, lineItems, entries, income] = await Promise.all([
    supabase.from("expense_sections").select("*").eq("user_id", user.id),
    supabase.from("expense_line_items").select("*"),
    supabase.from("expense_entries").select("*").eq("user_id", user.id).gte("month", months[0]).lte("month", months[11]),
    supabase.from("monthly_income").select("*").eq("user_id", user.id).gte("month", months[0]).lte("month", months[11]),
  ]);
  const error = sections.error ?? lineItems.error ?? entries.error ?? income.error;
  if (error) return jsonError(error.message, 500);
  const rows = buildExpenseSummary(
    months,
    sections.data ?? [],
    lineItems.data ?? [],
    entries.data ?? [],
    income.data ?? [],
  );
  return NextResponse.json({ data: { year, yearType, months: rows, earliestYear: financialYearStartForDate(months[0]) } });
}
