// E-shop checkout: turns the browser's cart into a recorded purchase.
// The browser only sends which books and how many. Prices, the discount and
// the amount paid are worked out here from the catalog, never taken from it.

import { parseCart, summarizeCart, type CartLine, type PricedCartBook } from "./cart";
import type { PurchaseStore } from "./purchase-store";
import { recordPurchase, type RecordedPurchase } from "./purchases";

const CHECKOUT_REF = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class EmptyCartError extends Error {
  constructor() {
    super("The cart has no books that can be bought");
    this.name = "EmptyCartError";
  }
}

export function isCheckoutRef(value: unknown): value is string {
  return typeof value === "string" && CHECKOUT_REF.test(value);
}

/** The order number shown to the member, derived from the checkout reference. */
export function orderNumberFor(checkoutRef: string): string {
  return `RR-${checkoutRef.replaceAll("-", "").slice(0, 8).toUpperCase()}`;
}

export type CheckoutRequest = {
  memberId: string;
  /** Untrusted: whatever the browser sent. */
  lines: unknown;
  /** Made once per checkout in the browser and sent again on a retry. */
  checkoutRef: string;
  /** Priced for this member on the server. */
  catalog: PricedCartBook[];
  at?: Date;
};

export type CheckoutResult = RecordedPurchase & { orderNumber: string; total: number };

export async function checkoutCart(store: PurchaseStore, request: CheckoutRequest): Promise<CheckoutResult> {
  if (!isCheckoutRef(request.checkoutRef)) {
    throw new RangeError("A checkout needs a UUID reference");
  }

  const lines: CartLine[] = Array.isArray(request.lines) ? parseCart(JSON.stringify(request.lines)) : [];
  const summary = summarizeCart(lines, request.catalog);
  if (summary.count === 0) throw new EmptyCartError();

  const orderNumber = orderNumberFor(request.checkoutRef);
  const recorded = await recordPurchase(store, {
    memberId: request.memberId,
    channel: "e_shop",
    amountPaid: summary.total,
    externalRef: `e_shop:${request.checkoutRef.toLowerCase()}`,
    orderNumber,
    purchasedAt: request.at,
  });

  return { ...recorded, orderNumber, total: summary.total };
}
