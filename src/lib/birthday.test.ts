import { beforeEach, describe, expect, it } from "vitest";
import {
  BIRTHDAY_CODE_PREFIX,
  birthdayCard,
  birthdayCode,
  giveBirthdayCard,
  isBirthday,
  nextBirthday,
  type BirthdayCard,
  type BirthdayStore,
} from "./birthday";
import { PERK_DAYS } from "./points";

/** Keeps the schema's perks_birthday_once_per_year rule, like MemoryPurchaseStore does for purchases. */
class MemoryBirthdayStore implements BirthdayStore {
  birthdays = new Map<string, string | null>();
  perks: (BirthdayCard & { memberId: string })[] = [];

  async memberBirthday(memberId: string) {
    return this.birthdays.get(memberId) ?? null;
  }

  async insertBirthdayPerk(memberId: string, card: BirthdayCard) {
    if (this.perks.some((row) => row.memberId === memberId && row.birthdayYear === card.birthdayYear)) return false;
    this.perks.push({ memberId, ...card });
    return true;
  }
}

const memberId = "member-1";
let store: MemoryBirthdayStore;

beforeEach(() => {
  store = new MemoryBirthdayStore();
  store.birthdays.set(memberId, "1990-11-14");
});

const give = (today: string) => giveBirthdayCard(store, { memberId, today });

describe("isBirthday", () => {
  it("is true on the birthday's month and day in a later year", () => {
    expect(isBirthday("1990-11-14", "2026-11-14")).toBe(true);
  });

  it.each(["2026-11-13", "2026-11-15", "2026-10-14"])("is false on %s", (today) => {
    expect(isBirthday("1990-11-14", today)).toBe(false);
  });

  it("counts 28 February as the birthday of someone born on 29 February in a non-leap year", () => {
    expect(isBirthday("2000-02-29", "2027-02-28")).toBe(true);
    expect(isBirthday("2000-02-29", "2027-03-01")).toBe(false);
  });

  it("keeps 29 February in a leap year", () => {
    expect(isBirthday("2000-02-29", "2028-02-29")).toBe(true);
    expect(isBirthday("2000-02-29", "2028-02-28")).toBe(false);
  });

  it("is false before the member was born", () => {
    expect(isBirthday("2030-11-14", "2026-11-14")).toBe(false);
  });

  it("rejects a date that is not YYYY-MM-DD", () => {
    expect(() => isBirthday("1990-11-14", "14.11.2026")).toThrow(RangeError);
    expect(() => isBirthday("1990-02-30", "2026-11-14")).toThrow(RangeError);
  });
});

describe("birthdayCode", () => {
  it("is the prefix and four characters that cannot be misread", () => {
    expect(birthdayCode(new Uint8Array([0, 1, 30, 31]))).toBe(`${BIRTHDAY_CODE_PREFIX}23YZ`);
  });

  it("makes a random code when given no bytes", () => {
    expect(birthdayCode()).toMatch(/^SYNNIPAEV-[2-9A-HJ-NP-Z]{4}$/);
  });
});

describe("birthdayCard", () => {
  it("opens on the birthday, lasts 60 days and is marked with that year", () => {
    const card = birthdayCard("1990-11-14", "2026-11-14", "SYNNIPAEV-7K2M");

    expect(card).toEqual({
      birthdayYear: 2026,
      openedAt: new Date("2026-11-14T00:00:00Z"),
      expiresAt: new Date("2027-01-13T00:00:00Z"),
      code: "SYNNIPAEV-7K2M",
    });
    expect(PERK_DAYS).toBe(60);
  });

  it("is null on any other day", () => {
    expect(birthdayCard("1990-11-14", "2026-11-15", "SYNNIPAEV-7K2M")).toBeNull();
  });
});

describe("giveBirthdayCard", () => {
  it("gives the member a 5 € birthday code on their birthday", async () => {
    const result = await give("2026-11-14");

    expect(result).toMatchObject({ status: "given", birthdayYear: 2026 });
    expect(store.perks).toEqual([expect.objectContaining({ memberId, birthdayYear: 2026 })]);
    expect(store.perks[0].code).toMatch(/^SYNNIPAEV-/);
  });

  it("gives the card once a year when triggered again", async () => {
    const first = await give("2026-11-14");
    const second = await give("2026-11-14");

    expect(first.status).toBe("given");
    expect(second).toEqual({ status: "already_given", birthdayYear: 2026 });
    expect(store.perks).toHaveLength(1);
  });

  it("gives a new card on next year's birthday", async () => {
    await give("2026-11-14");
    const nextYear = await give("2027-11-14");

    expect(nextYear).toMatchObject({ status: "given", birthdayYear: 2027 });
    expect(store.perks.map((perk) => perk.birthdayYear)).toEqual([2026, 2027]);
  });

  it("gives nothing on a day that is not the birthday", async () => {
    expect(await give("2026-11-13")).toEqual({ status: "not_birthday" });
    expect(store.perks).toEqual([]);
  });

  it("gives nothing to a member with no birthday on file", async () => {
    store.birthdays.set(memberId, null);

    expect(await give("2026-11-14")).toEqual({ status: "no_birthday" });
    expect(store.perks).toEqual([]);
  });

  it("keeps each member's year separate", async () => {
    store.birthdays.set("member-2", "1985-11-14");

    await give("2026-11-14");
    const other = await giveBirthdayCard(store, { memberId: "member-2", today: "2026-11-14" });

    expect(other.status).toBe("given");
    expect(store.perks).toHaveLength(2);
  });
});

describe("nextBirthday", () => {
  it("is this year's birthday when it is still ahead, today included", () => {
    expect(nextBirthday("1990-11-14", "2026-11-13")).toBe("2026-11-14");
    expect(nextBirthday("1990-11-14", "2026-11-14")).toBe("2026-11-14");
  });

  it("is next year's once this year's has passed", () => {
    expect(nextBirthday("1990-11-14", "2026-11-15")).toBe("2027-11-14");
  });

  it("is 28 February for someone born on 29 February in a year without one", () => {
    expect(nextBirthday("2000-02-29", "2026-11-13")).toBe("2027-02-28");
    expect(nextBirthday("2000-02-29", "2027-11-13")).toBe("2028-02-29");
  });

  it("is the day the card is given", () => {
    const day = nextBirthday("2000-02-29", "2026-11-13");
    expect(isBirthday("2000-02-29", day)).toBe(true);
  });
});
