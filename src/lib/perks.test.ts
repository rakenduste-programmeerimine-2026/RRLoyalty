import { beforeEach, describe, expect, it } from "vitest";
import { DAY_MS } from "./calendar-day";
import { applyPurchase, expirePoints, type MemberPoints } from "./laps";
import { MemoryPerkStore } from "./memory-perk-store";
import {
  appPerkCode,
  appWeekCode,
  choosePrize,
  giftCardCode,
  openingCode,
  perkKind,
  perkStatus,
  redeemPerk,
  settleUnclaimedPrizes,
  type Perk,
} from "./perks";
import type { PerkToOpen } from "./points";

const memberId = "member-1";
const opened = new Date("2026-11-13T10:00:00Z");
const days = (n: number) => new Date(opened.getTime() + n * DAY_MS);
const justBefore = (date: Date) => new Date(date.getTime() - 1);

let store: MemoryPerkStore;
let codes: number;
const newCode = () => `GUSTAV-TEST${++codes}-5EUR`;

beforeEach(() => {
  store = new MemoryPerkStore();
  codes = 0;
});

/** A rail perk as the points engine opens it. */
const railPerk = (stopAt: number, extra: Partial<Perk> = {}) =>
  store.addPerk({
    memberId,
    stopAt,
    openedAt: opened,
    expiresAt: days(60),
    chooseBy: [100, 200, 300, 400].includes(stopAt) ? days(3) : null,
    code: stopAt === 150 ? "APP5-TEST" : null,
    ...extra,
  });

const redeem = (perkId: number, now: Date, choice?: "hot_drink" | "app_week") =>
  redeemPerk(store, { memberId, perkId, now, choice, newCode: () => "APPNADAL-TEST" });

const choose = (perkId: number, choice: "gift_card" | "donation", now: Date) =>
  choosePrize(store, { memberId, perkId, choice, now, newCode });

const settle = (now: Date) => settleUnclaimedPrizes(store, { memberId, now, newCode });

describe("perkKind", () => {
  it.each([
    [50, "drink_or_app"],
    [100, "prize"],
    [150, "code"],
    [200, "prize"],
    [250, "direct"],
    [300, "prize"],
    [350, "direct"],
    [400, "prize"],
  ] as const)("stop %i is a %s perk", (stopAt, kind) => {
    expect(perkKind({ source: "rail", stopAt })).toBe(kind);
  });

  it("treats the birthday card as code only", () => {
    expect(perkKind({ source: "birthday", stopAt: null })).toBe("code");
  });
});

describe("codes", () => {
  it("formats gift card and app codes", () => {
    expect(giftCardCode(new Uint8Array([0, 1, 30, 31]))).toBe("GUSTAV-23YZ-5EUR");
    expect(appPerkCode()).toMatch(/^APP5-[2-9A-HJ-NP-Z]{4}$/);
    expect(appWeekCode()).toMatch(/^APPNADAL-[2-9A-HJ-NP-Z]{4}$/);
  });

  it("gives an opening code to stop 150 only", () => {
    expect(openingCode(150)).toMatch(/^APP5-/);
    for (const stop of [50, 100, 200, 250, 300, 350, 400]) expect(openingCode(stop)).toBeNull();
  });
});

describe("double redemption", () => {
  it("spends a perk once: a second Märgi kasutatuks is refused", async () => {
    const perk = railPerk(250);

    expect(await redeem(perk.id, days(1))).toMatchObject({ status: "redeemed" });
    expect(await redeem(perk.id, days(2))).toEqual({ status: "already_used" });
    expect(store.perks[0].redeemedAt).toEqual(days(1));
  });

  it("lets only one of two simultaneous requests spend the perk", async () => {
    const perk = railPerk(350);

    const results = await Promise.all([redeem(perk.id, days(1)), redeem(perk.id, days(1))]);

    expect(results.map((result) => result.status).sort()).toEqual(["already_used", "redeemed"]);
  });

  it("refuses a second Märgi kasutatuks even when the first read was stale", async () => {
    const perk = railPerk(250);
    const stale = await store.perk(memberId, perk.id);
    await redeem(perk.id, days(1));

    // A request that read the perk before it was spent still cannot spend it again.
    expect(await store.markRedeemed(memberId, { perkId: stale!.id, at: days(1), choice: null, code: null })).toBe(false);
  });

  it("spends a gift card once", async () => {
    const perk = railPerk(100);
    await choose(perk.id, "gift_card", days(1));

    expect(await redeem(perk.id, days(5))).toMatchObject({ status: "redeemed" });
    expect(await redeem(perk.id, days(6))).toEqual({ status: "already_used" });
  });

  it("saves one prize choice: choosing again is refused", async () => {
    const perk = railPerk(200);

    expect(await choose(perk.id, "gift_card", days(1))).toMatchObject({ status: "chosen", choice: "gift_card" });
    expect(await choose(perk.id, "donation", days(1))).toEqual({ status: "already_chosen" });
    expect(store.giftCards).toHaveLength(1);
    expect(store.donations).toHaveLength(0);
  });

  it("saves only one of two simultaneous prize choices", async () => {
    const perk = railPerk(300);

    const results = await Promise.all([choose(perk.id, "gift_card", days(1)), choose(perk.id, "donation", days(1))]);

    expect(results.map((result) => result.status).sort()).toEqual(["already_chosen", "chosen"]);
    expect(store.giftCards.length + store.donations.length).toBe(1);
  });

  it("does not let a member spend someone else's perk", async () => {
    const perk = railPerk(250);

    expect(await redeemPerk(store, { memberId: "member-2", perkId: perk.id, now: days(1) })).toEqual({
      status: "not_found",
    });
    expect(store.perks[0].redeemedAt).toBeNull();
  });
});

describe("prize choice", () => {
  it("makes a donation to the school from settings and spends the perk at once", async () => {
    const perk = railPerk(100);

    expect(await choose(perk.id, "donation", days(1))).toEqual({
      status: "chosen",
      choice: "donation",
      giftCard: null,
      school: "Näidiskooli",
    });
    expect(store.donations).toEqual([{ memberId, perkId: perk.id, school: "Näidiskooli", createdAt: days(1) }]);
    expect(perkStatus(store.perks[0], days(1))).toBe("used");
    expect(await redeem(perk.id, days(2))).toEqual({ status: "already_used" });
  });

  it("asks for the choice before a prize can be spent", async () => {
    const perk = railPerk(100);

    expect(perkStatus(perk, days(1))).toBe("choosing");
    expect(await redeem(perk.id, days(1))).toEqual({ status: "choose_first" });
  });

  it("refuses a prize choice on a perk that isn't a prize stop", async () => {
    const perk = railPerk(250);

    expect(await choose(perk.id, "gift_card", days(1))).toEqual({ status: "not_a_prize" });
  });

  it("draws a new gift card code when the first one is taken", async () => {
    store.giftCards.push({ memberId: "member-2", perkId: 99, code: "GUSTAV-TEST1-5EUR", validUntil: days(60), createdAt: opened });
    const perk = railPerk(100);

    const result = await choose(perk.id, "gift_card", days(1));

    expect(result).toMatchObject({ status: "chosen", giftCard: { code: "GUSTAV-TEST2-5EUR" } });
  });
});

describe("the automatic gift card after 3 days", () => {
  it("gives nothing while the 3 days are running", async () => {
    railPerk(100);

    expect(await settle(justBefore(days(3)))).toEqual([]);
    expect(store.giftCards).toEqual([]);
  });

  it("gives the gift card once the 3 days are over, with 60 days from then", async () => {
    const perk = railPerk(100);

    const given = await settle(days(3));

    expect(given).toEqual([{ perkId: perk.id, code: "GUSTAV-TEST1-5EUR", validUntil: days(63) }]);
    expect(store.perks[0]).toMatchObject({ choice: "gift_card", redeemedAt: null });
    expect(store.giftCards).toEqual([
      { memberId, perkId: perk.id, code: "GUSTAV-TEST1-5EUR", validUntil: days(63), createdAt: days(3) },
    ]);
  });

  it("dates the gift card from the end of the 3 days, however late it runs", async () => {
    railPerk(200);

    // /demo skipping ahead 10 days.
    const [card] = await settle(days(10));

    expect(card.validUntil).toEqual(days(63));
    expect(store.giftCards[0].createdAt).toEqual(days(3));
  });

  it("gives it once: settling again changes nothing", async () => {
    railPerk(100);
    await settle(days(3));

    expect(await settle(days(4))).toEqual([]);
    expect(store.giftCards).toHaveLength(1);
  });

  it("leaves chosen prizes alone", async () => {
    const donated = railPerk(100);
    const chosen = railPerk(200);
    await choose(donated.id, "donation", days(1));
    await choose(chosen.id, "gift_card", days(2));

    expect(await settle(days(5))).toEqual([]);
    expect(store.giftCards).toHaveLength(1);
    expect(store.donations).toHaveLength(1);
  });

  it("settles every unclaimed prize stop, whatever its lap", async () => {
    railPerk(100, { lap: 1 });
    railPerk(400, { lap: 1 });
    railPerk(100, { lap: 2 });
    railPerk(250, { lap: 2 });

    expect(await settle(days(3))).toHaveLength(3);
  });

  it("closes the member's choice once the 3 days are over", async () => {
    const perk = railPerk(100);

    expect(perkStatus(perk, days(3))).toBe("unclaimed");
    expect(await choose(perk.id, "donation", days(3))).toEqual({ status: "choice_closed" });
    expect(store.donations).toEqual([]);
  });

  it("gives one outcome when the member chooses as the gift card is given", async () => {
    const perk = railPerk(100);
    const lateRead = (await store.unclaimedPrizes(memberId, days(3)))[0];
    await choose(perk.id, "donation", justBefore(days(3)));

    // The settle that read the perk before the choice landed must not add a gift card.
    expect(await store.givePrize(memberId, {
      perkId: lateRead.id,
      choice: "gift_card",
      at: days(3),
      giftCard: { code: "GUSTAV-LATE-5EUR", validUntil: days(63) },
      school: null,
    })).toBe(false);
    expect(store.giftCards).toEqual([]);
    expect(store.donations).toHaveLength(1);
  });

  it("can be spent after settling", async () => {
    const perk = railPerk(100);
    await settle(days(3));

    expect(await redeem(perk.id, days(4))).toMatchObject({ status: "redeemed" });
  });
});

describe("60-day validity", () => {
  it.each([250, 350, 150])("lets stop %i be spent until the end of its 60 days", async (stopAt) => {
    const perk = railPerk(stopAt);

    expect(perkStatus(perk, justBefore(days(60)))).toBe("available");
    expect(await redeem(perk.id, justBefore(days(60)))).toMatchObject({ status: "redeemed" });
  });

  it.each([50, 150, 250, 350])("refuses stop %i once its 60 days are over", async (stopAt) => {
    const perk = railPerk(stopAt);

    expect(perkStatus(perk, days(60))).toBe("expired");
    expect(await redeem(perk.id, days(60))).toEqual({ status: "expired" });
    expect(store.perks[0].redeemedAt).toBeNull();
  });

  it("applies the 60 days to the birthday card", async () => {
    const card = store.addPerk({ memberId, source: "birthday", stopAt: null, lap: null, code: "SYNNIPAEV-TEST", openedAt: opened, expiresAt: days(60) });

    expect(await redeem(card.id, days(60))).toEqual({ status: "expired" });
    expect(await redeem(card.id, justBefore(days(60)))).toMatchObject({ status: "redeemed", code: "SYNNIPAEV-TEST" });
  });

  it("gives a chosen gift card 60 days from the choice", async () => {
    const perk = railPerk(100);

    const result = await choose(perk.id, "gift_card", days(2));

    expect(result).toMatchObject({ giftCard: { validUntil: days(62) } });
    // Past the perk's own 60 days, the gift card still has 2 to go.
    expect(perkStatus(store.perks[0], days(61))).toBe("available");
    expect(await redeem(perk.id, days(62))).toEqual({ status: "expired" });
    expect(await redeem(perk.id, justBefore(days(62)))).toMatchObject({ status: "redeemed" });
  });

  it("expires an automatic gift card 60 days after the 3 days", async () => {
    const perk = railPerk(300);
    await settle(days(3));

    expect(await redeem(perk.id, days(63))).toEqual({ status: "expired" });
    expect(await redeem(perk.id, justBefore(days(63)))).toMatchObject({ status: "redeemed" });
  });
});

describe("stop 50: a hot drink or a week in the app", () => {
  it("spends it as a hot drink by default", async () => {
    const perk = railPerk(50);

    expect(await redeem(perk.id, days(1))).toEqual({ status: "redeemed", perkId: perk.id, choice: "hot_drink", code: null });
    expect(store.perks[0]).toMatchObject({ choice: "hot_drink", redeemedAt: days(1) });
  });

  it("spends it as an app week with a code", async () => {
    const perk = railPerk(50);

    expect(await redeem(perk.id, days(1), "app_week")).toEqual({
      status: "redeemed",
      perkId: perk.id,
      choice: "app_week",
      code: "APPNADAL-TEST",
    });
    expect(store.perks[0]).toMatchObject({ choice: "app_week", code: "APPNADAL-TEST" });
  });

  it("can't be picked twice", async () => {
    const perk = railPerk(50);
    await redeem(perk.id, days(1), "app_week");

    expect(await redeem(perk.id, days(1), "hot_drink")).toEqual({ status: "already_used" });
    expect(store.perks[0].choice).toBe("app_week");
  });

  it("refuses stop 50's options on other perks", async () => {
    const perk = railPerk(250);

    expect(await redeem(perk.id, days(1), "app_week")).toEqual({ status: "invalid_choice" });
  });

  it("returns stop 150's code when it is spent", async () => {
    const perk = railPerk(150);

    expect(await redeem(perk.id, days(1))).toMatchObject({ status: "redeemed", code: "APP5-TEST" });
  });
});

describe("perks survive a lap reset and point expiry", () => {
  const start: MemberPoints = { lap: 1, lapPoints: 0, lifetimeTotal: 0, lastPurchaseAt: null, appPerkGiven: false, perks: [] };
  const toStore = (perks: PerkToOpen[]) =>
    perks.map((perk) =>
      store.addPerk({
        memberId,
        stopAt: perk.stopAt,
        lap: perk.lap,
        openedAt: perk.openedAt,
        expiresAt: perk.expiresAt,
        chooseBy: perk.chooseBy,
      }),
    );

  it("keeps lap 1's perks usable after 390 + 25 starts lap 2", async () => {
    const lap1 = applyPurchase(start, { amountPaid: 390, at: opened });
    const lap2 = applyPurchase(lap1.state, { amountPaid: 25, at: days(1) });
    const perks = toStore([...lap1.perks, ...lap2.perks]);

    expect(lap2.state).toMatchObject({ lap: 2, lapPoints: 15 });
    const prize100 = perks.find((perk) => perk.stopAt === 100 && perk.lap === 1)!;
    const stop250 = perks.find((perk) => perk.stopAt === 250 && perk.lap === 1)!;
    expect(await redeem(stop250.id, days(2))).toMatchObject({ status: "redeemed" });
    expect(await choose(prize100.id, "donation", days(2))).toMatchObject({ status: "chosen" });
  });

  it("keeps perks and gift cards usable after the points expire", async () => {
    const earned = applyPurchase(start, { amountPaid: 120, at: opened });
    const perks = toStore(earned.perks);
    const prize = perks.find((perk) => perk.stopAt === 100)!;
    await choose(prize.id, "gift_card", days(1));

    // Six months later the points are gone, but nothing else is.
    const expiry = expirePoints(earned.state, new Date("2027-05-13T10:00:00Z"));
    expect(expiry).toMatchObject({ expiredPoints: 120, state: { lapPoints: 0 } });
    expect(expiry.state.perks).toEqual(earned.state.perks);
    expect(store.perks).toHaveLength(2);
    expect(store.giftCards).toHaveLength(1);

    // Still within each perk's own 60 days, they can be spent.
    expect(await redeem(perks.find((perk) => perk.stopAt === 50)!.id, days(30))).toMatchObject({ status: "redeemed" });
    expect(await redeem(prize.id, days(30))).toMatchObject({ status: "redeemed" });
  });

  it("gives the automatic gift card for a lap-1 prize after the lap resets", async () => {
    const lap1 = applyPurchase(start, { amountPaid: 399, at: opened });
    const lap2 = applyPurchase(lap1.state, { amountPaid: 10, at: days(1) });
    toStore([...lap1.perks, ...lap2.perks]);

    const given = await settle(days(5));

    // 100, 200 and 300 opened on day 0, and 400, reached on day 1, whose 3 days ended on day 4.
    expect(given.map((card) => card.perkId)).toHaveLength(4);
  });
});
