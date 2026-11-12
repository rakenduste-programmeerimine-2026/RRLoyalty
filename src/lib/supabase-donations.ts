// The signed-in member's donations. Uses the member's own session: RLS (#6)
// only returns their rows, so no secret key is needed.

import "server-only";
import type { DonationRow } from "./donations";
import { createClient } from "./supabase/server";

export async function loadDonations(): Promise<DonationRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("donations")
    .select("id, amount, school, created_at, perks(stop_at)")
    .returns<
      {
        id: number;
        amount: number | string;
        school: string;
        created_at: string;
        perks: { stop_at: number | null } | null;
      }[]
    >();
  if (error) throw new Error(`Could not read donations: ${error.message}`);
  return data.map((row) => ({
    id: row.id,
    amount: Number(row.amount),
    school: row.school,
    createdAt: new Date(row.created_at),
    stopAt: row.perks?.stop_at ?? null,
  }));
}
