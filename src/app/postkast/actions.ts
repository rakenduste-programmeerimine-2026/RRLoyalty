"use server";

import { revalidatePath } from "next/cache";
import { getMember } from "@/lib/auth";
import { getNow } from "@/lib/demo-now";
import { markAllMessagesReadInSupabase } from "@/lib/supabase-message-store";

/** "Märgi kõik loetuks" on the Postkast inbox. */
export async function markAllReadAction(): Promise<void> {
  const member = await getMember("/postkast");
  try {
    await markAllMessagesReadInSupabase(member.id, await getNow());
  } catch (error) {
    // The inbox reloads either way; unread messages simply stay unread.
    console.error("Could not mark the messages read", error);
  }
  // The unread count shows in the menus on every page.
  revalidatePath("/", "layout");
}
