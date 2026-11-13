import { redirect } from "next/navigation";

// The sample gift card screen. Real gift cards live at /konto/kinkekaardid/[id] (#18).
export default function GiftCard() {
  redirect("/konto/kinkekaardid");
}
