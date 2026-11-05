import Link from "next/link";
import { GustavScene } from "@/components/Gustav";
import { Screen } from "@/components/Screen";

export default function HundredPointsEmail() {
  return (
    <Screen
      title="Postkast"
      footer={<Link className="btn" href="/konto/gustavi-rada/tasu">Vali tasu</Link>}
    >
      <GustavScene variant="milestone" label="Gustav jõudis 100 punkti peatusse" />
      <h1>Sul on 100 punkti – vali oma tasu</h1>
      <p className="muted">
        Vali 3 päeva jooksul: 5 € kinkekaart endale või 5 € annetus kooliraamatukogule.
      </p>
      <p className="note">Kui sa ei vali, saad kinkekaardi automaatselt 3 päeva jooksul.</p>
    </Screen>
  );
}
