// Calendar days as "YYYY-MM-DD" strings, shared by the name-day and birthday
// rules. The caller always passes "today" in, so /demo can move it without
// touching the system clock.

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Midnight UTC of a "YYYY-MM-DD" day, in milliseconds. Throws on anything else, 2026-02-30 included. */
export function parseDay(value: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const time = match ? Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : NaN;
  if (Number.isNaN(time) || formatDay(time) !== value) {
    throw new RangeError(`Expected a calendar date as YYYY-MM-DD, got "${value}"`);
  }
  return time;
}

export function formatDay(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}
