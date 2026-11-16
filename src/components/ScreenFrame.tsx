import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./Icon";
import "./Screen.css";

export type ScreenVariant = "plain" | "card" | "mail";

export type ScreenProps = {
  /** The name in the phone's top bar. */
  title: string;
  backTo?: string;
  /**
   * "plain" fills the page width (shop screens), "card" is one centred box
   * (confirmations and choices), "mail" is a message on a tinted page without
   * the site header.
   */
  variant?: ScreenVariant;
  centered?: boolean;
  /** The screen's main buttons: a row under the content, pinned to the bottom on a phone. */
  footer?: ReactNode;
  children: ReactNode;
};

/**
 * The layout shared by the shop, message and reward screens. Server pages use
 * <Screen>, which adds the site header. A client component (the bag) uses this
 * frame and is handed the header by its page, since the header reads the session.
 */
export function ScreenFrame({
  header,
  title,
  backTo,
  variant = "plain",
  centered,
  footer,
  children,
}: ScreenProps & { header?: ReactNode }) {
  const back = variant === "mail" ? title : "Tagasi";
  return (
    <div className={`screen screen--${variant}${centered ? " screen--center" : ""}`}>
      {header}
      <header className="screen__bar">
        {backTo && (
          <Link href={backTo} aria-label="Tagasi">
            <Icon name="back" size={24} />
          </Link>
        )}
        <span>{title}</span>
      </header>
      <div className="screen__page">
        {backTo && (
          <Link className="screen__back" href={backTo}>
            <Icon name="back" size={18} />
            {back}
          </Link>
        )}
        <main className="screen__body">
          {children}
          {footer && <div className="screen__foot">{footer}</div>}
        </main>
      </div>
    </div>
  );
}
