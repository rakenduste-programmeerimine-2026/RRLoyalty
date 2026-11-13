// MessageStore against Supabase, with the server's secret key: RLS lets a
// member read their messages but not write them (#6). Only call these after
// getMember() has checked who the member is.

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";
import { deliverMessages, isMessageKind, type Message, type MessagePerk, type MessageStore, type NewMessage } from "./messages";
import { todayInEstonia } from "./namesakes";
import type { NameDay } from "./name-day";
import { createAdminClient } from "./supabase/admin";

type MessageRow = {
  id: number;
  kind: string;
  title: string;
  body: string;
  link: string | null;
  created_at: string;
  read_at: string | null;
};

export class SupabaseMessageStore implements MessageStore {
  constructor(private readonly db: SupabaseClient) {}

  async addMessages(memberId: string, messages: NewMessage[]): Promise<number> {
    const { data, error } = await this.db
      .from("messages")
      .upsert(
        messages.map((message) => ({
          member_id: memberId,
          kind: message.kind,
          title: message.title,
          body: message.body,
          link: message.link,
          event_key: message.eventKey,
          created_at: message.createdAt.toISOString(),
        })),
        // unique (member_id, event_key): an event that already has its message adds nothing.
        { onConflict: "member_id,event_key", ignoreDuplicates: true },
      )
      .select("id");
    if (error) throw new Error(`Could not save the messages: ${error.message}`);
    return data.length;
  }

  async messages(memberId: string): Promise<Message[]> {
    const { data, error } = await this.db
      .from("messages")
      .select("id, kind, title, body, link, created_at, read_at")
      .eq("member_id", memberId)
      .in("kind", ["name_day", "points_100", "birthday"])
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .returns<MessageRow[]>();
    if (error) throw new Error(`Could not read the messages: ${error.message}`);
    return data.flatMap((row) =>
      isMessageKind(row.kind)
        ? [
            {
              id: row.id,
              kind: row.kind,
              title: row.title,
              body: row.body,
              link: row.link ?? "/postkast",
              createdAt: new Date(row.created_at),
              readAt: row.read_at ? new Date(row.read_at) : null,
            },
          ]
        : [],
    );
  }

  async markRead(memberId: string, messageId: number, at: Date): Promise<void> {
    const { error } = await this.db
      .from("messages")
      .update({ read_at: at.toISOString() })
      .eq("member_id", memberId)
      .eq("id", messageId)
      .is("read_at", null);
    if (error) throw new Error(`Could not mark the message read: ${error.message}`);
  }

  async markAllRead(memberId: string, at: Date): Promise<number> {
    const { data, error } = await this.db
      .from("messages")
      .update({ read_at: at.toISOString() })
      .eq("member_id", memberId)
      .is("read_at", null)
      .select("id");
    if (error) throw new Error(`Could not mark the messages read: ${error.message}`);
    return data.length;
  }
}

/** The member's first name, name days and the perks that have a message. */
async function messageSources(db: SupabaseClient, memberId: string) {
  const member = await db.from("members").select("first_name").eq("id", memberId).maybeSingle<{ first_name: string }>();
  if (member.error) throw new Error(`Could not read the member: ${member.error.message}`);
  if (!member.data) return null;

  const [days, perks] = await Promise.all([
    db.from("name_days").select("name, month, day").eq("name", member.data.first_name).returns<NameDay[]>(),
    db
      .from("perks")
      .select("id, source, stop_at, birthday_year, opened_at")
      .eq("member_id", memberId)
      .returns<{ id: number; source: "rail" | "birthday"; stop_at: number | null; birthday_year: number | null; opened_at: string }[]>(),
  ]);
  if (days.error) throw new Error(`Could not read name days: ${days.error.message}`);
  if (perks.error) throw new Error(`Could not read the perks: ${perks.error.message}`);

  return {
    firstName: member.data.first_name,
    nameDays: days.data,
    perks: perks.data.map(
      (row): MessagePerk => ({
        id: row.id,
        source: row.source,
        stopAt: row.stop_at,
        birthdayYear: row.birthday_year,
        openedAt: new Date(row.opened_at),
      }),
    ),
  };
}

/**
 * Creates the member's missing Postkast messages for `now` (the demo clock).
 * Safe to call on every page: each event's message is created once. Runs
 * once per request.
 */
export const deliverMessagesInSupabase = cache(async (memberId: string, now: Date): Promise<number> => {
  const db = createAdminClient();
  const sources = await messageSources(db, memberId);
  if (!sources) return 0;
  return deliverMessages(new SupabaseMessageStore(db), memberId, { ...sources, today: todayInEstonia(now) });
});

export function loadMessages(memberId: string): Promise<Message[]> {
  return new SupabaseMessageStore(createAdminClient()).messages(memberId);
}

export function markMessageReadInSupabase(memberId: string, messageId: number, at: Date): Promise<void> {
  return new SupabaseMessageStore(createAdminClient()).markRead(memberId, messageId, at);
}

/** "Märgi kõik loetuks". Server only: check memberId with getMember() first. */
export function markAllMessagesReadInSupabase(memberId: string, at: Date): Promise<number> {
  return new SupabaseMessageStore(createAdminClient()).markAllRead(memberId, at);
}
