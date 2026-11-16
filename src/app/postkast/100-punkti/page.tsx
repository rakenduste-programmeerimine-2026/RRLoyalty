import type { Metadata } from "next";
import { PostkastMessage, type MessageSearchParams } from "../PostkastMessage";

export const metadata: Metadata = { title: "Postkast · Gustavi rada" };

export default function HundredPointsEmail({ searchParams }: { searchParams: MessageSearchParams }) {
  return (
    <PostkastMessage
      kind="points_100"
      path="/postkast/100-punkti"
      searchParams={searchParams}
      pose="reaching"
      sceneLabel="Gustav sirutab käpa tasu poole"
      note={<p className="note">Kui sa ei vali, saad kinkekaardi automaatselt 3 päeva jooksul.</p>}
      button="Vali tasu"
    />
  );
}
