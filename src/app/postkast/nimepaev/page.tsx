import type { Metadata } from "next";
import { PostkastMessage, type MessageSearchParams } from "../PostkastMessage";

export const metadata: Metadata = { title: "Postkast · Gustavi rada" };

export default function NameDayEmail({ searchParams }: { searchParams: MessageSearchParams }) {
  return (
    <PostkastMessage
      kind="name_day"
      path="/postkast/nimepaev"
      searchParams={searchParams}
      pose="playing"
      sceneLabel="Gustav mängib"
      note={<p className="note">Kehtib ainult nimepäeval e-poes ja kauplustes klubikaardiga.</p>}
      button="Vaata nimekaimude raamatuid"
    />
  );
}
