import Link from "next/link";
import { Screen } from "./Screen";

type Variant = "plain" | "card" | "mail";

/** Shown when a screen's data could not be loaded. */
export function ShopError({ title, backTo, retry, variant = "card" }: { title: string; backTo?: string; retry: string; variant?: Variant }) {
  return (
    <Screen title={title} backTo={backTo} variant={variant} footer={<Link className="btn" href={retry}>Proovi uuesti</Link>}>
      <h1>Midagi läks valesti</h1>
      <p className="muted" role="alert">Andmeid ei õnnestunud laadida. Proovi hetke pärast uuesti.</p>
    </Screen>
  );
}

/** The loading state of a screen. */
export function ShopLoading({ title, backTo, text, variant = "plain" }: { title: string; backTo?: string; text: string; variant?: Variant }) {
  return (
    <Screen title={title} backTo={backTo} variant={variant}>
      <p className="muted" role="status">{text}</p>
    </Screen>
  );
}
