"use server";

import { revalidatePath } from "next/cache";
import { getMember } from "@/lib/auth";
import { getNow } from "@/lib/demo-now";
import { todayInEstonia } from "@/lib/namesakes";
import { checkProfile, type ProfileErrors, type ProfileInput } from "@/lib/profile";
import { saveProfileInSupabase } from "@/lib/supabase-profile";

export type ProfileFormState =
  | { status: "idle" }
  | { status: "saved" }
  // `values` carries what the member typed: React resets the form after the action,
  // so the fields fall back to these instead of losing the input.
  | { status: "invalid"; errors: ProfileErrors; values: ProfileInput }
  | { status: "failed"; values: ProfileInput };

export async function saveProfile(_state: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const member = await getMember("/konto/andmed");

  const values: ProfileInput = {
    lastName: String(formData.get("lastName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    birthday: String(formData.get("birthday") ?? ""),
  };
  const check = checkProfile(values, todayInEstonia(await getNow()));
  if (!check.ok) return { status: "invalid", errors: check.errors, values };

  try {
    await saveProfileInSupabase(member.id, check.update);
  } catch (error) {
    console.error("Could not save the profile", error);
    return { status: "failed", values };
  }

  revalidatePath("/konto/andmed");
  return { status: "saved" };
}
