"use client";

import Link from "next/link";
import { Icon } from "./Icon";
import { useCart } from "./useCart";

/** The bag in the header: "Ostukorv (2)" on a wide screen, the icon with a count on a phone. */
export function CartCount() {
  const { lines } = useCart();
  const count = lines?.reduce((sum, line) => sum + line.qty, 0) ?? 0;

  return (
    <Link className="site-user__link site-user__link--bag" href="/ostukorv" aria-label={`Ostukorv (${count})`}>
      <Icon name="bag" />
      <span className="site-user__bag-text">Ostukorv ({count})</span>
      <span className="site-user__badge">{count}</span>
    </Link>
  );
}
