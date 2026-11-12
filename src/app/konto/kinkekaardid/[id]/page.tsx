import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { GiftCardPerk } from "@/components/GiftCardPerk";
import { NotWiredButton } from "@/components/NotWiredButton";
import { Screen } from "@/components/Screen";
import { ShopError, ShopLoading } from "@/components/ShopError";
import { getMember } from "@/lib/auth";
import type { GiftCardRow } from "@/lib/gift-cards";
import { qrSvg } from "@/lib/qr";
import { formatDate } from "@/lib/rail-account";
import { loadGiftCard } from "@/lib/supabase-gift-cards";

const TITLE = "Kinkekaardid";
const BACK = "/konto/kinkekaardid";

type Params = Promise<{ id: string }>;

export default function GiftCardPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ShopLoading title={TITLE} backTo={BACK} text="Laen kinkekaarti…" />}>
      <GiftCardDetails params={params} />
    </Suspense>
  );
}

async function GiftCardDetails({ params }: { params: Params }) {
  await connection();
  const { id } = await params;
  await getMember(`${BACK}/${encodeURIComponent(id)}`);
  if (!/^\d+$/.test(id)) notFound();

  let card: GiftCardRow | null;
  try {
    card = await loadGiftCard(Number(id));
  } catch (error) {
    console.error("Could not load the gift card", error);
    return <ShopError title={TITLE} backTo={BACK} retry={`${BACK}/${id}`} />;
  }
  if (!card) notFound();

  return (
    <Screen
      title={TITLE}
      backTo={BACK}
      centered
      footer={
        <>
          <Link className="btn btn--ghost" href={BACK}>Tagasi kinkekaartide juurde</Link>
          {/* Simulated in the prototype: it only shows the message (docs/program-rules.md). */}
          <NotWiredButton message="Kinkekaart lisatud walletisse">Lisa walletisse</NotWiredButton>
        </>
      }
    >
      <GiftCardPerk
        code={card.code}
        validUntil={formatDate(card.validUntil)}
        qrSvg={await qrSvg(card.code)}
      />
    </Screen>
  );
}
