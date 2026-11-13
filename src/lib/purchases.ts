// The one path every simulated sales channel uses to record a purchase.
// Rules: docs/program-rules.md. The checkout (e-shop) and /demo (stores,
// Literaat, the app) both call recordPurchase(); only the channel differs.
//
// Safe to retry: the channel's externalRef is unique, and points are written
// once per purchase, so sending the same purchase again never awards points twice.
//
// Points expire 6 months after the last purchase. The expiry row is written
// here, with the purchase that comes after it, so that purchase starts the
// lap from 0. Until then the pages count overdue points as 0 (laps.ts).

import { pointsExpireAt } from "./laps";
import { earnFromPurchase } from "./points";
import type { Channel, PurchaseStatus, PurchaseStore } from "./purchase-store";

export type { Channel } from "./purchase-store";

export const CHANNELS: readonly Channel[] = ["e_shop", "store", "literaat", "app"];

const MAX_REF_LENGTH = 200;

export function isChannel(value: unknown): value is Channel {
  return typeof value === "string" && (CHANNELS as readonly string[]).includes(value);
}

/** A store purchase is handed over at the till; every other channel starts as an order being processed. */
export function initialStatus(channel: Channel): PurchaseStatus {
  return channel === "store" ? "in_store" : "processing";
}

export type PurchaseRequest = {
  memberId: string;
  channel: Channel;
  /** After discounts, in euros. */
  amountPaid: number;
  /** The channel's own id for this purchase. Send the same one when retrying. */
  externalRef: string;
  location?: string | null;
  orderNumber?: string | null;
  /** Defaults to now. */
  purchasedAt?: Date;
};

export type RecordedPurchase = {
  purchaseId: number;
  channel: Channel;
  points: number;
  /** True when this purchase had already been recorded, so no points were added now. */
  alreadyRecorded: boolean;
  /** Stops whose perks this purchase opened. Empty when alreadyRecorded. */
  openedStops: number[];
};

/** The same externalRef was sent for a different purchase. */
export class PurchaseConflictError extends Error {
  constructor(externalRef: string, detail: string) {
    super(`Purchase ${externalRef} was already recorded with a different ${detail}`);
    this.name = "PurchaseConflictError";
  }
}

const toCents = (amount: number) => Math.round(amount * 100);

export async function recordPurchase(store: PurchaseStore, request: PurchaseRequest): Promise<RecordedPurchase> {
  if (!isChannel(request.channel)) {
    throw new RangeError(`Unknown sales channel: ${String(request.channel)}`);
  }
  if (!Number.isFinite(request.amountPaid) || request.amountPaid < 0) {
    throw new RangeError(`Amount paid must be a non-negative number, got ${request.amountPaid}`);
  }
  const externalRef = request.externalRef?.trim() ?? "";
  if (externalRef === "" || externalRef.length > MAX_REF_LENGTH) {
    throw new RangeError(`A purchase needs an external reference of 1 to ${MAX_REF_LENGTH} characters`);
  }

  const amountPaid = toCents(request.amountPaid) / 100;
  const { purchase, created } = await store.findOrCreatePurchase({
    memberId: request.memberId,
    channel: request.channel,
    status: initialStatus(request.channel),
    amountPaid,
    externalRef,
    location: request.location ?? null,
    orderNumber: request.orderNumber ?? null,
    purchasedAt: request.purchasedAt ?? new Date(),
  });

  if (!created) {
    if (purchase.memberId !== request.memberId) throw new PurchaseConflictError(externalRef, "member");
    if (purchase.channel !== request.channel) throw new PurchaseConflictError(externalRef, "channel");
    if (toCents(purchase.amountPaid) !== toCents(amountPaid)) throw new PurchaseConflictError(externalRef, "amount");
  }

  // Also runs on a retry: if an earlier attempt saved the purchase but failed
  // before its points were written, this finishes the job.
  const position = await store.lapPosition(purchase.memberId, purchase);
  const expiresAt = position.lastPurchaseAt ? pointsExpireAt(position.lastPurchaseAt) : null;
  const expiry =
    expiresAt !== null && purchase.purchasedAt >= expiresAt && position.lapPoints > 0
      ? { points: -position.lapPoints, at: expiresAt }
      : null;
  const outcome = earnFromPurchase({
    lap: position.lap,
    lapPoints: expiry ? 0 : position.lapPoints,
    amountPaid: purchase.amountPaid,
    at: purchase.purchasedAt,
  });
  const written = await store.recordPurchasePoints(purchase.memberId, purchase.id, outcome, expiry);

  return {
    purchaseId: purchase.id,
    channel: purchase.channel,
    points: outcome.points,
    alreadyRecorded: !written.applied,
    openedStops: written.openedStops,
  };
}
