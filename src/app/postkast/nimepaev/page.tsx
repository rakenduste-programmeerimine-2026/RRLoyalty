import Link from "next/link";
import { GustavScene } from "@/components/Gustav";
import { Screen } from "@/components/Screen";
import { member } from "@/lib/sample-data";

export default function NameDayEmail() {
  return (
    <Screen
      title="Postkast"
      footer={<Link className="btn" href="/nimekaimud">Vaata nimekaimude raamatuid</Link>}
    >
      <GustavScene variant="nameday" label="Gustav tähistab nimepäeva" />
      <h1>Palju õnne nimepäevaks, {member.name}!</h1>
      <p className="muted">Täna saad −10% kõigilt raamatutelt, mille autor on sinu nimekaim.</p>
      <p className="note">Kehtib ainult täna e-poes ja kauplustes klubikaardiga.</p>
    </Screen>
  );
}
