"use server";

import { getMember } from "@/lib/auth";
import { EmptyCartError, checkoutCart } from "@/lib/checkout";
import { PurchaseConflictError } from "@/lib/purchases";
import { SupabasePurchaseStore } from "@/lib/supabase-purchase-store";
import { loadShopFromSupabase } from "@/lib/supabase-shop-store";
import { createAdminClient } from "@/lib/supabase/admin";

export type CheckoutState =
  | { ok: true; orderNumber: string; total: number; points: number; openedStops: number[] }
  | { ok: false; error: string; newCheckout?: boolean };

/** Simulated payment: records the order as an e-shop purchase. There is no payment provider. */
export async function payForCart(lines: unknown, checkoutRef: string): Promise<CheckoutState> {
  // Redirects to sign-in when nobody is signed in. The cart stays in the browser meanwhile.
  const member = await getMember("/ostukorv");

  try {
    // Priced again here, at payment time: the offer can end between opening the bag and paying.
    const shop = await loadShopFromSupabase(member.id);
    const result = await checkoutCart(new SupabasePurchaseStore(createAdminClient()), {
      memberId: member.id,
      lines,
      checkoutRef,
      catalog: shop.books,
    });
    return {
      ok: true,
      orderNumber: result.orderNumber,
      total: result.total,
      points: result.points,
      openedStops: result.openedStops,
    };
  } catch (error) {
    if (error instanceof EmptyCartError) {
      return { ok: false, error: "Ostukorv on tühi." };
    }
    if (error instanceof PurchaseConflictError) {
      return { ok: false, error: "Ostukorv muutus makse ajal. Vaata see üle ja maksa uuesti.", newCheckout: true };
    }
    console.error("Checkout failed", error);
    return { ok: false, error: "Makse ebaõnnestus. Proovi hetke pärast uuesti." };
  }
}
