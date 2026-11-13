import { connection } from "next/server";
import { unreadMessageCount } from "@/lib/supabase-unread";

/** " (2)" after "Postkast" when there are unread messages. Reads the session, so render it inside <Suspense>. */
export async function UnreadBadge() {
  await connection();
  const count = await unreadMessageCount();
  if (count === 0) return null;
  return (
    <span className="unread-badge" aria-label={count === 1 ? "1 lugemata kiri" : `${count} lugemata kirja`}>
      {count}
    </span>
  );
}
