import Link from "next/link";
import { PrizeForm } from "./PrizeForm";

export default function ChoosePrize() {
  return (
    <div className="screen">
      <header className="screen__bar">
        <Link href="/konto/gustavi-rada">‹ Gustavi rada</Link>
      </header>
      <PrizeForm />
    </div>
  );
}
