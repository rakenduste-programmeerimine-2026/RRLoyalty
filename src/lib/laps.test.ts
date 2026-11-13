import { describe, expect, it } from "vitest";
import { addMonths, applyPurchase, expirePoints, lapPointsAt, pointsExpireAt, type MemberPoints } from "./laps";
import type { PerkToOpen } from "./points";

const lastPurchase = new Date("2026-05-10T12:00:00Z");

const earlierPerk: PerkToOpen = {
  stopAt: 50,
  lap: 1,
  openedAt: lastPurchase,
  expiresAt: new Date("2026-07-09T12:00:00Z"),
  chooseBy: null,
};

const member = (overrides: Partial<MemberPoints> = {}): MemberPoints => ({
  lap: 1,
  lapPoints: 0,
  lifetimeTotal: 0,
  lastPurchaseAt: lastPurchase,
  appPerkGiven: false,
  perks: [],
  ...overrides,
});

describe("pointsExpireAt", () => {
  it("is 6 months after the last purchase", () => {
    expect(pointsExpireAt(lastPurchase)).toEqual(new Date("2026-11-10T12:00:00Z"));
  });

  it("falls on the last day of a shorter month, as Postgres interval '6 months' does", () => {
    expect(pointsExpireAt(new Date("2026-08-31T09:00:00Z"))).toEqual(new Date("2027-02-28T09:00:00Z"));
  });
});

describe("expirePoints", () => {
  it("keeps the points until 6 months have passed", () => {
    const state = member({ lap: 2, lapPoints: 120, lifetimeTotal: 520 });

    const result = expirePoints(state, new Date("2026-11-10T11:59:59Z"));

    expect(result.expiredPoints).toBe(0);
    expect(result.state).toEqual(state);
  });

  it("sets the current lap to 0 once 6 months have passed since the last purchase", () => {
    const result = expirePoints(member({ lap: 2, lapPoints: 120, lifetimeTotal: 520 }), new Date("2026-11-10T12:00:00Z"));

    expect(result.expiredPoints).toBe(120);
    expect(result.state.lapPoints).toBe(0);
  });

  it("keeps perks, completed laps and the lifetime total", () => {
    const result = expirePoints(
      member({ lap: 3, lapPoints: 120, lifetimeTotal: 920, appPerkGiven: true, perks: [earlierPerk] }),
      new Date("2027-01-01T00:00:00Z"),
    );

    expect(result.state).toEqual(
      member({ lap: 3, lapPoints: 0, lifetimeTotal: 920, appPerkGiven: true, perks: [earlierPerk] }),
    );
  });

  it("has nothing to expire for a member without a purchase", () => {
    const state = member({ lastPurchaseAt: null });

    expect(expirePoints(state, new Date("2030-01-01T00:00:00Z"))).toEqual({ state, expiredPoints: 0 });
  });

  it("expires nothing twice", () => {
    const now = new Date("2027-01-01T00:00:00Z");
    const once = expirePoints(member({ lapPoints: 120, lifetimeTotal: 120 }), now);

    expect(expirePoints(once.state, now)).toEqual({ state: once.state, expiredPoints: 0 });
  });
});

describe("applyPurchase", () => {
  it("carries over into the next lap: 390 + 25 gives 15", () => {
    const result = applyPurchase(member({ lapPoints: 390, lifetimeTotal: 390 }), {
      amountPaid: 25,
      at: new Date("2026-06-01T12:00:00Z"),
    });

    expect(result.state.lap).toBe(2);
    expect(result.state.lapPoints).toBe(15);
    expect(result.state.lifetimeTotal).toBe(415);
    expect(result.perks.map((perk) => [perk.stopAt, perk.lap])).toEqual([[400, 1]]);
  });

  it("keeps earlier perks through a lap reset and adds the new ones", () => {
    const result = applyPurchase(member({ lapPoints: 390, lifetimeTotal: 390, perks: [earlierPerk] }), {
      amountPaid: 25,
      at: new Date("2026-06-01T12:00:00Z"),
    });

    expect(result.state.perks).toEqual([earlierPerk, ...result.perks]);
  });

  it("restarts the 6 months with each purchase", () => {
    const bought = applyPurchase(member({ lapPoints: 120, lifetimeTotal: 120 }), {
      amountPaid: 10,
      at: new Date("2026-10-01T12:00:00Z"),
    });

    expect(bought.state.lastPurchaseAt).toEqual(new Date("2026-10-01T12:00:00Z"));
    expect(expirePoints(bought.state, new Date("2027-03-01T00:00:00Z")).expiredPoints).toBe(0);
  });

  it("expires stale points before earning, so Gustav starts again from Start", () => {
    const result = applyPurchase(member({ lap: 2, lapPoints: 200, lifetimeTotal: 600, perks: [earlierPerk] }), {
      amountPaid: 60,
      at: new Date("2026-12-24T12:00:00Z"),
    });

    expect(result.expiredPoints).toBe(200);
    expect(result.state).toMatchObject({ lap: 2, lapPoints: 60, lifetimeTotal: 660 });
    expect(result.perks.map((perk) => [perk.stopAt, perk.lap])).toEqual([[50, 2]]);
    expect(result.state.perks[0]).toEqual(earlierPerk);
  });

  it("remembers the 150 app perk so a later lap does not give it again", () => {
    const first = applyPurchase(member({ lapPoints: 140, lifetimeTotal: 140 }), {
      amountPaid: 10,
      at: new Date("2026-06-01T12:00:00Z"),
    });
    const later = applyPurchase(
      { ...first.state, lap: 2, lapPoints: 140 },
      { amountPaid: 10, at: new Date("2026-07-01T12:00:00Z") },
    );

    expect(first.perks.map((perk) => perk.stopAt)).toEqual([150]);
    expect(first.state.appPerkGiven).toBe(true);
    expect(later.perks).toEqual([]);
  });

  it("does not give the 150 app perk again after expiry", () => {
    const given = member({ lapPoints: 160, lifetimeTotal: 160, appPerkGiven: true });

    const result = applyPurchase(given, { amountPaid: 150, at: new Date("2027-01-01T12:00:00Z") });

    expect(result.expiredPoints).toBe(160);
    expect(result.perks.map((perk) => perk.stopAt)).toEqual([50, 100]);
  });
});

describe("addMonths", () => {
  it("keeps the time and moves to the last day of a shorter month", () => {
    expect(addMonths(new Date("2026-11-13T10:30:00Z"), 6)).toEqual(new Date("2027-05-13T10:30:00Z"));
    expect(addMonths(new Date("2026-08-31T09:00:00Z"), 6)).toEqual(new Date("2027-02-28T09:00:00Z"));
  });
});

describe("lapPointsAt", () => {
  const expiresAt = new Date("2026-11-10T12:00:00Z");

  it("shows the lap points until they expire", () => {
    expect(lapPointsAt(120, lastPurchase, new Date(expiresAt.getTime() - 1))).toBe(120);
  });

  it("shows 0 once the 6 months are up, before an expiry row is written", () => {
    expect(lapPointsAt(120, lastPurchase, expiresAt)).toBe(0);
  });

  it("shows the points of a member without a purchase", () => {
    expect(lapPointsAt(34, null, new Date("2030-01-01T00:00:00Z"))).toBe(34);
  });
});
