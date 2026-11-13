// Laps and point expiry: the member's whole points state, on top of the
// points engine in points.ts. Rules: docs/program-rules.md (Points, The rail
// and laps). Pure functions: the caller passes the date in, so /demo can skip
// ahead 6 months without touching the system clock.
//
// In the database this state is the member_points view over points_ledger:
// an expiry row of -expiredPoints sets the current lap to 0, and laps
// completed, the lifetime total and the perks rows are left as they are.

import { earnFromPurchase, type PerkToOpen } from "./points";
import { STOPS } from "./rail";

export const EXPIRY_MONTHS = 6;

const ONE_TIME_STOPS = new Set(STOPS.filter((stop) => stop.type === "code_once").map((stop) => stop.at));

export type MemberPoints = {
  /** The current lap, starting at 1. Laps completed is lap - 1. */
  lap: number;
  /** Points on the current lap, 0 to 399. */
  lapPoints: number;
  /** Every point ever earned. Expiry never lowers it. */
  lifetimeTotal: number;
  lastPurchaseAt: Date | null;
  /** True once the one-time 150 perk ("Äpp 5 € (uutele)") has been given, on any lap. */
  appPerkGiven: boolean;
  perks: PerkToOpen[];
};

export type Expiry = { state: MemberPoints; expiredPoints: number };

export type PurchaseResult = Expiry & {
  /** Points earned by this purchase. */
  points: number;
  /** The perks this purchase opened, also added to state.perks. */
  perks: PerkToOpen[];
};

/**
 * When the current lap's points expire: 6 calendar months after the last
 * purchase, on the last day of the month when it is shorter, as Postgres
 * `interval '6 months'` does in the member_points view.
 */
export function pointsExpireAt(lastPurchaseAt: Date): Date {
  return addMonths(lastPurchaseAt, EXPIRY_MONTHS);
}

/** `months` calendar months later, at the same time, on the last day of the month when it is shorter. */
export function addMonths(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + months;
  const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const moved = new Date(date);
  moved.setUTCFullYear(year, month, Math.min(date.getUTCDate(), lastDayOfMonth));
  return moved;
}

/**
 * The current lap's points as the member sees them at `now`: 0 once they
 * have expired, even before the next purchase writes the expiry row.
 */
export function lapPointsAt(lapPoints: number, lastPurchaseAt: Date | null, now: Date): number {
  return lastPurchaseAt !== null && now >= pointsExpireAt(lastPurchaseAt) ? 0 : lapPoints;
}

/** lapPointsAt for a member_points row as Supabase returns it, or 0 when there is none. */
export function lapPointsOf(
  row: { current_lap_points: number | string; last_purchase_at: string | null } | null,
  now: Date,
): number {
  if (!row) return 0;
  return lapPointsAt(Number(row.current_lap_points), row.last_purchase_at ? new Date(row.last_purchase_at) : null, now);
}

/** Sets the current lap to 0 once its points have expired. Perks, laps and the lifetime total stay. */
export function expirePoints(state: MemberPoints, now: Date): Expiry {
  const due = state.lastPurchaseAt !== null && now >= pointsExpireAt(state.lastPurchaseAt);
  if (!due || state.lapPoints === 0) return { state, expiredPoints: 0 };
  return { state: { ...state, lapPoints: 0 }, expiredPoints: state.lapPoints };
}

/**
 * Applies one purchase: points that expired before it go first, then the
 * purchase earns its points, carrying over past 400 and opening every stop passed.
 */
export function applyPurchase(state: MemberPoints, purchase: { amountPaid: number; at: Date }): PurchaseResult {
  const expiry = expirePoints(state, purchase.at);
  const before = expiry.state;
  const outcome = earnFromPurchase({
    lap: before.lap,
    lapPoints: before.lapPoints,
    amountPaid: purchase.amountPaid,
    at: purchase.at,
    appPerkGiven: before.appPerkGiven,
  });

  const lastPurchaseAt =
    before.lastPurchaseAt && before.lastPurchaseAt > purchase.at ? before.lastPurchaseAt : purchase.at;

  return {
    state: {
      lap: outcome.lapAfter,
      lapPoints: outcome.lapPointsAfter,
      lifetimeTotal: before.lifetimeTotal + outcome.points,
      lastPurchaseAt,
      appPerkGiven: before.appPerkGiven || outcome.perks.some((perk) => ONE_TIME_STOPS.has(perk.stopAt)),
      perks: [...before.perks, ...outcome.perks],
    },
    expiredPoints: expiry.expiredPoints,
    points: outcome.points,
    perks: outcome.perks,
  };
}
