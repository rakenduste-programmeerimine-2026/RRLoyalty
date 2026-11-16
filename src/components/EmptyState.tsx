import Link from "next/link";
import type { ReactNode } from "react";
import { Gustav } from "./Gustav";
import "./EmptyState.css";

type EmptyStateProps = {
  title: string;
  children: ReactNode;
  /** A link or button under the text. */
  action?: ReactNode;
  /** Gustav peeks in from the left edge. Leave him out for errors. */
  gustav?: boolean;
  /** Set for a loading failure, so screen readers announce it. */
  alert?: boolean;
};

/** The box an account page shows when its list is empty or could not be loaded. */
export function EmptyState({ title, children, action, gustav = false, alert = false }: EmptyStateProps) {
  return (
    <section className={gustav ? "empty-state empty-state--gustav" : "empty-state"} role={alert ? "alert" : undefined}>
      {gustav && <Gustav pose="peeking" className="empty-state__gustav" />}
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </section>
  );
}

/** The usual failure box: "Midagi läks valesti" with a retry link. */
export function LoadError({ what, retry }: { what: string; retry: string }) {
  return (
    <EmptyState
      alert
      title="Midagi läks valesti"
      action={<Link className="btn btn--ghost btn--small" href={retry}>Proovi uuesti</Link>}
    >
      {what} ei õnnestunud laadida. Proovi hetke pärast uuesti.
    </EmptyState>
  );
}
