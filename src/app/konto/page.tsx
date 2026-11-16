import { redirect } from "next/navigation";

// "Minu konto" has no overview in the prototype: it opens on Gustavi rada.
export default function AccountPage() {
  redirect("/konto/gustavi-rada");
}
