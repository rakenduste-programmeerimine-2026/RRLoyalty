import { connection } from "next/server";
import { getNow } from "@/lib/demo-now";
import { deliverMessagesInSupabase } from "@/lib/supabase-message-store";
import { createClient } from "@/lib/supabase/server";

/**
 * Creates the signed-in member's missing Postkast messages on every page, so
 * the name-day message is there on the name day wherever they open the app.
 * Renders nothing, and never redirects: it also runs on public pages. Must
 * sit inside <Suspense>.
 */
export async function PostkastDelivery() {
  await connection();
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) await deliverMessagesInSupabase(data.user.id, await getNow());
  } catch (error) {
    // A missed delivery is retried on the next page.
    console.error("Could not deliver the Postkast messages", error);
  }
  return null;
}
