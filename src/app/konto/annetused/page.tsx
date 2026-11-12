import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AccountShell } from "@/components/AccountShell";
import { getMember } from "@/lib/auth";
import { donationsView, libraryName, type DonationRow } from "@/lib/donations";
import { euros } from "@/lib/gift-cards";
import { formatDate } from "@/lib/rail-account";
import { loadDonations } from "@/lib/supabase-donations";

export const metadata: Metadata = { title: "Annetused · Minu konto" };

const PATH = "/konto/annetused";

export default function DonationsPage() {
  return (
    <AccountShell current="Annetused">
      <div>
        <h1>Annetused</h1>
        <p className="lede">Gustavi raja peatustes saad kinkekaardi asemel annetada kooliraamatukogule.</p>
      </div>
      <Suspense fallback={<p className="muted" role="status">Laen annetusi…</p>}>
        <Donations />
      </Suspense>
    </AccountShell>
  );
}

async function Donations() {
  await connection();
  await getMember(PATH);

  let rows: DonationRow[];
  try {
    rows = await loadDonations();
  } catch (error) {
    console.error("Could not load the donations page", error);
    return (
      <section className="perk" role="alert">
        <h2>Midagi läks valesti</h2>
        <p>Annetusi ei õnnestunud laadida. Proovi hetke pärast uuesti.</p>
        <div className="perk__actions">
          <Link className="btn btn--auto" href={PATH}>Proovi uuesti</Link>
        </div>
      </section>
    );
  }

  const view = donationsView(rows);

  if (view.items.length === 0) {
    return (
      <section className="perk">
        <h2>Sa pole veel annetanud</h2>
        <p>Gustavi raja 100 punkti peatuses saad kinkekaardi asemel annetada 5 € kooliraamatukogule.</p>
        <div className="perk__actions">
          <Link className="btn btn--auto" href="/konto/gustavi-rada">Vaata Gustavi rada</Link>
        </div>
      </section>
    );
  }

  return (
    <div className="wallet-list">
      <section className="gift-card">
        <small>Kokku annetatud</small>
        <b>{euros(view.total)}</b>
      </section>
      <ul className="donation-list">
        {view.items.map((item) => (
          <li key={item.id}>
            <div>
              <b>{libraryName(item.school)}</b>
              <span className="muted small">{formatDate(item.createdAt)} · {item.source}</span>
            </div>
            <b>{euros(item.amount)}</b>
          </li>
        ))}
      </ul>
      <p className="muted small">Annetuste kokkuvõtte saad aasta lõpus e-kirjaga.</p>
    </div>
  );
}
