import type { Book } from "@/lib/book";
import "./BookCover.css";

export function BookCover({ book, size }: { book: Book; size: "grid" | "large" | "thumb" }) {
  return (
    <div className={`cover cover--${book.cover} cover--${size}`} aria-hidden="true">
      <span>{book.title}</span>
      <small>{book.author}</small>
    </div>
  );
}
