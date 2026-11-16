import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AccountShell } from "@/components/AccountShell";
import { LoadError } from "@/components/EmptyState";
import { getMember } from "@/lib/auth";
import { getNow } from "@/lib/demo-now";
import { messageScreen, unreadCount, type Message } from "@/lib/messages";
import { formatDate } from "@/lib/rail-account";
import { deliverMessagesInSupabase, loadMessages } from "@/lib/supabase-message-store";
import { markAllReadAction } from "./actions";
import "./inbox.css";

export const metadata: Metadata = { title: "Teavitused · Gustavi rada" };

const PATH = "/postkast";

/** The member's Postkast, opened from the bell in the header. */
export default function Inbox() {
  return (
    <AccountShell title="Teavitused">
      <h1>Teavitused</h1>
      <Suspense fallback={<p className="muted" role="status">Laen kirju…</p>}>
        <InboxContent />
      </Suspense>
    </AccountShell>
  );
}

async function InboxContent() {
  await connection();
  const member = await getMember(PATH);

  let messages: Message[];
  try {
    await deliverMessagesInSupabase(member.id, await getNow());
    messages = await loadMessages(member.id);
  } catch (error) {
    console.error("Could not load the Postkast", error);
    return <LoadError what="Kirju" retry={PATH} />;
  }

  const unread = unreadCount(messages);

  return (
    <div className="inbox">
      <div className="inbox-bar">
        <span className="muted small" role="status">{unread} lugemata</span>
        {unread > 0 && (
          <form action={markAllReadAction}>
            <button type="submit" className="textlink">Märgi kõik loetuks</button>
          </form>
        )}
      </div>
      {messages.length === 0 ? (
        <p className="muted">Kirju veel pole. Siia tulevad nimepäeva, sünnipäeva ja Gustavi raja tasude kirjad.</p>
      ) : (
        <ul className="message-list">
          {messages.map((message) => (
            <li key={message.id} className={message.readAt ? undefined : "message-list__unread"}>
              <Link href={messageScreen(message)}>
                <span className="message-list__dot" aria-hidden="true" />
                <span className="message-list__text">
                  <b>{message.title}</b>
                  <span>{message.body}</span>
                  <small>
                    {formatDate(message.createdAt)}
                    {message.readAt ? "" : " · Uus"}
                  </small>
                </span>
                <span className="message-list__open">Ava ›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link className="textlink inbox__manage" href="/konto/uudiskirjad">Halda teavitusi ja e-kirju</Link>
    </div>
  );
}
