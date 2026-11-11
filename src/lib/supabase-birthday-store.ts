// BirthdayStore against Supabase, with the server's secret key.

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { giveBirthdayCard, type BirthdayCard, type BirthdayResult, type BirthdayStore } from "./birthday";
import { createAdminClient } from "./supabase/admin";

const UNIQUE_VIOLATION = "23505";

export class SupabaseBirthdayStore implements BirthdayStore {
  constructor(private readonly db: SupabaseClient) {}

  async memberBirthday(memberId: string): Promise<string | null> {
    const { data, error } = await this.db
      .from("members")
      .select("birthday")
      .eq("id", memberId)
      .single<{ birthday: string | null }>();
    if (error) throw new Error(`Could not read the member's birthday: ${error.message}`);
    return data.birthday;
  }

  async insertBirthdayPerk(memberId: string, card: BirthdayCard): Promise<boolean> {
    const { error } = await this.db.from("perks").insert({
      member_id: memberId,
      source: "birthday",
      birthday_year: card.birthdayYear,
      opened_at: card.openedAt.toISOString(),
      expires_at: card.expiresAt.toISOString(),
      code: card.code,
    });
    if (!error) return true;
    // perks_birthday_once_per_year: this year's card is already given.
    if (error.code === UNIQUE_VIOLATION) return false;
    throw new Error(`Could not save the birthday card: ${error.message}`);
  }
}

/**
 * Gives the birthday card in Supabase if `today` ("YYYY-MM-DD") is the
 * member's birthday. Server only, for /demo (#22): the caller must have
 * checked that memberId is the signed-in member.
 */
export function giveBirthdayCardInSupabase(memberId: string, today: string): Promise<BirthdayResult> {
  return giveBirthdayCard(new SupabaseBirthdayStore(createAdminClient()), { memberId, today });
}
