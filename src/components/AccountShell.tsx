import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { UnreadBadge } from "./UnreadBadge";

/**
 * The account menu, in the prototype's order. A page that isn't built yet has
 * no href and shows as plain text until its issue lands (#56–#62).
 */
const ACCOUNT_PAGES: { label: string; href: string | null }[] = [
  { label: "Ülevaade", href: "/konto" },
  { label: "Minu andmed", href: "/konto/andmed" },
  { label: "Tellimused", href: "/konto/tellimused" },
  { label: "Gustavi rada", href: "/konto/gustavi-rada" },
  { label: "Postkast", href: "/postkast" },
  { label: "Kinkekaardid", href: "/konto/kinkekaardid" },
  { label: "Annetused", href: "/konto/annetused" },
  { label: "Wallet-kaart", href: "/konto/wallet-kaart" },
  { label: "Uudiskirjad", href: "/konto/uudiskirjad" },
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
                  <Link href={href} aria-current={label === current ? "page" : undefined}>
                    {label}
                    {href === "/postkast" && (
                      <Suspense fallback={null}>
                        <UnreadBadge />
                      </Suspense>
                    )}
                  </Link>
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
