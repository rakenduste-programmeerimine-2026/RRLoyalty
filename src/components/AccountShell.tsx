import type { ReactNode } from "react";
import { AccountMenu } from "./AccountMenu";
import { LogoutButton } from "./LogoutButton";
import { SiteHeader } from "./SiteHeader";
import "./AccountShell.css";

type AccountShellProps = {
  /** The open page's label in the account menu. Leave it out for a page outside the menu. */
  current?: string;
  /** The page's name in the phone breadcrumb, when it is not in the menu. */
  title?: string;
  children: ReactNode;
};

/** The site header, the "Minu konto" menu and the page content beside it. */
export function AccountShell({ current, title = current, children }: AccountShellProps) {
  return (
    <>
      <SiteHeader current={current} />
      <div className="account">
        <nav className="side" aria-label="Minu konto">
          <h2>Minu konto</h2>
          <AccountMenu current={current} />
          <LogoutButton />
        </nav>
        <main className="main">
          {/* On a phone the menu is in the header's drawer, and this line says where you are. */}
          <p className="crumbs">
            <span>Minu konto</span>
            {title && <> <span aria-hidden="true">/</span> <b>{title}</b></>}
          </p>
          {children}
        </main>
      </div>
    </>
  );
}
