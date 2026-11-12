import Link from "next/link";
import { GiftCardPerk } from "@/components/GiftCardPerk";
import { NotWiredButton } from "@/components/NotWiredButton";
import { Screen } from "@/components/Screen";
import { qrSvg } from "@/lib/qr";
import { giftCard } from "@/lib/sample-data";

export default async function GiftCard() {
  const qr = await qrSvg(giftCard.code);

  return (
    <Screen
      title="Gustavi rada"
      backTo="/konto/gustavi-rada"
      centered
      footer={
        <>
          <Link className="btn btn--ghost" href="/konto/gustavi-rada">Tagasi rajale</Link>
          {/* Simulated in the prototype: it only shows the message (docs/program-rules.md). */}
          <NotWiredButton message="Kinkekaart lisatud walletisse">Lisa walletisse</NotWiredButton>
        </>
      }
    >
      <GiftCardPerk code={giftCard.code} validUntil={giftCard.validUntil} qrSvg={qr} />
    </Screen>
  );
}
