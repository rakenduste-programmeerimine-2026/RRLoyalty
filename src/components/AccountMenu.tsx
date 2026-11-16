import Link from "next/link";
import "./AccountMenu.css";

/** The "Minu konto" pages, in the prototype's order. */
export const ACCOUNT_PAGES = [
  { label: "Gustavi rada", href: "/konto/gustavi-rada" },
  { label: "Kinkekaardid", href: "/konto/kinkekaardid" },
  { label: "Wallet-kaart", href: "/konto/wallet-kaart" },
  { label: "Tellimused", href: "/konto/tellimused" },
  { label: "Annetused", href: "/konto/annetused" },
  { label: "Minu andmed", href: "/konto/andmed" },
  { label: "Uudiskirjad", href: "/konto/uudiskirjad" },
] as const;

/** The list of account pages, used beside the page and in the mobile menu. `current` is a page's label. */
export function AccountMenu({ current }: { current?: string }) {
  return (
    <ul className="account-menu">
      {ACCOUNT_PAGES.map(({ label, href }) => (
        <li key={href}>
          <Link href={href} aria-current={label === current ? "page" : undefined}>{label}</Link>
        </li>
      ))}
    </ul>
  );
}
