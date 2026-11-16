import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { AddToCartButton } from "@/components/AddToCartButton";
import { BookCover } from "@/components/BookCover";
import { Screen } from "@/components/Screen";
import { ShopError, ShopLoading } from "@/components/ShopError";
import { getMember } from "@/lib/auth";
import { getNow } from "@/lib/demo-now";
import { formatEur } from "@/lib/money";
import type { Shop } from "@/lib/namesakes";
import { pointsForPurchase } from "@/lib/points";
import { loadShopFromSupabase } from "@/lib/supabase-shop-store";
import "./book.css";

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
    shop = await loadShopFromSupabase(member.id, await getNow());
  } catch (error) {
    console.error("Could not load the book", error);
    return <ShopError title={TITLE} backTo={BACK} retry={`/raamat/${encodeURIComponent(slug)}`} />;
  }

  const book = shop.books.find((candidate) => candidate.slug === slug);
  if (!book) notFound();
  const discounted = book.discounted < book.price;

  return (
    <Screen title={TITLE} backTo={BACK}>
      <div className="book">
        <div className="book__cover">
          <BookCover book={book} size="large" />
          {discounted && <span className="book__badge">−10%</span>}
        </div>
        <div className="book__details">
          <h1>{book.title}</h1>
          <p className="muted">{book.author}{book.format === "ebook" ? " · e-raamat" : ""}</p>
          {discounted ? (
            <>
              <p className="price book__price">
                <s>{formatEur(book.price)}</s>
                <strong>{formatEur(book.discounted)}</strong>
                <span className="tag">Nimepäev −10%</span>
              </p>
              <p className="muted small">Soodushind kehtib sisselogituna ja kassas klubikaardiga.</p>
            </>
          ) : (
            <p className="price book__price"><strong>{formatEur(book.price)}</strong></p>
          )}
          <p className="note">
            <b>+{pointsForPurchase(book.discounted)} punkti</b> Gustavi rajale
          </p>
          <div className="screen__foot">
            <AddToCartButton slug={book.slug} price={formatEur(book.discounted)} />
          </div>
        </div>
      </div>
    </Screen>
  );
}
