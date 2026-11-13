// The /demo page's clock. Pure: the real time is passed in.
//
// The demo date is stored as an offset from the real time, in a cookie
// (demo-now.ts), so the demo clock keeps running between skips and every page
// in the same browser sees the same "now". The skips only run ahead. Going
// back is only "Tagasi tänasesse" (reset): purchases and perks written at a
// demo date then sit in the future, so reset before a fresh demo, not mid-way.

import { DAY_MS, parseDay } from "./calendar-day";
import { addMonths } from "./laps";
import { todayInEstonia } from "./namesakes";

export const DEMO_COOKIE = "rr_demo_offset";

/** About five years: further ahead than any demo needs. */
export const MAX_DEMO_OFFSET_MS = 5 * 366 * DAY_MS;

export type DemoSkip = "3d" | "6m";

const HOUR_MS = 60 * 60 * 1000;

/** The stored offset in whole milliseconds, or 0 (the real date) for anything else. */
export function parseDemoOffset(value: string | undefined): number {
  if (value === undefined || !/^\d{1,15}$/.test(value)) return 0;
  const offset = Number(value);
  return offset <= MAX_DEMO_OFFSET_MS ? offset : 0;
}

export function demoNow(realNow: Date, offset: number): Date {
  return new Date(realNow.getTime() + offset);
}

/** The offset to store so the demo clock shows `demo`. Never negative. */
export function offsetFor(realNow: Date, demo: Date): number {
  return Math.min(MAX_DEMO_OFFSET_MS, Math.max(0, demo.getTime() - realNow.getTime()));
}

/** 3 days, or 6 calendar months as the points count them (laps.ts). */
export function skipAhead(now: Date, skip: DemoSkip): Date {
  return skip === "3d" ? new Date(now.getTime() + 3 * DAY_MS) : addMonths(now, 6);
}

/**
 * The same time of day on `day` ("YYYY-MM-DD", in Estonia), today or later.
 * A clock change in between moves it by an hour, so it is nudged back onto `day`.
 */
export function jumpToDay(now: Date, day: string): Date {
  const days = Math.round((parseDay(day) - parseDay(todayInEstonia(now))) / DAY_MS);
  if (days < 0) throw new RangeError(`The demo clock only runs ahead, and ${day} is in the past`);

  let target = new Date(now.getTime() + days * DAY_MS);
  const landed = todayInEstonia(target);
  if (landed < day) target = new Date(target.getTime() + HOUR_MS);
  if (landed > day) target = new Date(target.getTime() - HOUR_MS);
  return target;
}
