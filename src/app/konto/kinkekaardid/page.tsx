import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AccountShell } from "@/components/AccountShell";
import { getMember } from "@/lib/auth";
import { euros, giftCardsView, type GiftCardView } from "@/lib/gift-cards";
import type { Shop } from "@/lib/namesakes";
import { formatDate } from "@/lib/rail-account";
import { loadGiftCards } from "@/lib/supabase-gift-cards";
import { settleUnclaimedPrizesInSupabase } from "@/lib/supabase-perk-store";
import { loadShopFromSupabase } from "@/lib/supabase-shop-store";

export const metadata: Metadata = { title: "Kinkekaardid ja soodustused · Minu konto" };

const PATH = "/konto/kinkekaardid";

export default function GiftCardsPage() {
  return (
    <AccountShell current="Kinkekaardid">
      <div>
        <h1>Kinkekaardid ja soodustused</h1>
        <p className="lede">Sinu kinkekaardid, sünnipäevakaart ja nimepäeva kupong ühes kohas.</p>
      </div>
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

  const now = new Date();
  let data: Awaited<ReturnType<typeof loadGiftCards>>;
  let shop: Shop;
  try {
    // Prizes left unchosen for 3 days become gift cards before they are read.
    await settleUnclaimedPrizesInSupabase(member.id, now);
    [data, shop] = await Promise.all([loadGiftCards(), loadShopFromSupabase(member.id)]);
  } catch (error) {
    console.error("Could not load the gift cards page", error);
    return (
      <section className="perk" role="alert">
        <h2>Midagi läks valesti</h2>
        <p>Kinkekaarte ei õnnestunud laadida. Proovi hetke pärast uuesti.</p>
        <div className="perk__actions">
          <Link className="btn btn--auto" href={PATH}>Proovi uuesti</Link>
        </div>
      </section>
    );
  }

  const view = giftCardsView(data.cards, data.birthdays, now);
  // The coupon is a discount, not a card, so the "no cards yet" note shows next to it too.
  const nothing = view.active.length === 0 && view.birthday.length === 0 && view.past.length === 0;

  return (
    <div className="wallet-list">
      {shop.offer && (
        <Link className="coupon" href="/nimekaimud">
          <small>Nimepäeva kupong · kehtib ainult täna</small>
          <b>−10% kõigile raamatutele, mille autor on {shop.offer.firstName}</b>
          <span>Kehtib ükskõik mitmel ostul. Soodustus tuleb ostukorvis ise.</span>
          <span className="coupon__cta">Vaata raamatuid ›</span>
        </Link>
      )}

      {view.birthday.map((card) => (
        <section key={`b-${card.id}`} className="gift-card">
          <small>Sünnipäev</small>
          <b>5 € sünnipäevakaart</b>
          {card.code && <span className="code">{card.code}</span>}
          <span className="muted small">kehtib kuni {formatDate(card.validUntil)} · kood äpis</span>
        </section>
      ))}

      {view.active.map((card) => (
        <GiftCardLink key={card.id} card={card} />
      ))}

      {nothing && (
        <section className="perk">
          <h2>Sul pole veel kinkekaarte</h2>
          <p>
            Gustavi rajal saad 100 punkti peatuses valida 5 € kinkekaardi. Sul on {data.lapPoints} punkti.
          </p>
          <div className="perk__actions">
            <Link className="btn btn--auto" href="/konto/gustavi-rada">Vaata Gustavi rada</Link>
          </div>
        </section>
      )}

      {view.past.length > 0 && (
        <>
          <h2 className="wallet-list__heading">Kasutatud ja aegunud</h2>
          {view.past.map((card) => (
            <GiftCardLink key={card.id} card={card} />
          ))}
        </>
      )}
    </div>
  );
}

function GiftCardLink({ card }: { card: GiftCardView }) {
  const status = card.state === "used" ? "Kasutatud" : card.state === "expired" ? "Aegunud" : null;
  return (
    <Link className={`gift-card${status ? " gift-card--past" : ""}`} href={`${PATH}/${card.id}`}>
      <small>{card.source}</small>
      <b>{card.title}</b>
      <span className="muted small">
        {status ?? `kehtib kuni ${formatDate(card.validUntil)}`} · ostul alates {euros(card.minPurchase)}
      </span>
    </Link>
  );
}
