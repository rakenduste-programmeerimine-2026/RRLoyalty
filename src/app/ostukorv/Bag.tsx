"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { BookCover } from "@/components/BookCover";
import { Screen } from "@/components/Screen";
import { useCart } from "@/components/useCart";
import { MAX_QTY, summarizeCart, type CartLine, type PricedCartBook } from "@/lib/cart";
import { formatEur } from "@/lib/money";
import { RAIL_END, STOPS, nextStop } from "@/lib/rail";
import { payForCart, type CheckoutState } from "./actions";

const lowerFirst = (text: string) => text.charAt(0).toLocaleLowerCase("et") + text.slice(1);

type Order = Extract<CheckoutState, { ok: true }>;

type BagProps = {
  /** Every book, priced for the signed-in member on the server. */
  catalog: PricedCartBook[];
  /** The member's points on the current lap. */
  lapPoints: number;
};

export function Bag({ catalog, lapPoints }: BagProps) {
  const { lines, setQty, remove, clear } = useCart();
  const [order, setOrder] = useState<Order>();
  const [error, setError] = useState<string>();
  const [paying, startPaying] = useTransition();
  // One reference per checkout, reused on a retry of the same cart so it is never recorded twice.
  const checkout = useRef<{ cart: string; ref: string }>(undefined);

  function pay(cartLines: CartLine[]) {
    const cart = JSON.stringify(cartLines);
    if (checkout.current?.cart !== cart) checkout.current = { cart, ref: crypto.randomUUID() };
    const ref = checkout.current.ref;
    setError(undefined);

    startPaying(async () => {
      try {
        const result: CheckoutState | undefined = await payForCart(cartLines, ref);
        // A signed-out member is sent to sign-in instead, and no result comes back.
        if (!result) return;
        if (result.ok) {
          checkout.current = undefined;
          setOrder(result);
          clear();
        } else {
          if (result.newCheckout) checkout.current = undefined;
          setError(result.error);
        }
      } catch {
        setError("Ühendus katkes. Proovi uuesti.");
      }
    });
  }

  if (order) {
    const opened = STOPS.filter((stop) => order.openedStops.includes(stop.at));
    return (
      <Screen
        title="Tellimus"
        footer={
          <>
            <Link className="textlink" href="/nimekaimud">Tagasi raamatute juurde</Link>
            <Link className="btn" href="/konto/gustavi-rada">Vaata Gustavi rada</Link>
          </>
        }
      >
        <h1>Aitäh, makse õnnestus!</h1>
        <p className="muted">Tellimus {order.orderNumber} · {formatEur(order.total)}</p>
        <div className="gain" role="status">
          <b>+{order.points} punkti Gustavi rajale</b>
          {opened.map((stop) => (
            <p key={stop.at}>Jõudsid {stop.at} punkti peatusse: {lowerFirst(stop.label)}.</p>
          ))}
        </div>
      </Screen>
    );
  }

  if (lines === undefined) {
    return (
      <Screen title="Ostukorv" backTo="/nimekaimud">
        <p className="muted" role="status">Laen ostukorvi…</p>
      </Screen>
    );
  }

  const summary = summarizeCart(lines, catalog);

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

  const pointsAfter = lapPoints + summary.earned;
  const next = nextStop(pointsAfter);
  const goal = next?.at ?? RAIL_END;

  return (
    <Screen
      title="Ostukorv"
      backTo="/nimekaimud"
      footer={
        <>
          <Link className="textlink" href="/konto/gustavi-rada">Vaata Gustavi rada</Link>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="button" className="btn" disabled={paying} onClick={() => pay(lines)}>
            {paying ? "Maksan…" : `Maksa ${formatEur(summary.total)}`}
          </button>
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
        {summary.discount > 0 && (
          <div className="saving">
            <span>Nimepäeva soodustus −10%</span>
            <span>−{formatEur(summary.discount)}</span>
          </div>
        )}
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
