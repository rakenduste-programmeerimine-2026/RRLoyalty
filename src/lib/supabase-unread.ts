// The signed-in member's unread Postkast messages, for "Postkast (2)" in the
// menus. Uses the member's own session: RLS (#6) only counts their messages.

import "server-only";
import { createClient } from "./supabase/server";

/** 0 when nobody is signed in or the count can't be read: the menus then show no badge. */
export async function unreadMessageCount(): Promise<number> {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .is("read_at", null);
    if (error) throw error;
    return count ?? 0;
  } catch (error) {
    console.error("Could not count unread messages", error);
    return 0;
  }
}
