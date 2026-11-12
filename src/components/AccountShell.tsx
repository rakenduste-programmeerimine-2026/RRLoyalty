import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";

/**
 * The account menu, in the prototype's order. A page that isn't built yet has
 * no href and shows as plain text until its issue lands (#56–#62).
 */
const ACCOUNT_PAGES: { label: string; href: string | null }[] = [
  { label: "Ülevaade", href: "/konto" },
  { label: "Minu andmed", href: null },
  { label: "Tellimused", href: null },
  { label: "Gustavi rada", href: "/konto/gustavi-rada" },
  { label: "Kinkekaardid", href: "/konto/kinkekaardid" },
  { label: "Annetused", href: "/konto/annetused" },
  { label: "Wallet-kaart", href: null },
  { label: "Uudiskirjad", href: null },
];

/** The site header, the "Minu konto" menu and the page content beside it. */
export function AccountShell({ current, children }: { current: string; children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <div className="account">
        <nav className="side" aria-label="Minu konto">
          <h2>Minu konto</h2>
          <ul>
            {ACCOUNT_PAGES.map(({ label, href }) => (
              <li key={label}>
                {href ? (
                  <Link href={href} aria-current={label === current ? "page" : undefined}>{label}</Link>
                ) : (
                  <span className="side__soon" title="Tuleb peagi">{label}</span>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <main className="main">{children}</main>
      </div>
    </>
  );
}
