// Stand-in content for the design stage. Replace with Supabase data.

export const member = {
  name: "Mari",
  points: 52,
  unopenedPerks: 1,
  pointsValidUntil: "31.12.2027",
};

export const nameDayOfferUntil = "12.11.2026";
/** The prize-choice stop the demo member has reached (100, 200, 300 or 400). */
export const reachedPrizeStop = 100;
export const giftCard ={ code: "GUSTAV-7K2M-5EUR", validUntil: "01.12.2026" };
export const school = "Näidiskooli";

export type Book = {
  slug: string;
  title: string;
  author: string;
  price: number;
  cover: "aqua" | "crimson" | "aubergine" | "teal";
};

export const nameDayBooks: Book[] = [
  { slug: "sugisene-raamatupood", title: "Sügisene raamatupood", author: "Mari Näidis", price: 20, cover: "aubergine" },
  { slug: "lounatuul", title: "Lõunatuul", author: "Mari Näidis", price: 17.9, cover: "aqua" },
  { slug: "kolm-kassi", title: "Kolm kassi katusel", author: "Mari Proov", price: 14.5, cover: "crimson" },
  { slug: "vaikne-tanav", title: "Vaikne tänav", author: "Mari Proov", price: 22, cover: "teal" },
];

export const accountLinks = [
  "Minu andmed",
  "Tellimused",
  "Gustavi rada",
  "Kinkekaardid",
  "Annetused",
  "Wallet-kaart",
  "Uudiskirjad",
];

export const siteLinks = ["Raamatud", "E-raamatud", "Äpp", "Literaat", "Kauplused"];
