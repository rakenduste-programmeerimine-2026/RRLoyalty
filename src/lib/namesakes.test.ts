import { describe, expect, it } from "vitest";
import type { NameDay } from "./name-day";
import { formatDayEt, loadShop, namesakeBooks, todayInEstonia, type CatalogBook, type ShopStore } from "./namesakes";

const books: CatalogBook[] = [
  { slug: "a", title: "A", author: "Mari Näidis", authorFirstName: "Mari", price: 20, cover: "aqua", format: "book" },
  { slug: "b", title: "B", author: "Mari Proov", authorFirstName: "Mari", price: 9.9, cover: "teal", format: "ebook" },
  { slug: "c", title: "C", author: "Marie Teine", authorFirstName: "Marie", price: 15, cover: "crimson", format: "book" },
  { slug: "d", title: "D", author: "Jüri Kolmas", authorFirstName: "Jüri", price: 12, cover: "aubergine", format: "book" },
];
const nameDays: NameDay[] = [{ name: "Mari", month: 11, day: 6 }];

function store(firstName: string | null, lapPoints = 34): ShopStore {
  return {
    memberFirstName: async () => firstName,
    nameDays: async (name) => nameDays.filter((row) => row.name === name),
    books: async () => books,
    lapPoints: async () => lapPoints,
  };
}

describe("loadShop", () => {
  it("gives a namesake 10% off on the name day, e-books included", async () => {
    const shop = await loadShop(store("Mari"), "member-1", "2026-11-06");

    expect(shop.offer).toMatchObject({ firstName: "Mari", lastDay: "2026-11-06" });
    expect(shop.lapPoints).toBe(34);
    expect(shop.books.map((book) => [book.slug, book.discounted])).toEqual([
      ["a", 18],
      ["b", 8.91],
      ["c", 15],
      ["d", 12],
    ]);
  });

  it("charges full price the day after the name day", async () => {
    const shop = await loadShop(store("Mari"), "member-1", "2026-11-07");

    expect(shop.offer).toBeNull();
    expect(shop.books.every((book) => book.discounted === book.price)).toBe(true);
  });

  it("has no offer for a member without a profile or a name day", async () => {
    expect((await loadShop(store(null), "member-1", "2026-11-06")).offer).toBeNull();
    expect((await loadShop(store("Jüri"), "member-1", "2026-11-06")).offer).toBeNull();
  });
});

describe("namesakeBooks", () => {
  it("lists only authors with exactly the member's first name", async () => {
    const shop = await loadShop(store("Mari"), "member-1", "2026-11-06");
    expect(namesakeBooks(shop).map((book) => book.slug)).toEqual(["a", "b"]);
  });

  it("is empty when no offer is open", async () => {
    const shop = await loadShop(store("Mari"), "member-1", "2026-12-01");
    expect(namesakeBooks(shop)).toEqual([]);
  });
});

describe("dates", () => {
  it("uses the Estonian calendar day", () => {
    // 23:30 UTC on 11 November is already 12 November in Tallinn.
    expect(todayInEstonia(new Date("2026-11-11T23:30:00Z"))).toBe("2026-11-12");
  });

  it("formats a day the Estonian way", () => {
    expect(formatDayEt("2026-11-12")).toBe("12.11.2026");
  });
});
