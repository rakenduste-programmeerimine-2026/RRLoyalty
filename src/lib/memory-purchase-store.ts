// An in-memory PurchaseStore for tests. It keeps the schema's unique rules
// (supabase/migrations) so retries behave as they do against Supabase:
// purchases.external_ref, points_ledger.purchase_id, one perk per stop per
// lap, and stop 150 once per member.

import { RAIL_END } from "./rail";
import type { PurchaseOutcome } from "./points";
import type { LapPosition, NewPurchase, PointsWrite, PurchaseStore, SavedPurchase } from "./purchase-store";

type StoredPurchase = SavedPurchase & Omit<NewPurchase, keyof SavedPurchase>;
type LedgerRow = { memberId: string; purchaseId: number | null; kind: "earn" | "expiry"; points: number };
type PerkRow = { memberId: string; stopAt: number; lap: number; openedAt: Date; expiresAt: Date; chooseBy: Date | null };

export class MemoryPurchaseStore implements PurchaseStore {
  purchases: StoredPurchase[] = [];
  ledger: LedgerRow[] = [];
  perks: PerkRow[] = [];
  /** Set to make the next recordPurchasePoints call fail before writing, like a dropped connection. */
  failNextPointsWrite = false;

  async findOrCreatePurchase(purchase: NewPurchase) {
    const existing = this.purchases.find((row) => row.externalRef === purchase.externalRef);
    if (existing) return { purchase: { ...existing }, created: false };

    const saved: StoredPurchase = { ...purchase, id: this.purchases.length + 1 };
    this.purchases.push(saved);
    return { purchase: { ...saved }, created: true };
  }

  async lapPosition(memberId: string): Promise<LapPosition> {
    const total = this.ledger.filter((row) => row.memberId === memberId).reduce((sum, row) => sum + row.points, 0);
    return { lap: Math.floor(total / RAIL_END) + 1, lapPoints: total % RAIL_END };
  }

  async recordPurchasePoints(memberId: string, purchaseId: number, outcome: PurchaseOutcome): Promise<PointsWrite> {
    if (this.failNextPointsWrite) {
      this.failNextPointsWrite = false;
      throw new Error("Simulated failure before the points were written");
    }
    if (this.ledger.some((row) => row.purchaseId === purchaseId)) {
      return { applied: false, openedStops: [] };
    }

    this.ledger.push({ memberId, purchaseId, kind: "earn", points: outcome.points });
    const openedStops: number[] = [];
    for (const perk of outcome.perks) {
      const mine = this.perks.filter((row) => row.memberId === memberId);
      const taken =
        mine.some((row) => row.stopAt === perk.stopAt && row.lap === perk.lap) ||
        (perk.stopAt === 150 && mine.some((row) => row.stopAt === 150));
      if (taken) continue;
      this.perks.push({ memberId, ...perk });
      openedStops.push(perk.stopAt);
    }
    return { applied: true, openedStops };
  }

  /** Test setup: give a member points without a purchase. */
  seedPoints(memberId: string, points: number) {
    this.ledger.push({ memberId, purchaseId: null, kind: "earn", points });
  }

  seedPerk(memberId: string, stopAt: number, lap: number) {
    const at = new Date(0);
    this.perks.push({ memberId, stopAt, lap, openedAt: at, expiresAt: at, chooseBy: null });
  }

  pointsOf(memberId: string): number {
    return this.ledger.filter((row) => row.memberId === memberId).reduce((sum, row) => sum + row.points, 0);
  }
}
