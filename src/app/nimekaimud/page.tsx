import Link from "next/link";
import { BookCover } from "@/components/BookCover";
import { NotWiredButton } from "@/components/NotWiredButton";
import { Screen } from "@/components/Screen";
import { formatEur, nameDayPrice } from "@/lib/money";
import { member, nameDayBooks, nameDayOfferUntil } from "@/lib/sample-data";

export default function Namesakes() {
  return (
    <Screen title="Minu konto" backTo="/konto/gustavi-rada">
      <h1>Sinu nimekaimud</h1>
      <p className="tag">Nimepäeva −10% kuni {nameDayOfferUntil}</p>
      <div className="book-grid">
        {nameDayBooks.map((book) => (
          <Link key={book.slug} className="book-card" href={`/raamat/${book.slug}`}>
            <BookCover book={book} size="grid" />
            <b>{book.title}</b>
            <span className="muted">{book.author}</span>
            <span className="price small">
              <s>{formatEur(book.price)}</s>
              <strong>{formatEur(nameDayPrice(book.price))}</strong>
            </span>
          </Link>
        ))}
      </div>
      <NotWiredButton className="card-link">
        Ei leidnud sobivat? Vaata raamatuid, kus tegelase nimi on {member.name} ›
      </NotWiredButton>
    </Screen>
  );
}
