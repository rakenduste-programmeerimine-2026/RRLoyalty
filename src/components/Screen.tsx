import Link from "next/link";
import type { ReactNode } from "react";

type ScreenProps = {
  title: string;
  backTo?: string;
  centered?: boolean;
  footer?: ReactNode;
  children: ReactNode;
};

/** The single-column layout shared by the e-mail, shop and reward screens. */
export function Screen({ title, backTo, centered, footer, children }: ScreenProps) {
  return (
    <div className={centered ? "screen screen--center" : "screen"}>
      <header className="screen__bar">
        {backTo ? <Link href={backTo}>‹ {title}</Link> : title}
      </header>
      <main className="screen__body">{children}</main>
      {footer && <footer className="screen__foot">{footer}</footer>}
    </div>
  );
}
