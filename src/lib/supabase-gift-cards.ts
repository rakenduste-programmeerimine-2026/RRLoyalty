// Gift cards and birthday cards for the signed-in member. Uses the member's
// own session: RLS (#6) only returns their rows, so no secret key is needed.

import "server-only";
import type { BirthdayCardRow, GiftCardRow } from "./gift-cards";
import { lapPointsOf } from "./laps";
import { createClient } from "./supabase/server";

type GiftCardDbRow = {
  id: number;
  code: string;
  amount: number | string;
  min_purchase: number | string;
  valid_until: string;
  perks: { stop_at: number | null; redeemed_at: string | null } | null;
};

const GIFT_CARD_COLUMNS = "id, code, amount, min_purchase, valid_until, perks(stop_at, redeemed_at)";

const toGiftCard = (row: GiftCardDbRow): GiftCardRow => ({
  id: row.id,
  code: row.code,
  amount: Number(row.amount),
  minPurchase: Number(row.min_purchase),
  validUntil: new Date(row.valid_until),
  stopAt: row.perks?.stop_at ?? null,
  redeemedAt: row.perks?.redeemed_at ? new Date(row.perks.redeemed_at) : null,
});

export async function loadGiftCards(
  now: Date = new Date(),
): Promise<{ cards: GiftCardRow[]; birthdays: BirthdayCardRow[]; lapPoints: number }> {
  const supabase = await createClient();
  const [cards, birthdays, points] = await Promise.all([
    supabase.from("gift_cards").select(GIFT_CARD_COLUMNS).returns<GiftCardDbRow[]>(),
    supabase
      .from("perks")
      .select("id, code, expires_at, redeemed_at")
      .eq("source", "birthday")
      .returns<{ id: number; code: string | null; expires_at: string; redeemed_at: string | null }[]>(),
    supabase
      .from("member_points")
      .select("current_lap_points, last_purchase_at")
      .maybeSingle<{ current_lap_points: number; last_purchase_at: string | null }>(),
  ]);
  if (cards.error) throw new Error(`Could not read gift cards: ${cards.error.message}`);
  if (birthdays.error) throw new Error(`Could not read birthday cards: ${birthdays.error.message}`);
  if (points.error) throw new Error(`Could not read points: ${points.error.message}`);

  return {
    cards: cards.data.map(toGiftCard),
    birthdays: birthdays.data.map((row) => ({
      id: row.id,
      code: row.code,
      expiresAt: new Date(row.expires_at),
      redeemedAt: row.redeemed_at ? new Date(row.redeemed_at) : null,
    })),
    lapPoints: lapPointsOf(points.data, now),
  };
}

/** One of the member's gift cards, or null when it doesn't exist or isn't theirs (RLS). */
export async function loadGiftCard(id: number): Promise<GiftCardRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gift_cards")
    .select(GIFT_CARD_COLUMNS)
    .eq("id", id)
    .maybeSingle<GiftCardDbRow>();
  if (error) throw new Error(`Could not read the gift card: ${error.message}`);
  return data ? toGiftCard(data) : null;
}
