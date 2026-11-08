"use client";

import Link from "next/link";
import { useCart } from "./useCart";

export function CartCount() {
  const { lines } = useCart();
  const count = lines?.reduce((sum, line) => sum + line.qty, 0) ?? 0;

  return <Link href="/ostukorv">Ostukorv ({count})</Link>;
}
