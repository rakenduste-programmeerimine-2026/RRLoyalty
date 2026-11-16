import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AccountShell } from "@/components/AccountShell";
import { EmptyState, LoadError } from "@/components/EmptyState";
import { RewardRow } from "@/components/RewardRow";
import { getMember } from "@/lib/auth";
import { getNow } from "@/lib/demo-now";
import { euros, giftCardsView, type GiftCardView } from "@/lib/gift-cards";
import type { Shop } from "@/lib/namesakes";
import { formatDate } from "@/lib/rail-account";
import { loadGiftCards } from "@/lib/supabase-gift-cards";
import { settleUnclaimedPrizesInSupabase } from "@/lib/supabase-perk-store";
import { loadShopFromSupabase } from "@/lib/supabase-shop-store";
import "./gift-cards.css";

export const metadata: Metadata = { title: "Kinkekaardid · Minu konto" };

const PATH = "/konto/kinkekaardid";

export default function GiftCardsPage() {
  return (
    <AccountShell current="Kinkekaardid">
      <h1>Kinkekaardid</h1>
      <Suspense fallback={<p className="muted" role="status">Laen kinkekaarte…</p>}>
        <GiftCards />
      </Suspense>
    </AccountShell>
  );
}

async function GiftCards() {
  // The coupon and card validity depend on today, so this renders per request.
  await connection();
  const member = await getMember(PATH);

  const now = await getNow();
  let data: Awaited<ReturnType<typeof loadGiftCards>>;
  let shop: Shop;
  try {
    // Prizes left unchosen for 3 days become gift cards before they are read.
    await settleUnclaimedPrizesInSupabase(member.id, now);
    [data, shop] = await Promise.all([loadGiftCards(now), loadShopFromSupabase(member.id, now)]);
  } catch (error) {
    console.error("Could not load the gift cards page", error);
    return <LoadError what="Kinkekaarte" retry={PATH} />;
  }

  const view = giftCardsView(data.cards, data.birthdays, now);
  // The coupon is a discount, not a card, so the "no cards yet" note shows next to it too.
  const nothing = view.active.length === 0 && view.birthday.length === 0 && view.past.length === 0;

  return (
    <div className="gift-cards">
      {shop.offer && (
        <RewardRow
          strong
          title={`−10% raamatutele, mille autor on ${shop.offer.firstName}`}
          detail="Nimepäeva kupong · kehtib ainult täna · soodustus tuleb ostukorvis ise"
          action={<Link className="pill-btn" href="/nimekaimud">Vaata raamatuid</Link>}
        />
      )}

      {view.birthday.map((card) => (
        <RewardRow
          key={`b-${card.id}`}
          title="5 € sünnipäevakaart"
          detail={`Sünnipäev · kehtib kuni ${formatDate(card.validUntil)} · kood äpis`}
          action={card.code && <span className="code gift-cards__code">{card.code}</span>}
        />
      ))}

      {view.active.map((card) => (
        <GiftCardRow key={card.id} card={card} />
      ))}

      {nothing && (
        <EmptyState
          gustav
          title="Sul pole veel kinkekaarte"
          action={<Link className="btn btn--ghost btn--small" href="/konto/gustavi-rada">Vaata Gustavi rada</Link>}
        >
          Gustavi rajal saad 100 punkti peatuses valida 5 € kinkekaardi. Sul on {data.lapPoints} punkti.
        </EmptyState>
      )}

      {view.past.length > 0 && (
        <>
          <h2 className="gift-cards__heading">Kasutatud ja aegunud</h2>
          {view.past.map((card) => (
            <GiftCardRow key={card.id} card={card} />
          ))}
        </>
      )}
    </div>
  );
}

function GiftCardRow({ card }: { card: GiftCardView }) {
  const status = card.state === "used" ? "Kasutatud" : card.state === "expired" ? "Aegunud" : null;
  return (
    <RewardRow
      strong={!status}
      past={Boolean(status)}
      title={card.title}
      detail={`${card.source} · ${status ?? `kehtib kuni ${formatDate(card.validUntil)}`} · ostul alates ${euros(card.minPurchase)}`}
      action={<Link className="pill-btn" href={`${PATH}/${card.id}`}>{status ? "Vaata" : "Ava"}</Link>}
    />
  );
}
