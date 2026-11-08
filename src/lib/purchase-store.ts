// What recording a purchase needs from the database. The Supabase version is
// in supabase-purchase-store.ts, and memory-purchase-store.ts is a stand-in
// for tests that keeps the same unique rules as the schema.

import type { PurchaseOutcome } from "./points";

/** Matches purchases.channel in the database. Every channel is simulated in the prototype. */
export type Channel = "e_shop" | "store" | "literaat" | "app";

/** Matches purchases.status in the database. */
export type PurchaseStatus = "processing" | "delivered" | "in_store";

export type LapPosition = {
  /** laps_completed + 1 from the member_points view. */
  lap: number;
  /** current_lap_points from the member_points view. */
  lapPoints: number;
};

export type NewPurchase = {
  memberId: string;
  channel: Channel;
  status: PurchaseStatus;
  /** After discounts, in whole cents' worth of euros. */
  amountPaid: number;
  /** The channel's own id for the purchase. Unique: a retry sends the same one. */
  externalRef: string;
  location: string | null;
  orderNumber: string | null;
  purchasedAt: Date;
};

export type SavedPurchase = {
  id: number;
  memberId: string;
  channel: Channel;
  amountPaid: number;
  externalRef: string;
  purchasedAt: Date;
};

export type PointsWrite = {
  /** False when this purchase already has its points, so nothing was written. */
  applied: boolean;
  /** The stops whose perks this write opened. A stop already opened, or 150 a second time, is skipped. */
  openedStops: number[];
};

export interface PurchaseStore {
  /** Saves the purchase, or returns the one already saved with the same externalRef. */
  findOrCreatePurchase(purchase: NewPurchase): Promise<{ purchase: SavedPurchase; created: boolean }>;
  lapPosition(memberId: string): Promise<LapPosition>;
  /**
   * Writes one earn row to points_ledger and a perks row (source 'rail') per
   * opened perk, all or nothing. Idempotent per purchase: points_ledger.purchase_id
   * is unique, so a second call writes nothing and returns applied: false.
   */
  recordPurchasePoints(memberId: string, purchaseId: number, outcome: PurchaseOutcome): Promise<PointsWrite>;
}
