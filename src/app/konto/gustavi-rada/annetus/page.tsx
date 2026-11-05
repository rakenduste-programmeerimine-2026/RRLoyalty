import Link from "next/link";
import { GustavScene } from "@/components/Gustav";
import { NotWiredButton } from "@/components/NotWiredButton";
import { Screen } from "@/components/Screen";
import { school } from "@/lib/sample-data";

export default function Donation() {
  return (
    <Screen
      title="Gustavi rada"
      backTo="/konto/gustavi-rada"
      centered
      footer={
        <>
          <Link className="btn btn--ghost" href="/konto/gustavi-rada">Tagasi rajale</Link>
          <NotWiredButton>Jaga sõpradega</NotWiredButton>
        </>
      }
    >
      <GustavScene variant="books" label="Gustav istub raamatuhunnikul" />
      <h1>Aitäh!</h1>
      <p>Sinu 5 € läheb {school} raamatukogule.</p>
      <p className="muted small">Annetuste kokkuvõtte saad aasta lõpus e-kirjaga.</p>
    </Screen>
  );
}
