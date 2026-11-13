"use server";

// /demo's events. Each one goes through the same server logic as the real
// event: recordPurchase() for a purchase, giveBirthdayCard() for the birthday,
// and the demo clock (demo-now.ts) that every page reads "now" from.

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getMember } from "@/lib/auth";
import { nextBirthday } from "@/lib/birthday";
import { isCheckoutRef, orderNumberFor } from "@/lib/checkout";
import { jumpToDay, skipAhead, type DemoSkip } from "@/lib/demo-clock";
import { getNow, resetDemoClock, setDemoNow } from "@/lib/demo-now";
import { formatEur } from "@/lib/money";
import { formatDayEt, todayInEstonia } from "@/lib/namesakes";
import { nextNameDay } from "@/lib/profile";
import { isChannel } from "@/lib/purchases";
import { formatDate } from "@/lib/rail-account";
import { giveBirthdayCardInSupabase } from "@/lib/supabase-birthday-store";
import { loadProfile } from "@/lib/supabase-profile";
import { recordPurchaseInSupabase } from "@/lib/supabase-purchase-store";

const PATH = "/demo";
const MAX_AMOUNT = 10_000;
const MAX_LOCATION = 60;

export type DemoState =
  | { status: "idle" }
  | { status: "done"; message: string }
  | { status: "error"; message: string };

/** The purchase form also needs a fresh reference for the next purchase. */
export type PurchaseState = DemoState & { nextRef: string };

const done = (message: string): DemoState => ({ status: "done", message });
const failed = (message: string): DemoState => ({ status: "error", message });

/** Every page shows the demo date, so all of them render again. */
function refreshPages() {
  revalidatePath("/", "layout");
}

export async function addDemoPurchase(_state: PurchaseState, formData: FormData): Promise<PurchaseState> {
  const member = await getMember(PATH);
  const ref = String(formData.get("ref") ?? "");
  const channel = formData.get("channel");
  const amount = Number(String(formData.get("amount") ?? "").replace(",", ".").trim());
  const location = String(formData.get("location") ?? "").trim();

  if (!isCheckoutRef(ref)) return { ...failed("Vorm aegus. Laadi leht uuesti."), nextRef: randomUUID() };
  if (!isChannel(channel)) return { ...failed("Vali müügikanal."), nextRef: ref };
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
    return { ...failed(`Summa peab olema 0,01–${MAX_AMOUNT} €.`), nextRef: ref };
  }
  if (location.length > MAX_LOCATION) {
    return { ...failed(`Kaupluse nimi võib olla kuni ${MAX_LOCATION} märki.`), nextRef: ref };
  }

  try {
    const result = await recordPurchaseInSupabase({
      memberId: member.id,
      channel,
      amountPaid: amount,
      // The same reference on a double submit, so the purchase is recorded once.
      externalRef: `demo:${ref.toLowerCase()}`,
      location: channel === "store" ? location || null : null,
      orderNumber: channel === "store" ? null : orderNumberFor(ref),
      purchasedAt: await getNow(),
    });
    refreshPages();
    if (result.alreadyRecorded) return { ...done("See ost oli juba lisatud."), nextRef: randomUUID() };
    const opened = result.openedStops.length > 0 ? ` Avanes peatus: ${result.openedStops.join(", ")} p.` : "";
    return { ...done(`Ost ${formatEur(amount)} lisatud, +${result.points} punkti.${opened}`), nextRef: randomUUID() };
  } catch (error) {
    console.error("Could not add the demo purchase", error);
    return { ...failed("Ostu ei õnnestunud lisada. Proovi uuesti."), nextRef: ref };
  }
}

export async function skipDemoClock(_state: DemoState, formData: FormData): Promise<DemoState> {
  await getMember(PATH);
  const skip = formData.get("skip");
  if (skip !== "3d" && skip !== "6m") return failed("Tundmatu ajahüpe.");

  const next = skipAhead(await getNow(), skip satisfies DemoSkip);
  await setDemoNow(next);
  refreshPages();
  return done(`Demo kuupäev on nüüd ${formatDate(next)}.`);
}

export async function triggerNameDay(): Promise<DemoState> {
  await getMember(PATH);
  try {
    const profile = await loadProfile();
    if (!profile) return failed("Sinu kontol pole kliendiklubi andmeid.");

    const now = await getNow();
    const day = nextNameDay(profile.nameDays, todayInEstonia(now));
    if (!day) return failed(`Nimel ${profile.firstName} pole nimepäeva.`);

    await setDemoNow(jumpToDay(now, day));
    refreshPages();
    return done(`Demo kuupäev on nüüd ${formatDayEt(day)}, ${profile.firstName} nimepäev. Nimekaimude raamatud on −10%.`);
  } catch (error) {
    console.error("Could not trigger the name day", error);
    return failed("Nimepäeva ei õnnestunud käivitada. Proovi uuesti.");
  }
}

export async function triggerBirthday(): Promise<DemoState> {
  const member = await getMember(PATH);
  try {
    const profile = await loadProfile();
    if (!profile) return failed("Sinu kontol pole kliendiklubi andmeid.");
    if (!profile.birthday) return failed("Sünnipäev puudub. Lisa see lehel Minu andmed.");

    const now = await getNow();
    const day = nextBirthday(profile.birthday, todayInEstonia(now));
    await setDemoNow(jumpToDay(now, day));
    const result = await giveBirthdayCardInSupabase(member.id, day);
    refreshPages();

    const date = formatDayEt(day);
    if (result.status === "given") return done(`Demo kuupäev on nüüd ${date}. 5 € sünnipäevakaart antud: ${result.code}.`);
    if (result.status === "already_given") {
      return done(`Demo kuupäev on nüüd ${date}. Selle aasta sünnipäevakaart on juba antud.`);
    }
    return failed("Sünnipäevakaarti ei antud.");
  } catch (error) {
    console.error("Could not trigger the birthday", error);
    return failed("Sünnipäeva ei õnnestunud käivitada. Proovi uuesti.");
  }
}

export async function resetDemo(): Promise<DemoState> {
  await getMember(PATH);
  await resetDemoClock();
  refreshPages();
  return done("Demo kuupäev on jälle tänane.");
}
