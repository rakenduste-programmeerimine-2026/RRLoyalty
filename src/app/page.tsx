import { redirect } from "next/navigation";

// The site opens on Gustavi rada. Signed-out visitors are sent on to sign-in from there.
export default function HomePage() {
  redirect("/konto/gustavi-rada");
}
