import { describe, expect, it } from "vitest";
import { DAY_MS } from "./calendar-day";
import { MAX_DEMO_OFFSET_MS, demoNow, jumpToDay, offsetFor, parseDemoOffset, skipAhead } from "./demo-clock";
import { todayInEstonia } from "./namesakes";

const real = new Date("2026-11-13T10:30:00Z"); // 12:30 in Tallinn

describe("parseDemoOffset", () => {
  it("reads a stored offset in milliseconds", () => {
    expect(parseDemoOffset(String(3 * DAY_MS))).toBe(3 * DAY_MS);
  });

  it("falls back to the real date for a missing, broken, negative or huge value", () => {
    expect(parseDemoOffset(undefined)).toBe(0);
    expect(parseDemoOffset("soon")).toBe(0);
    expect(parseDemoOffset("1.5")).toBe(0);
    expect(parseDemoOffset("-1000")).toBe(0);
    expect(parseDemoOffset(String(MAX_DEMO_OFFSET_MS + 1))).toBe(0);
  });
});

describe("demoNow and offsetFor", () => {
  it("runs the demo clock ahead of the real one by the offset", () => {
    expect(demoNow(real, 3 * DAY_MS)).toEqual(new Date("2026-11-16T10:30:00Z"));
    expect(offsetFor(real, new Date("2026-11-16T10:30:00Z"))).toBe(3 * DAY_MS);
  });

  it("never stores a demo date before the real one", () => {
    expect(offsetFor(real, new Date("2026-11-01T00:00:00Z"))).toBe(0);
  });
});

describe("skipAhead", () => {
  it("skips 3 days", () => {
    expect(skipAhead(real, "3d")).toEqual(new Date("2026-11-16T10:30:00Z"));
  });

  it("skips 6 calendar months, like the points' 6 months", () => {
    expect(skipAhead(real, "6m")).toEqual(new Date("2027-05-13T10:30:00Z"));
    expect(skipAhead(new Date("2026-08-31T09:00:00Z"), "6m")).toEqual(new Date("2027-02-28T09:00:00Z"));
  });
});

describe("jumpToDay", () => {
  it("moves to the same time of day on a later day in Estonia", () => {
    expect(jumpToDay(real, "2026-11-19")).toEqual(new Date("2026-11-19T10:30:00Z"));
  });

  it("stays put when the day is today", () => {
    expect(jumpToDay(real, "2026-11-13")).toEqual(real);
  });

  it("lands on the right Estonian day across a clock change", () => {
    // 23:30 on 24 October in Tallinn (summer time); clocks go back on 25 October 2026.
    const lateEvening = new Date("2026-10-24T20:30:00Z");
    expect(todayInEstonia(jumpToDay(lateEvening, "2026-11-01"))).toBe("2026-11-01");
    // 00:30 on 28 March in Tallinn (winter time); clocks go forward on 29 March 2026.
    const pastMidnight = new Date("2026-03-27T22:30:00Z");
    expect(todayInEstonia(jumpToDay(pastMidnight, "2026-04-02"))).toBe("2026-04-02");
  });

  it("refuses a day in the past", () => {
    expect(() => jumpToDay(real, "2026-11-12")).toThrow(RangeError);
  });
});
