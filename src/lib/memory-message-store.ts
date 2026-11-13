// An in-memory MessageStore for tests. Like the messages table, it is unique
// on (member_id, event_key) and only sets read_at once.

import type { Message, MessageStore, NewMessage } from "./messages";

export type StoredMessage = Message & { memberId: string; eventKey: string };

export class MemoryMessageStore implements MessageStore {
  rows: StoredMessage[] = [];

  async addMessages(memberId: string, messages: NewMessage[]): Promise<number> {
    let added = 0;
    for (const message of messages) {
      if (this.rows.some((row) => row.memberId === memberId && row.eventKey === message.eventKey)) continue;
      this.rows.push({ ...message, memberId, id: this.rows.length + 1, readAt: null });
      added += 1;
    }
    return added;
  }

  async messages(memberId: string): Promise<Message[]> {
    return this.rows
      .filter((row) => row.memberId === memberId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id - a.id)
      .map(({ id, kind, title, body, link, createdAt, readAt }) => ({ id, kind, title, body, link, createdAt, readAt }));
  }

  async markRead(memberId: string, messageId: number, at: Date): Promise<void> {
    const row = this.rows.find((r) => r.memberId === memberId && r.id === messageId);
    if (row && row.readAt === null) row.readAt = at;
  }

  async markAllRead(memberId: string, at: Date): Promise<number> {
    let changed = 0;
    for (const row of this.rows) {
      if (row.memberId !== memberId || row.readAt !== null) continue;
      row.readAt = at;
      changed += 1;
    }
    return changed;
  }
}
