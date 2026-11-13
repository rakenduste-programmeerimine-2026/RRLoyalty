// Reads for the prize flow (#18), with the member's own session: RLS (#6)
// only returns their perks and gift cards. Writes go through
// supabase-perk-store.ts with the secret key.

import "server-only";
import { STOPS } from "./rail";
import { createClient } from "./supabase/server";

const PRIZE_STOPS = STOPS.filter((stop) => stop.type === "prize_choice").map((stop) => stop.at);

export type OpenPrize = { perkId: number; stopAt: number; chooseBy: Date };

/** The member's oldest prize still within its 3 days to choose, or null. */
export async function loadOpenPrize(now: Date): Promise<OpenPrize | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("perks")
    .select("id, stop_at, choose_by")
    .eq("source", "rail")
    .in("stop_at", PRIZE_STOPS)
    .is("choice", null)
    .is("redeemed_at", null)
    .gt("choose_by", now.toISOString())
    .order("opened_at", { ascending: true })
    .limit(1)
    .maybeSingle<{ id: number; stop_at: number; choose_by: string }>();
  if (error) throw new Error(`Could not read the open prize: ${error.message}`);
  return data ? { perkId: data.id, stopAt: data.stop_at, chooseBy: new Date(data.choose_by) } : null;
}

/** The id of the gift card a perk turned into, for opening its QR page. */
export async function giftCardIdForPerk(perkId: number): Promise<number | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gift_cards")
    .select("id")
    .eq("perk_id", perkId)
    .maybeSingle<{ id: number }>();
  if (error) throw new Error(`Could not read the gift card: ${error.message}`);
  return data?.id ?? null;
}
