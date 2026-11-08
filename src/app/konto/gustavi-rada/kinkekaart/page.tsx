import Link from "next/link";
import { GiftCardPerk } from "@/components/GiftCardPerk";
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
      footer={<Link className="btn" href="/konto/gustavi-rada">Tagasi rajale</Link>}
    >
      <GiftCardPerk code={giftCard.code} validUntil={giftCard.validUntil} qrSvg={qr} />
    </Screen>
  );
}
