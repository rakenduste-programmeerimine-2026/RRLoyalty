"use client";

import { useRouter } from "next/navigation";
import { useCart } from "./useCart";

export function AddToCartButton({ slug }: { slug: string }) {
  const router = useRouter();
  const { add } = useCart();

  return (
    <button
      type="button"
      className="btn"
      onClick={() => {
        add(slug);
        router.push("/ostukorv");
      }}
    >
      Lisa ostukorvi
    </button>
  );
}
