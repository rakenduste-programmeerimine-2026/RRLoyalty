// Perk redemption: one system for every perk a member holds.
// Rules: docs/program-rules.md (Perks, The rail and laps).
//
//   * Prize stops (100, 200, 300, 400): 3 days to choose a 5 € gift card or a
//     donation. With no choice by then, the gift card is given automatically.
//     The gift card lasts 60 days from the choice, or from the end of the 3
//     days when it was given automatically. A donation spends the perk at once.
//   * Stop 50: a hot drink or a week free in the app. Picking either spends it;
//     the app week is shown as a code.
//   * Stop 150 and the birthday card: code only, spent with "Märgi kasutatuks".
//   * Stops 250 and 350: spent with "Märgi kasutatuks".
//   * Every perk lasts 60 days from when it opened.
//
// Perks are rows of their own, not part of the points: a lap reset or point
// expiry never touches them. Every function takes "now" from the caller, so
// /demo can skip ahead 3 days without touching the system clock.
//
// Double use: the store's writes are conditional (a choice is only set while
// there is none, redeemed_at only while it is empty), so two requests for the
// same perk can never both succeed.

import { DAY_MS } from "./calendar-day";
import { randomCodePart } from "./codes";
import { PERK_DAYS } from "./points";
import { STOPS } from "./rail";

export type PrizeChoice = "gift_card" | "donation";
/** Stop 50's two options. */
export type DrinkOrApp = "hot_drink" | "app_week";
/** Matches perks.choice in the database. */
export type PerkChoice = PrizeChoice | DrinkOrApp;

export const GIFT_CARD_AMOUNT = 5;
export const GIFT_CARD_MIN_PURCHASE = 20;

/** The stop whose perk is a hot drink or a week free in the app. */
export const DRINK_OR_APP_STOP = 50;

/** A perks row, with its gift card once one has been given. */
export type Perk = {
  id: number;
  memberId: string;
  source: "rail" | "birthday";
  stopAt: number | null;
  lap: number | null;
  openedAt: Date;
  expiresAt: Date;
  /** Prize stops only: the last moment to choose. */
  chooseBy: Date | null;
  choice: PerkChoice | null;
  /** Code-only perks: stop 150, the app week and the birthday card. */
  code: string | null;
  /** Set by "Märgi kasutatuks", or by choosing a donation or stop 50's option. */
  redeemedAt: Date | null;
  giftCard: { code: string; validUntil: Date } | null;
};

/**
 * prize: gift card or donation (100, 200, 300, 400)
 * drink_or_app: hot drink or app week (50)
 * code: shown as a code only (150, the birthday card)
 * direct: spent as it is (250, 350)
 */
export type PerkKind = "prize" | "drink_or_app" | "code" | "direct";

/**
 * choosing: a prize stop within its 3 days, with no choice yet
 * unclaimed: a prize stop past its 3 days, waiting for its automatic gift card
 * available: can be spent
 * used: spent
 * expired: its 60 days are over
 */
export type PerkStatus = "choosing" | "unclaimed" | "available" | "used" | "expired";

/** Why a choice or redemption was refused. */
export type PerkRefusal =
  | "not_found"
  | "not_a_prize"
  | "already_chosen"
  | "choice_closed"
  | "choose_first"
  | "already_used"
  | "expired"
  | "invalid_choice";

/** Saves a prize choice: the perk's choice, plus a gift_cards or donations row. */
export type PrizeWrite = {
  perkId: number;
  choice: PrizeChoice;
  /** When the choice was made, or the end of the 3 days for an automatic gift card. */
  at: Date;
  giftCard: { code: string; validUntil: Date } | null;
  /** The donation's school, copied from settings.donation_school. */
  school: string | null;
};

/** Spends a perk: sets redeemed_at, and stop 50's choice and code. */
export type RedeemWrite = {
  perkId: number;
  at: Date;
  choice: DrinkOrApp | null;
  code: string | null;
};

const STOP_TYPES = new Map(STOPS.map((stop) => [stop.at, stop.type]));

const addDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY_MS);

/** A gift card code like GUSTAV-7K2M-5EUR, also used for its QR code. */
export function giftCardCode(bytes?: Uint8Array): string {
  return `GUSTAV-${randomCodePart(4, bytes)}-${GIFT_CARD_AMOUNT}EUR`;
}

/** The code for "Äpp 5 € (uutele)", stop 150. */
export function appPerkCode(bytes?: Uint8Array): string {
  return `APP5-${randomCodePart(4, bytes)}`;
}

/** The code for stop 50's week free in the app. */
export function appWeekCode(bytes?: Uint8Array): string {
  return `APPNADAL-${randomCodePart(4, bytes)}`;
}

/** The code a rail stop's perk opens with: only stop 150 has one. */
export function openingCode(stopAt: number): string | null {
  return STOP_TYPES.get(stopAt) === "code_once" ? appPerkCode() : null;
}

export function perkKind(perk: Pick<Perk, "source" | "stopAt">): PerkKind {
  if (perk.source === "birthday") return "code";
  if (perk.stopAt === DRINK_OR_APP_STOP) return "drink_or_app";
  const type = perk.stopAt === null ? undefined : STOP_TYPES.get(perk.stopAt);
  if (type === "prize_choice") return "prize";
  if (type === "code_once") return "code";
  return "direct";
}

/** The end of the perk's validity: its gift card's, once it has one. */
export function perkValidUntil(perk: Pick<Perk, "expiresAt" | "giftCard">): Date {
  return perk.giftCard?.validUntil ?? perk.expiresAt;
}

export function perkStatus(perk: Perk, now: Date): PerkStatus {
  if (perk.redeemedAt) return "used";
  if (perkKind(perk) === "prize" && perk.choice === null) {
    return perk.chooseBy !== null && now < perk.chooseBy ? "choosing" : "unclaimed";
  }
  return now < perkValidUntil(perk) ? "available" : "expired";
}

/** The member's own prize choice, made before the 3 days are over. */
export function prizeChoiceWrite(
  perk: Perk,
  choice: PrizeChoice,
  now: Date,
  { school, code }: { school: string | null; code: string },
): PrizeWrite | PerkRefusal {
  if (choice !== "gift_card" && choice !== "donation") return "invalid_choice";
  if (perkKind(perk) !== "prize") return "not_a_prize";
  if (perk.choice !== null || perk.redeemedAt) return "already_chosen";
  const status = perkStatus(perk, now);
  if (status !== "choosing") return "choice_closed";
  if (choice === "donation" && !school) throw new Error("A donation needs settings.donation_school");

  return {
    perkId: perk.id,
    choice,
    at: now,
    giftCard: choice === "gift_card" ? { code, validUntil: addDays(now, PERK_DAYS) } : null,
    school: choice === "donation" ? school : null,
  };
}

/**
 * The automatic gift card for a prize with no choice once the 3 days are
 * over, or null when it isn't due. It is given at the end of the 3 days,
 * however late this runs, so its 60 days don't depend on when it was checked.
 */
export function autoGiftCardWrite(perk: Perk, now: Date, code: string): PrizeWrite | null {
  if (perkKind(perk) !== "prize" || perk.choice !== null || perk.redeemedAt || perk.chooseBy === null) return null;
  if (now < perk.chooseBy) return null;
  return {
    perkId: perk.id,
    choice: "gift_card",
    at: perk.chooseBy,
    giftCard: { code, validUntil: addDays(perk.chooseBy, PERK_DAYS) },
    school: null,
  };
}

/**
 * "Märgi kasutatuks". Stop 50 takes its option (a hot drink unless the app
 * week is picked); every other perk takes none.
 */
export function redeemWrite(
  perk: Perk,
  now: Date,
  { choice, code }: { choice?: DrinkOrApp; code: string },
): RedeemWrite | PerkRefusal {
  const kind = perkKind(perk);
  if (kind === "drink_or_app") {
    if (choice !== undefined && choice !== "hot_drink" && choice !== "app_week") return "invalid_choice";
  } else if (choice !== undefined) {
    return "invalid_choice";
  }

  const status = perkStatus(perk, now);
  if (status === "used") return "already_used";
  if (status === "choosing" || status === "unclaimed") return "choose_first";
  if (status === "expired") return "expired";

  if (kind !== "drink_or_app") return { perkId: perk.id, at: now, choice: null, code: null };
  const picked = choice ?? "hot_drink";
  return { perkId: perk.id, at: now, choice: picked, code: picked === "app_week" ? code : null };
}

/** What perk redemption needs from the database. The Supabase version is in supabase-perk-store.ts. */
export interface PerkStore {
  /** The member's perk, or null when it doesn't exist or belongs to someone else. */
  perk(memberId: string, perkId: number): Promise<Perk | null>;
  /** The member's prize perks with no choice whose choose_by is at or before now. */
  unclaimedPrizes(memberId: string, now: Date): Promise<Perk[]>;
  /**
   * Saves a prize choice and its gift card or donation, all or nothing, and
   * only while the perk has no choice. Returns false when it already had one.
   * Throws GiftCardCodeTakenError when the gift card code is already in use.
   */
  givePrize(memberId: string, write: PrizeWrite): Promise<boolean>;
  /** Spends the perk, only while redeemed_at is empty. Returns false when it was already spent. */
  markRedeemed(memberId: string, write: RedeemWrite): Promise<boolean>;
  /** settings.donation_school, or null when it is missing. */
  donationSchool(): Promise<string | null>;
}

/** gift_cards.code is unique: the random code is already taken. */
export class GiftCardCodeTakenError extends Error {
  constructor(code: string) {
    super(`Gift card code ${code} is already in use`);
    this.name = "GiftCardCodeTakenError";
  }
}

const CODE_ATTEMPTS = 5;

/** Saves a prize write, drawing a fresh gift card code if the first one is taken. */
async function givePrizeWithFreshCode(store: PerkStore, memberId: string, write: PrizeWrite, newCode: () => string) {
  for (let attempt = 1; ; attempt++) {
    try {
      return { saved: await store.givePrize(memberId, write), write };
    } catch (error) {
      if (!(error instanceof GiftCardCodeTakenError) || !write.giftCard || attempt >= CODE_ATTEMPTS) throw error;
      write = { ...write, giftCard: { ...write.giftCard, code: newCode() } };
    }
  }
}

export type ChoosePrizeResult =
  | { status: "chosen"; choice: PrizeChoice; giftCard: PrizeWrite["giftCard"]; school: string | null }
  | { status: PerkRefusal };

/** The member chooses a gift card or a donation at a prize stop. Safe to send twice: the second is refused. */
export async function choosePrize(
  store: PerkStore,
  { memberId, perkId, choice, now, newCode = giftCardCode }: {
    memberId: string;
    perkId: number;
    choice: PrizeChoice;
    now: Date;
    newCode?: () => string;
  },
): Promise<ChoosePrizeResult> {
  const perk = await store.perk(memberId, perkId);
  if (!perk) return { status: "not_found" };

  const school = choice === "donation" ? await store.donationSchool() : null;
  const write = prizeChoiceWrite(perk, choice, now, { school, code: newCode() });
  if (typeof write === "string") return { status: write };

  const { saved, write: written } = await givePrizeWithFreshCode(store, memberId, write, newCode);
  if (!saved) return { status: "already_chosen" };
  return { status: "chosen", choice: written.choice, giftCard: written.giftCard, school: written.school };
}

export type AutoGiftCard = { perkId: number; code: string; validUntil: Date };

/**
 * Gives the gift card for every prize the member didn't choose within 3 days
 * of `now`. Safe to run again, and alongside the member's own choice: each
 * perk gets one outcome. Pass the /demo date to skip ahead.
 */
export async function settleUnclaimedPrizes(
  store: PerkStore,
  { memberId, now, newCode = giftCardCode }: { memberId: string; now: Date; newCode?: () => string },
): Promise<AutoGiftCard[]> {
  const given: AutoGiftCard[] = [];
  for (const perk of await store.unclaimedPrizes(memberId, now)) {
    const write = autoGiftCardWrite(perk, now, newCode());
    if (!write) continue;
    const { saved, write: written } = await givePrizeWithFreshCode(store, memberId, write, newCode);
    if (saved && written.giftCard) given.push({ perkId: perk.id, ...written.giftCard });
  }
  return given;
}

export type RedeemResult =
  | { status: "redeemed"; perkId: number; choice: DrinkOrApp | null; code: string | null }
  | { status: PerkRefusal };

/** "Märgi kasutatuks" (demo only). A perk can be spent once: a second request is refused. */
export async function redeemPerk(
  store: PerkStore,
  { memberId, perkId, now, choice, newCode = appWeekCode }: {
    memberId: string;
    perkId: number;
    now: Date;
    choice?: DrinkOrApp;
    newCode?: () => string;
  },
): Promise<RedeemResult> {
  const perk = await store.perk(memberId, perkId);
  if (!perk) return { status: "not_found" };

  const write = redeemWrite(perk, now, { choice, code: newCode() });
  if (typeof write === "string") return { status: write };

  if (!(await store.markRedeemed(memberId, write))) return { status: "already_used" };
  return { status: "redeemed", perkId: write.perkId, choice: write.choice, code: write.code ?? perk.code };
}
