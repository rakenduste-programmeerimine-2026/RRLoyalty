import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { AddToCartButton } from "@/components/AddToCartButton";
import { BookCover } from "@/components/BookCover";
import { Screen } from "@/components/Screen";
import { ShopError, ShopLoading } from "@/components/ShopError";
import { getMember } from "@/lib/auth";
import { formatEur } from "@/lib/money";
import type { Shop } from "@/lib/namesakes";
import { loadShopFromSupabase } from "@/lib/supabase-shop-store";

export const instant = false;

const TITLE = "Sinu nimekaimud";
const BACK = "/nimekaimud";

type Params = Promise<{ slug: string }>;

export default function BookPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ShopLoading title={TITLE} backTo={BACK} text="Laen raamatut…" />}>
      <BookDetails params={params} />
    </Suspense>
  );
}

async function BookDetails({ params }: { params: Params }) {
  // The price depends on today's date, so this part renders at request time.
  await connection();
  const { slug } = await params;
  const member = await getMember(`/raamat/${encodeURIComponent(slug)}`);

  let shop: Shop;
  try {
    shop = await loadShopFromSupabase(member.id);
  } catch (error) {
    console.error("Could not load the book", error);
    return <ShopError title={TITLE} backTo={BACK} retry={`/raamat/${encodeURIComponent(slug)}`} />;
  }

  const book = shop.books.find((candidate) => candidate.slug === slug);
  if (!book) notFound();
  const discounted = book.discounted < book.price;

  return (
    <Screen title={TITLE} backTo={BACK} footer={<AddToCartButton slug={book.slug} />}>
      <BookCover book={book} size="large" />
      <h1>{book.title}</h1>
      <p className="muted">{book.author}{book.format === "ebook" ? " · e-raamat" : ""}</p>
      {discounted ? (
        <>
          <p className="price">
            <s>{formatEur(book.price)}</s>
            <strong>{formatEur(book.discounted)}</strong>
            <span className="tag">Nimepäeva −10%</span>
          </p>
          <p className="muted small">Soodushind kehtib sisselogituna ja kassas klubikaardiga.</p>
        </>
      ) : (
        <p className="price"><strong>{formatEur(book.price)}</strong></p>
      )}
    </Screen>
  );
}
