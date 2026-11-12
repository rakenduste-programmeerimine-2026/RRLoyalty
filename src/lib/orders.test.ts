import { describe, expect, it } from "vitest";
import { orderWhere, ordersView, type OrderRow } from "./orders";

const row = (overrides: Partial<OrderRow>): OrderRow => ({
  id: 1,
  channel: "e_shop",
  location: null,
  amountPaid: 18,
  orderNumber: "RR-0F8B2C4E",
  status: "processing",
  purchasedAt: new Date("2026-11-12T10:00:00Z"),
  points: 18,
  ...overrides,
});

describe("ordersView", () => {
  it("lists the newest purchase first, with where, status and points", () => {
    const view = ordersView([
      row({ id: 1, channel: "store", location: "Viru Keskus", status: "in_store", purchasedAt: new Date("2026-08-15T09:00:00Z"), points: 11 }),
      row({ id: 3, channel: "literaat", location: "Telliskivi", status: "in_store", purchasedAt: new Date("2026-09-03T09:00:00Z"), points: 9 }),
      row({ id: 2, channel: "app", status: "delivered", purchasedAt: new Date("2026-08-28T09:00:00Z"), points: 14 }),
    ]);
    expect(view.map((order) => [order.id, order.where, order.status, order.points])).toEqual([
      [3, "Literaat Telliskivi", "Ostetud kauplusest", 9],
      [2, "Äpp", "Kohale toimetatud", 14],
      [1, "Kauplus Viru Keskus", "Ostetud kauplusest", 11],
    ]);
  });

  it("keeps a purchase whose points aren't written yet", () => {
    expect(ordersView([row({ points: null })])[0]).toMatchObject({ status: "Töötlemisel", points: null });
  });

  it("is empty with no purchases", () => {
    expect(ordersView([])).toEqual([]);
  });
});

describe("orderWhere", () => {
  it("names the channel, and the place when there is one", () => {
    expect(orderWhere("e_shop", null)).toBe("E-pood");
    expect(orderWhere("store", "Viru Keskus")).toBe("Kauplus Viru Keskus");
  });
});
