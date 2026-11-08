"use client";

import { useState, useSyncExternalStore } from "react";

// Until perk redemption is stored on the server (#14), "used" is remembered in this browser only.
const keyFor = (code: string) => `gustavi-rada:kasutatud:${code}`;

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readUsed(code: string): boolean {
  try {
    return window.localStorage.getItem(keyFor(code)) !== null;
  } catch {
    return false;
  }
}

function writeUsed(code: string, used: boolean) {
  try {
    if (used) window.localStorage.setItem(keyFor(code), new Date().toISOString());
    else window.localStorage.removeItem(keyFor(code));
  } catch {
    // Storage can be blocked; nothing to remember then.
  }
  listeners.forEach((listener) => listener());
}

type GiftCardPerkProps = { code: string; validUntil: string; qrSvg: string };

export function GiftCardPerk({ code, validUntil, qrSvg }: GiftCardPerkProps) {
  const used = useSyncExternalStore<boolean | undefined>(subscribe, () => readUsed(code), () => undefined);
  const [confirming, setConfirming] = useState(false);

  if (used === undefined) {
    return <p className="muted" role="status">Laen kinkekaarti…</p>;
  }

  if (used) {
    return (
      <>
        <h1>Kinkekaart on kasutatud</h1>
        <p className="code code--used">{code}</p>
        <p className="muted small">Seda kinkekaarti ei saa enam kasutada.</p>
        <button type="button" className="textlink" onClick={() => writeUsed(code, false)}>
          Taasta kasutamata (demo)
        </button>
      </>
    );
  }

  return (
    <>
      <h1>5 € kinkekaart on sinu!</h1>
      <div className="qr" role="img" aria-label={`QR-kood: ${code}`} dangerouslySetInnerHTML={{ __html: qrSvg }} />
      <p className="code">{code}</p>
      <p className="muted small">kehtib kuni {validUntil} · ostul alates 20 €</p>
      {confirming ? (
        <div className="confirm" role="group" aria-label="Kinnita kasutamine">
          <span className="small">Märkida kinkekaart kasutatuks?</span>
          <button type="button" className="textlink" onClick={() => writeUsed(code, true)}>Jah</button>
          <button type="button" className="textlink" onClick={() => setConfirming(false)}>Tühista</button>
        </div>
      ) : (
        <button type="button" className="textlink" onClick={() => setConfirming(true)}>
          Märgi kasutatuks (demo)
        </button>
      )}
    </>
  );
}
