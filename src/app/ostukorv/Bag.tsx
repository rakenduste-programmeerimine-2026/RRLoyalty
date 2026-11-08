"use client";

import Link from "next/link";
import { BookCover } from "@/components/BookCover";
import { NotWiredButton } from "@/components/NotWiredButton";
import { Screen } from "@/components/Screen";
import { useCart } from "@/components/useCart";
import { MAX_QTY, summarizeCart } from "@/lib/cart";
import { formatEur } from "@/lib/money";
import { RAIL_END, nextStop } from "@/lib/rail";
import { nameDayBooks, pointsBeforeNameDayPurchase } from "@/lib/sample-data";

const lowerFirst = (text: string) => text.charAt(0).toLocaleLowerCase("et") + text.slice(1);

export function Bag() {
  const { lines, setQty, remove } = useCart();

  if (lines === undefined) {
    return (
      <Screen title="Ostukorv" backTo="/nimekaimud">
        <p className="muted" role="status">Laen ostukorvi…</p>
      </Screen>
    );
  }

  const summary = summarizeCart(lines, nameDayBooks);

  if (summary.count === 0) {
    return (
      <Screen
        title="Ostukorv"
        backTo="/nimekaimud"
        footer={<Link className="btn" href="/nimekaimud">Vaata nimekaimude raamatuid</Link>}
      >
        <h1>Ostukorv on tühi</h1>
        <p className="muted">Lisa raamat, et näha, mitu punkti see Gustavi rajale toob.</p>
      </Screen>
    );
  }

  const pointsAfter = pointsBeforeNameDayPurchase + summary.earned;
  const next = nextStop(pointsAfter);
  const goal = next?.at ?? RAIL_END;

  return (
    <Screen
      title="Ostukorv"
      backTo="/nimekaimud"
      footer={
        <>
          <Link className="textlink" href="/konto/gustavi-rada">Vaata Gustavi rada</Link>
          <NotWiredButton>Maksa {formatEur(summary.total)}</NotWiredButton>
        </>
      }
    >
      {summary.items.map(({ book, qty }) => (
        <div key={book.slug} className="cart-line">
          <BookCover book={book} size="grid" />
          <div>
            <b>{book.title}</b>
            <span className="muted">{book.author} · {qty} tk</span>
            <div className="cart-line__qty">
              <button
                type="button"
                aria-label={`Vähenda: ${book.title}`}
                disabled={qty <= 1}
                onClick={() => setQty(book.slug, qty - 1)}
              >
                −
              </button>
              <span aria-live="polite">{qty}</span>
              <button
                type="button"
                aria-label={`Suurenda: ${book.title}`}
                disabled={qty >= MAX_QTY}
                onClick={() => setQty(book.slug, qty + 1)}
              >
                +
              </button>
              <button type="button" className="textlink" onClick={() => remove(book.slug)}>
                Eemalda
              </button>
            </div>
          </div>
        </div>
      ))}
      <div className="sum">
        <div><span>Hind</span><span>{formatEur(summary.listTotal)}</span></div>
        <div className="saving">
          <span>Nimepäeva soodustus −10%</span>
          <span>−{formatEur(summary.discount)}</span>
        </div>
        <div className="total"><span>Kokku</span><span>{formatEur(summary.total)}</span></div>
      </div>
      <div className="gain">
        <b>+{summary.earned} punkti Gustavi rajale</b>
        <div className="gain__meter">
          <div className="meter">
            <span style={{ width: `${Math.min(pointsAfter / goal, 1) * 100}%` }} />
          </div>
          <span>{pointsAfter} / {goal}</span>
        </div>
        <p>
          {next
            ? `Pärast ostu: ${pointsAfter} punkti. Veel ${next.at - pointsAfter} € ja jõuad järgmise peatusse: ${lowerFirst(next.label)}.`
            : `Pärast ostu: ${pointsAfter} punkti. Jõuad raja lõppu ja alustad uut ringi.`}
        </p>
      </div>
    </Screen>
  );
}
