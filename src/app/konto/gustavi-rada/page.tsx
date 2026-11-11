import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { NotWiredButton } from "@/components/NotWiredButton";
import { Rail } from "@/components/Rail";
import { SiteHeader } from "@/components/SiteHeader";
import { getMember } from "@/lib/auth";
import { nextStop, pointsToNext } from "@/lib/rail";
import { formatDate, formatDayMonth, historyLabel, type PerkView, type RailView } from "@/lib/rail-account";
import { accountLinks } from "@/lib/sample-data";
import { loadRailFromSupabase } from "@/lib/supabase-rail-store";

export const metadata: Metadata = { title: "Gustavi rada · Minu konto" };

const PATH = "/konto/gustavi-rada";
const HISTORY_SHORT = 5;
const HISTORY_ALL = 50;

type SearchParams = Promise<{ ajalugu?: string }>;

export default function GustavRailPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <SiteHeader />
      <div className="account">
        <nav className="side" aria-label="Minu konto">
          <h2>Minu konto</h2>
          <ul>
            {accountLinks.map((link) => (
              <li key={link}>
                {link === "Gustavi rada" ? (
                  <Link href={PATH} aria-current="page">{link}</Link>
                ) : (
                  <a href="#">{link}</a>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <main className="main">
          <div>
            <h1>Gustavi rada</h1>
            <p className="lede">
              Iga 1 € = 1 punkt – kauplustes, e-poes, Literaadis ja äpis. Peatusel avaneb hüve.
            </p>
          </div>
          <Suspense fallback={<p className="muted" role="status">Laen sinu punkte…</p>}>
            <RailContent searchParams={searchParams} />
          </Suspense>
        </main>
      </div>
    </>
  );
}

async function RailContent({ searchParams }: { searchParams: SearchParams }) {
  const member = await getMember(PATH);
  const showAll = (await searchParams).ajalugu === "koik";
  const limit = showAll ? HISTORY_ALL : HISTORY_SHORT;

  let view: RailView;
  try {
    view = await loadRailFromSupabase(member.id, limit);
  } catch (error) {
    console.error("Could not load the Gustavi rada page", error);
    return (
      <section className="perk" role="alert">
        <h2>Midagi läks valesti</h2>
        <p>Sinu punkte ei õnnestunud laadida. Proovi hetke pärast uuesti.</p>
        <div className="perk__actions">
          <Link className="btn btn--auto" href={PATH}>Proovi uuesti</Link>
        </div>
      </section>
    );
  }

  const next = nextStop(view.lapPoints);

  return (
    <>
      <div className="stats">
        <div className="stat">
          <b>{view.lapPoints}</b>
          <span>{view.lapsCompleted > 0 ? `punkti ${view.lapsCompleted + 1}. ringil` : "punkti kogutud"}</span>
        </div>
        <div className="stat">
          <b>{pointsToNext(view.lapPoints)} p</b>
          <span>järgmise peatuseni{next ? ` (${next.at} p)` : ""}</span>
        </div>
        <div className="stat"><b>{view.perks.length}</b><span>avamata hüve</span></div>
        <ValidUntil view={view} />
      </div>
      <Rail points={view.lapPoints} />
      <div className="panels">
        <PerkPanel perks={view.perks} nextLabel={next ? `${next.at} p: ${next.label}` : null} />
        <section className="history">
          <h2>Viimased punktid</h2>
          {view.history.length === 0 ? (
            <p className="muted">Sul pole veel punkte. Esimene ost viib Gustavi rajale.</p>
          ) : (
            <ul>
              {view.history.map((row, index) => (
                <li key={`${row.at.toISOString()}-${index}`}>
                  <time dateTime={row.at.toISOString()}>{formatDayMonth(row.at)}</time>
                  <span>{historyLabel(row)}</span>
                  <b>{row.points >= 0 ? `+${row.points}` : `−${-row.points}`} p</b>
                </li>
              ))}
            </ul>
          )}
          {!showAll && view.history.length === HISTORY_SHORT && (
            <Link className="textlink" href={`${PATH}?ajalugu=koik`} scroll={false}>Näita rohkem</Link>
          )}
        </section>
      </div>
    </>
  );
}

function ValidUntil({ view }: { view: RailView }) {
  if (view.validUntil === null) {
    return <div className="stat"><b>–</b><span>punktid kehtivad 6 kuud viimasest ostust</span></div>;
  }
  if (view.expired) {
    return <div className="stat"><b>{formatDate(view.validUntil)}</b><span>punktid aegusid</span></div>;
  }
  return <div className="stat"><b>{formatDate(view.validUntil)}</b><span>punktid kehtivad kuni</span></div>;
}

function PerkPanel({ perks, nextLabel }: { perks: PerkView[]; nextLabel: string | null }) {
  const [perk, ...more] = perks;

  if (!perk) {
    return (
      <section className="perk">
        <small>Hüved</small>
        <h2>Avatud hüvesid pole</h2>
        <p>{nextLabel ? `Järgmine peatus ${nextLabel}.` : "Peatusel avaneb hüve."}</p>
      </section>
    );
  }

  return (
    <section className="perk">
      <small>Avatud hüve</small>
      <h2>{perk.title}</h2>
      <p>
        {perk.choosing && perk.chooseBy
          ? `Vali kuni ${formatDate(perk.chooseBy)}. Kui sa ei vali, saad 5 € kinkekaardi.`
          : `Kehtib kuni ${formatDate(perk.expiresAt)}.`}
      </p>
      {perk.code && <p className="code">{perk.code}</p>}
      {more.length > 0 && <p className="muted small">Lisaks veel {more.length} avatud hüve.</p>}
      <div className="perk__actions">
        {perk.choosing && <Link className="btn btn--auto" href={`${PATH}/tasu`}>Vali tasu</Link>}
        {/* Showing and spending perks comes with perk redemption (#14) and the prize flow (#18). */}
        {perk.stopAt === 50 && (
          <>
            <NotWiredButton className="btn btn--auto">Näita QR-koodi</NotWiredButton>
            <NotWiredButton className="textlink">Vali hoopis nädal tasuta äpis</NotWiredButton>
          </>
        )}
      </div>
    </section>
  );
}
