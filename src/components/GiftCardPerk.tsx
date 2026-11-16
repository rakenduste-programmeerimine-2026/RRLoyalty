"use client";

import { useState, useTransition } from "react";
import { redeemPerkAction } from "@/app/konto/gustavi-rada/actions";
import { QrCode } from "./QrCode";

type GiftCardPerkProps = {
  /** The perk the card came from: "Märgi kasutatuks" spends it on the server (#14). */
  perkId: number;
  code: string;
  validUntil: string;
  qrSvg: string;
  used: boolean;
  expired: boolean;
};

export function GiftCardPerk({ perkId, code, validUntil, qrSvg, used, expired }: GiftCardPerkProps) {
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string>();
  const [saving, startSaving] = useTransition();

  function markUsed() {
    setError(undefined);
    startSaving(async () => {
      const result = await redeemPerkAction(perkId, null);
      // On success the page reloads from the server and shows the used card.
      if (result?.error) setError(result.error);
      setConfirming(false);
    });
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      // No clipboard access (an old browser or a blocked permission): the code is on screen to type.
    }
  }

  if (used || expired) {
    return (
      <>
        <h1>{used ? "Kinkekaart on kasutatud" : "Kinkekaart on aegunud"}</h1>
        <p className="code code--used">{code}</p>
        <p className="muted small">Seda kinkekaarti ei saa enam kasutada.</p>
      </>
    );
  }

  return (
    <>
      <h1>5 € kinkekaart on sinu!</h1>
      <QrCode svg={qrSvg} code={code} />
      <div className="gift-card-code">
        <span className="code">{code}</span>
        <button type="button" className="copy-btn" aria-label="Kopeeri kood" onClick={copyCode}>
          {copied ? "Kopeeritud" : "Kopeeri"}
        </button>
      </div>
      <p className="muted small">
        Kehtib kuni {validUntil} · ostul alates 20 € · kaupluses näita QR-koodi.
      </p>
      {error && <p className="form-error" role="alert">{error}</p>}
      {confirming ? (
        <div className="confirm" role="group" aria-label="Kinnita kasutamine">
          <span className="small">Märkida kinkekaart kasutatuks?</span>
          <button type="button" className="textlink" disabled={saving} onClick={markUsed}>
            {saving ? "Salvestan…" : "Jah"}
          </button>
          <button type="button" className="textlink" disabled={saving} onClick={() => setConfirming(false)}>Tühista</button>
        </div>
      ) : (
        <button type="button" className="textlink" onClick={() => setConfirming(true)}>
          Märgi kasutatuks (demo)
        </button>
      )}
    </>
  );
}
