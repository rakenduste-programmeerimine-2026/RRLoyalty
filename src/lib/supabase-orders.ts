// The signed-in member's purchases with their points. Uses the member's own
// session: RLS (#6) only returns their purchases and ledger rows.

import "server-only";
import type { OrderRow } from "./orders";
import type { Channel, PurchaseStatus } from "./purchase-store";
import { createClient } from "./supabase/server";

export async function loadOrders(limit = 50): Promise<OrderRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchases")
    .select("id, channel, location, amount_paid, order_number, status, purchased_at, points_ledger(points)")
    .order("purchased_at", { ascending: false })
    .limit(limit)
    .returns<
      {
        id: number;
        channel: Channel;
        location: string | null;
        amount_paid: number | string;
        order_number: string | null;
        status: PurchaseStatus;
        purchased_at: string;
        points_ledger: { points: number } | null;
      }[]
    >();
  if (error) throw new Error(`Could not read purchases: ${error.message}`);
  return data.map((row) => ({
    id: row.id,
    channel: row.channel,
    location: row.location,
    amountPaid: Number(row.amount_paid),
    orderNumber: row.order_number,
    status: row.status,
    purchasedAt: new Date(row.purchased_at),
    points: row.points_ledger ? Number(row.points_ledger.points) : null,
  }));
}
