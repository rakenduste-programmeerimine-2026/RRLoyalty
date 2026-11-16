"use client";

import { useRouter } from "next/navigation";
import { useCart } from "./useCart";

/** `price` is the formatted price the member pays, shown on the button. */
export function AddToCartButton({ slug, price }: { slug: string; price?: string }) {
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
      Lisa ostukorvi{price ? ` · ${price}` : ""}
    </button>
  );
}
