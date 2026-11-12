import Link from "next/link";
import { connection } from "next/server";
import { SIGN_IN_PATH } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";
import { MemberMenu } from "./MemberMenu";

/**
 * The signed-in member's name in the header, or "Logi sisse". Reads the
 * session, so it must sit inside <Suspense>. Unlike getMember() it never
 * redirects: the header also appears on public pages.
 */
export async function HeaderMember() {
  await connection();

  let name: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      // RLS lets a member read their own members row.
      const { data: row } = await supabase
        .from("members")
        .select("first_name")
        .eq("id", data.user.id)
        .maybeSingle<{ first_name: string }>();
      name = row?.first_name ?? data.user.email?.split("@")[0] ?? "Minu konto";
    }
  } catch (error) {
    // Without Supabase settings, or if it is down, show the signed-out header.
    console.error("Could not read the signed-in member for the header", error);
  }

  if (!name) return <Link href={SIGN_IN_PATH}>Logi sisse</Link>;
  return <MemberMenu name={name} />;
}
