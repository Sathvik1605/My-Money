import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Statements don't carry user_id directly (§7) — ownership is via their
// parent card. This confirms the card exists, is owned by the caller,
// and returns its id for use as a foreign key.
export async function assertOwnsCard(
  supabase: SupabaseClient<Database>,
  cardId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("cards")
    .select("id")
    .eq("id", cardId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return false;
  return true;
}
