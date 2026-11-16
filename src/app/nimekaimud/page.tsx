import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { BookCover } from "@/components/BookCover";
import { Screen } from "@/components/Screen";
import { ShopError, ShopLoading } from "@/components/ShopError";
import { getMember } from "@/lib/auth";
import { getNow } from "@/lib/demo-now";
import { formatEur } from "@/lib/money";
import { namesakeBooks, type Shop } from "@/lib/namesakes";
import { loadShopFromSupabase } from "@/lib/supabase-shop-store";
import "./namesakes.css";

const TITLE = "Sinu nimekaimud";
const BACK = "/konto/gustavi-rada";
const PATH = "/nimekaimud";

/** The filter chips. `vorm` in the address picks one; anything else shows every book. */
const FORMATS = [
  { vorm: undefined, label: "Kõik" },
  { vorm: "raamat", label: "Raamatud", format: "book" },
  { vorm: "e-raamat", label: "E-raamatud", format: "ebook" },
] as const;

type SearchParams = Promise<{ vorm?: string | string[] }>;

export default function NamesakesPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<ShopLoading title={TITLE} backTo={BACK} text="Laen nimekaimude raamatuid…" />}>
      <Namesakes searchParams={searchParams} />
    </Suspense>
  );
}

async function Namesakes({ searchParams }: { searchParams: SearchParams }) {
  // The offer depends on today's date, so this part renders at request time.
  await connection();
  const member = await getMember(PATH);
  const { vorm } = await searchParams;

  let shop: Shop;
  try {
    shop = await loadShopFromSupabase(member.id, await getNow());
  } catch (error) {
    console.error("Could not load the namesake books", error);
    return <ShopError title={TITLE} backTo={BACK} retry={PATH} />;
  }

  if (!shop.offer) {
    return (
      <Screen title={TITLE} backTo={BACK}>
        <h1>Sinu nimekaimud</h1>
        <p className="muted">
          Praegu sul nimepäeva pakkumist pole. Nimepäeval näed siin raamatuid, mille autor on sinu nimekaim,
          −10% hinnaga.
        </p>
      </Screen>
    );
  }

  const chosen = FORMATS.find((item) => item.vorm === vorm) ?? FORMATS[0];
  const all = namesakeBooks(shop);
  const books = "format" in chosen ? all.filter((book) => book.format === chosen.format) : all;

  return (
    <Screen title={TITLE} backTo={BACK}>
      <h1>Sinu nimekaimud</h1>
      <div className="namesakes-bar">
        <p className="namesakes-offer">Nimepäeva −10% ainult täna</p>
        <nav className="chips" aria-label="Filter">
          {FORMATS.map((item) => (
            <Link
              key={item.label}
              href={item.vorm ? `${PATH}?vorm=${item.vorm}` : PATH}
              aria-current={item === chosen ? "true" : undefined}
              scroll={false}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      {all.length === 0 ? (
        <p className="muted">Praegu pole meil ühtegi raamatut, mille autori eesnimi on {shop.offer.firstName}.</p>
      ) : books.length === 0 ? (
        <p className="muted">Selles valikus raamatuid pole.</p>
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
