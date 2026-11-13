"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMember } from "@/lib/auth";
import { getNow } from "@/lib/demo-now";
import { perkRefusalMessage } from "@/lib/perk-messages";
import type { DrinkOrApp, PrizeChoice } from "@/lib/perks";
import { choosePrizeInSupabase, redeemPerkInSupabase } from "@/lib/supabase-perk-store";
import { giftCardIdForPerk } from "@/lib/supabase-prize";

export type PerkActionState = { error?: string; code?: string; done?: boolean } | undefined;

const isPrizeChoice = (value: unknown): value is PrizeChoice => value === "gift_card" || value === "donation";

/** "Kinnita valik" at a prize stop. On success it opens the gift card or the thank-you screen. */
export async function choosePrizeAction(perkId: number, _state: PerkActionState, formData: FormData): Promise<PerkActionState> {
  const member = await getMember("/konto/gustavi-rada/tasu");
  const choice = formData.get("prize");
  if (!isPrizeChoice(choice)) return { error: perkRefusalMessage("invalid_choice") };

  let target: string;
  try {
    // At the /demo date, so the 3 days to choose follow the demo clock.
    const result = await choosePrizeInSupabase(member.id, perkId, choice, await getNow());
    if (result.status !== "chosen") return { error: perkRefusalMessage(result.status) };
    const cardId = result.choice === "gift_card" ? await giftCardIdForPerk(perkId) : null;
    target = cardId ? `/konto/kinkekaardid/${cardId}` : result.choice === "gift_card" ? "/konto/kinkekaardid" : "/konto/gustavi-rada/annetus";
  } catch (error) {
    console.error("Could not save the prize choice", error);
    return { error: "Valikut ei õnnestunud salvestada. Proovi hetke pärast uuesti." };
  }

  revalidatePath("/konto", "layout");
  redirect(target);
}

/** "Märgi kasutatuks" (demo only), and stop 50's "Vali hoopis nädal tasuta äpis". */
export async function redeemPerkAction(perkId: number, choice: DrinkOrApp | null): Promise<PerkActionState> {
  const member = await getMember("/konto/gustavi-rada");
  try {
    const result = await redeemPerkInSupabase(member.id, perkId, await getNow(), choice ?? undefined);
    if (result.status !== "redeemed") return { error: perkRefusalMessage(result.status) };
    revalidatePath("/konto", "layout");
    return { done: true, code: result.code ?? undefined };
  } catch (error) {
    console.error("Could not redeem the perk", error);
    return { error: "Hüve kasutamine ebaõnnestus. Proovi hetke pärast uuesti." };
  }
}
