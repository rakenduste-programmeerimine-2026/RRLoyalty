import { describe, expect, it } from "vitest";
import { earnFromPurchase, pointsForPurchase, stopsPassed } from "./points";

const at = new Date("2026-11-08T12:00:00Z");
const daysAfter = (days: number) => new Date(at.getTime() + days * 24 * 60 * 60 * 1000);

describe("pointsForPurchase", () => {
  it("earns 1 point per whole euro paid", () => {
    expect(pointsForPurchase(18)).toBe(18);
  });

  it("rounds down per purchase", () => {
    expect(pointsForPurchase(18.99)).toBe(18);
  });

  it("earns nothing below one euro", () => {
    expect(pointsForPurchase(0.99)).toBe(0);
    expect(pointsForPurchase(0)).toBe(0);
  });

  it("is not thrown off by floating-point cents", () => {
    // 0.1 + 0.2 + 19.7 is 19.999999999999996 in floating point, but €20.00 paid.
    expect(pointsForPurchase(0.1 + 0.2 + 19.7)).toBe(20);
  });

  it("rounds each purchase separately, not their sum", () => {
    expect(pointsForPurchase(9.5) + pointsForPurchase(9.5)).toBe(18);
  });

  it("rejects a negative or non-numeric amount", () => {
    expect(() => pointsForPurchase(-1)).toThrow(RangeError);
    expect(() => pointsForPurchase(Number.NaN)).toThrow(RangeError);
  });
});

describe("stopsPassed", () => {
  it("includes a stop reached exactly", () => {
    expect(stopsPassed(34, 16).map((stop) => stop.at)).toEqual([50]);
  });

  it("does not reopen the stop the member already stands on", () => {
    expect(stopsPassed(50, 10)).toEqual([]);
  });

  it("is empty when no stop is reached", () => {
    expect(stopsPassed(34, 15)).toEqual([]);
  });

  it("includes every stop passed in one purchase", () => {
    expect(stopsPassed(40, 125).map((stop) => stop.at)).toEqual([50, 100, 150]);
  });

  it("ends at the last stop of the lap", () => {
    expect(stopsPassed(390, 25).map((stop) => stop.at)).toEqual([400]);
  });
});

describe("earnFromPurchase", () => {
  it("returns the points earned and the new lap points", () => {
    const outcome = earnFromPurchase({ lap: 1, lapPoints: 34, amountPaid: 18.99, at });

    expect(outcome.points).toBe(18);
    expect(outcome.lapPointsAfter).toBe(52);
  });

  it("opens the perk of a stop reached exactly", () => {
    const outcome = earnFromPurchase({ lap: 1, lapPoints: 34, amountPaid: 16, at });

    expect(outcome.perks).toEqual([
      { stopAt: 50, lap: 1, openedAt: at, expiresAt: daysAfter(60), chooseBy: null },
    ]);
  });

  it("opens every perk passed in one purchase", () => {
    const outcome = earnFromPurchase({ lap: 2, lapPoints: 240, amountPaid: 115.5, at });

    expect(outcome.points).toBe(115);
    expect(outcome.perks.map((perk) => [perk.stopAt, perk.lap])).toEqual([
      [250, 2],
      [300, 2],
      [350, 2],
    ]);
  });

  it("gives prize stops 3 days to choose", () => {
    const outcome = earnFromPurchase({ lap: 1, lapPoints: 90, amountPaid: 120, at });

    expect(outcome.perks.map((perk) => [perk.stopAt, perk.chooseBy])).toEqual([
      [100, daysAfter(3)],
      [150, null],
      [200, daysAfter(3)],
    ]);
  });

  it("opens no perk when no stop is reached", () => {
    const outcome = earnFromPurchase({ lap: 1, lapPoints: 34, amountPaid: 15.99, at });

    expect(outcome.perks).toEqual([]);
  });

  it("opens the 400 prize when the purchase reaches the end of the lap", () => {
    const outcome = earnFromPurchase({ lap: 1, lapPoints: 390, amountPaid: 25, at });

    expect(outcome.points).toBe(25);
    expect(outcome.perks.map((perk) => perk.stopAt)).toEqual([400]);
  });

  it("rejects lap points outside one lap", () => {
    expect(() => earnFromPurchase({ lap: 1, lapPoints: 400, amountPaid: 5, at })).toThrow(RangeError);
    expect(() => earnFromPurchase({ lap: 0, lapPoints: 0, amountPaid: 5, at })).toThrow(RangeError);
  });
});

describe("earnFromPurchase across laps", () => {
  it("carries extra points into the next lap: 390 + 25 gives 15", () => {
    const outcome = earnFromPurchase({ lap: 1, lapPoints: 390, amountPaid: 25, at });

    expect(outcome.lapAfter).toBe(2);
    expect(outcome.lapPointsAfter).toBe(15);
  });

  it("starts the next lap on 0 when a purchase lands exactly on 400", () => {
    const outcome = earnFromPurchase({ lap: 3, lapPoints: 380, amountPaid: 20, at });

    expect(outcome.lapAfter).toBe(4);
    expect(outcome.lapPointsAfter).toBe(0);
    expect(outcome.perks.map((perk) => [perk.stopAt, perk.lap])).toEqual([[400, 3]]);
  });

  it("stays on the lap below 400", () => {
    const outcome = earnFromPurchase({ lap: 2, lapPoints: 34, amountPaid: 18, at });

    expect(outcome.lapAfter).toBe(2);
    expect(outcome.lapPointsAfter).toBe(52);
  });

  it("opens the next lap's stops passed by the carried-over points", () => {
    const outcome = earnFromPurchase({ lap: 1, lapPoints: 390, amountPaid: 70, at });

    expect(outcome.lapPointsAfter).toBe(60);
    expect(outcome.perks.map((perk) => [perk.stopAt, perk.lap])).toEqual([
      [400, 1],
      [50, 2],
    ]);
  });

  it("opens the repeat perks again on a later lap", () => {
    const outcome = earnFromPurchase({ lap: 2, lapPoints: 0, amountPaid: 400, at, appPerkGiven: true });

    expect(outcome.perks.map((perk) => [perk.stopAt, perk.lap])).toEqual([
      [50, 2],
      [100, 2],
      [200, 2],
      [250, 2],
      [300, 2],
      [350, 2],
      [400, 2],
    ]);
  });

  it("opens the 150 app perk when the member has never had it", () => {
    const outcome = earnFromPurchase({ lap: 2, lapPoints: 140, amountPaid: 10, at, appPerkGiven: false });

    expect(outcome.perks.map((perk) => [perk.stopAt, perk.lap])).toEqual([[150, 2]]);
  });

  it("skips the 150 app perk once the member has had it", () => {
    const outcome = earnFromPurchase({ lap: 2, lapPoints: 140, amountPaid: 70, at, appPerkGiven: true });

    expect(outcome.perks.map((perk) => perk.stopAt)).toEqual([200]);
  });

  it("gives the 150 app perk only once in a purchase that passes it on two laps", () => {
    const outcome = earnFromPurchase({ lap: 1, lapPoints: 100, amountPaid: 500, at });

    expect(outcome.lapAfter).toBe(2);
    expect(outcome.lapPointsAfter).toBe(200);
    expect(outcome.perks.filter((perk) => perk.stopAt === 150).map((perk) => perk.lap)).toEqual([1]);
    expect(outcome.perks.map((perk) => [perk.stopAt, perk.lap])).toContainEqual([200, 2]);
  });
});
