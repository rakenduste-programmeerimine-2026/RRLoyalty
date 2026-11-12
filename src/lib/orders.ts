// What the "Tellimused" page shows: every purchase from every channel, with
// its points. Pure: rows are passed in. Rules: docs/program-rules.md (Points).

import type { Channel, PurchaseStatus } from "./purchase-store";

/** A purchases row with the points its ledger row gave. */
export type OrderRow = {
  id: number;
  channel: Channel;
  location: string | null;
  amountPaid: number;
  orderNumber: string | null;
  status: PurchaseStatus;
  purchasedAt: Date;
  /** Null when the purchase has no points written (yet). */
  points: number | null;
};

export type OrderView = {
  id: number;
  orderNumber: string | null;
  amountPaid: number;
  purchasedAt: Date;
  where: string;
  status: string;
  points: number | null;
};

const CHANNEL_NAMES: Record<Channel, string> = {
  e_shop: "E-pood",
  store: "Kauplus",
  literaat: "Literaat",
  app: "Äpp",
};

const STATUS_NAMES: Record<PurchaseStatus, string> = {
  processing: "Töötlemisel",
  delivered: "Kohale toimetatud",
  in_store: "Ostetud kauplusest",
};

/** "E-pood", "Äpp", "Kauplus Viru Keskus", "Literaat Telliskivi" */
export function orderWhere(channel: Channel, location: string | null): string {
  return location ? `${CHANNEL_NAMES[channel]} ${location}` : CHANNEL_NAMES[channel];
}

/** Newest first. */
export function ordersView(rows: OrderRow[]): OrderView[] {
  return [...rows]
    .sort((a, b) => b.purchasedAt.getTime() - a.purchasedAt.getTime())
    .map((row) => ({
      id: row.id,
      orderNumber: row.orderNumber,
      amountPaid: row.amountPaid,
      purchasedAt: row.purchasedAt,
      where: orderWhere(row.channel, row.location),
      status: STATUS_NAMES[row.status],
      points: row.points,
    }));
}
