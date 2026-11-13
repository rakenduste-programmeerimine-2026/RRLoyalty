import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { AccountShell } from "@/components/AccountShell";
import { getMember } from "@/lib/auth";
import { signOut } from "../logi-sisse/actions";

export const metadata: Metadata = { title: "Minu konto · Gustavi rada" };

// Reads the session, so it streams in behind the Suspense boundary below.
async function SignedInMember() {
  // Render per request: the session check reads the clock, which Next.js won't allow while prerendering.
  await connection();
  const member = await getMember("/konto");

  return (
    <section className="perk">
      <small>Sisse logitud</small>
      <h2>{member.email}</h2>
      <form action={signOut}>
        <button type="submit" className="btn btn--ghost btn--auto">Logi välja</button>
      </form>
    </section>
  );
}

export default function AccountPage() {
  return (
    <AccountShell current="Ülevaade">
      <div>
        <h1>Minu konto</h1>
        <p className="lede">Siin näed, kellena oled sisse logitud.</p>
      </div>
      <Suspense fallback={<p className="muted">Laen konto andmeid…</p>}>
        <SignedInMember />
      </Suspense>
    </AccountShell>
  );
}
