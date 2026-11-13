import Link from "next/link";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { Screen } from "@/components/Screen";
import { ShopError, ShopLoading } from "@/components/ShopError";
import { getMember } from "@/lib/auth";
import { getNow } from "@/lib/demo-now";
import { pickMessage, type Message, type MessageKind } from "@/lib/messages";
import { formatDate } from "@/lib/rail-account";
import { deliverMessagesInSupabase, loadMessages, markMessageReadInSupabase } from "@/lib/supabase-message-store";

export type MessageSearchParams = Promise<{ id?: string }>;

const TITLE = "Postkast";
const INBOX = "/postkast";

type Props = {
  kind: MessageKind;
  /** This screen's path, to come back to after signing in. */
  path: string;
  searchParams: MessageSearchParams;
  scene: (message: Message) => ReactNode;
  note: ReactNode;
  button: string;
};

/** One stored Postkast message: the e-mail-style screen, with a button into its flow. */
export function PostkastMessage(props: Props) {
  return (
    <Suspense fallback={<ShopLoading title={TITLE} backTo={INBOX} text="Laen kirja…" />}>
      <MessageContent {...props} />
    </Suspense>
  );
}

async function MessageContent({ kind, path, searchParams, scene, note, button }: Props) {
  await connection();
  const member = await getMember(path);
  const { id } = await searchParams;
  const retry = id ? `${path}?id=${encodeURIComponent(id)}` : path;

  let message: Message | null;
  try {
    const now = await getNow();
    await deliverMessagesInSupabase(member.id, now);
    message = pickMessage(await loadMessages(member.id), kind, id);
    if (message && message.readAt === null) await markMessageReadInSupabase(member.id, message.id, now);
  } catch (error) {
    console.error("Could not load the Postkast message", error);
    return <ShopError title={TITLE} backTo={INBOX} retry={retry} />;
  }

  if (!message) {
    return (
      <Screen title={TITLE} backTo={INBOX} footer={<Link className="btn" href={INBOX}>Ava postkast</Link>}>
        <h1>Kirja ei leitud</h1>
        <p className="muted">Seda kirja sinu postkastis pole.</p>
      </Screen>
    );
  }

  return (
    <Screen title={TITLE} backTo={INBOX} footer={<Link className="btn" href={message.link}>{button}</Link>}>
      {scene(message)}
      <p className="small muted">{formatDate(message.createdAt)}</p>
      <h1>{message.title}</h1>
      <p className="muted">{message.body}</p>
      {note}
    </Screen>
  );
}
