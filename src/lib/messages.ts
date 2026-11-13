// In-app Postkast messages: no real emails are sent (docs/program-rules.md,
// "Simulated for the prototype"). Pure: the member, perks and "today" are
// passed in, so /demo's date works and the rules can be tested.
//
// Each event has an event key, and the messages table is unique on
// (member_id, event_key), so delivering the same event again adds nothing:
//   name_day:2026-11-06  one per name day (a name may have several a year)
//   points_100:perk:42   one per opened prize stop (100, 200, 300, 400), so
//                        every lap and every restart after expiry gets its own
//   birthday:2026        one per birthday card, which is once a year

import { parseDay } from "./calendar-day";
import { nameDayOffer, type NameDay } from "./name-day";
import { STOPS } from "./rail";

export type MessageKind = "name_day" | "points_100" | "birthday";

export type NewMessage = {
  kind: MessageKind;
  title: string;
  body: string;
  /** The flow the message's button opens. */
  link: string;
  eventKey: string;
  createdAt: Date;
};

export type Message = Omit<NewMessage, "eventKey"> & { id: number; readAt: Date | null };

/** The stops whose perk is a 5 € gift card or donation choice. */
export const PRIZE_STOPS: readonly number[] = STOPS.filter((stop) => stop.type === "prize_choice").map((s) => s.at);

/** A perks row, as much as the messages need. */
export type MessagePerk = {
  id: number;
  source: "rail" | "birthday";
  stopAt: number | null;
  birthdayYear: number | null;
  openedAt: Date;
};

export const NAME_DAY_LINK = "/nimekaimud";
export const PRIZE_LINK = "/konto/gustavi-rada/tasu";
export const BIRTHDAY_LINK = "/konto/gustavi-rada";

const SCREENS: Record<MessageKind, string> = {
  name_day: "/postkast/nimepaev",
  points_100: "/postkast/100-punkti",
  birthday: "/postkast/sunnipaev",
};

/** The Postkast screen that shows one message, e.g. /postkast/100-punkti?id=7. */
export function messageScreen(message: Pick<Message, "id" | "kind">): string {
  return `${SCREENS[message.kind]}?id=${message.id}`;
}

export function isMessageKind(value: unknown): value is MessageKind {
  return typeof value === "string" && value in SCREENS;
}

export function nameDayMessage(firstName: string, nameDay: string): NewMessage {
  return {
    kind: "name_day",
    title: `Palju õnne nimepäevaks, ${firstName}!`,
    body: "Täna saad −10% kõigilt raamatutelt, mille autor on sinu nimekaim.",
    link: NAME_DAY_LINK,
    eventKey: `name_day:${nameDay}`,
    createdAt: new Date(parseDay(nameDay)),
  };
}

export function prizeMessage(perk: Pick<MessagePerk, "id" | "stopAt" | "openedAt">): NewMessage {
  return {
    kind: "points_100",
    title: `Sul on ${perk.stopAt} punkti – vali oma tasu`,
    body: "Vali 3 päeva jooksul: 5 € kinkekaart endale või 5 € annetus kooliraamatukogule.",
    link: PRIZE_LINK,
    eventKey: `points_100:perk:${perk.id}`,
    createdAt: perk.openedAt,
  };
}

export function birthdayMessage(firstName: string, perk: Pick<MessagePerk, "birthdayYear" | "openedAt">): NewMessage {
  return {
    kind: "birthday",
    title: `Palju õnne sünnipäevaks, ${firstName}!`,
    body: "Kingituseks saad 5 € sünnipäevakaardi. Koodi leiad Gustavi rajalt.",
    link: BIRTHDAY_LINK,
    eventKey: `birthday:${perk.birthdayYear}`,
    createdAt: perk.openedAt,
  };
}

export type MessageInput = {
  firstName: string;
  nameDays: NameDay[];
  perks: MessagePerk[];
  /** "YYYY-MM-DD" in Estonia, from the demo clock. */
  today: string;
};

/**
 * Every message the member should have by `today`: today's name day, and one
 * per prize-stop perk and birthday card. Messages that already exist are
 * skipped by the store, so this is safe to call on every page.
 */
export function dueMessages({ firstName, nameDays, perks, today }: MessageInput): NewMessage[] {
  const due: NewMessage[] = [];
  const offer = nameDayOffer(firstName, nameDays, today);
  if (offer) due.push(nameDayMessage(firstName, offer.nameDay));

  for (const perk of perks) {
    if (perk.source === "rail" && perk.stopAt !== null && PRIZE_STOPS.includes(perk.stopAt)) {
      due.push(prizeMessage(perk));
    } else if (perk.source === "birthday" && perk.birthdayYear !== null) {
      due.push(birthdayMessage(firstName, perk));
    }
  }
  return due;
}

/** What the messages need from the database. The Supabase version is in supabase-message-store.ts. */
export interface MessageStore {
  /** Adds the messages whose event key the member doesn't have yet. Returns how many were added. */
  addMessages(memberId: string, messages: NewMessage[]): Promise<number>;
  /** Newest first. */
  messages(memberId: string): Promise<Message[]>;
  /** Sets read_at if it is still empty. */
  markRead(memberId: string, messageId: number, at: Date): Promise<void>;
  /** "Märgi kõik loetuks": sets read_at on every unread message. Returns how many changed. */
  markAllRead(memberId: string, at: Date): Promise<number>;
}

/** How many of the messages are unread, for "Postkast (2)". */
export function unreadCount(messages: Pick<Message, "readAt">[]): number {
  return messages.filter((message) => message.readAt === null).length;
}

/** Creates the member's missing messages. Returns how many were added. */
export async function deliverMessages(store: MessageStore, memberId: string, input: MessageInput): Promise<number> {
  const due = dueMessages(input);
  return due.length === 0 ? 0 : store.addMessages(memberId, due);
}

/** The message a Postkast screen shows: the one in ?id= if it is that kind, else the newest of that kind. */
export function pickMessage(messages: Message[], kind: MessageKind, id: string | undefined): Message | null {
  const ofKind = messages.filter((message) => message.kind === kind);
  if (id !== undefined) return ofKind.find((message) => String(message.id) === id) ?? null;
  return ofKind[0] ?? null;
}
