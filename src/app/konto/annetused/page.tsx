import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AccountShell } from "@/components/AccountShell";
import { EmptyState, LoadError } from "@/components/EmptyState";
import { RewardRow } from "@/components/RewardRow";
import { getMember } from "@/lib/auth";
import { donationsView, libraryName, type DonationRow } from "@/lib/donations";
import { euros } from "@/lib/gift-cards";
import { formatDate } from "@/lib/rail-account";
import { loadDonations } from "@/lib/supabase-donations";
import "./donations.css";

export const metadata: Metadata = { title: "Annetused · Minu konto" };

const PATH = "/konto/annetused";

export default function DonationsPage() {
  return (
    <AccountShell current="Annetused">
      <h1>Annetused</h1>
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
    return <LoadError what="Annetusi" retry={PATH} />;
  }

  const view = donationsView(rows);

  if (view.items.length === 0) {
    return (
      <EmptyState
        gustav
        title="Sa pole veel annetanud"
        action={<Link className="btn btn--ghost btn--small" href="/konto/gustavi-rada">Vaata Gustavi rada</Link>}
      >
        Gustavi raja 100 punkti peatuses saad kinkekaardi asemel annetada 5 € kooliraamatukogule.
      </EmptyState>
    );
  }

  return (
    <div className="donations">
      <p className="donations__total"><b>Kokku annetatud: {euros(view.total)}</b></p>
      <ul>
        {view.items.map((item) => (
          <li key={item.id}>
            <RewardRow
              title={libraryName(item.school)}
              detail={`${formatDate(item.createdAt)} · ${euros(item.amount)} · ${item.source}`}
            />
          </li>
        ))}
      </ul>
      <p className="muted small">Annetuste kokkuvõtte saad aasta lõpus e-kirjaga.</p>
    </div>
  );
}
