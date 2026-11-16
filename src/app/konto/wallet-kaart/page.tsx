import type { Metadata } from "next";
import Image from "next/image";
import { connection } from "next/server";
import { Suspense } from "react";
import { AccountShell } from "@/components/AccountShell";
import { EmptyState, LoadError } from "@/components/EmptyState";
import { Gustav } from "@/components/Gustav";
import { NotWiredButton } from "@/components/NotWiredButton";
import { QrCode } from "@/components/QrCode";
import { getMember } from "@/lib/auth";
import { getNow } from "@/lib/demo-now";
import { qrSvg } from "@/lib/qr";
import { loadWalletCard, type WalletCard } from "@/lib/supabase-wallet-card";
import "./wallet-card.css";

export const metadata: Metadata = { title: "Wallet-kaart · Minu konto" };

const PATH = "/konto/wallet-kaart";

export default function WalletCardPage() {
  return (
    <AccountShell current="Wallet-kaart">
      <h1>Wallet-kaart</h1>
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
    return <LoadError what="Kliendikaarti" retry={PATH} />;
  }

  if (!card?.cardNumber) {
    return (
      <EmptyState title="Kliendikaart puudub">
        Sinu kontol pole veel kliendikaarti. Võta ühendust klienditoega.
      </EmptyState>
    );
  }

  // A QR code of the card number (decided on #59), drawn on the server.
  const qr = await qrSvg(card.cardNumber);

  return (
    <div className="club-card-wrap">
      <section className="club-card" aria-label="Kliendikaart">
        <Gustav pose="sleeping" alt="Gustav lebab raamatute peal kaardi kohal" className="club-card__gustav" />
        <div className="club-card__top">
          <Image className="club-card__logo" src="/assets/rr-logo.png" width={800} height={250} alt="Rahva Raamat" />
          <small>Kliendiklubi</small>
        </div>
        <div className="club-card__body">
          <div>
            <b>{card.name}</b>
            <span>Kaart {card.cardNumber}</span>
          </div>
          <QrCode svg={qr} code={card.cardNumber} size="small" />
        </div>
        <div className="club-card__points"><span>Gustavi rada</span><b>{card.lapPoints} p</b></div>
      </section>
      <div className="club-card-side">
        <p className="muted small">
          Näita kaarti kassas – punktid ja soodustused arvestatakse automaatselt. Lisa kaart telefoni walletisse,
          et see oleks alati käepärast.
        </p>
        {/* Simulated in the prototype: it only shows the message (docs/program-rules.md). */}
        <NotWiredButton message="Kaart lisatud walletisse">Lisa walletisse</NotWiredButton>
      </div>
    </div>
  );
}
