import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatDayMonth,
  historyLabel,
  railView,
  type HistoryRow,
  type PerkRow,
  type PointsRow,
} from "./rail-account";

const now = new Date("2026-11-11T12:00:00Z");
const day = (iso: string) => new Date(`${iso}T10:00:00Z`);

const points = (overrides: Partial<PointsRow> = {}): PointsRow => ({
  lifetimeTotal: 52,
  lapsCompleted: 0,
  currentLapPoints: 52,
  lastPurchaseAt: day("2026-11-08"),
  ...overrides,
});

const perk = (overrides: Partial<PerkRow>): PerkRow => ({
  id: 1,
  source: "rail",
  stopAt: 50,
  openedAt: day("2026-11-08"),
  expiresAt: day("2027-01-07"),
  chooseBy: null,
  choice: null,
  code: null,
  redeemedAt: null,
  giftCardValidUntil: null,
  ...overrides,
});

describe("railView points", () => {
  it("shows the current lap and when the points expire", () => {
    const view = railView(points(), [], [], now);
    expect(view).toMatchObject({ lapPoints: 52, lapsCompleted: 0, lifetimeTotal: 52, expired: false });
    expect(view.validUntil?.toISOString()).toBe("2027-05-08T10:00:00.000Z");
  });

  it("shows the next lap after a reset: 390 + 25 is lap 2 on 15 points", () => {
    const view = railView(points({ lifetimeTotal: 415, lapsCompleted: 1, currentLapPoints: 15 }), [], [], now);
    expect(view).toMatchObject({ lapPoints: 15, lapsCompleted: 1, lifetimeTotal: 415 });
  });

  it("shows 0 on the rail once the 6 months have passed, keeping laps and the lifetime total", () => {
    const view = railView(
      points({ lifetimeTotal: 415, lapsCompleted: 1, currentLapPoints: 15, lastPurchaseAt: day("2026-05-10") }),
      [],
      [],
      now,
    );
    expect(view).toMatchObject({ lapPoints: 0, expired: true, lapsCompleted: 1, lifetimeTotal: 415 });
  });

  it("starts from zero for a member without points or a profile", () => {
    expect(railView(null, [], [], now)).toMatchObject({ lapPoints: 0, lifetimeTotal: 0, validUntil: null, expired: false });
  });
});

describe("railView perks", () => {
  it("lists unused, unexpired perks, newest first", () => {
    const view = railView(
      points(),
      [
        perk({ id: 1, stopAt: 50, openedAt: day("2026-10-01") }),
        perk({ id: 2, source: "birthday", stopAt: null, openedAt: day("2026-11-02"), code: "SYNNIPAEV-7K2M" }),
        perk({ id: 3, redeemedAt: day("2026-11-09") }),
        perk({ id: 4, expiresAt: day("2026-11-10") }),
      ],
      [],
      now,
    );
    expect(view.perks.map((p) => [p.id, p.title, p.code])).toEqual([
      [2, "5 € sünnipäevakaart", "SYNNIPAEV-7K2M"],
      [1, "Tasuta kuum jook", null],
    ]);
  });

  it("marks a prize stop as choosing during its 3 days, then shows what it became", () => {
    const open = perk({ stopAt: 100, chooseBy: day("2026-11-12") });
    expect(railView(points(), [open], [], now).perks[0]).toMatchObject({ choosing: true, title: "5 € kinkekaart või annetus" });

    const late = perk({ stopAt: 100, chooseBy: day("2026-11-10") });
    expect(railView(points(), [late], [], now).perks[0].choosing).toBe(false);

    const donated = perk({ stopAt: 200, choice: "donation", chooseBy: day("2026-11-12") });
    expect(railView(points(), [donated], [], now).perks[0]).toMatchObject({ choosing: false, title: "5 € annetus kooliraamatukogule" });
  });

  it("dates a chosen gift card by the card, whose 60 days start from the choice", () => {
    // Stop opened 08.11 (perk ends 07.01), card chosen 10.11, so the card runs to 09.01.
    const chosen = perk({ stopAt: 100, choice: "gift_card", expiresAt: day("2027-01-07"), giftCardValidUntil: day("2027-01-09") });
    expect(railView(points(), [chosen], [], now).perks[0]).toMatchObject({ title: "5 € kinkekaart", expiresAt: day("2027-01-09") });

    // Still listed after the perk's own 60 days, while the card is valid.
    const later = new Date("2027-01-08T12:00:00Z");
    expect(railView(points(), [chosen], [], later).perks.map((p) => p.id)).toEqual([chosen.id]);
  });
});

describe("history labels and dates", () => {
  const row = (overrides: Partial<HistoryRow>): HistoryRow => ({
    at: day("2026-09-12"),
    kind: "earn",
    points: 18,
    channel: "e_shop",
    location: null,
    ...overrides,
  });

  it("names the channel and place", () => {
    expect(historyLabel(row({}))).toBe("E-pood");
    expect(historyLabel(row({ channel: "store", location: "Viru Keskus" }))).toBe("Kauplus Viru Keskus");
    expect(historyLabel(row({ kind: "expiry", points: -15, channel: null }))).toBe("Punktid aegusid");
  });

  it("formats dates in Estonian time", () => {
    // 22:30 UTC on 31 December is already 1 January in Tallinn.
    expect(formatDayMonth(new Date("2026-12-31T22:30:00Z"))).toBe("01.01");
    expect(formatDate(new Date("2027-05-08T10:00:00Z"))).toBe("08.05.2027");
  });
});
