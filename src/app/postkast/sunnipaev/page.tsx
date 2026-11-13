import type { Metadata } from "next";
import { GustavScene } from "@/components/Gustav";
import { PostkastMessage, type MessageSearchParams } from "../PostkastMessage";

export const metadata: Metadata = { title: "Postkast · Gustavi rada" };

export default function BirthdayEmail({ searchParams }: { searchParams: MessageSearchParams }) {
  return (
    <PostkastMessage
      kind="birthday"
      path="/postkast/sunnipaev"
      searchParams={searchParams}
      scene={() => <GustavScene variant="nameday" label="Gustav tähistab sünnipäeva" />}
      note={<p className="note">Sünnipäevakaart kehtib 60 päeva.</p>}
      button="Vaata sünnipäevakaarti"
    />
  );
}
