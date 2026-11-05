import { NotWiredButton } from "@/components/NotWiredButton";
import { Rail } from "@/components/Rail";
import { SiteHeader } from "@/components/SiteHeader";
import { nextStop, pointsToNext } from "@/lib/rail";
import { accountLinks, member, recentPoints } from "@/lib/sample-data";

export default function GustavRail() {
  const next = nextStop(member.points);

  return (
    <>
      <SiteHeader />
      <div className="account">
        <nav className="side" aria-label="Minu konto">
          <h2>Minu konto</h2>
          <ul>
            {accountLinks.map((link) => (
              <li key={link}>
                <a href="#" aria-current={link === "Gustavi rada" ? "page" : undefined}>{link}</a>
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
          <div className="stats">
            <div className="stat"><b>{member.points}</b><span>punkti kogutud</span></div>
            <div className="stat">
              <b>{pointsToNext(member.points)} p</b>
              <span>järgmise peatuseni{next ? ` (${next.at} p)` : ""}</span>
            </div>
            <div className="stat"><b>{member.unopenedPerks}</b><span>avamata hüve</span></div>
            <div className="stat"><b>{member.pointsValidUntil}</b><span>punktid kehtivad kuni</span></div>
          </div>
          <Rail points={member.points} />
          <div className="panels">
            <section className="perk">
              <small>Avatud hüve</small>
              <h2>Tasuta kuum jook</h2>
              <p>
                Kehtib 60 päeva – kuni 01.12.2026.<br />
                Literaat Telliskivi · Viru Keskus · Vanalinn<br />
                Kauplused: Võru, Jõhvi, Kuressaare
              </p>
              <div className="perk__actions">
                <NotWiredButton className="btn btn--auto">Näita QR-koodi</NotWiredButton>
                <NotWiredButton className="textlink">Vali hoopis nädal tasuta äpis</NotWiredButton>
              </div>
            </section>
            <section className="history">
              <h2>Viimased punktid</h2>
              <ul>
                {recentPoints.map((row) => (
                  <li key={row.date}>
                    <time>{row.date}</time>
                    <span>{row.where}</span>
                    <b>+{row.points} p</b>
                  </li>
                ))}
              </ul>
              <NotWiredButton className="textlink">Näita rohkem</NotWiredButton>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
