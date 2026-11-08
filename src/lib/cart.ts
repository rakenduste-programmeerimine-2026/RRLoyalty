import { nameDayPrice } from "./money";
import type { Book } from "./sample-data";

export type CartLine = { slug: string; qty: number };

export const MAX_QTY = 9;

const clampQty = (qty: number) => Math.min(Math.max(Math.trunc(qty), 1), MAX_QTY);

export function addToCart(lines: CartLine[], slug: string): CartLine[] {
  const existing = lines.find((line) => line.slug === slug);
  if (!existing) return [...lines, { slug, qty: 1 }];
  return lines.map((line) => (line.slug === slug ? { ...line, qty: clampQty(line.qty + 1) } : line));
}

export function setQty(lines: CartLine[], slug: string, qty: number): CartLine[] {
  return lines.map((line) => (line.slug === slug ? { ...line, qty: clampQty(qty) } : line));
}

export function removeFromCart(lines: CartLine[], slug: string): CartLine[] {
  return lines.filter((line) => line.slug !== slug);
}

/** Reads a stored cart, dropping anything malformed instead of failing. */
export function parseCart(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value
      .filter(
        (line): line is CartLine =>
          typeof line?.slug === "string" && typeof line?.qty === "number" && Number.isFinite(line.qty),
      )
      .map((line) => ({ slug: line.slug, qty: clampQty(line.qty) }));
  } catch {
    return [];
  }
}

const cents = (amount: number) => Math.round(amount * 100);

export type CartSummary = {
  items: { book: Book; qty: number; price: number; discounted: number }[];
  count: number;
  listTotal: number;
  discount: number;
  total: number;
  earned: number;
};

/**
 * Totals for the bag. Every book in the catalog is a namesake book, so each gets the name-day price.
 * Points are 1 per euro of the amount paid, rounded down once for the whole purchase.
 */
export function summarizeCart(lines: CartLine[], catalog: Book[]): CartSummary {
  const items = lines.flatMap((line) => {
    const book = catalog.find((candidate) => candidate.slug === line.slug);
    if (!book) return [];
    return [{ book, qty: line.qty, price: book.price, discounted: nameDayPrice(book.price) }];
  });

  const listCents = items.reduce((sum, item) => sum + cents(item.price) * item.qty, 0);
  const totalCents = items.reduce((sum, item) => sum + cents(item.discounted) * item.qty, 0);

  return {
    items,
    count: items.reduce((sum, item) => sum + item.qty, 0),
    listTotal: listCents / 100,
    discount: (listCents - totalCents) / 100,
    total: totalCents / 100,
    earned: Math.floor(totalCents / 100),
  };
}
