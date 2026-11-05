import Link from "next/link";
import { BookCover } from "@/components/BookCover";
import { NotWiredButton } from "@/components/NotWiredButton";
import { Screen } from "@/components/Screen";
import { formatEur, nameDayPrice } from "@/lib/money";
import { nextStop, pointsToNext } from "@/lib/rail";
import { nameDayBooks } from "@/lib/sample-data";

const POINTS_BEFORE_PURCHASE = 14;

export default function Bag() {
  const book = nameDayBooks[0];
  const total = nameDayPrice(book.price);
  const earned = Math.floor(total);
  const pointsAfter = POINTS_BEFORE_PURCHASE + earned;
  const goal = nextStop(pointsAfter)?.at ?? pointsAfter;

  return (
    <Screen
      title="Ostukorv"
      backTo={`/raamat/${book.slug}`}
      footer={
        <>
          <Link className="textlink" href="/konto/gustavi-rada">Vaata Gustavi rada</Link>
          <NotWiredButton>Maksa {formatEur(total)}</NotWiredButton>
        </>
      }
    >
      <div className="cart-line">
        <BookCover book={book} size="grid" />
        <div>
          <b>{book.title}</b>
          <span className="muted">{book.author} · 1 tk</span>
        </div>
      </div>
      <div className="sum">
        <div><span>Hind</span><span>{formatEur(book.price)}</span></div>
        <div className="saving">
          <span>Nimepäeva soodustus −10%</span>
          <span>−{formatEur(book.price - total)}</span>
        </div>
        <div className="total"><span>Kokku</span><span>{formatEur(total)}</span></div>
      </div>
      <div className="gain">
        <b>+{earned} punkti Gustavi rajale</b>
        <div className="gain__meter">
          <div className="meter"><span style={{ width: `${(pointsAfter / goal) * 100}%` }} /></div>
          <span>{pointsAfter} / {goal}</span>
        </div>
        <p>
          Pärast ostu: {pointsAfter} punkti. Veel {pointsToNext(pointsAfter)} € ja jõuad järgmise
          peatusse: tasuta kohv.
        </p>
      </div>
    </Screen>
  );
}
