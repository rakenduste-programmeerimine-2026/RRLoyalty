// "Minu andmed" data. Reading uses the member's own session (RLS lets them read
// their row and the public name days). Saving needs the secret key, because
// RLS has no write policies (#6): only call saveProfileInSupabase after getMember().

import "server-only";
import type { NameDay } from "./name-day";
import type { ProfileUpdate } from "./profile";
import { createAdminClient } from "./supabase/admin";
import { createClient } from "./supabase/server";

export type Profile = {
  email: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  /** "YYYY-MM-DD" or null. */
  birthday: string | null;
  /** "YYYY-MM-DD". */
  memberSince: string;
  nameDays: NameDay[];
};

/** The signed-in member's profile, or null when they have no members row yet. */
export async function loadProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data, error } = await supabase
    .from("members")
    .select("first_name, last_name, phone, birthday, member_since")
    .eq("id", auth.user.id)
    .maybeSingle<{
      first_name: string;
      last_name: string | null;
      phone: string | null;
      birthday: string | null;
      member_since: string;
    }>();
  if (error) throw new Error(`Could not read the member: ${error.message}`);
  if (!data) return null;

  const days = await supabase.from("name_days").select("name, month, day").eq("name", data.first_name);
  if (days.error) throw new Error(`Could not read name days: ${days.error.message}`);

  return {
    email: auth.user.email ?? "",
    firstName: data.first_name,
    lastName: data.last_name,
    phone: data.phone,
    birthday: data.birthday,
    memberSince: data.member_since,
    nameDays: days.data as NameDay[],
  };
}

export async function saveProfileInSupabase(memberId: string, update: ProfileUpdate): Promise<void> {
  const { error } = await createAdminClient()
    .from("members")
    .update({ last_name: update.lastName, phone: update.phone, birthday: update.birthday })
    .eq("id", memberId);
  if (error) throw new Error(`Could not save the profile: ${error.message}`);
}
