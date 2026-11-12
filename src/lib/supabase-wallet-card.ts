// The simulated club card for the signed-in member. Uses the member's own
// session: RLS (#6) returns only their members row and member_points.

import "server-only";
import { createClient } from "./supabase/server";

export type WalletCard = {
  name: string;
  /** members.card_number, or null when the member has none yet. */
  cardNumber: string | null;
  lapPoints: number;
};

/** The card, or null when the signed-in user has no members row. */
export async function loadWalletCard(): Promise<WalletCard | null> {
  const supabase = await createClient();
  const [member, points] = await Promise.all([
    supabase
      .from("members")
      .select("first_name, last_name, card_number")
      .maybeSingle<{ first_name: string; last_name: string | null; card_number: string | null }>(),
    supabase.from("member_points").select("current_lap_points").maybeSingle<{ current_lap_points: number }>(),
  ]);
  if (member.error) throw new Error(`Could not read the member: ${member.error.message}`);
  if (points.error) throw new Error(`Could not read points: ${points.error.message}`);
  if (!member.data) return null;

  return {
    name: [member.data.first_name, member.data.last_name].filter(Boolean).join(" "),
    cardNumber: member.data.card_number,
    lapPoints: Number(points.data?.current_lap_points ?? 0),
  };
}
