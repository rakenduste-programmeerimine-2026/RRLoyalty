import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { getMember } from "@/lib/auth";
import { signOut } from "../logi-sisse/actions";

export const metadata: Metadata = { title: "Minu konto · Gustavi rada" };

// Reads the session, so it streams in behind the Suspense boundary below.
async function SignedInMember() {
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
    <>
      <SiteHeader />
      <div className="account">
        <nav className="side" aria-label="Minu konto">
          <h2>Minu konto</h2>
          <ul>
            <li><Link href="/konto" aria-current="page">Ülevaade</Link></li>
            <li><Link href="/konto/gustavi-rada">Gustavi rada</Link></li>
          </ul>
        </nav>
        <main className="main">
          <div>
            <h1>Minu konto</h1>
            <p className="lede">Siin näed, kellena oled sisse logitud.</p>
          </div>
          <Suspense fallback={<p className="muted">Laen konto andmeid…</p>}>
            <SignedInMember />
          </Suspense>
        </main>
      </div>
    </>
  );
}
