import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { AccountMenu } from "./AccountMenu";
import { CartCount } from "./CartCount";
import { HeaderBell, HeaderGreeting, HeaderMember, HeaderUnreadBell } from "./HeaderMember";
import { Icon } from "./Icon";
import { MobileMenu } from "./MobileMenu";
import { SHOP_LINKS, shopPath } from "./shop-links";
import "./SiteHeader.css";

/** Where the logo leads: the member's rail, as in the prototype. */
const HOME = "/konto/gustavi-rada";

/** `current` is the open account page, marked in the mobile menu. */
export function SiteHeader({ current }: { current?: string }) {
  return (
    <header className="site-top">
      <div className="site-top__row">
        <MobileMenu
          greeting={
            <Suspense fallback={null}>
              <HeaderGreeting />
            </Suspense>
          }
        >
          <AccountMenu current={current} />
        </MobileMenu>
        <Link className="site-top__logo" href={HOME} aria-label="Rahva Raamat – avaleht">
          <Image src="/assets/rr-logo.png" width={800} height={250} alt="Rahva Raamat" priority />
        </Link>
        <div className="search" role="search">
          <Icon name="search" size={18} />
          <label className="visually-hidden" htmlFor="site-search">Otsi</label>
          <input id="site-search" type="search" placeholder="Otsi raamatuid, autoreid…" />
        </div>
        <nav className="site-nav" aria-label="Pood">
          {SHOP_LINKS.map(({ slug, label }) => (
            <Link key={slug} href={shopPath(slug)}>{label}</Link>
          ))}
        </nav>
        <div className="site-user">
          {/* The member's parts stream in; the rest of the header stays in the static shell. */}
          <Suspense fallback={<HeaderBell />}>
            <HeaderUnreadBell />
          </Suspense>
          <Suspense fallback={null}>
            <HeaderMember />
          </Suspense>
          <CartCount />
        </div>
      </div>
    </header>
  );
}
