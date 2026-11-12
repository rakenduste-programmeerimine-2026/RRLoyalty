"use server";

import { redirect } from "next/navigation";
import { SIGN_IN_PATH, safeNextPath } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";

export type SignInState = { error?: string; email?: string } | undefined;

export async function signIn(_state: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? ""));

  if (!email || !password) {
    return { error: "Sisesta e-posti aadress ja parool.", email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Same message for an unknown email and a wrong password.
    const message =
      error.status === 400
        ? "E-posti aadress või parool on vale."
        : "Sisselogimine ebaõnnestus. Proovi hetke pärast uuesti.";
    return { error: message, email };
  }

  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // The sign-in page then says "Logisid välja", as in the prototype.
  redirect(`${SIGN_IN_PATH}?valja=1`);
}
