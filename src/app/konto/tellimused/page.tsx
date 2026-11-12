import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AccountShell } from "@/components/AccountShell";
import { getMember } from "@/lib/auth";
import { formatEur } from "@/lib/money";
import { ordersView, type OrderRow } from "@/lib/orders";
import { formatDate } from "@/lib/rail-account";
import { loadOrders } from "@/lib/supabase-orders";

export const metadata: Metadata = { title: "Tellimused · Minu konto" };

const PATH = "/konto/tellimused";

export default function OrdersPage() {
  return (
    <AccountShell current="Tellimused">
      <div>
        <h1>Tellimused</h1>
        <p className="lede">Kõik sinu ostud – e-poes, äpis, kauplustes ja Literaadis – ning nende punktid.</p>
      </div>
      <Suspense fallback={<p className="muted" role="status">Laen tellimusi…</p>}>
        <Orders />
      </Suspense>
    </AccountShell>
  );
}

async function Orders() {
  await connection();
  await getMember(PATH);

  let rows: OrderRow[];
  try {
    rows = await loadOrders();
  } catch (error) {
    console.error("Could not load the orders page", error);
    return (
      <section className="perk" role="alert">
        <h2>Midagi läks valesti</h2>
        <p>Tellimusi ei õnnestunud laadida. Proovi hetke pärast uuesti.</p>
        <div className="perk__actions">
          <Link className="btn btn--auto" href={PATH}>Proovi uuesti</Link>
        </div>
      </section>
    );
  }

  const orders = ordersView(rows);

  if (orders.length === 0) {
    return (
      <section className="perk">
        <h2>Sul pole veel tellimusi</h2>
        <p>Iga ost – e-poes, äpis, kauplustes või Literaadis – toob 1 punkti euro kohta Gustavi rajale.</p>
        <div className="perk__actions">
          <Link className="btn btn--auto" href="/konto/gustavi-rada">Vaata Gustavi rada</Link>
        </div>
      </section>
    );
  }

  return (
    <ul className="order-list">
      {orders.map((order) => (
        <li key={order.id}>
          <div>
            <b>{order.where}</b>
            <span className="muted small">
              {formatDate(order.purchasedAt)}
              {order.orderNumber ? ` · ${order.orderNumber}` : ""} · {order.status}
            </span>
          </div>
          <div className="order-list__sum">
            <b>{formatEur(order.amountPaid)}</b>
            {order.points !== null && <span className="order-list__points">+{order.points} p</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}
