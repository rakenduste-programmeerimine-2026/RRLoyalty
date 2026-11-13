// Birthday reward: a 5 € card shown as a code only, once a year.
// Rules: docs/program-rules.md (Name day and birthday).
//
// The card is an ordinary perk: a perks row with source 'birthday', lasting
// PERK_DAYS like every other perk. The schema's perks_birthday_once_per_year
// index allows one per member per birthday_year, so triggering it twice is safe.
//
// "today" is a "YYYY-MM-DD" calendar day passed in by the caller, so /demo
// can trigger a birthday without touching the system clock.

import { DAY_MS, formatDay, parseDay } from "./calendar-day";
import { randomCodePart } from "./codes";
import { PERK_DAYS } from "./points";

export const BIRTHDAY_CODE_PREFIX = "SYNNIPAEV-";

const CODE_LENGTH = 4;

export type BirthdayCard = {
  /** The calendar year of the birthday: one card per member per year. */
  birthdayYear: number;
  openedAt: Date;
  expiresAt: Date;
  code: string;
};

const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

/**
 * True when `today` is the member's birthday. Someone born on 29 February
 * celebrates on 28 February in a year without one.
 */
export function isBirthday(birthday: string, today: string): boolean {
  const born = new Date(parseDay(birthday));
  const now = new Date(parseDay(today));
  if (now < born) return false;

  const month = born.getUTCMonth();
  let day = born.getUTCDate();
  if (month === 1 && day === 29 && !isLeapYear(now.getUTCFullYear())) day = 28;

  return now.getUTCMonth() === month && now.getUTCDate() === day;
}

/** The first day from `today` on, today included, that isBirthday() is true. For /demo's birthday jump. */
export function nextBirthday(birthday: string, today: string): string {
  const start = Math.max(parseDay(today), parseDay(birthday));
  // At most a year and a day ahead.
  for (let time = start; time <= start + 367 * DAY_MS; time += DAY_MS) {
    if (isBirthday(birthday, formatDay(time))) return formatDay(time);
  }
  throw new RangeError(`No birthday found after ${today} for ${birthday}`);
}

/** A code like SYNNIPAEV-7K2M. Pass bytes in tests; otherwise they are random. */
export function birthdayCode(bytes?: Uint8Array): string {
  return BIRTHDAY_CODE_PREFIX + randomCodePart(CODE_LENGTH, bytes);
}

/** The card to give on `today`, or null when `today` is not the member's birthday. */
export function birthdayCard(birthday: string, today: string, code: string): BirthdayCard | null {
  if (!isBirthday(birthday, today)) return null;
  const openedAt = new Date(parseDay(today));
  return {
    birthdayYear: openedAt.getUTCFullYear(),
    openedAt,
    expiresAt: new Date(openedAt.getTime() + PERK_DAYS * DAY_MS),
    code,
  };
}

/** What giving the card needs from the database. The Supabase version is in supabase-birthday-store.ts. */
export interface BirthdayStore {
  /** members.birthday as "YYYY-MM-DD", or null when the member has none on file. */
  memberBirthday(memberId: string): Promise<string | null>;
  /** Writes the perks row. Returns false when the member already has that year's card. */
  insertBirthdayPerk(memberId: string, card: BirthdayCard): Promise<boolean>;
}

export type BirthdayResult =
  | ({ status: "given" } & BirthdayCard)
  | { status: "already_given"; birthdayYear: number }
  | { status: "not_birthday" }
  | { status: "no_birthday" };

/** Gives the member this year's birthday card if `today` is their birthday. Safe to call again. */
export async function giveBirthdayCard(
  store: BirthdayStore,
  { memberId, today }: { memberId: string; today: string },
): Promise<BirthdayResult> {
  const birthday = await store.memberBirthday(memberId);
  if (birthday === null) return { status: "no_birthday" };

  const card = birthdayCard(birthday, today, birthdayCode());
  if (card === null) return { status: "not_birthday" };

  const inserted = await store.insertBirthdayPerk(memberId, card);
  return inserted ? { status: "given", ...card } : { status: "already_given", birthdayYear: card.birthdayYear };
}
