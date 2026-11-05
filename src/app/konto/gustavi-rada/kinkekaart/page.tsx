import Link from "next/link";
import { NotWiredButton } from "@/components/NotWiredButton";
import { SampleQr } from "@/components/SampleQr";
import { Screen } from "@/components/Screen";
import { giftCard } from "@/lib/sample-data";

export default function GiftCard() {
  return (
    <Screen
      title="Gustavi rada"
      backTo="/konto/gustavi-rada"
      centered
      footer={
        <>
          <Link className="btn btn--ghost" href="/konto/gustavi-rada">Tagasi rajale</Link>
          <NotWiredButton>Lisa walletisse</NotWiredButton>
        </>
      }
    >
      <h1>5 € kinkekaart on sinu!</h1>
      <SampleQr seed={giftCard.code} />
      <p className="code">{giftCard.code}</p>
      <p className="muted small">kehtib kuni {giftCard.validUntil} · ostul alates 20 €</p>
    </Screen>
  );
}
