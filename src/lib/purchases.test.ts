import { beforeEach, describe, expect, it } from "vitest";
import { MemoryPurchaseStore } from "./memory-purchase-store";
import { CHANNELS, PurchaseConflictError, initialStatus, isChannel, recordPurchase, type Channel } from "./purchases";

const memberId = "member-1";
const at = new Date("2026-11-08T12:00:00Z");

let store: MemoryPurchaseStore;

beforeEach(() => {
  store = new MemoryPurchaseStore();
  store.seedPoints(memberId, 34);
});

const buy = (channel: Channel, amountPaid: number, externalRef: string) =>
  recordPurchase(store, { memberId, channel, amountPaid, externalRef, purchasedAt: at });

describe("recordPurchase", () => {
  it.each(CHANNELS)("updates the member's points for a %s purchase", async (channel) => {
    const result = await buy(channel, 18.99, `${channel}-1`);

    expect(result).toMatchObject({ channel, points: 18, alreadyRecorded: false });
    expect(store.pointsOf(memberId)).toBe(52);
  });

  it.each(CHANNELS)("stores the %s channel on the purchase", async (channel) => {
    const result = await buy(channel, 10, `${channel}-1`);

    expect(store.purchases).toEqual([
      expect.objectContaining({ id: result.purchaseId, channel, status: initialStatus(channel), amountPaid: 10 }),
    ]);
  });

  it("awards points once when the same purchase is processed twice", async () => {
    const first = await buy("e_shop", 18, "order-1001");
    const second = await buy("e_shop", 18, "order-1001");

    expect(first.alreadyRecorded).toBe(false);
    expect(second).toMatchObject({ purchaseId: first.purchaseId, points: 18, alreadyRecorded: true, openedStops: [] });
    expect(store.purchases).toHaveLength(1);
    expect(store.ledger.filter((row) => row.purchaseId === first.purchaseId)).toHaveLength(1);
    expect(store.pointsOf(memberId)).toBe(52);
  });

  it("finishes the job when a retry follows a failed points write", async () => {
    store.failNextPointsWrite = true;
    await expect(buy("store", 18, "till-77")).rejects.toThrow();
    expect(store.pointsOf(memberId)).toBe(34);

    const retry = await buy("store", 18, "till-77");
    await buy("store", 18, "till-77");

    expect(retry.alreadyRecorded).toBe(false);
    expect(store.purchases).toHaveLength(1);
    expect(store.pointsOf(memberId)).toBe(52);
  });

  it("counts different purchases separately, rounding each one down", async () => {
    await buy("app", 9.5, "app-1");
    await buy("literaat", 9.5, "literaat-1");

    expect(store.pointsOf(memberId)).toBe(34 + 18);
  });

  it("opens the perks of the stops a purchase passes, once", async () => {
    const first = await buy("store", 70, "till-1");
    const again = await buy("store", 70, "till-1");

    expect(first.openedStops).toEqual([50, 100]);
    expect(again.openedStops).toEqual([]);
    expect(store.perks.map((perk) => [perk.stopAt, perk.lap])).toEqual([
      [50, 1],
      [100, 1],
    ]);
    expect(store.perks[1].chooseBy).toEqual(new Date("2026-11-11T12:00:00Z"));
  });

  it("does not open the one-time 150 stop again on a later lap", async () => {
    const lapTwo = new MemoryPurchaseStore();
    lapTwo.seedPoints(memberId, 400);
    lapTwo.seedPerk(memberId, 150, 1);

    const result = await recordPurchase(lapTwo, {
      memberId, channel: "app", amountPaid: 160, externalRef: "app-9", purchasedAt: at,
    });

    expect(result.openedStops).toEqual([50, 100]);
  });

  it("rejects the same reference sent with a different amount, channel or member", async () => {
    await buy("e_shop", 18, "order-1001");

    await expect(buy("e_shop", 19, "order-1001")).rejects.toThrow(PurchaseConflictError);
    await expect(buy("app", 18, "order-1001")).rejects.toThrow(PurchaseConflictError);
    await expect(
      recordPurchase(store, { memberId: "member-2", channel: "e_shop", amountPaid: 18, externalRef: "order-1001" }),
    ).rejects.toThrow(PurchaseConflictError);
    expect(store.pointsOf(memberId)).toBe(52);
  });

  it("treats amounts that differ only by floating-point noise as the same purchase", async () => {
    await buy("e_shop", 20, "order-1");
    const retry = await buy("e_shop", 0.1 + 0.2 + 19.7, "order-1");

    expect(retry.alreadyRecorded).toBe(true);
  });

  it("rejects an unknown channel, a bad amount or a missing reference before saving anything", async () => {
    await expect(buy("phone" as Channel, 10, "x")).rejects.toThrow(RangeError);
    await expect(buy("store", -1, "x")).rejects.toThrow(RangeError);
    await expect(buy("store", Number.NaN, "x")).rejects.toThrow(RangeError);
    await expect(buy("store", 10, "   ")).rejects.toThrow(RangeError);
    expect(store.purchases).toEqual([]);
  });
});

describe("recordPurchase after the points expire", () => {
  // Points expire 6 months after the last purchase (docs/program-rules.md).
  const lastPurchase = new Date("2026-05-13T10:00:00Z");
  const expiresAt = new Date("2026-11-13T10:00:00Z");

  const buyAt = (purchasedAt: Date, amountPaid: number, externalRef: string) =>
    recordPurchase(store, { memberId, channel: "store", amountPaid, externalRef, purchasedAt });

  beforeEach(async () => {
    // 34 seeded + 18 = 52 on lap 1, last purchase on 13 May.
    await buyAt(lastPurchase, 18, "till-may");
  });

  it("starts the lap from 0 when the purchase comes 6 months after the last one", async () => {
    const result = await buyAt(expiresAt, 60, "till-nov");

    expect(result.points).toBe(60);
    expect(result.openedStops).toEqual([50]);
    expect(store.pointsOf(memberId) % 400).toBe(60);
  });

  it("writes one expiry row of minus the lap points, dated when they expired", async () => {
    await buyAt(new Date("2027-02-01T09:00:00Z"), 10, "till-feb");

    expect(store.ledger.filter((row) => row.kind === "expiry")).toEqual([
      expect.objectContaining({ memberId, points: -52, at: expiresAt }),
    ]);
  });

  it("keeps the points a moment before the 6 months are up", async () => {
    const result = await buyAt(new Date(expiresAt.getTime() - 1), 60, "till-nov");

    expect(result.openedStops).toEqual([100]);
    expect(store.pointsOf(memberId)).toBe(112);
    expect(store.ledger.some((row) => row.kind === "expiry")).toBe(false);
  });

  it("expires once when the purchase is sent again", async () => {
    await buyAt(expiresAt, 60, "till-nov");
    const retry = await buyAt(expiresAt, 60, "till-nov");

    expect(retry.alreadyRecorded).toBe(true);
    expect(store.ledger.filter((row) => row.kind === "expiry")).toHaveLength(1);
    expect(store.pointsOf(memberId)).toBe(60);
  });

  it("expires once when a retry follows a failed points write", async () => {
    store.failNextPointsWrite = true;
    await expect(buyAt(expiresAt, 60, "till-nov")).rejects.toThrow();

    await buyAt(expiresAt, 60, "till-nov");

    expect(store.ledger.filter((row) => row.kind === "expiry")).toHaveLength(1);
    expect(store.pointsOf(memberId)).toBe(60);
  });

  it("counts from the latest earlier purchase, not one recorded later with an older date", async () => {
    await buyAt(new Date("2026-08-01T10:00:00Z"), 10, "till-aug");
    await buyAt(new Date("2026-07-01T10:00:00Z"), 10, "till-jul-late");

    const result = await buyAt(new Date("2027-01-15T10:00:00Z"), 5, "till-jan");

    expect(result.points).toBe(5);
    expect(store.pointsOf(memberId)).toBe(72 + 5);
    expect(store.ledger.some((row) => row.kind === "expiry")).toBe(false);
  });

  it("opens the stops of the lap again after expiry, but not the one-time 150 stop", async () => {
    await buyAt(new Date("2026-06-01T10:00:00Z"), 100, "till-jun"); // 152: opens 100 and 150
    await buyAt(new Date("2026-12-01T10:00:00Z"), 160, "till-dec"); // expired, 0 + 160

    expect(store.perks.map((perk) => [perk.stopAt, perk.lap, perk.restart])).toEqual([
      [50, 1, 0],
      [100, 1, 0],
      [150, 1, 0],
      [50, 1, 1],
      [100, 1, 1],
    ]);
  });

  it("writes no expiry row when the lap has no points, and keeps completed laps", async () => {
    const lapTwo = new MemoryPurchaseStore();
    lapTwo.seedPoints(memberId, 400);
    await recordPurchase(lapTwo, { memberId, channel: "app", amountPaid: 0, externalRef: "app-0", purchasedAt: lastPurchase });

    await recordPurchase(lapTwo, { memberId, channel: "app", amountPaid: 20, externalRef: "app-1", purchasedAt: expiresAt });

    expect(lapTwo.ledger.some((row) => row.kind === "expiry")).toBe(false);
    expect(lapTwo.pointsOf(memberId)).toBe(420);
  });
});

describe("initialStatus", () => {
  it("hands store purchases over at the till and processes the rest as orders", () => {
    expect(CHANNELS.map((channel) => [channel, initialStatus(channel)])).toEqual([
      ["e_shop", "processing"],
      ["store", "in_store"],
      ["literaat", "processing"],
      ["app", "processing"],
    ]);
  });
});

describe("isChannel", () => {
  it("accepts only the channels in the schema", () => {
    expect(CHANNELS.every(isChannel)).toBe(true);
    expect(isChannel("phone")).toBe(false);
    expect(isChannel(undefined)).toBe(false);
  });
});
