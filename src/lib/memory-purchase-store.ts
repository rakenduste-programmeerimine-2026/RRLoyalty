// An in-memory PurchaseStore for tests. It keeps the schema's unique rules
// (supabase/migrations) so retries behave as they do against Supabase:
// purchases.external_ref, points_ledger.purchase_id, one perk per stop per
// lap and restart (the member's expiry rows so far), and stop 150 once per member.

import { RAIL_END } from "./rail";
import type { PurchaseOutcome } from "./points";
import type { ExpiryWrite, LapPosition, NewPurchase, PointsWrite, PurchaseStore, SavedPurchase } from "./purchase-store";

type StoredPurchase = SavedPurchase & Omit<NewPurchase, keyof SavedPurchase>;
type LedgerRow = { memberId: string; purchaseId: number | null; kind: "earn" | "expiry"; points: number; at?: Date };
type PerkRow = {
  memberId: string;
  stopAt: number;
  lap: number;
  restart: number;
  openedAt: Date;
  expiresAt: Date;
  chooseBy: Date | null;
};

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

  async lapPosition(memberId: string, purchase: { id: number; purchasedAt: Date }): Promise<LapPosition> {
    const total = this.pointsOf(memberId);
    const earlier = this.purchases
      .filter((row) => row.memberId === memberId && row.id !== purchase.id && row.purchasedAt <= purchase.purchasedAt)
      .map((row) => row.purchasedAt.getTime());
    return {
      lap: Math.floor(total / RAIL_END) + 1,
      lapPoints: total % RAIL_END,
      lastPurchaseAt: earlier.length > 0 ? new Date(Math.max(...earlier)) : null,
    };
  }

  async recordPurchasePoints(
    memberId: string,
    purchaseId: number,
    outcome: PurchaseOutcome,
    expiry: ExpiryWrite | null,
  ): Promise<PointsWrite> {
    if (this.failNextPointsWrite) {
      this.failNextPointsWrite = false;
      throw new Error("Simulated failure before the points were written");
    }
    if (this.ledger.some((row) => row.purchaseId === purchaseId)) {
      return { applied: false, openedStops: [] };
    }

    if (expiry) this.ledger.push({ memberId, purchaseId: null, kind: "expiry", points: expiry.points, at: expiry.at });
    this.ledger.push({ memberId, purchaseId, kind: "earn", points: outcome.points });
    const restart = this.ledger.filter((row) => row.memberId === memberId && row.kind === "expiry").length;
    const openedStops: number[] = [];
    for (const perk of outcome.perks) {
      const mine = this.perks.filter((row) => row.memberId === memberId);
      const taken =
        mine.some((row) => row.stopAt === perk.stopAt && row.lap === perk.lap && row.restart === restart) ||
        (perk.stopAt === 150 && mine.some((row) => row.stopAt === 150));
      if (taken) continue;
      this.perks.push({ memberId, ...perk, restart });
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
    this.perks.push({ memberId, stopAt, lap, restart: 0, openedAt: at, expiresAt: at, chooseBy: null });
  }

  pointsOf(memberId: string): number {
    return this.ledger.filter((row) => row.memberId === memberId).reduce((sum, row) => sum + row.points, 0);
  }
}
