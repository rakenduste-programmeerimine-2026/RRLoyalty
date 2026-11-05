import { describe, expect, it } from "vitest";
import { formatEur, nameDayPrice } from "./money";

describe("nameDayPrice", () => {
  it("takes 10% off", () => {
    expect(nameDayPrice(20)).toBe(18);
  });

  it("rounds to whole cents", () => {
    expect(nameDayPrice(17.9)).toBe(16.11);
  });
});

describe("formatEur", () => {
  it("uses the Estonian format", () => {
    expect(formatEur(18).replace(/\s/g, " ")).toBe("18,00 €");
  });
});
