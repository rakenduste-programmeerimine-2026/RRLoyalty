// An in-memory PerkStore for tests. It keeps the database's guards
// (supabase/migrations): a choice is set only while there is none,
// redeemed_at only while it is empty, one gift card or donation per perk,
// and unique gift card codes. Each write checks and changes in one step, as
// a single conditional UPDATE does in Postgres.

import {
  GiftCardCodeTakenError,
  type Perk,
  type PerkStore,
  type PrizeWrite,
  type RedeemWrite,
} from "./perks";

export type StoredGiftCard = { memberId: string; perkId: number; code: string; validUntil: Date; createdAt: Date };
export type StoredDonation = { memberId: string; perkId: number; school: string; createdAt: Date };

export class MemoryPerkStore implements PerkStore {
  perks: Perk[] = [];
  giftCards: StoredGiftCard[] = [];
  donations: StoredDonation[] = [];
  school: string | null = "Näidiskooli";

  /** Adds a perk with sensible defaults and returns it. */
  addPerk(perk: Partial<Perk> & Pick<Perk, "memberId" | "openedAt" | "expiresAt">): Perk {
    const row: Perk = {
      id: this.perks.length + 1,
      source: "rail",
      stopAt: null,
      lap: 1,
      chooseBy: null,
      choice: null,
      code: null,
      redeemedAt: null,
      giftCard: null,
      ...perk,
    };
    this.perks.push(row);
    return row;
  }

  async perk(memberId: string, perkId: number): Promise<Perk | null> {
    const row = this.perks.find((perk) => perk.id === perkId && perk.memberId === memberId);
    return row ? structuredClone(row) : null;
  }

  async unclaimedPrizes(memberId: string, now: Date): Promise<Perk[]> {
    return this.perks
      .filter((perk) => perk.memberId === memberId && perk.choice === null && perk.redeemedAt === null)
      .filter((perk) => perk.chooseBy !== null && perk.chooseBy <= now)
      .map((perk) => structuredClone(perk));
  }

  async givePrize(memberId: string, write: PrizeWrite): Promise<boolean> {
    const perk = this.perks.find((row) => row.id === write.perkId && row.memberId === memberId);
    if (!perk || perk.source !== "rail" || perk.chooseBy === null || perk.choice !== null || perk.redeemedAt) {
      return false;
    }
    if (write.giftCard && this.giftCards.some((card) => card.code === write.giftCard!.code)) {
      throw new GiftCardCodeTakenError(write.giftCard.code);
    }

    perk.choice = write.choice;
    if (write.choice === "donation") {
      perk.redeemedAt = write.at;
      this.donations.push({ memberId, perkId: perk.id, school: write.school!, createdAt: write.at });
    } else {
      perk.giftCard = { ...write.giftCard! };
      this.giftCards.push({ memberId, perkId: perk.id, ...write.giftCard!, createdAt: write.at });
    }
    return true;
  }

  async markRedeemed(memberId: string, write: RedeemWrite): Promise<boolean> {
    const perk = this.perks.find((row) => row.id === write.perkId && row.memberId === memberId);
    if (!perk || perk.redeemedAt) return false;
    if (write.choice !== null && perk.choice !== null) return false;

    perk.redeemedAt = write.at;
    if (write.choice !== null) perk.choice = write.choice;
    if (write.code !== null) perk.code = write.code;
    return true;
  }

  async donationSchool(): Promise<string | null> {
    return this.school;
  }
}
