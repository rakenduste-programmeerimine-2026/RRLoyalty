import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { BookCover } from "@/components/BookCover";
import { Screen } from "@/components/Screen";
import { ShopError, ShopLoading } from "@/components/ShopError";
import { getMember } from "@/lib/auth";
import { formatEur } from "@/lib/money";
import { namesakeBooks, type Shop } from "@/lib/namesakes";
import { loadShopFromSupabase } from "@/lib/supabase-shop-store";

const TITLE = "Minu konto";
const BACK = "/konto/gustavi-rada";

export default function NamesakesPage() {
  return (
    <Suspense fallback={<ShopLoading title={TITLE} backTo={BACK} text="Laen nimekaimude raamatuid…" />}>
      <Namesakes />
    </Suspense>
  );
}

async function Namesakes() {
  // The offer depends on today's date, so this part renders at request time.
  await connection();
  const member = await getMember("/nimekaimud");

  let shop: Shop;
  try {
    shop = await loadShopFromSupabase(member.id);
  } catch (error) {
    console.error("Could not load the namesake books", error);
    return <ShopError title={TITLE} backTo={BACK} retry="/nimekaimud" />;
  }

  if (!shop.offer) {
    return (
      <Screen title={TITLE} backTo={BACK}>
        <h1>Sinu nimekaimud</h1>
        <p className="muted">
          Praegu sul nimepäeva pakkumist pole. Nimepäeva nädalal näed siin raamatuid, mille autor on sinu nimekaim,
          −10% hinnaga.
        </p>
      </Screen>
    );
  }

  const books = namesakeBooks(shop);

  return (
    <Screen title={TITLE} backTo={BACK}>
      <h1>Sinu nimekaimud</h1>
      <p className="tag">Nimepäeva −10% ainult täna</p>
      {books.length === 0 ? (
        <p className="muted">Praegu pole meil ühtegi raamatut, mille autori eesnimi on {shop.offer.firstName}.</p>
      ) : (
        <div className="book-grid">
          {books.map((book) => (
            <Link key={book.slug} className="book-card" href={`/raamat/${book.slug}`}>
              <BookCover book={book} size="grid" />
              <b>{book.title}</b>
              <span className="muted">{book.author}</span>
              <span className="price small">
                <s>{formatEur(book.price)}</s>
                <strong>{formatEur(book.discounted)}</strong>
              </span>
            </Link>
          ))}
        </div>
      )}
    </Screen>
  );
}
