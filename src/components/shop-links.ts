/** The shop sections in the header. They open a placeholder: the shop itself is outside this prototype. */
export const SHOP_LINKS = [
  { slug: "raamatud", label: "Raamatud" },
  { slug: "e-raamatud", label: "E-raamatud" },
  { slug: "app", label: "Äpp" },
  { slug: "literaat", label: "Literaat" },
  { slug: "kauplused", label: "Kauplused" },
] as const;

export const shopPath = (slug: string) => `/pood/${slug}`;
