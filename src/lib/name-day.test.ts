import { describe, expect, it } from "vitest";
import { isNamesake, nameDayOffer, namesakePrice, type NameDay } from "./name-day";

const nameDays: NameDay[] = [
  { name: "Mari", month: 11, day: 6 },
  { name: "Jüri", month: 4, day: 23 },
  { name: "Silvester", month: 12, day: 31 },
];

describe("isNamesake", () => {
  it("matches the same first name", () => {
    expect(isNamesake("Mari", "Mari")).toBe(true);
  });

  it("does not match a different name", () => {
    expect(isNamesake("Mari", "Marie")).toBe(false);
    expect(isNamesake("Mari", "Jüri")).toBe(false);
  });

  it("does not match another case, spacing or accent", () => {
    expect(isNamesake("Mari", "mari")).toBe(false);
    expect(isNamesake("Mari", " Mari")).toBe(false);
    expect(isNamesake("Jüri", "Juri")).toBe(false);
  });
});

describe("nameDayOffer", () => {
  it("opens on the name day, and only for that day", () => {
    expect(nameDayOffer("Mari", nameDays, "2026-11-06")).toEqual({
      firstName: "Mari",
      nameDay: "2026-11-06",
      lastDay: "2026-11-06",
    });
  });

  it("is not open the day before the name day", () => {
    expect(nameDayOffer("Mari", nameDays, "2026-11-05")).toBeNull();
  });

  it("is closed the day after the name day", () => {
    expect(nameDayOffer("Mari", nameDays, "2026-11-07")).toBeNull();
  });

  it("has no offer for a name without a name day", () => {
    expect(nameDayOffer("Kati", nameDays, "2026-11-06")).toBeNull();
  });

  it("matches the name exactly", () => {
    expect(nameDayOffer("mari", nameDays, "2026-11-06")).toBeNull();
  });

  it("does not carry a 31 December name day into the new year", () => {
    expect(nameDayOffer("Silvester", nameDays, "2026-12-31")?.nameDay).toBe("2026-12-31");
    expect(nameDayOffer("Silvester", nameDays, "2027-01-01")).toBeNull();
  });

  it("opens on each name day when a name has two, and not in between", () => {
    const twice: NameDay[] = [
      { name: "Mari", month: 11, day: 6 },
      { name: "Mari", month: 11, day: 9 },
    ];
    expect(nameDayOffer("Mari", twice, "2026-11-06")?.nameDay).toBe("2026-11-06");
    expect(nameDayOffer("Mari", twice, "2026-11-08")).toBeNull();
    expect(nameDayOffer("Mari", twice, "2026-11-09")?.nameDay).toBe("2026-11-09");
  });

  it("skips a 29 February name day in a year without one", () => {
    const leap: NameDay[] = [{ name: "Liisu", month: 2, day: 29 }];
    expect(nameDayOffer("Liisu", leap, "2027-03-01")).toBeNull();
    expect(nameDayOffer("Liisu", leap, "2028-02-29")?.nameDay).toBe("2028-02-29");
  });

  it("rejects a date that is not YYYY-MM-DD", () => {
    expect(() => nameDayOffer("Mari", nameDays, "06.11.2026")).toThrow(RangeError);
    expect(() => nameDayOffer("Mari", nameDays, "2026-02-30")).toThrow(RangeError);
  });
});

describe("namesakePrice", () => {
  const offer = nameDayOffer("Mari", nameDays, "2026-11-06");

  it("takes 10% off a namesake author's book while the offer is open", () => {
    expect(namesakePrice({ price: 20, authorFirstName: "Mari" }, offer)).toBe(18);
    expect(namesakePrice({ price: 17.9, authorFirstName: "Mari" }, offer)).toBe(16.11);
  });

  it("keeps the full price for another author", () => {
    expect(namesakePrice({ price: 20, authorFirstName: "Marie" }, offer)).toBe(20);
  });

  it("keeps the full price on any other day", () => {
    const closed = nameDayOffer("Mari", nameDays, "2026-11-07");
    expect(namesakePrice({ price: 20, authorFirstName: "Mari" }, closed)).toBe(20);
  });
});
