import type { Metadata } from "next";
import { PostkastMessage, type MessageSearchParams } from "../PostkastMessage";

export const metadata: Metadata = { title: "Postkast · Gustavi rada" };

export default function BirthdayEmail({ searchParams }: { searchParams: MessageSearchParams }) {
  return (
    <PostkastMessage
      kind="birthday"
      path="/postkast/sunnipaev"
      searchParams={searchParams}
      pose="playing"
      sceneLabel="Gustav mängib"
      note={<p className="note">Sünnipäevakaart kehtib 60 päeva.</p>}
      button="Vaata sünnipäevakaarti"
    />
  );
}
