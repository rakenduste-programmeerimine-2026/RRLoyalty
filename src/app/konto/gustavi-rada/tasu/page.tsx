import Link from "next/link";
import { reachedPrizeStop } from "@/lib/sample-data";
import { PrizeForm } from "./PrizeForm";

export default function ChoosePrize() {
  return (
    <div className="screen">
      <header className="screen__bar">
        <Link href="/konto/gustavi-rada">‹ Gustavi rada</Link>
      </header>
      <PrizeForm stop={reachedPrizeStop} />
    </div>
  );
}
