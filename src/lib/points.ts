// The points engine: pure rules for earning points and opening perks.
// Rules: docs/program-rules.md. No database code here; the caller (#11)
// writes the result to points_ledger and perks.
//
// Works on one lap: lap resets, carry-over past 400 and point expiry are #21.
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
};

export type PurchaseOutcome = {
  /** Points for the ledger's earn row. */
  points: number;
  /** Lap points after the purchase. Can reach past 400; #21 starts the next lap. */
  lapPointsAfter: number;
  perks: PerkToOpen[];
};

const addDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY_MS);

export function earnFromPurchase({ lap, lapPoints, amountPaid, at }: PurchaseInput): PurchaseOutcome {
  if (!Number.isInteger(lap) || lap < 1) {
    throw new RangeError(`Lap must be a whole number from 1, got ${lap}`);
  }
  if (!Number.isInteger(lapPoints) || lapPoints < 0 || lapPoints >= RAIL_END) {
    throw new RangeError(`Lap points must be a whole number from 0 to ${RAIL_END - 1}, got ${lapPoints}`);
  }

  const points = pointsForPurchase(amountPaid);
  const perks = stopsPassed(lapPoints, points).map((stop) => ({
    stopAt: stop.at,
    lap,
    openedAt: at,
    expiresAt: addDays(at, PERK_DAYS),
    chooseBy: stop.type === "prize_choice" ? addDays(at, PRIZE_CHOICE_DAYS) : null,
  }));

  return { points, lapPointsAfter: lapPoints + points, perks };
}
