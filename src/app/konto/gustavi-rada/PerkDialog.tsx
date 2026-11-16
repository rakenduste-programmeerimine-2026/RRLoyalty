"use client";

import { useId, useRef, useState, useTransition } from "react";
import { Icon } from "@/components/Icon";
import type { DrinkOrApp } from "@/lib/perks";
import { redeemPerkAction } from "./actions";
import "./PerkDialog.css";

type PerkDialogProps = {
  perkId: number;
  stopAt: number | null;
  title: string;
  /** "dd.mm.yyyy" */
  validUntil: string;
  /** App perks and the birthday card are shown as a code (docs/program-rules.md). */
  code: string | null;
  /** "app_week" once the member swapped the hot drink for it. */
  choice: string | null;
};

/**
 * "Ava" on an open perk, and the sheet it opens. Spending goes through the
 * server (#14): a perk can be spent once, and the page then reloads without it.
 */
export function PerkDialog({ perkId, stopAt, title, validUntil, code, choice }: PerkDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<{ error?: string; code?: string }>();
  const [saving, startSaving] = useTransition();

  function redeem(option: DrinkOrApp | null) {
    setMessage(undefined);
    startSaving(async () => {
      const result = await redeemPerkAction(perkId, option);
      setConfirming(false);
      if (result?.error) setMessage({ error: result.error });
      else if (result?.code) setMessage({ code: result.code });
    });
  }

  const close = () => dialog.current?.close();
  const canSwap = stopAt === 50 && choice !== "app_week";

  return (
    <>
      <button type="button" className="pill-btn" onClick={() => dialog.current?.showModal()}>Ava</button>
      <dialog ref={dialog} className="sheet" aria-labelledby={titleId}>
        <div className="sheet__head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="sheet__close" aria-label="Sulge" onClick={close}>
            <Icon name="close" size={18} />
          </button>
        </div>
        {code && <p className="code">{code}</p>}
        <p className="muted small">
          {code ? "Sisesta kood äpis. " : "Näita seda kassas. "}Kehtib kuni {validUntil}.
        </p>
        {message?.error && <p className="form-error" role="alert">{message.error}</p>}
        {message?.code && (
          <p role="status">
            Nädal tasuta äpis on aktiveeritud. Kood: <b className="code">{message.code}</b>
          </p>
        )}
        {confirming ? (
          <div className="confirm" role="group" aria-label="Kinnita kasutamine">
            <span className="small">Märkida hüve kasutatuks?</span>
            <button type="button" className="textlink" disabled={saving} onClick={() => redeem(stopAt === 50 ? "hot_drink" : null)}>
              {saving ? "Salvestan…" : "Jah"}
            </button>
            <button type="button" className="textlink" disabled={saving} onClick={() => setConfirming(false)}>Tühista</button>
          </div>
        ) : (
          <button type="button" className="textlink" onClick={() => setConfirming(true)}>
            Märgi kasutatuks (demo)
          </button>
        )}
        {canSwap && !confirming && (
          <button type="button" className="textlink" disabled={saving} onClick={() => redeem("app_week")}>
            Vali hoopis nädal tasuta äpis
          </button>
        )}
        <button type="button" className="btn btn--ghost" onClick={close}>Valmis</button>
      </dialog>
    </>
  );
}
