import Link from "next/link";
import { Suspense } from "react";
import { GustavScene } from "@/components/Gustav";
import { NotWiredButton } from "@/components/NotWiredButton";
import { Screen } from "@/components/Screen";
import { donationSchool } from "@/lib/settings";

export default function Donation() {
  return (
    <Screen
      title="Gustavi rada"
      backTo="/konto/gustavi-rada"
      centered
      footer={
        <>
          <Link className="btn btn--ghost" href="/konto/gustavi-rada">Tagasi rajale</Link>
          {/* Simulated in the prototype: it only shows the message (docs/program-rules.md). */}
          <NotWiredButton message="Link kopeeritud">Jaga sõpradega</NotWiredButton>
        </>
      }
    >
      <GustavScene variant="books" label="Gustav istub raamatuhunnikul" />
      <h1>Aitäh!</h1>
      <Suspense fallback={<p>Sinu 5 € läheb kooliraamatukogule.</p>}>
        <DonationTarget />
      </Suspense>
      <p className="muted small">Annetuste kokkuvõtte saad aasta lõpus e-kirjaga.</p>
    </Screen>
  );
}

async function DonationTarget() {
  const school = await donationSchool();
  return <p>{school ? `Sinu 5 € läheb ${school} raamatukogule.` : "Sinu 5 € läheb kooliraamatukogule."}</p>;
}
