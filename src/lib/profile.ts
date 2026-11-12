// "Minu andmed": what the member may change, and how it is checked.
// The first name is read-only (decided on #58): it decides the member's name
// day and namesake authors. The email is the sign-in and is read-only too.

import { DAY_MS, formatDay, parseDay } from "./calendar-day";
import type { NameDay } from "./name-day";

export type ProfileInput = { lastName: string; phone: string; birthday: string };

/** Cleaned values ready to save; empty fields become null. */
export type ProfileUpdate = { lastName: string | null; phone: string | null; birthday: string | null };

export type ProfileErrors = Partial<Record<keyof ProfileInput, string>>;

export type ProfileCheck = { ok: true; update: ProfileUpdate } | { ok: false; errors: ProfileErrors };

const MAX_LAST_NAME = 60;
const PHONE = /^\+?[0-9][0-9 ]{4,19}$/;

/** Checks the form on the server. `today` is "YYYY-MM-DD". Messages are in Estonian for the form. */
export function checkProfile(input: ProfileInput, today: string): ProfileCheck {
  const errors: ProfileErrors = {};
  const lastName = input.lastName.trim().replace(/\s+/g, " ");
  const phone = input.phone.trim().replace(/\s+/g, " ");
  const birthday = input.birthday.trim();

  if (lastName.length > MAX_LAST_NAME) errors.lastName = `Perekonnanimi võib olla kuni ${MAX_LAST_NAME} märki.`;

  if (phone && !PHONE.test(phone)) errors.phone = "Sisesta telefon numbritena, näiteks +372 5123 4567.";

  if (birthday) {
    let time: number | null = null;
    try {
      time = parseDay(birthday);
    } catch {
      errors.birthday = "Sisesta kuupäev kujul pp.kk.aaaa.";
    }
    if (time !== null) {
      if (time > parseDay(today)) errors.birthday = "Sünnipäev ei saa olla tulevikus.";
      else if (new Date(time).getUTCFullYear() < 1900) errors.birthday = "Kontrolli sünniaastat.";
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, update: { lastName: lastName || null, phone: phone || null, birthday: birthday || null } };
}

/**
 * The member's next name day from `today` ("YYYY-MM-DD"), today included, or null when the
 * name has none. A 29 February name day is skipped in years without one.
 */
export function nextNameDay(nameDays: NameDay[], today: string): string | null {
  const start = parseDay(today);
  const year = new Date(start).getUTCFullYear();
  let next: number | null = null;
  for (const nameDay of nameDays) {
    // Up to four years ahead, so a 29 February name day always finds a leap year.
    for (let candidateYear = year; candidateYear <= year + 4; candidateYear++) {
      const time = Date.UTC(candidateYear, nameDay.month - 1, nameDay.day);
      const date = new Date(time);
      if (date.getUTCMonth() !== nameDay.month - 1 || date.getUTCDate() !== nameDay.day) continue;
      if (time >= start) {
        if (next === null || time < next) next = time;
        break;
      }
    }
  }
  return next === null ? null : formatDay(next);
}

/** Days from `today` to `day`, both "YYYY-MM-DD". */
export function daysUntil(day: string, today: string): number {
  return Math.round((parseDay(day) - parseDay(today)) / DAY_MS);
}
