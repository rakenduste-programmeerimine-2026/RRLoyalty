import type { Metadata } from "next";
import { GustavScene } from "@/components/Gustav";
import { PostkastMessage, type MessageSearchParams } from "../PostkastMessage";

export const metadata: Metadata = { title: "Postkast · Gustavi rada" };

export default function NameDayEmail({ searchParams }: { searchParams: MessageSearchParams }) {
  return (
    <PostkastMessage
      kind="name_day"
      path="/postkast/nimepaev"
      searchParams={searchParams}
      scene={() => <GustavScene variant="nameday" label="Gustav tähistab nimepäeva" />}
      note={<p className="note">Kehtib ainult nimepäeval e-poes ja kauplustes klubikaardiga.</p>}
      button="Vaata nimekaimude raamatuid"
    />
  );
}
