import Link from "next/link";
import { Screen } from "./Screen";

/** Shown when the shop's data could not be loaded. */
export function ShopError({ title, backTo, retry }: { title: string; backTo?: string; retry: string }) {
  return (
    <Screen title={title} backTo={backTo} footer={<Link className="btn" href={retry}>Proovi uuesti</Link>}>
      <h1>Midagi läks valesti</h1>
      <p className="muted" role="alert">Andmeid ei õnnestunud laadida. Proovi hetke pärast uuesti.</p>
    </Screen>
  );
}

/** The loading state of a shop screen. */
export function ShopLoading({ title, backTo, text }: { title: string; backTo?: string; text: string }) {
  return (
    <Screen title={title} backTo={backTo}>
      <p className="muted" role="status">{text}</p>
    </Screen>
  );
}
