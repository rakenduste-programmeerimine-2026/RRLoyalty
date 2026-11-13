import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Screen } from "@/components/Screen";
import { ShopError, ShopLoading } from "@/components/ShopError";
import { getMember } from "@/lib/auth";
import { getNow } from "@/lib/demo-now";
import { messageScreen, unreadCount, type Message } from "@/lib/messages";
import { formatDate } from "@/lib/rail-account";
import { deliverMessagesInSupabase, loadMessages } from "@/lib/supabase-message-store";
import { markAllReadAction } from "./actions";

export const metadata: Metadata = { title: "Postkast · Gustavi rada" };

const PATH = "/postkast";
const TITLE = "Postkast";

export default function Inbox() {
  return (
    <Suspense fallback={<ShopLoading title={TITLE} backTo="/konto" text="Laen kirju…" />}>
      <InboxContent />
    </Suspense>
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
    return <ShopError title={TITLE} backTo="/konto" retry={PATH} />;
  }

  const unread = unreadCount(messages);

  return (
    <Screen title="Minu konto" backTo="/konto">
      <h1>Postkast</h1>
      <div className="inbox-bar">
        <span className="muted small" role="status">
          {unread === 0 ? "Kõik kirjad on loetud" : unread === 1 ? "1 lugemata kiri" : `${unread} lugemata kirja`}
        </span>
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
                <b>{message.title}</b>
                <span className="small muted">
                  {formatDate(message.createdAt)}
                  {message.readAt ? "" : " · Uus"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link className="textlink" href="/konto/uudiskirjad">Halda teavitusi ja e-kirju</Link>
    </Screen>
  );
}
