import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Screen } from "@/components/Screen";
import { ShopError, ShopLoading } from "@/components/ShopError";
import { getMember } from "@/lib/auth";
import { getNow } from "@/lib/demo-now";
import { formatDate } from "@/lib/rail-account";
import { donationSchool } from "@/lib/settings";
import { loadOpenPrize, type OpenPrize } from "@/lib/supabase-prize";
import { PrizeForm } from "./PrizeForm";

const PATH = "/konto/gustavi-rada/tasu";
const TITLE = "Gustavi rada";
const BACK = "/konto/gustavi-rada";

const time = new Intl.DateTimeFormat("et-EE", { timeZone: "Europe/Tallinn", hour: "2-digit", minute: "2-digit" });

export default function ChoosePrize() {
  return (
    <Suspense fallback={<ShopLoading title={TITLE} backTo={BACK} text="Laen sinu tasu…" />}>
      <OpenPrizeForm />
    </Suspense>
  );
}

async function OpenPrizeForm() {
  await connection();
  await getMember(PATH);

  let prize: OpenPrize | null;
  let school: string | null;
  try {
    [prize, school] = await Promise.all([loadOpenPrize(await getNow()), donationSchool()]);
  } catch (error) {
    console.error("Could not load the prize choice", error);
    return <ShopError title={TITLE} backTo={BACK} retry={PATH} />;
  }

  if (!prize) {
    return (
      <Screen title={TITLE} backTo={BACK} footer={<Link className="btn" href={BACK}>Vaata Gustavi rada</Link>}>
        <h1>Praegu pole tasu valida</h1>
        <p className="muted">
          Tasu saad valida, kui jõuad 100, 200, 300 või 400 punkti peatusse. Kui valimise aeg sai läbi, leiad oma
          kinkekaardi kinkekaartide alt.
        </p>
        <Link className="textlink" href="/konto/kinkekaardid">Vaata kinkekaarte</Link>
      </Screen>
    );
  }

  return (
    <div className="screen">
      <header className="screen__bar">
        <Link href={BACK}>‹ {TITLE}</Link>
      </header>
      <PrizeForm
        perkId={prize.perkId}
        stop={prize.stopAt}
        chooseBy={`${formatDate(prize.chooseBy)} ${time.format(prize.chooseBy)}`}
        school={school}
      />
    </div>
  );
}
