"use client";

import Link from "next/link";
import { useRef, useState, useTransition, type ReactNode } from "react";
import { BookCover } from "@/components/BookCover";
import { Icon } from "@/components/Icon";
import { ScreenFrame } from "@/components/ScreenFrame";
import { useCart } from "@/components/useCart";
import { MAX_QTY, summarizeCart, type CartLine, type PricedCartBook } from "@/lib/cart";
import { formatEur } from "@/lib/money";
import { RAIL_END, STOPS, nextStop } from "@/lib/rail";
import { payForCart, type CheckoutState } from "./actions";
import "./bag.css";

const lowerFirst = (text: string) => text.charAt(0).toLocaleLowerCase("et") + text.slice(1);

type Order = Extract<CheckoutState, { ok: true }>;

type BagProps = {
  /** The site header, rendered on the server: it reads the session. */
  siteHeader: ReactNode;
  /** Every book, priced for the signed-in member on the server. */
  catalog: PricedCartBook[];
  /** The member's points on the current lap. */
  lapPoints: number;
  /** For "Aitäh, Mari!"; null when the member has no profile. */
  firstName: string | null;
  /** "18.11.2026" while the name-day offer is open, otherwise null. */
  offerLastDay: string | null;
};

type Removed = { line: CartLine; index: number; title: string };

const TITLE = "Ostukorv";
const BACK = "/nimekaimud";

export function Bag({ siteHeader, catalog, lapPoints, firstName, offerLastDay }: BagProps) {
  const { lines, setQty, remove, restore, clear } = useCart();
  const [order, setOrder] = useState<Order>();
  const [error, setError] = useState<string>();
  const [removed, setRemoved] = useState<Removed>();

  function removeLine(slug: string, title: string) {
    const index = lines?.findIndex((line) => line.slug === slug) ?? -1;
    if (lines && index >= 0) setRemoved({ line: lines[index], index, title });
    remove(slug);
  }

  function undoRemove() {
    if (!removed) return;
    restore(removed.line, removed.index);
    setRemoved(undefined);
  }

  const undo = removed && (
    <p className="undo" role="status">
      Eemaldasid: {removed.title}.{" "}
      <button type="button" className="textlink" onClick={undoRemove}>Võta tagasi</button>
    </p>
  );
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
    // Reaching 400 starts the next lap with the extra points.
    const lapAfter = (lapPoints + order.points) % RAIL_END;
    const toNext = nextStop(lapAfter);
    return (
      <ScreenFrame
        header={siteHeader}
        title="Tellimus"
        variant="card"
        footer={
          <>
            <Link className="btn btn--ghost" href="/nimekaimud">Jätka ostlemist</Link>
            <Link className="btn" href="/konto/gustavi-rada">Vaata Gustavi rada</Link>
          </>
        }
      >
        <span className="order-check" aria-hidden="true"><Icon name="check" size={30} /></span>
        <h1 className="order-title">{firstName ? `Aitäh, ${firstName}!` : "Aitäh!"}</h1>
        <p className="muted order-text">Tellimus {order.orderNumber} on vormistatud · {formatEur(order.total)}</p>
        <div className="gain" role="status">
          <b>+{order.points} punkti Gustavi rajale</b>
          {toNext && <Meter points={lapAfter} goal={toNext.at} />}
          {opened.map((stop) => (
            <p key={stop.at}>Jõudsid {stop.at} punkti peatusse: {lowerFirst(stop.label)}.</p>
          ))}
          {toNext && <p>Veel {toNext.at - lapAfter} punkti ja Gustav jõuab järgmisse peatusse.</p>}
        </div>
      </ScreenFrame>
    );
  }

  if (lines === undefined) {
    return (
      <ScreenFrame header={siteHeader} title={TITLE} backTo={BACK}>
        <p className="muted" role="status">Laen ostukorvi…</p>
      </ScreenFrame>
    );
  }

  const summary = summarizeCart(lines, catalog);

  if (summary.count === 0) {
    return (
      <ScreenFrame header={siteHeader} title={TITLE} backTo={BACK}>
        <h1>Ostukorv</h1>
        <div className="bag-empty">
          <b>Ostukorv on tühi</b>
          <span className="muted small">
            {offerLastDay
              ? "Nimepäeva −10% kehtib ainult täna."
              : "Lisa raamat, et näha, mitu punkti see Gustavi rajale toob."}
          </span>
          {undo}
          <Link className="textlink" href="/nimekaimud">Vaata nimekaimude raamatuid</Link>
        </div>
      </ScreenFrame>
    );
  }

  const pointsAfter = lapPoints + summary.earned;
  const next = nextStop(pointsAfter);
  const goal = next?.at ?? RAIL_END;

  return (
    <ScreenFrame header={siteHeader} title={TITLE} backTo={BACK}>
      <h1>Ostukorv</h1>
      <div className="bag">
        <div className="bag__lines">
          {summary.items.map(({ book, qty }) => (
            <div key={book.slug} className="cart-line">
              <BookCover book={book} size="thumb" />
              <div className="cart-line__info">
                <b>{book.title}</b>
                <span className="muted">{book.author}</span>
                <span className="price">
                  {book.discounted < book.price && <s>{formatEur(book.price)}</s>}
                  <strong>{formatEur(book.discounted)}</strong>
                </span>
                <div className="cart-line__actions">
                  <div className="stepper" role="group" aria-label="Kogus">
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
                  </div>
                  <button type="button" className="textlink" onClick={() => removeLine(book.slug, book.title)}>
                    Eemalda
                  </button>
                </div>
              </div>
            </div>
          ))}
          {undo}
          <div className="gain">
            <b>+{summary.earned} punkti Gustavi rajale</b>
            <Meter points={pointsAfter} goal={goal} />
            <p>
              {next
                ? `Pärast ostu: ${pointsAfter} punkti. Veel ${next.at - pointsAfter} € ja jõuad järgmise peatusse: ${lowerFirst(next.label)}.`
                : `Pärast ostu: ${pointsAfter} punkti. Jõuad raja lõppu ja alustad uut ringi.`}
            </p>
          </div>
        </div>
        <aside className="bag__summary">
          <div className="sum">
            <div><span>Hind</span><span>{formatEur(summary.listTotal)}</span></div>
            {summary.discount > 0 && (
              <div className="saving">
                <span>Nimepäeva soodustus −10%</span>
                <span>−{formatEur(summary.discount)}</span>
              </div>
            )}
            <div><span>Tarne</span><span className="muted">Vali järgmises sammus</span></div>
            <div className="total"><span>Kokku</span><span>{formatEur(summary.total)}</span></div>
          </div>
          <div className="screen__foot">
            {error && <p className="form-error" role="alert">{error}</p>}
            <button type="button" className="btn" disabled={paying} onClick={() => pay(lines)}>
              {paying ? "Maksan…" : `Maksa ${formatEur(summary.total)}`}
            </button>
          </div>
        </aside>
      </div>
    </ScreenFrame>
  );
}

/** The bar towards the next stop, with "70 / 100" beside it. */
function Meter({ points, goal }: { points: number; goal: number }) {
  return (
    <div className="gain__meter">
      <progress className="gain__bar" max={goal} value={Math.min(points, goal)} aria-label="Punktid järgmise peatuseni" />
      <span>{points} / {goal}</span>
    </div>
  );
}
