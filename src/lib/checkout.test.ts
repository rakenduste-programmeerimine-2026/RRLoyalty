import { beforeEach, describe, expect, it } from "vitest";
import { EmptyCartError, checkoutCart, isCheckoutRef, orderNumberFor } from "./checkout";
import { MemoryPurchaseStore } from "./memory-purchase-store";
import { PurchaseConflictError } from "./purchases";
import type { Book } from "./sample-data";

const memberId = "member-1";
const at = new Date("2026-11-08T12:00:00Z");
const ref = "0f8b2c4e-1a2b-4c3d-8e9f-0123456789ab";
const catalog: Book[] = [
  { slug: "sugisene-raamatupood", title: "Sügisene raamatupood", author: "Mari Näidis", price: 20, cover: "aubergine" },
  { slug: "lounatuul", title: "Lõunatuul", author: "Mari Näidis", price: 17.9, cover: "aqua" },
];

let store: MemoryPurchaseStore;

beforeEach(() => {
  store = new MemoryPurchaseStore();
  store.seedPoints(memberId, 34);
});

const checkout = (lines: unknown, checkoutRef = ref, member = memberId) =>
  checkoutCart(store, { memberId: member, lines, checkoutRef, catalog, at });

describe("checkoutCart", () => {
  it("records the demo name-day order: 18 € paid, 34 → 52 points, the 50 stop opens", async () => {
    const result = await checkout([{ slug: "sugisene-raamatupood", qty: 1 }]);

    expect(result).toMatchObject({ channel: "e_shop", total: 18, points: 18, alreadyRecorded: false, openedStops: [50] });
    expect(store.pointsOf(memberId)).toBe(52);
    expect(store.purchases).toEqual([
      expect.objectContaining({
        channel: "e_shop",
        status: "processing",
        amountPaid: 18,
        externalRef: `e_shop:${ref}`,
        orderNumber: orderNumberFor(ref),
      }),
    ]);
  });

  it("prices the order from the catalog, ignoring anything else the browser sends", async () => {
    const result = await checkout([{ slug: "lounatuul", qty: 2, price: 0.01, total: 0.02 }]);

    expect(result.total).toBe(32.22);
    expect(store.purchases[0].amountPaid).toBe(32.22);
  });

  it("awards points once when the same checkout is sent twice", async () => {
    const lines = [{ slug: "sugisene-raamatupood", qty: 1 }];
    await checkout(lines);
    const again = await checkout(lines);

    expect(again).toMatchObject({ alreadyRecorded: true, openedStops: [] });
    expect(store.pointsOf(memberId)).toBe(52);
  });

  it("refuses to reuse a checkout reference for a different cart", async () => {
    await checkout([{ slug: "sugisene-raamatupood", qty: 1 }]);

    await expect(checkout([{ slug: "sugisene-raamatupood", qty: 2 }])).rejects.toBeInstanceOf(PurchaseConflictError);
  });

  it("refuses an empty cart or one with only unknown books", async () => {
    await expect(checkout([])).rejects.toBeInstanceOf(EmptyCartError);
    await expect(checkout([{ slug: "not-a-book", qty: 1 }])).rejects.toBeInstanceOf(EmptyCartError);
    await expect(checkout("not a cart")).rejects.toBeInstanceOf(EmptyCartError);
    expect(store.purchases).toHaveLength(0);
  });

  it("refuses a reference that isn't a UUID", async () => {
    await expect(checkout([{ slug: "lounatuul", qty: 1 }], "order-1")).rejects.toBeInstanceOf(RangeError);
  });
});

describe("checkout references", () => {
  it("accepts UUIDs only", () => {
    expect(isCheckoutRef(ref)).toBe(true);
    expect(isCheckoutRef("e_shop:1")).toBe(false);
    expect(isCheckoutRef(42)).toBe(false);
  });

  it("gives a short order number", () => {
    expect(orderNumberFor(ref)).toBe("RR-0F8B2C4E");
  });
});
