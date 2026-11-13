import type { Metadata } from "next";
import { GustavScene } from "@/components/Gustav";
import { PostkastMessage, type MessageSearchParams } from "../PostkastMessage";

export const metadata: Metadata = { title: "Postkast · Gustavi rada" };

/** The stop in "Sul on 200 punkti – vali oma tasu". */
const stopIn = (title: string) => Number(title.match(/\d+/)?.[0] ?? 100);

export default function HundredPointsEmail({ searchParams }: { searchParams: MessageSearchParams }) {
  return (
    <PostkastMessage
      kind="points_100"
      path="/postkast/100-punkti"
      searchParams={searchParams}
      scene={(message) => (
        <GustavScene
          variant="milestone"
          stop={stopIn(message.title)}
          label={`Gustav jõudis ${stopIn(message.title)} punkti peatusse`}
        />
      )}
      note={<p className="note">Kui sa ei vali, saad kinkekaardi automaatselt 3 päeva jooksul.</p>}
      button="Vali tasu"
    />
  );
}
