// Data access layer for the signed-in member. Every page and Server Action
// that needs the member calls getMember(), so the check sits next to the data
// rather than only in the proxy.

import { redirect } from "next/navigation";
import { cache } from "react";
import { signInPath } from "./auth-redirect";
import { createClient } from "./supabase/server";

export type Member = {
  id: string;
  email: string;
};

/**
 * The signed-in member, or a redirect to sign-in. `returnTo` is the page to
 * open again after signing in.
 */
export const getMember = cache(async (returnTo: string): Promise<Member> => {
  const supabase = await createClient();
  // getUser() asks Supabase Auth, so a revoked session is caught here too.
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect(signInPath(returnTo));
  }

  return { id: data.user.id, email: data.user.email ?? "" };
});
