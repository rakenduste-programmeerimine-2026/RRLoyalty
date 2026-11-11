// The shop as one member sees it on one day: every book priced with their
// name-day offer, if one is open. Pure: the data and "today" are passed in.
// Rules: docs/program-rules.md (Name day and birthday).

import { isNamesake, nameDayOffer, namesakePrice, type NameDay, type NameDayOffer } from "./name-day";
import type { Book } from "./sample-data";

/** A row of books joined with its author. */
export type CatalogBook = Book & { authorFirstName: string; format: "book" | "ebook" };

/** A book with the price this member pays for it. `discounted` equals `price` when no discount applies. */
export type PricedBook = CatalogBook & { discounted: number };

export type Shop = {
  /** Null when the signed-in user has no member profile yet. */
  firstName: string | null;
  offer: NameDayOffer | null;
  /** Every book, priced for this member. */
  books: PricedBook[];
  /** Points on the current lap, from member_points. */
  lapPoints: number;
};

/** What building the shop needs from the database. The Supabase version is in supabase-shop-store.ts. */
export interface ShopStore {
  /** members.first_name, or null when there is no members row. */
  memberFirstName(memberId: string): Promise<string | null>;
  nameDays(firstName: string): Promise<NameDay[]>;
  books(): Promise<CatalogBook[]>;
  /** member_points.current_lap_points, or 0 when there is no row. */
  lapPoints(memberId: string): Promise<number>;
}

export function priceBooks(books: CatalogBook[], offer: NameDayOffer | null): PricedBook[] {
  return books.map((book) => ({ ...book, discounted: namesakePrice(book, offer) }));
}

/** The books on the "Sinu nimekaimud" list: namesake authors, while the offer is open. */
export function namesakeBooks(shop: Shop): PricedBook[] {
  const offer = shop.offer;
  if (!offer) return [];
  return shop.books.filter((book) => isNamesake(offer.firstName, book.authorFirstName));
}

export async function loadShop(store: ShopStore, memberId: string, today: string): Promise<Shop> {
  const [firstName, books, lapPoints] = await Promise.all([
    store.memberFirstName(memberId),
    store.books(),
    store.lapPoints(memberId),
  ]);
  const offer = firstName ? nameDayOffer(firstName, await store.nameDays(firstName), today) : null;
  return { firstName, offer, books: priceBooks(books, offer), lapPoints };
}

/** Today's date in Estonia as "YYYY-MM-DD". /demo (#22) will be able to move it. */
export function todayInEstonia(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Tallinn" }).format(now);
}

/** "2026-11-12" → "12.11.2026" */
export function formatDayEt(day: string): string {
  const [year, month, date] = day.split("-");
  return `${date}.${month}.${year}`;
}
