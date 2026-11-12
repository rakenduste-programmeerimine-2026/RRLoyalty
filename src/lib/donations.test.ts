import { describe, expect, it } from "vitest";
import { donationsView, libraryName, type DonationRow } from "./donations";

const row = (overrides: Partial<DonationRow>): DonationRow => ({
  id: 1,
  amount: 5,
  school: "Näidiskooli",
  createdAt: new Date("2026-11-12T10:00:00Z"),
  stopAt: 100,
  ...overrides,
});

describe("donationsView", () => {
  it("adds up every donation and lists the newest first", () => {
    const view = donationsView([
      row({ id: 1, createdAt: new Date("2026-09-01T10:00:00Z"), stopAt: 100 }),
      row({ id: 2, createdAt: new Date("2026-11-12T10:00:00Z"), stopAt: 200 }),
      row({ id: 3, amount: 2.5, createdAt: new Date("2026-10-01T10:00:00Z"), stopAt: null }),
    ]);
    expect(view.total).toBe(12.5);
    expect(view.items.map((item) => [item.id, item.source])).toEqual([
      [2, "Gustavi rada 200 p"],
      [3, "Gustavi rada"],
      [1, "Gustavi rada 100 p"],
    ]);
  });

  it("adds cents without floating-point errors", () => {
    expect(donationsView([row({ amount: 0.1 }), row({ id: 2, amount: 0.2 })]).total).toBe(0.3);
  });

  it("is empty for a member who hasn't donated", () => {
    expect(donationsView([])).toEqual({ total: 0, items: [] });
  });
});

describe("libraryName", () => {
  it("names the school's library", () => {
    expect(libraryName("Näidiskooli")).toBe("Näidiskooli raamatukogu");
  });
});
