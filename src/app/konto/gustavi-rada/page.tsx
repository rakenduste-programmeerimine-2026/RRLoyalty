import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AccountShell } from "@/components/AccountShell";
import { LoadError } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";
import { Rail } from "@/components/Rail";
import { RewardRow } from "@/components/RewardRow";
import { getMember } from "@/lib/auth";
import { getNow } from "@/lib/demo-now";
import { messageScreen, type Message } from "@/lib/messages";
import { formatDate, formatDayMonth, historyLabel, type PerkView, type RailView } from "@/lib/rail-account";
import { loadMessages } from "@/lib/supabase-message-store";
import { loadRailFromSupabase } from "@/lib/supabase-rail-store";
import { PerkDialog } from "./PerkDialog";
import "./rail-page.css";

export const metadata: Metadata = { title: "Gustavi rada · Minu konto" };

const PATH = "/konto/gustavi-rada";
const HISTORY_ROWS = 5;

export default function GustavRailPage() {
  return (
    <AccountShell current="Gustavi rada">
      <Suspense fallback={null}>
        <NewMessage />
      </Suspense>
      <div>
        <h1>Gustavi rada</h1>
        <p className="lede">
          Iga 1 € = 1 punkt – kauplustes, e-poes, Literaadis ja äpis. Peatusel avaneb hüve.
        </p>
      </div>
      <Suspense fallback={<p className="muted" role="status">Laen sinu punkte…</p>}>
        <RailContent />
      </Suspense>
    </AccountShell>
  );
}

/** The newest unread Postkast message, as a banner above the page. */
async function NewMessage() {
  await connection();
  const member = await getMember(PATH);

  let unread: Message | undefined;
  try {
    unread = (await loadMessages(member.id)).find((message) => message.readAt === null);
  } catch (error) {
    // The banner is a shortcut: the bell in the header still leads to the messages.
    console.error("Could not load the newest message for the rail page", error);
  }
  if (!unread) return null;

  return (
    <Link className="mail-banner" href={messageScreen(unread)}>
      <Icon name="mail" />
      <span className="mail-banner__text">
        <small>Uus kiri · {formatDate(unread.createdAt)}</small>
        <b>{unread.title}</b>
      </span>
      <span className="mail-banner__open">Ava kiri ›</span>
    </Link>
  );
}

async function RailContent() {
  // Points expire by the clock, so this part renders at request time, never prerendered.
  await connection();
  const member = await getMember(PATH);

  let view: RailView;
  try {
    view = await loadRailFromSupabase(member.id, HISTORY_ROWS, await getNow());
  } catch (error) {
    console.error("Could not load the Gustavi rada page", error);
    return <LoadError what="Sinu punkte" retry={PATH} />;
  }

  return (
    <>
      {view.perks.length > 0 && (
        <section className="perk-rows" aria-label="Avatud hüved">
          {view.perks.map((perk) => (
            <PerkRow key={perk.id} perk={perk} />
          ))}
        </section>
      )}
      <Rail points={view.lapPoints} />
      <div className="stats">
        <div className="stat">
          <b>{view.lapPoints} p</b>
          <span>{view.lapsCompleted > 0 ? `kogutud ${view.lapsCompleted + 1}. ringil` : "kogutud"}</span>
        </div>
        <div className="stat"><b>{view.perks.length}</b><span>avamata hüve</span></div>
        <ValidUntil view={view} />
      </div>
      <div className="rail-panels">
        <section className="history" aria-labelledby="history-title">
          <div className="history__head">
            <h2 id="history-title">Viimased punktid</h2>
            <Link className="textlink" href="/konto/tellimused">Vaata kõiki</Link>
          </div>
          {view.history.length === 0 ? (
            <p className="muted small">Sul pole veel punkte. Esimene ost viib Gustavi rajale.</p>
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
        </section>
        <section className="how" aria-labelledby="how-title">
          <h2 id="how-title">Kuidas Gustavi rada töötab?</h2>
          <p>
            Kogud punkte iga ostuga (1 € = 1 punkt). Igal peatusel avaneb hüve, mille kohta saad ka kirja oma
            postkasti. Kui sa 3 päeva jooksul tasu ei vali, saad automaatselt kinkekaardi. Punktid kehtivad 6 kuud
            viimasest ostust.
          </p>
        </section>
      </div>
    </>
  );
}

function ValidUntil({ view }: { view: RailView }) {
  if (view.validUntil === null) {
    return <div className="stat"><b>6 kuud</b><span>punktid kehtivad viimasest ostust</span></div>;
  }
  if (view.expired) {
    return <div className="stat"><b>{formatDate(view.validUntil)}</b><span>punktid aegusid</span></div>;
  }
  return <div className="stat"><b>{formatDate(view.validUntil)}</b><span>punktid kehtivad kuni</span></div>;
}

/** One open perk above the rail, with the action that fits it. */
function PerkRow({ perk }: { perk: PerkView }) {
  if (perk.choosing && perk.chooseBy) {
    return (
      <RewardRow
        strong
        title={perk.title}
        detail={`Vali kuni ${formatDate(perk.chooseBy)} · muidu saad 5 € kinkekaardi`}
        action={<Link className="pill-btn" href={`${PATH}/tasu`}>Vali tasu</Link>}
      />
    );
  }

  const validUntil = formatDate(perk.expiresAt);
  const detail = `${perk.stopAt ? `${perk.stopAt} p hüve` : "Avatud hüve"} · kehtib kuni ${validUntil}`;

  if (perk.choice === "gift_card") {
    return (
      <RewardRow
        title={perk.title}
        detail={detail}
        action={<Link className="pill-btn" href="/konto/kinkekaardid">Ava</Link>}
      />
    );
  }

  return (
    <RewardRow
      title={perk.title}
      detail={detail}
      action={
        <PerkDialog
          perkId={perk.id}
          stopAt={perk.stopAt}
          title={perk.title}
          validUntil={validUntil}
          code={perk.code}
          choice={perk.choice}
        />
      }
    />
  );
}
