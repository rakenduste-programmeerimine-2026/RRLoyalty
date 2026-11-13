// PerkStore against Supabase, with the server's secret key. The writes go
// through give_prize() and redeem_perk() (supabase/migrations), whose
// conditional updates stop a perk being chosen or spent twice.

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  GiftCardCodeTakenError,
  choosePrize,
  redeemPerk,
  settleUnclaimedPrizes,
  type AutoGiftCard,
  type ChoosePrizeResult,
  type DrinkOrApp,
  type Perk,
  type PerkChoice,
  type PerkStore,
  type PrizeChoice,
  type PrizeWrite,
  type RedeemResult,
  type RedeemWrite,
} from "./perks";
import { createAdminClient } from "./supabase/admin";

const UNIQUE_VIOLATION = "23505";
const PERK_COLUMNS =
  "id, member_id, source, stop_at, lap, opened_at, expires_at, choose_by, choice, code, redeemed_at, gift_cards(code, valid_until)";

type GiftCardDbRow = { code: string; valid_until: string };

type PerkDbRow = {
  id: number;
  member_id: string;
  source: Perk["source"];
  stop_at: number | null;
  lap: number | null;
  opened_at: string;
  expires_at: string;
  choose_by: string | null;
  choice: PerkChoice | null;
  code: string | null;
  redeemed_at: string | null;
  // One-to-one through gift_cards.perk_id (unique); PostgREST may still send a list.
  gift_cards: GiftCardDbRow | GiftCardDbRow[] | null;
};

const date = (value: string | null) => (value ? new Date(value) : null);

function toPerk(row: PerkDbRow): Perk {
  const card = Array.isArray(row.gift_cards) ? (row.gift_cards[0] ?? null) : row.gift_cards;
  return {
    id: row.id,
    memberId: row.member_id,
    source: row.source,
    stopAt: row.stop_at,
    lap: row.lap,
    openedAt: new Date(row.opened_at),
    expiresAt: new Date(row.expires_at),
    chooseBy: date(row.choose_by),
    choice: row.choice,
    code: row.code,
    redeemedAt: date(row.redeemed_at),
    giftCard: card ? { code: card.code, validUntil: new Date(card.valid_until) } : null,
  };
}

export class SupabasePerkStore implements PerkStore {
  constructor(private readonly db: SupabaseClient) {}

  async perk(memberId: string, perkId: number): Promise<Perk | null> {
    const { data, error } = await this.db
      .from("perks")
      .select(PERK_COLUMNS)
      .eq("id", perkId)
      .eq("member_id", memberId)
      .maybeSingle<PerkDbRow>();
    if (error) throw new Error(`Could not read the perk: ${error.message}`);
    return data ? toPerk(data) : null;
  }

  async unclaimedPrizes(memberId: string, now: Date): Promise<Perk[]> {
    const { data, error } = await this.db
      .from("perks")
      .select(PERK_COLUMNS)
      .eq("member_id", memberId)
      .eq("source", "rail")
      .is("choice", null)
      .is("redeemed_at", null)
      .lte("choose_by", now.toISOString())
      .returns<PerkDbRow[]>();
    if (error) throw new Error(`Could not read the unclaimed prizes: ${error.message}`);
    return data.map(toPerk);
  }

  async givePrize(memberId: string, write: PrizeWrite): Promise<boolean> {
    const { data, error } = await this.db.rpc("give_prize", {
      p_member_id: memberId,
      p_perk_id: write.perkId,
      p_choice: write.choice,
      p_at: write.at.toISOString(),
      p_code: write.giftCard?.code ?? null,
      p_valid_until: write.giftCard?.validUntil.toISOString() ?? null,
      p_school: write.school,
    });
    if (error) {
      if (error.code === UNIQUE_VIOLATION && write.giftCard && error.message.includes("gift_cards_code_key")) {
        throw new GiftCardCodeTakenError(write.giftCard.code);
      }
      throw new Error(`Could not save the prize choice: ${error.message}`);
    }
    return data === true;
  }

  async markRedeemed(memberId: string, write: RedeemWrite): Promise<boolean> {
    const { data, error } = await this.db.rpc("redeem_perk", {
      p_member_id: memberId,
      p_perk_id: write.perkId,
      p_at: write.at.toISOString(),
      p_choice: write.choice,
      p_code: write.code,
    });
    if (error) throw new Error(`Could not spend the perk: ${error.message}`);
    return data === true;
  }

  async donationSchool(): Promise<string | null> {
    const { data, error } = await this.db
      .from("settings")
      .select("value")
      .eq("key", "donation_school")
      .maybeSingle<{ value: string }>();
    if (error) throw new Error(`Could not read settings.donation_school: ${error.message}`);
    return data?.value?.trim() || null;
  }
}

const store = () => new SupabasePerkStore(createAdminClient());

// Server only: each caller must have checked that memberId is the signed-in
// member (getMember in auth.ts). `now` is the moment to act at; /demo passes
// its skipped-ahead date.

/** The member chooses a gift card or a donation at a prize stop. */
export function choosePrizeInSupabase(memberId: string, perkId: number, choice: PrizeChoice, now = new Date()): Promise<ChoosePrizeResult> {
  return choosePrize(store(), { memberId, perkId, choice, now });
}

/** "Märgi kasutatuks". Stop 50 takes "hot_drink" (the default) or "app_week". */
export function redeemPerkInSupabase(memberId: string, perkId: number, now = new Date(), choice?: DrinkOrApp): Promise<RedeemResult> {
  return redeemPerk(store(), { memberId, perkId, now, choice });
}

/** Gives the automatic gift card for every prize left unchosen for 3 days. */
export function settleUnclaimedPrizesInSupabase(memberId: string, now = new Date()): Promise<AutoGiftCard[]> {
  return settleUnclaimedPrizes(store(), { memberId, now });
}
