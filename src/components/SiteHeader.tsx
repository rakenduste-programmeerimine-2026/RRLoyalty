import Link from "next/link";
import { member, siteLinks } from "@/lib/sample-data";
import { CartCount } from "./CartCount";

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
          {member.name} ▾<small><CartCount /></small>
        </div>
      </div>
    </header>
  );
}
