import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AccountShell } from "@/components/AccountShell";
import { EmptyState, LoadError } from "@/components/EmptyState";
import { getMember } from "@/lib/auth";
import { formatEur } from "@/lib/money";
import { ordersView, type OrderRow } from "@/lib/orders";
import { formatDate } from "@/lib/rail-account";
import { loadOrders } from "@/lib/supabase-orders";
import "./orders.css";

export const metadata: Metadata = { title: "Tellimused · Minu konto" };

const PATH = "/konto/tellimused";

export default function OrdersPage() {
  return (
    <AccountShell current="Tellimused">
      <h1>Tellimused</h1>
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
    return <LoadError what="Tellimusi" retry={PATH} />;
  }

  const orders = ordersView(rows);

  if (orders.length === 0) {
    return (
      <EmptyState
        gustav
        title="Sul pole veel tellimusi"
        action={<Link className="btn btn--ghost btn--small" href="/konto/gustavi-rada">Vaata Gustavi rada</Link>}
      >
        Iga ost – e-poes, äpis, kauplustes või Literaadis – toob 1 punkti euro kohta Gustavi rajale.
      </EmptyState>
    );
  }

  return (
    <div className="orders">
      <table>
        <thead>
          <tr>
            <th scope="col">Tellimus</th>
            <th scope="col">Kuupäev</th>
            <th scope="col">Kus</th>
            <th scope="col">Summa</th>
            <th scope="col">Punktid</th>
            <th scope="col">Staatus</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <th scope="row">{order.orderNumber ?? "–"}</th>
              <td className="orders__date">{formatDate(order.purchasedAt)}</td>
              <td className="orders__where">{order.where}</td>
              <td className="orders__sum">{formatEur(order.amountPaid)}</td>
              <td className="orders__points">{order.points !== null ? `+${order.points} p` : "–"}</td>
              <td className="orders__state"><span className="orders__status">{order.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
