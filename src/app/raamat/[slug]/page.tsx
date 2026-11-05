import Link from "next/link";
import { notFound } from "next/navigation";
import { BookCover } from "@/components/BookCover";
import { Screen } from "@/components/Screen";
import { formatEur, nameDayPrice } from "@/lib/money";
import { nameDayBooks } from "@/lib/sample-data";

export const instant = false;

export function generateStaticParams() {
  return nameDayBooks.map((book) => ({ slug: book.slug }));
}

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const book = nameDayBooks.find((candidate) => candidate.slug === slug);
  if (!book) notFound();

  return (
    <Screen
      title="Sinu nimekaimud"
      backTo="/nimekaimud"
      footer={<Link className="btn" href="/ostukorv">Lisa ostukorvi</Link>}
    >
      <BookCover book={book} size="large" />
      <h1>{book.title}</h1>
      <p className="muted">{book.author}</p>
      <p className="price">
        <s>{formatEur(book.price)}</s>
        <strong>{formatEur(nameDayPrice(book.price))}</strong>
        <span className="tag">Nimepäeva −10%</span>
      </p>
      <p className="muted small">Soodushind kehtib sisselogituna ja kassas klubikaardiga.</p>
    </Screen>
  );
}
