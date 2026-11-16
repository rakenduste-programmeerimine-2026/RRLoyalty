// The signed-in member's first name for the header and the mobile menu.

import "server-only";
import { cache } from "react";
import { createClient } from "./supabase/server";

/**
 * Null when nobody is signed in, or when Supabase can't be reached: the header
 * then shows "Logi sisse". Never redirects, because the header also appears
 * on public pages. Cached per request, so the header and the menu share one read.
 */
export const headerMemberName = cache(async (): Promise<string | null> => {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    // RLS lets a member read their own members row.
    const { data: row } = await supabase
      .from("members")
      .select("first_name")
      .eq("id", data.user.id)
      .maybeSingle<{ first_name: string }>();
    return row?.first_name ?? data.user.email?.split("@")[0] ?? "Minu konto";
  } catch (error) {
    console.error("Could not read the signed-in member for the header", error);
    return null;
  }
});
