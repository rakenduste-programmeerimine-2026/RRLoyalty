import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AccountShell } from "@/components/AccountShell";
import { NotWiredButton } from "@/components/NotWiredButton";
import { getMember } from "@/lib/auth";
import { getNow } from "@/lib/demo-now";
import { qrSvg } from "@/lib/qr";
import { loadWalletCard, type WalletCard } from "@/lib/supabase-wallet-card";

export const metadata: Metadata = { title: "Wallet-kaart · Minu konto" };

const PATH = "/konto/wallet-kaart";

export default function WalletCardPage() {
  return (
    <AccountShell current="Wallet-kaart">
      <div>
        <h1>Wallet-kaart</h1>
        <p className="lede">Näita kaarti kassas – punktid ja soodustused arvestatakse automaatselt.</p>
      </div>
      <Suspense fallback={<p className="muted" role="status">Laen kliendikaarti…</p>}>
        <Card />
      </Suspense>
    </AccountShell>
  );
}

async function Card() {
  await connection();
  await getMember(PATH);

  let card: WalletCard | null;
  try {
    card = await loadWalletCard(await getNow());
  } catch (error) {
    console.error("Could not load the wallet card", error);
    return (
      <section className="perk" role="alert">
        <h2>Midagi läks valesti</h2>
        <p>Kliendikaarti ei õnnestunud laadida. Proovi hetke pärast uuesti.</p>
        <div className="perk__actions">
          <Link className="btn btn--auto" href={PATH}>Proovi uuesti</Link>
        </div>
      </section>
    );
  }

  if (!card?.cardNumber) {
    return (
      <section className="perk">
        <h2>Kliendikaart puudub</h2>
        <p>Sinu kontol pole veel kliendikaarti. Võta ühendust klienditoega.</p>
      </section>
    );
  }

  // A QR code of the card number (decided on #59), drawn on the server.
  const qr = await qrSvg(card.cardNumber);

  return (
    <div className="club-card-wrap">
      <section className="club-card" aria-label="Kliendikaart">
        <div className="club-card__top">
          <span className="club-card__brand">Rahva Raamat</span>
          <small>Kliendiklubi</small>
        </div>
        <div className="club-card__body">
          <div>
            <b>{card.name}</b>
            <span>Kaart {card.cardNumber}</span>
            <span className="club-card__points">Gustavi rada · {card.lapPoints} p</span>
          </div>
          <div className="club-card__qr" role="img" aria-label={`QR-kood: ${card.cardNumber}`} dangerouslySetInnerHTML={{ __html: qr }} />
        </div>
      </section>
      {/* Simulated in the prototype: it only shows the message (docs/program-rules.md). */}
      <NotWiredButton className="btn btn--auto" message="Kaart lisatud walletisse">Lisa walletisse</NotWiredButton>
    </div>
  );
}
