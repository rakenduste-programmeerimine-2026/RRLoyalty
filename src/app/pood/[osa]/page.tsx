import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Screen } from "@/components/Screen";
import { ShopLoading } from "@/components/ShopError";
import { SHOP_LINKS } from "@/components/shop-links";
import "./shop-section.css";

export const metadata: Metadata = { title: "Pood · Rahva Raamat" };

const BACK = "/konto/gustavi-rada";

type Params = Promise<{ osa: string }>;

export function generateStaticParams() {
  return SHOP_LINKS.map(({ slug }) => ({ osa: slug }));
}

/** A shop section from the header. The shop itself is outside the loyalty prototype, so this only says so. */
export default function ShopSectionPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ShopLoading title="Pood" backTo={BACK} text="Laen…" />}>
      <ShopSection params={params} />
    </Suspense>
  );
}

// The address is request data, so it is read inside the Suspense boundary.
async function ShopSection({ params }: { params: Params }) {
  const { osa } = await params;
  const label = SHOP_LINKS.find((link) => link.slug === osa)?.label;
  if (!label) notFound();

  return (
    <Screen title={label} backTo={BACK}>
      <h1>{label}</h1>
      <div className="shop-section">
        <b>{label}</b>
        <span>See osa jääb lojaalsusprogrammi prototüübist välja.</span>
      </div>
    </Screen>
  );
}
