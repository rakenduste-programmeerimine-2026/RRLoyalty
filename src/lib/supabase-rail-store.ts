// RailStore against Supabase, with the server's secret key. RLS has no
// policies yet (#6), so reads go through the admin client.

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Channel } from "./purchase-store";
import { railView, type HistoryRow, type PerkRow, type PointsRow, type RailStore, type RailView } from "./rail-account";
import { settleUnclaimedPrizesInSupabase } from "./supabase-perk-store";
import { createAdminClient } from "./supabase/admin";

const date = (value: string | null) => (value ? new Date(value) : null);

export class SupabaseRailStore implements RailStore {
  constructor(private readonly db: SupabaseClient) {}

  async points(memberId: string): Promise<PointsRow | null> {
    const { data, error } = await this.db
      .from("member_points")
      .select("lifetime_total, laps_completed, current_lap_points, last_purchase_at")
      .eq("member_id", memberId)
      .maybeSingle<{
        lifetime_total: number;
        laps_completed: number;
        current_lap_points: number;
        last_purchase_at: string | null;
      }>();
    if (error) throw new Error(`Could not read the member's points: ${error.message}`);
    if (!data) return null;
    return {
      lifetimeTotal: Number(data.lifetime_total),
      lapsCompleted: Number(data.laps_completed),
      currentLapPoints: Number(data.current_lap_points),
      lastPurchaseAt: date(data.last_purchase_at),
    };
  }

  async perks(memberId: string): Promise<PerkRow[]> {
    const { data, error } = await this.db
      .from("perks")
      .select("id, source, stop_at, opened_at, expires_at, choose_by, choice, code, redeemed_at, gift_cards(valid_until)")
      .eq("member_id", memberId)
      .is("redeemed_at", null)
      .returns<
        {
          id: number;
          source: PerkRow["source"];
          stop_at: number | null;
          opened_at: string;
          expires_at: string;
          choose_by: string | null;
          choice: string | null;
          code: string | null;
          redeemed_at: string | null;
          // One-to-one through gift_cards.perk_id; PostgREST may still send a list.
          gift_cards: { valid_until: string } | { valid_until: string }[] | null;
        }[]
      >();
    if (error) throw new Error(`Could not read the member's perks: ${error.message}`);
    return data.map((row) => ({
      id: row.id,
      source: row.source,
      stopAt: row.stop_at,
      openedAt: new Date(row.opened_at),
      expiresAt: new Date(row.expires_at),
      chooseBy: date(row.choose_by),
      choice: row.choice,
      code: row.code,
      redeemedAt: date(row.redeemed_at),
      giftCardValidUntil: date((Array.isArray(row.gift_cards) ? row.gift_cards[0] : row.gift_cards)?.valid_until ?? null),
    }));
  }

  async history(memberId: string, limit: number): Promise<HistoryRow[]> {
    const { data, error } = await this.db
      .from("points_ledger")
      .select("kind, points, created_at, purchases(purchased_at, channel, location)")
      .eq("member_id", memberId)
      .order("created_at", { ascending: false })
      .limit(limit)
      .returns<
        {
          kind: HistoryRow["kind"];
          points: number;
          created_at: string;
          purchases: { purchased_at: string; channel: Channel; location: string | null } | null;
        }[]
      >();
    if (error) throw new Error(`Could not read the points history: ${error.message}`);
    return data.map((row) => ({
      at: new Date(row.purchases?.purchased_at ?? row.created_at),
      kind: row.kind,
      points: row.points,
      channel: row.purchases?.channel ?? null,
      location: row.purchases?.location ?? null,
    }));
  }
}

/** The Gustavi rada page's data for the signed-in member. Server only: check memberId with getMember() first. */
export async function loadRailFromSupabase(memberId: string, historyLimit: number, now = new Date()): Promise<RailView> {
  const store = new SupabaseRailStore(createAdminClient());
  // Prizes left unchosen for 3 days become gift cards before the page reads them.
  await settleUnclaimedPrizesInSupabase(memberId, now);
  const [points, perks, history] = await Promise.all([
    store.points(memberId),
    store.perks(memberId),
    store.history(memberId, historyLimit),
  ]);
  return railView(points, perks, history, now);
}
