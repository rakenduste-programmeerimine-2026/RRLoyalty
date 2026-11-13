import { connection } from "next/server";
import { Suspense } from "react";
import { ShopError, ShopLoading } from "@/components/ShopError";
import { getMember } from "@/lib/auth";
import { getNow } from "@/lib/demo-now";
import { formatDayEt, type Shop } from "@/lib/namesakes";
import { loadShopFromSupabase } from "@/lib/supabase-shop-store";
import { Bag } from "./Bag";

const TITLE = "Ostukorv";
const BACK = "/nimekaimud";

export default function BagPage() {
  return (
    <Suspense fallback={<ShopLoading title={TITLE} backTo={BACK} text="Laen ostukorvi…" />}>
      <PricedBag />
    </Suspense>
  );
}

async function PricedBag() {
  // Prices depend on today's date, so this part renders at request time.
  await connection();
  const member = await getMember("/ostukorv");

  let shop: Shop;
  try {
    shop = await loadShopFromSupabase(member.id, await getNow());
  } catch (error) {
    console.error("Could not load the bag's prices", error);
    return <ShopError title={TITLE} backTo={BACK} retry="/ostukorv" />;
  }

  // Only what the bag shows goes to the browser. The checkout prices the order again on the server.
  const catalog = shop.books.map(({ slug, title, author, price, discounted, cover }) => ({
    slug,
    title,
    author,
    price,
    discounted,
    cover,
  }));

  return (
    <Bag
      catalog={catalog}
      lapPoints={shop.lapPoints}
      firstName={shop.firstName}
      offerLastDay={shop.offer ? formatDayEt(shop.offer.lastDay) : null}
    />
  );
}
