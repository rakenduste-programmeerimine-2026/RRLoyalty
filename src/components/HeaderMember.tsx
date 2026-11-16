import Link from "next/link";
import { connection } from "next/server";
import { SIGN_IN_PATH } from "@/lib/auth-redirect";
import { headerMemberName } from "@/lib/header-member";
import { unreadMessageCount } from "@/lib/supabase-unread";
import { Icon } from "./Icon";

/**
 * The signed-in member's name in the header, or "Logi sisse". Reads the
 * session, so it must sit inside <Suspense>.
 */
export async function HeaderMember() {
  await connection();
  const name = await headerMemberName();

  if (!name) {
    return <Link className="site-user__link site-user__link--sign-in" href={SIGN_IN_PATH}>Logi sisse</Link>;
  }
  return (
    <Link className="site-user__link site-user__link--member" href="/konto/andmed">
      <Icon name="user" />
      {name}
    </Link>
  );
}

/** "Tere, Mari!" at the top of the mobile menu. Must sit inside <Suspense>. */
export async function HeaderGreeting() {
  await connection();
  const name = await headerMemberName();
  return name ? <>Tere, {name}!</> : null;
}

/** The bell that opens the notifications, with the unread count on it. */
export function HeaderBell({ unread = 0 }: { unread?: number }) {
  return (
    <Link className="site-user__icon" href="/postkast" aria-label={`Teavitused, ${unread} lugemata`}>
      <Icon name="bell" size={24} />
      {unread > 0 && <span className="site-user__badge">{unread}</span>}
    </Link>
  );
}

/** The bell with the member's own unread count. Must sit inside <Suspense>. */
export async function HeaderUnreadBell() {
  await connection();
  return <HeaderBell unread={await unreadMessageCount()} />;
}
