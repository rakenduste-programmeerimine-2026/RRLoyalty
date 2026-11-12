// Program settings from the settings table. RLS makes it public, so the
// signed-in member's own client can read it. Never store secrets there.

import "server-only";
import { connection } from "next/server";
import { createClient } from "./supabase/server";

/**
 * settings.donation_school: the one school that donations go to (docs/program-rules.md, Perks).
 * Null when it is missing or cannot be read, so the page can fall back to generic wording.
 */
export async function donationSchool(): Promise<string | null> {
  // Read per request, and outside the try: Next.js stops prerendering here by
  // throwing, and catching that would bake the fallback into the static page.
  await connection();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "donation_school")
      .maybeSingle<{ value: string }>();
    if (error) throw error;
    return data?.value?.trim() || null;
  } catch (error) {
    console.error("Could not read settings.donation_school", error);
    return null;
  }
}
