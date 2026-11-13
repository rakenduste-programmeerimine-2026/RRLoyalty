import Link from "next/link";
import { Suspense } from "react";
import { CartCount } from "./CartCount";
import { HeaderMember } from "./HeaderMember";

const siteLinks = ["Raamatud", "E-raamatud", "Äpp", "Literaat", "Kauplused"];

export function SiteHeader() {
  return (
    <header className="site-top">
      <div className="site-top__row">
        <Link className="wordmark" href="/">Rahva Raamat</Link>
        <div className="search">Otsi raamatut, autorit…</div>
        <nav className="site-nav" aria-label="Põhimenüü">
          {siteLinks.map((link) => (
            <a key={link} href="#">{link}</a>
          ))}
        </nav>
        <div className="site-user">
          {/* The member streams in; the rest of the header stays in the static shell. */}
          <Suspense fallback={<span>Minu konto</span>}>
            <HeaderMember />
          </Suspense>
          <small><CartCount /></small>
        </div>
      </div>
    </header>
  );
}
