import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { randomUUID } from "node:crypto";
import { Suspense } from "react";
import { Screen } from "@/components/Screen";
import { getMember } from "@/lib/auth";
import { getNow } from "@/lib/demo-now";
import { todayInEstonia } from "@/lib/namesakes";
import { formatDate, type RailView } from "@/lib/rail-account";
import { loadRailFromSupabase } from "@/lib/supabase-rail-store";
import { DemoControls } from "./DemoControls";

// Hidden: nothing links here, and search engines are told to skip it.
export const metadata: Metadata = { title: "Demo juhtimine", robots: { index: false, follow: false } };

const PATH = "/demo";

export default function DemoPage() {
  return (
    <Screen title="Demo juhtimine">
      <h1>Demo juhtimine</h1>
      <p className="muted">
        Lisa oste, käivita nimepäev või sünnipäev ja keri aega edasi. Kõik käib sama loogika kaudu nagu päris
        sündmused. Demo kuupäev kehtib ainult selles brauseris.
      </p>
      <Suspense fallback={<p className="muted" role="status">Laen demo andmeid…</p>}>
        <DemoContent />
      </Suspense>
    </Screen>
  );
}

async function DemoContent() {
  // The demo date comes from a cookie, so this renders per request.
  await connection();
  const member = await getMember(PATH);
  const now = await getNow();
  const demoDate = todayInEstonia(now) !== todayInEstonia() ? now : null;

  let view: RailView;
  try {
    // Also turns prizes left unchosen for 3 days into gift cards, as the real pages do.
    view = await loadRailFromSupabase(member.id, 0, now);
  } catch (error) {
    console.error("Could not load the demo page", error);
    return (
      <section className="perk" role="alert">
        <h2>Midagi läks valesti</h2>
        <p>Demo andmeid ei õnnestunud laadida. Proovi hetke pärast uuesti.</p>
        <div className="perk__actions">
          <Link className="btn btn--auto" href={PATH}>Proovi uuesti</Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="demo-state" aria-label="Praegune seis">
        <dl className="profile__facts">
          <div>
            <dt>Demo kuupäev</dt>
            <dd>{formatDate(now)}{demoDate ? "" : " (täna)"}</dd>
          </div>
          <div>
            <dt>Punkte sellel ringil</dt>
            <dd>{view.lapPoints} p{view.expired ? " (aegusid)" : ""}</dd>
          </div>
          <div>
            <dt>Ringe läbitud</dt>
            <dd>{view.lapsCompleted}</dd>
          </div>
          <div>
            <dt>Punktid kehtivad kuni</dt>
            <dd>{view.validUntil && !view.expired ? formatDate(view.validUntil) : "–"}</dd>
          </div>
        </dl>
        <h2>Avatud hüved</h2>
        {view.perks.length === 0 ? (
          <p className="muted">Avatud hüvesid pole.</p>
        ) : (
          <ul className="demo-perks">
            {view.perks.map((perk) => (
              <li key={perk.id}>
                <b>{perk.stopAt ? `${perk.stopAt} p · ` : ""}{perk.title}</b>
                <span className="muted small">
                  {perk.choosing && perk.chooseBy
                    ? `vali kuni ${formatDate(perk.chooseBy)}`
                    : `kehtib kuni ${formatDate(perk.expiresAt)}`}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="demo-links">
          <Link href="/konto/gustavi-rada">Gustavi rada ›</Link>
          <Link href="/konto/kinkekaardid">Kinkekaardid ›</Link>
          <Link href="/nimekaimud">Nimekaimud ›</Link>
        </p>
      </section>

      <DemoControls purchaseRef={randomUUID()} demoDateSet={demoDate !== null} />
    </>
  );
}
