// What the Gustavi rada page shows for one member at one moment. Pure: the
// rows and "now" are passed in. Rules: docs/program-rules.md.

import { pointsExpireAt } from "./laps";
import type { Channel } from "./purchase-store";
import { STOPS } from "./rail";

/** A row of the member_points view. */
export type PointsRow = {
  lifetimeTotal: number;
  lapsCompleted: number;
  currentLapPoints: number;
  lastPurchaseAt: Date | null;
};

/** A row of the perks table. */
export type PerkRow = {
  id: number;
  source: "rail" | "birthday";
  stopAt: number | null;
  openedAt: Date;
  expiresAt: Date;
  chooseBy: Date | null;
  choice: string | null;
  code: string | null;
  redeemedAt: Date | null;
};

/** A points_ledger row, with its purchase for earn rows. */
export type HistoryRow = {
  at: Date;
  kind: "earn" | "expiry";
  points: number;
  channel: Channel | null;
  location: string | null;
};

/** What the page needs from the database. The Supabase version is in supabase-rail-store.ts. */
export interface RailStore {
  /** Null when the member has no members row yet. */
  points(memberId: string): Promise<PointsRow | null>;
  perks(memberId: string): Promise<PerkRow[]>;
  /** Newest first. */
  history(memberId: string, limit: number): Promise<HistoryRow[]>;
}

export type PerkView = {
  id: number;
  /** Null for the birthday card. */
  stopAt: number | null;
  title: string;
  expiresAt: Date;
  /** A prize stop whose 3 days to choose are still running. */
  choosing: boolean;
  chooseBy: Date | null;
  code: string | null;
};

export type RailView = {
  /** Points on the current lap, shown on the rail. 0 once they have expired. */
  lapPoints: number;
  lapsCompleted: number;
  lifetimeTotal: number;
  /** When the current lap's points expire. Null before the first purchase. */
  validUntil: Date | null;
  /** True when the 6 months have passed but no expiry row has been written yet. */
  expired: boolean;
  /** Unused perks that have not expired, newest first. */
  perks: PerkView[];
  history: HistoryRow[];
};

const STOP_LABELS = new Map(STOPS.map((stop) => [stop.at, stop.label]));
const PRIZE_STOPS = new Set(STOPS.filter((stop) => stop.type === "prize_choice").map((stop) => stop.at));

function perkTitle(perk: PerkRow): string {
  if (perk.source === "birthday") return "5 € sünnipäevakaart";
  if (perk.stopAt !== null && PRIZE_STOPS.has(perk.stopAt)) {
    if (perk.choice === "donation") return "5 € annetus kooliraamatukogule";
    if (perk.choice === "gift_card") return "5 € kinkekaart";
  }
  if (perk.stopAt === 50 && perk.choice === "app_week") return "Nädal tasuta äpis";
  return (perk.stopAt !== null && STOP_LABELS.get(perk.stopAt)) || "Hüve";
}

export function railView(points: PointsRow | null, perks: PerkRow[], history: HistoryRow[], now: Date): RailView {
  const lastPurchaseAt = points?.lastPurchaseAt ?? null;
  const validUntil = lastPurchaseAt ? pointsExpireAt(lastPurchaseAt) : null;
  const lapPoints = points?.currentLapPoints ?? 0;
  // The expiry row is written with the next purchase (purchases.ts), so treat overdue points as expired here.
  const expired = validUntil !== null && now >= validUntil && lapPoints > 0;

  return {
    lapPoints: expired ? 0 : lapPoints,
    lapsCompleted: points?.lapsCompleted ?? 0,
    lifetimeTotal: points?.lifetimeTotal ?? 0,
    validUntil,
    expired,
    perks: perks
      .filter((perk) => perk.redeemedAt === null && perk.expiresAt > now)
      .sort((a, b) => b.openedAt.getTime() - a.openedAt.getTime())
      .map((perk) => ({
        id: perk.id,
        stopAt: perk.stopAt,
        title: perkTitle(perk),
        expiresAt: perk.expiresAt,
        choosing:
          perk.stopAt !== null &&
          PRIZE_STOPS.has(perk.stopAt) &&
          perk.choice === null &&
          perk.chooseBy !== null &&
          now < perk.chooseBy,
        chooseBy: perk.chooseBy,
        code: perk.code,
      })),
    history,
  };
}

const CHANNEL_NAMES: Record<Channel, string> = {
  e_shop: "E-pood",
  store: "Kauplus",
  literaat: "Literaat",
  app: "Äpi tellimus",
};

/** "E-pood", "Kauplus Viru Keskus", "Punktid aegusid" */
export function historyLabel(row: HistoryRow): string {
  if (row.kind === "expiry") return "Punktid aegusid";
  const channel = row.channel ? CHANNEL_NAMES[row.channel] : "Ost";
  return row.location ? `${channel} ${row.location}` : channel;
}

const tallinn = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("et-EE", { timeZone: "Europe/Tallinn", ...options });
const dayMonth = tallinn({ day: "2-digit", month: "2-digit" });
const fullDate = tallinn({ day: "2-digit", month: "2-digit", year: "numeric" });

/** "12.09" in Estonian time. */
export function formatDayMonth(date: Date): string {
  return dayMonth.format(date).replace(/\.$/, "");
}

/** "12.09.2026" in Estonian time. */
export function formatDate(date: Date): string {
  return fullDate.format(date);
}
