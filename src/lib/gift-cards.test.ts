import { describe, expect, it } from "vitest";
import { euros, giftCardsView, type BirthdayCardRow, type GiftCardRow } from "./gift-cards";

const now = new Date("2026-11-12T12:00:00Z");
const day = (iso: string) => new Date(`${iso}T10:00:00Z`);

const card = (overrides: Partial<GiftCardRow>): GiftCardRow => ({
  id: 1,
  perkId: 11,
  code: "GUSTAV-AAAA-5EUR",
  amount: 5,
  minPurchase: 20,
  validUntil: day("2027-01-10"),
  stopAt: 100,
  redeemedAt: null,
  ...overrides,
});

const birthday = (overrides: Partial<BirthdayCardRow>): BirthdayCardRow => ({
  id: 9,
  code: "SYNNIPAEV-7K2M",
  expiresAt: day("2027-01-01"),
  redeemedAt: null,
  ...overrides,
});

describe("giftCardsView", () => {
  it("lists usable cards first, soonest to expire on top, with their stop", () => {
    const view = giftCardsView(
      [card({ id: 1, validUntil: day("2027-02-01"), stopAt: 200 }), card({ id: 2, validUntil: day("2026-12-01") })],
      [],
      now,
    );
    expect(view.active.map((c) => [c.id, c.title, c.source])).toEqual([
      [2, "5 € kinkekaart", "Gustavi rada · 100 p"],
      [1, "5 € kinkekaart", "Gustavi rada · 200 p"],
    ]);
    expect(view.past).toEqual([]);
  });

  it("moves used and expired cards out of the usable list", () => {
    const view = giftCardsView(
      [card({ id: 1, redeemedAt: day("2026-11-10") }), card({ id: 2, validUntil: day("2026-11-01") }), card({ id: 3 })],
      [],
      now,
    );
    expect(view.active.map((c) => c.id)).toEqual([3]);
    expect(view.past.map((c) => [c.id, c.state])).toEqual([
      [1, "used"],
      [2, "expired"],
    ]);
  });

  it("shows only unused, unexpired birthday cards", () => {
    const view = giftCardsView(
      [],
      [birthday({ id: 1 }), birthday({ id: 2, redeemedAt: day("2026-11-01") }), birthday({ id: 3, expiresAt: day("2026-11-01") })],
      now,
    );
    expect(view.birthday).toEqual([{ id: 1, code: "SYNNIPAEV-7K2M", validUntil: day("2027-01-01") }]);
  });

  it("is empty for a member with nothing yet", () => {
    expect(giftCardsView([], [], now)).toEqual({ active: [], past: [], birthday: [] });
  });
});

describe("euros", () => {
  it("drops cents from whole amounts", () => {
    expect(euros(5)).toBe("5 €");
    expect(euros(7.5)).toBe("7,50 €");
  });
});
