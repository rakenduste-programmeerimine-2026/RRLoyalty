import { describe, expect, it } from "vitest";
import { MAX_QTY, addToCart, parseCart, removeFromCart, restoreLine, setQty, summarizeCart, type PricedCartBook } from "./cart";

// Prices as the server sends them: namesake books at −10%, others at full price.
const catalog: PricedCartBook[] = [
  { slug: "a", title: "A", author: "Mari A", price: 20, discounted: 18, cover: "aqua" },
  { slug: "b", title: "B", author: "Mari B", price: 17.9, discounted: 16.11, cover: "teal" },
  { slug: "c", title: "C", author: "Mari C", price: 15.5, discounted: 13.95, cover: "crimson" },
  { slug: "d", title: "D", author: "Jüri D", price: 12.5, discounted: 12.5, cover: "aubergine" },
];

describe("addToCart", () => {
  it("adds a new book with quantity 1", () => {
    expect(addToCart([], "a")).toEqual([{ slug: "a", qty: 1 }]);
  });

  it("raises the quantity of a book already in the bag", () => {
    expect(addToCart([{ slug: "a", qty: 1 }], "a")).toEqual([{ slug: "a", qty: 2 }]);
  });

  it("stops at the maximum quantity", () => {
    expect(addToCart([{ slug: "a", qty: MAX_QTY }], "a")).toEqual([{ slug: "a", qty: MAX_QTY }]);
  });
});

describe("setQty and removeFromCart", () => {
  it("keeps the quantity at 1 or more", () => {
    expect(setQty([{ slug: "a", qty: 2 }], "a", 0)).toEqual([{ slug: "a", qty: 1 }]);
  });

  it("removes a book", () => {
    expect(removeFromCart([{ slug: "a", qty: 1 }, { slug: "b", qty: 1 }], "a")).toEqual([{ slug: "b", qty: 1 }]);
  });
});

describe("restoreLine", () => {
  const lines = [{ slug: "a", qty: 1 }, { slug: "c", qty: 1 }];

  it("puts a removed book back in its place", () => {
    expect(restoreLine(lines, { slug: "b", qty: 2 }, 1)).toEqual([
      { slug: "a", qty: 1 },
      { slug: "b", qty: 2 },
      { slug: "c", qty: 1 },
    ]);
  });

  it("merges with the same book added again meanwhile", () => {
    expect(restoreLine(lines, { slug: "a", qty: 2 }, 0)).toEqual([{ slug: "a", qty: 3 }, { slug: "c", qty: 1 }]);
  });

  it("restores into an empty bag", () => {
    expect(restoreLine([], { slug: "a", qty: 1 }, 3)).toEqual([{ slug: "a", qty: 1 }]);
  });
});

describe("parseCart", () => {
  it("reads a stored cart", () => {
    expect(parseCart('[{"slug":"a","qty":2}]')).toEqual([{ slug: "a", qty: 2 }]);
  });

  it("ignores missing or broken data", () => {
    expect(parseCart(null)).toEqual([]);
    expect(parseCart("not json")).toEqual([]);
    expect(parseCart('{"slug":"a"}')).toEqual([]);
    expect(parseCart('[{"slug":"a"},{"slug":"b","qty":1}]')).toEqual([{ slug: "b", qty: 1 }]);
  });
});

describe("summarizeCart", () => {
  it("gives the demo name-day purchase: 20 € book, 18 € paid, 18 points", () => {
    const summary = summarizeCart([{ slug: "a", qty: 1 }], catalog);
    expect(summary).toMatchObject({ count: 1, listTotal: 20, discount: 2, total: 18, earned: 18 });
  });

  it("rounds points down once for the whole purchase, not per book", () => {
    // 15,50 € → 13,95 € each. Two cost 27,90 € → 27 points; rounding per book would give only 26.
    const summary = summarizeCart([{ slug: "c", qty: 2 }], catalog);
    expect(summary.total).toBe(27.9);
    expect(summary.earned).toBe(27);
  });

  it("charges full price for a book without a discount", () => {
    const summary = summarizeCart([{ slug: "a", qty: 1 }, { slug: "d", qty: 1 }], catalog);
    expect(summary).toMatchObject({ listTotal: 32.5, discount: 2, total: 30.5, earned: 30 });
  });

  it("skips books that are no longer in the catalog", () => {
    const summary = summarizeCart([{ slug: "gone", qty: 1 }], catalog);
    expect(summary).toMatchObject({ count: 0, total: 0, earned: 0 });
  });
});
