"use client";

import { useId, useRef } from "react";
import { signOut } from "@/app/logi-sisse/actions";
import "./LogoutButton.css";

/** "Logi välja" under the account menu. It asks first, as in the prototype. */
export function LogoutButton() {
  const dialog = useRef<HTMLDialogElement>(null);
  // The button is on the page twice on a phone (menu and drawer), so the id must differ.
  const titleId = useId();

  return (
    <>
      <button type="button" className="logout" onClick={() => dialog.current?.showModal()}>
        Logi välja
      </button>
      <dialog ref={dialog} className="confirm-dialog" aria-labelledby={titleId}>
        <h2 id={titleId}>Kas soovid välja logida?</h2>
        <p>Sinu punktid ja hüved jäävad alles.</p>
        <form action={signOut} className="confirm-dialog__actions">
          <button type="button" className="btn btn--ghost" onClick={() => dialog.current?.close()}>
            Tühista
          </button>
          <button type="submit" className="btn">Logi välja</button>
        </form>
      </dialog>
    </>
  );
}
