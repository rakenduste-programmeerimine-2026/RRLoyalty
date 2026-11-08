// What the points engine needs from the database. Types only: #11 implements
// this against Supabase once the write path is settled (#6 adds the policies).

import type { PurchaseOutcome } from "./points";

export type LapPosition = {
  /** laps_completed + 1 from the member_points view. */
  lap: number;
  /** current_lap_points from the member_points view. */
  lapPoints: number;
};

export interface PointsStore {
  lapPosition(memberId: string): Promise<LapPosition>;
  /**
   * Writes one earn row to points_ledger and a perks row (source 'rail') per
   * opened perk. Must be idempotent per purchase: points_ledger.purchase_id
   * and perks_one_per_stop_per_lap are unique.
   */
  recordPurchasePoints(memberId: string, purchaseId: number, outcome: PurchaseOutcome): Promise<void>;
}
