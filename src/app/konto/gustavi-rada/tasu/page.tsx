import Link from "next/link";
import { Suspense } from "react";
import { reachedPrizeStop } from "@/lib/sample-data";
import { donationSchool } from "@/lib/settings";
import { PrizeForm } from "./PrizeForm";

export default function ChoosePrize() {
  return (
    <div className="screen">
      <header className="screen__bar">
        <Link href="/konto/gustavi-rada">‹ Gustavi rada</Link>
      </header>
      {/* The form works straight away; the school's name streams in from settings. */}
      <Suspense fallback={<PrizeForm stop={reachedPrizeStop} school={null} />}>
        <PrizeFormWithSchool />
      </Suspense>
    </div>
  );
}

async function PrizeFormWithSchool() {
  return <PrizeForm stop={reachedPrizeStop} school={await donationSchool()} />;
}
