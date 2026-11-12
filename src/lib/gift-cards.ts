// What the "Kinkekaardid ja soodustused" page shows. Pure: rows and "now" are
// passed in. Rules: docs/program-rules.md (Perks, Name day and birthday).

/** A gift_cards row with its perk. */
export type GiftCardRow = {
  id: number;
  code: string;
  amount: number;
  minPurchase: number;
  validUntil: Date;
  /** The rail stop the card came from, or null. */
  stopAt: number | null;
  /** The perk's redeemed_at: set by "Märgi kasutatuks". */
  redeemedAt: Date | null;
};

/** A birthday perk (perks.source = 'birthday'). */
export type BirthdayCardRow = {
  id: number;
  code: string | null;
  expiresAt: Date;
  redeemedAt: Date | null;
};

export type CardState = "active" | "used" | "expired";

export type GiftCardView = {
  id: number;
  title: string;
  source: string;
  code: string;
  minPurchase: number;
  validUntil: Date;
  state: CardState;
};

export type BirthdayCardView = { id: number; code: string | null; validUntil: Date };

export type GiftCardsView = {
  /** Usable now, soonest to expire first. */
  active: GiftCardView[];
  /** Used or expired, newest first. */
  past: GiftCardView[];
  /** Unused birthday cards that haven't expired. */
  birthday: BirthdayCardView[];
};

/** "5 €", or "7,50 €" for an amount with cents. */
export function euros(amount: number): string {
  return Number.isInteger(amount) ? `${amount} €` : `${amount.toFixed(2).replace(".", ",")} €`;
}

function cardState(card: { redeemedAt: Date | null; validUntil: Date }, now: Date): CardState {
  if (card.redeemedAt) return "used";
  return card.validUntil > now ? "active" : "expired";
}

export function giftCardsView(cards: GiftCardRow[], birthdays: BirthdayCardRow[], now: Date): GiftCardsView {
  const views = cards.map((card) => ({
    id: card.id,
    title: `${euros(card.amount)} kinkekaart`,
    source: card.stopAt ? `Gustavi rada · ${card.stopAt} p` : "Kinkekaart",
    code: card.code,
    minPurchase: card.minPurchase,
    validUntil: card.validUntil,
    state: cardState(card, now),
  }));

  return {
    active: views
      .filter((card) => card.state === "active")
      .sort((a, b) => a.validUntil.getTime() - b.validUntil.getTime()),
    past: views
      .filter((card) => card.state !== "active")
      .sort((a, b) => b.validUntil.getTime() - a.validUntil.getTime()),
    birthday: birthdays
      .filter((card) => cardState({ redeemedAt: card.redeemedAt, validUntil: card.expiresAt }, now) === "active")
      .map((card) => ({ id: card.id, code: card.code, validUntil: card.expiresAt })),
  };
}
