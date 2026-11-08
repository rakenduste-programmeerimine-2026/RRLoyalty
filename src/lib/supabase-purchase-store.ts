// PurchaseStore against Supabase, with the server's secret key.

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PurchaseOutcome } from "./points";
import { recordPurchase, type PurchaseRequest, type RecordedPurchase } from "./purchases";
import type { Channel, LapPosition, NewPurchase, PointsWrite, PurchaseStore, SavedPurchase } from "./purchase-store";
import { createAdminClient } from "./supabase/admin";

const UNIQUE_VIOLATION = "23505";
const PURCHASE_COLUMNS = "id, member_id, channel, amount_paid, external_ref, purchased_at";

type PurchaseRow = {
  id: number;
  member_id: string;
  channel: Channel;
  amount_paid: number | string;
  external_ref: string;
  purchased_at: string;
};

const toSaved = (row: PurchaseRow): SavedPurchase => ({
  id: row.id,
  memberId: row.member_id,
  channel: row.channel,
  amountPaid: Number(row.amount_paid),
  externalRef: row.external_ref,
  purchasedAt: new Date(row.purchased_at),
});

export class SupabasePurchaseStore implements PurchaseStore {
  constructor(private readonly db: SupabaseClient) {}

  async findOrCreatePurchase(purchase: NewPurchase) {
    const { data, error } = await this.db
      .from("purchases")
      .insert({
        member_id: purchase.memberId,
        channel: purchase.channel,
        status: purchase.status,
        amount_paid: purchase.amountPaid,
        external_ref: purchase.externalRef,
        location: purchase.location,
        order_number: purchase.orderNumber,
        purchased_at: purchase.purchasedAt.toISOString(),
      })
      .select(PURCHASE_COLUMNS)
      .single<PurchaseRow>();

    if (!error) return { purchase: toSaved(data), created: true };
    if (error.code !== UNIQUE_VIOLATION) throw new Error(`Could not save the purchase: ${error.message}`);

    const existing = await this.db
      .from("purchases")
      .select(PURCHASE_COLUMNS)
      .eq("external_ref", purchase.externalRef)
      .single<PurchaseRow>();
    if (existing.error) throw new Error(`Could not read the saved purchase: ${existing.error.message}`);
    return { purchase: toSaved(existing.data), created: false };
  }

  async lapPosition(memberId: string): Promise<LapPosition> {
    const { data, error } = await this.db
      .from("member_points")
      .select("laps_completed, current_lap_points")
      .eq("member_id", memberId)
      .single<{ laps_completed: number; current_lap_points: number }>();
    if (error) throw new Error(`Could not read the member's points: ${error.message}`);
    return { lap: Number(data.laps_completed) + 1, lapPoints: Number(data.current_lap_points) };
  }

  async recordPurchasePoints(memberId: string, purchaseId: number, outcome: PurchaseOutcome): Promise<PointsWrite> {
    const { data, error } = await this.db.rpc("record_purchase_points", {
      p_member_id: memberId,
      p_purchase_id: purchaseId,
      p_points: outcome.points,
      p_perks: outcome.perks.map((perk) => ({
        stop_at: perk.stopAt,
        lap: perk.lap,
        opened_at: perk.openedAt.toISOString(),
        expires_at: perk.expiresAt.toISOString(),
        choose_by: perk.chooseBy?.toISOString() ?? null,
      })),
    });
    if (error) throw new Error(`Could not write the purchase's points: ${error.message}`);

    const result = data as { applied: boolean; opened_stops: number[] };
    return { applied: result.applied, openedStops: result.opened_stops };
  }
}

/**
 * Records a purchase from any channel in Supabase. Server only: the caller
 * must have checked that request.memberId is the signed-in member.
 */
export function recordPurchaseInSupabase(request: PurchaseRequest): Promise<RecordedPurchase> {
  return recordPurchase(new SupabasePurchaseStore(createAdminClient()), request);
}
