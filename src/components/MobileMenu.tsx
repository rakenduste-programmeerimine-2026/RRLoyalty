"use client";

import Link from "next/link";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { Icon } from "./Icon";
import { LogoutButton } from "./LogoutButton";
import { SHOP_LINKS, shopPath } from "./shop-links";
import "./MobileMenu.css";

type MobileMenuProps = {
  /** "Tere, Mari!" under the title, streamed in by the header. */
  greeting: ReactNode;
  /** The account menu. */
  children: ReactNode;
};

/** The phone header's menu button and the drawer it opens. Hidden on wide screens. */
export function MobileMenu({ greeting, children }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  // Following any link in the drawer closes it.
  const closeOnLink = (event: MouseEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("a")) close();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="mobile-menu">
      <button
        type="button"
        className="mobile-menu__toggle"
        aria-label="Ava menüü"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Icon name="menu" size={24} />
      </button>
      {open && (
        <div className="mobile-menu__layer">
          <button type="button" className="mobile-menu__backdrop" aria-label="Sulge menüü" onClick={close} />
          <nav className="mobile-menu__drawer" aria-label="Minu konto" onClick={closeOnLink}>
            <div className="mobile-menu__head">
              <div>
                <b>Minu konto</b>
                <span>{greeting}</span>
              </div>
              <button type="button" className="mobile-menu__toggle" aria-label="Sulge menüü" onClick={close}>
                <Icon name="close" />
              </button>
            </div>
            {children}
            <div className="mobile-menu__shop">
              {SHOP_LINKS.map(({ slug, label }) => (
                <Link key={slug} href={shopPath(slug)}>{label}</Link>
              ))}
            </div>
            <LogoutButton />
          </nav>
        </div>
      )}
    </div>
  );
}
