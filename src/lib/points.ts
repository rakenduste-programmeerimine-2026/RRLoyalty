// The points engine: pure rules for earning points and opening perks.
// Rules: docs/program-rules.md. No database code here; recordPurchase()
// in purchases.ts writes the result to points_ledger and perks.
//
// Reaching 400 starts the next lap and carries the extra points over, and
// every stop passed on either lap opens its perk. The one-time stop (150,
// "Äpp 5 € (uutele)") opens once per member: pass appPerkGiven once they have
// had it. Point expiry and the member's whole points state are in laps.ts.
// Earning is always 1 point per euro. "Topelt-punktid" (stop 250) opens as a
// perk only, until the client says how long it lasts.

import { RAIL_END, STOPS, type Stop } from "./rail";

const DAY_MS = 24 * 60 * 60 * 1000;
export const PERK_DAYS = 60;
export const PRIZE_CHOICE_DAYS = 3;

/** 1 point per euro paid after discounts, rounded down per purchase. */
export function pointsForPurchase(amountPaid: number): number {
  if (!Number.isFinite(amountPaid) || amountPaid < 0) {
    throw new RangeError(`Amount paid must be a non-negative number, got ${amountPaid}`);
  }
  // Round to whole cents first so floating-point noise (19.999999…) cannot cost a point.
  const cents = Math.round(amountPaid * 100);
  return Math.floor(cents / 100);
}

/** The stops a member passes going from lapPoints to lapPoints + earned, a stop reached exactly included. */
export function stopsPassed(lapPoints: number, earned: number, stops: Stop[] = STOPS): Stop[] {
  const after = lapPoints + earned;
  return stops.filter((stop) => stop.at > lapPoints && stop.at <= after);
}

export type PerkToOpen = {
  stopAt: number;
  lap: number;
  openedAt: Date;
  expiresAt: Date;
  /** Prize stops only: the last moment to pick a gift card or a donation. */
  chooseBy: Date | null;
};

export type PurchaseInput = {
  /** The current lap, starting at 1. */
  lap: number;
  /** Points on the current lap before this purchase, 0 to 399. */
  lapPoints: number;
  amountPaid: number;
  at: Date;
  /** True once the member has had the one-time 150 perk, on any lap. Defaults to false. */
  appPerkGiven?: boolean;
};

export type PurchaseOutcome = {
  /** Points for the ledger's earn row. */
  points: number;
  /** The lap after the purchase: one more for every 400 reached. */
  lapAfter: number;
  /** Points on lapAfter, 0 to 399. 390 + 25 gives 15. */
  lapPointsAfter: number;
  perks: PerkToOpen[];
};

const addDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY_MS);

export function earnFromPurchase({ lap, lapPoints, amountPaid, at, appPerkGiven = false }: PurchaseInput): PurchaseOutcome {
  if (!Number.isInteger(lap) || lap < 1) {
    throw new RangeError(`Lap must be a whole number from 1, got ${lap}`);
  }
  if (!Number.isInteger(lapPoints) || lapPoints < 0 || lapPoints >= RAIL_END) {
    throw new RangeError(`Lap points must be a whole number from 0 to ${RAIL_END - 1}, got ${lapPoints}`);
  }

  const points = pointsForPurchase(amountPaid);
  const perks: PerkToOpen[] = [];
  let appGiven = appPerkGiven;
  let currentLap = lap;
  let from = lapPoints;
  let remaining = points;

  // One pass per lap the purchase touches: stops up to 400, then carry over.
  for (;;) {
    for (const stop of stopsPassed(from, Math.min(remaining, RAIL_END - from))) {
      if (stop.type === "code_once") {
        if (appGiven) continue;
        appGiven = true;
      }
      perks.push({
        stopAt: stop.at,
        lap: currentLap,
        openedAt: at,
        expiresAt: addDays(at, PERK_DAYS),
        chooseBy: stop.type === "prize_choice" ? addDays(at, PRIZE_CHOICE_DAYS) : null,
      });
    }
    if (from + remaining < RAIL_END) break;
    remaining -= RAIL_END - from;
    currentLap += 1;
    from = 0;
  }

  return { points, lapAfter: currentLap, lapPointsAfter: from + remaining, perks };
}
