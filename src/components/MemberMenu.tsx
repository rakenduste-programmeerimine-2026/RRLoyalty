"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut } from "@/app/logi-sisse/actions";

/** "Mari ▾" in the header: a small menu with "Minu konto" and "Logi välja", which asks first. */
export function MemberMenu({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  // Close the menu on Escape or a click outside it.
  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!menu.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="member-menu" ref={menu}>
      <button type="button" className="member-menu__toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        Tere, {name}! ▾
      </button>
      {open && (
        <ul className="member-menu__list">
          <li><Link href="/konto" onClick={() => setOpen(false)}>Minu konto</Link></li>
          <li><Link href="/konto/gustavi-rada" onClick={() => setOpen(false)}>Gustavi rada</Link></li>
          <li><Link href="/postkast" onClick={() => setOpen(false)}>Postkast</Link></li>
          <li>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                dialog.current?.showModal();
              }}
            >
              Logi välja
            </button>
          </li>
        </ul>
      )}
      <dialog ref={dialog} className="confirm-dialog" aria-labelledby="logout-title">
        <h2 id="logout-title">Kas soovid välja logida?</h2>
        <p>Sinu punktid ja hüved jäävad alles.</p>
        <form action={signOut} className="confirm-dialog__actions">
          <button type="button" className="btn btn--ghost" onClick={() => dialog.current?.close()}>
            Tühista
          </button>
          <button type="submit" className="btn">Logi välja</button>
        </form>
      </dialog>
    </div>
  );
}
