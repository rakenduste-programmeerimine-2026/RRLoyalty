import { describe, expect, it } from "vitest";
import { checkProfile, daysUntil, nextNameDay } from "./profile";

const today = "2026-11-12";
const valid = { lastName: "Maasikas", phone: "+372 5123 4567", birthday: "2001-01-01" };

describe("checkProfile", () => {
  it("accepts valid values and tidies spaces", () => {
    expect(checkProfile({ lastName: "  Maasikas  ", phone: "+372  5123 4567", birthday: "2001-01-01" }, today)).toEqual({
      ok: true,
      update: { lastName: "Maasikas", phone: "+372 5123 4567", birthday: "2001-01-01" },
    });
  });

  it("turns empty fields into null", () => {
    expect(checkProfile({ lastName: "", phone: " ", birthday: "" }, today)).toEqual({
      ok: true,
      update: { lastName: null, phone: null, birthday: null },
    });
  });

  it("refuses a phone that isn't a number", () => {
    const result = checkProfile({ ...valid, phone: "helista mulle" }, today);
    expect(result).toMatchObject({ ok: false, errors: { phone: expect.any(String) } });
  });

  it("refuses an impossible, future or too old birthday", () => {
    expect(checkProfile({ ...valid, birthday: "2001-02-30" }, today)).toMatchObject({ ok: false, errors: { birthday: expect.any(String) } });
    expect(checkProfile({ ...valid, birthday: "2026-11-13" }, today)).toMatchObject({ ok: false, errors: { birthday: "Sünnipäev ei saa olla tulevikus." } });
    expect(checkProfile({ ...valid, birthday: "1850-01-01" }, today)).toMatchObject({ ok: false, errors: { birthday: "Kontrolli sünniaastat." } });
  });

  it("refuses a very long last name", () => {
    expect(checkProfile({ ...valid, lastName: "x".repeat(61) }, today)).toMatchObject({ ok: false, errors: { lastName: expect.any(String) } });
  });
});

describe("nextNameDay", () => {
  it("is the next name day from today, today included", () => {
    expect(nextNameDay([{ name: "Mari", month: 11, day: 19 }], today)).toBe("2026-11-19");
    expect(nextNameDay([{ name: "Mari", month: 11, day: 12 }], today)).toBe("2026-11-12");
  });

  it("moves to next year once this year's has passed, and picks the nearest of several", () => {
    expect(nextNameDay([{ name: "Mari", month: 3, day: 1 }], today)).toBe("2027-03-01");
    expect(nextNameDay([{ name: "Mari", month: 3, day: 1 }, { name: "Mari", month: 12, day: 24 }], today)).toBe("2026-12-24");
  });

  it("finds a 29 February name day in the next leap year", () => {
    expect(nextNameDay([{ name: "Mari", month: 2, day: 29 }], today)).toBe("2028-02-29");
  });

  it("is null without name days", () => {
    expect(nextNameDay([], today)).toBeNull();
  });
});

describe("daysUntil", () => {
  it("counts whole days", () => {
    expect(daysUntil("2026-11-19", today)).toBe(7);
    expect(daysUntil(today, today)).toBe(0);
  });
});
