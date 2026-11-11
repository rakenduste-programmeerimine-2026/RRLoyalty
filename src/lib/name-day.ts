// Name-day discount: pure rules, no database or clock.
// Rules: docs/program-rules.md (Name day and birthday).
//
// Dates are calendar days as "YYYY-MM-DD" strings, always passed in by the
// caller, so /demo can move "today" without touching the system clock.

import { nameDayPrice } from "./money";

/** One row of the name_days table. */
export type NameDay = { name: string; month: number; day: number };

/** The offer lasts 7 days: the name day itself and the 6 days after it. */
export const NAME_DAY_OFFER_DAYS = 7;

export type NameDayOffer = {
  firstName: string;
  /** The name day that opened the offer. */
  nameDay: string;
  /** The last day the discount applies, inclusive. */
  lastDay: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** The author's first name must equal the member's first name exactly: same case, spacing and accents. */
export function isNamesake(memberFirstName: string, authorFirstName: string): boolean {
  return memberFirstName === authorFirstName;
}

function parseDay(value: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const time = match ? Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : NaN;
  if (Number.isNaN(time) || formatDay(time) !== value) {
    throw new RangeError(`Expected a calendar date as YYYY-MM-DD, got "${value}"`);
  }
  return time;
}

function formatDay(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}

/** The name day in the given year, or null when it does not exist that year (29 February). */
function nameDayIn(year: number, nameDay: NameDay): number | null {
  const time = Date.UTC(year, nameDay.month - 1, nameDay.day);
  const date = new Date(time);
  return date.getUTCMonth() === nameDay.month - 1 && date.getUTCDate() === nameDay.day ? time : null;
}

/**
 * The member's open name-day offer on `today`, or null when there is none.
 * A name day late in December carries its offer into January. When a name has
 * several name days, the one whose offer runs longest wins.
 */
export function nameDayOffer(firstName: string, nameDays: NameDay[], today: string): NameDayOffer | null {
  const now = parseDay(today);
  const year = new Date(now).getUTCFullYear();

  let opened: number | null = null;
  for (const nameDay of nameDays) {
    if (nameDay.name !== firstName) continue;
    for (const candidateYear of [year - 1, year]) {
      const start = nameDayIn(candidateYear, nameDay);
      if (start === null) continue;
      const last = start + (NAME_DAY_OFFER_DAYS - 1) * DAY_MS;
      if (start <= now && now <= last && (opened === null || start > opened)) opened = start;
    }
  }

  if (opened === null) return null;
  return {
    firstName,
    nameDay: formatDay(opened),
    lastDay: formatDay(opened + (NAME_DAY_OFFER_DAYS - 1) * DAY_MS),
  };
}

/** A book's price for the member: 10% off when the offer is open and the author is a namesake. */
export function namesakePrice(book: { price: number; authorFirstName: string }, offer: NameDayOffer | null): number {
  if (offer && isNamesake(offer.firstName, book.authorFirstName)) return nameDayPrice(book.price);
  return book.price;
}
