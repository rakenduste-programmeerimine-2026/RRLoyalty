"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { DrinkOrApp } from "@/lib/perks";
import { redeemPerkAction } from "./actions";

type PerkActionsProps = {
  perkId: number;
  stopAt: number | null;
  choice: string | null;
  /** A prize stop still within its 3 days. */
  choosing: boolean;
};

/**
 * The buttons on the open perk. Spending goes through the server (#14):
 * a perk can be spent once, and the page then reloads without it.
 */
export function PerkActions({ perkId, stopAt, choice, choosing }: PerkActionsProps) {
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

  if (choosing) {
    return <Link className="btn btn--auto" href="/konto/gustavi-rada/tasu">Vali tasu</Link>;
  }
  if (choice === "gift_card") {
    return <Link className="btn btn--auto" href="/konto/kinkekaardid">Näita kinkekaarti</Link>;
  }

  return (
    <>
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
        <button type="button" className="btn btn--auto" onClick={() => setConfirming(true)}>
          Märgi kasutatuks (demo)
        </button>
      )}
      {stopAt === 50 && !confirming && (
        <button type="button" className="textlink" disabled={saving} onClick={() => redeem("app_week")}>
          Vali hoopis nädal tasuta äpis
        </button>
      )}
    </>
  );
}
