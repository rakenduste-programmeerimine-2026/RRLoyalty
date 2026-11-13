"use client";

import { useActionState, useState } from "react";
import {
  addDemoPurchase,
  resetDemo,
  skipDemoClock,
  triggerBirthday,
  triggerNameDay,
  type DemoState,
  type PurchaseState,
} from "./actions";

const IDLE: DemoState = { status: "idle" };

const CHANNELS = [
  { value: "store", label: "Kauplus" },
  { value: "e_shop", label: "E-pood" },
  { value: "literaat", label: "Literaat" },
  { value: "app", label: "Äpp" },
] as const;

export function DemoControls({ purchaseRef, demoDateSet }: { purchaseRef: string; demoDateSet: boolean }) {
  const [purchase, purchaseAction, buying] = useActionState(addDemoPurchase, { status: "idle", nextRef: purchaseRef } as PurchaseState);
  const [skip, skipAction, skipping] = useActionState(skipDemoClock, IDLE);
  const [nameDay, nameDayAction, namingDay] = useActionState(triggerNameDay, IDLE);
  const [birthday, birthdayAction, birthdaying] = useActionState(triggerBirthday, IDLE);
  const [reset, resetAction, resetting] = useActionState(resetDemo, IDLE);
  const [channel, setChannel] = useState<string>("store");

  return (
    <div className="demo-controls">
      <section className="perk">
        <h2>Lisa ost</h2>
        <form action={purchaseAction} className="profile-form">
          <input type="hidden" name="ref" value={purchase.nextRef} />
          <label className="field">
            <span>Müügikanal</span>
            <select name="channel" value={channel} onChange={(event) => setChannel(event.target.value)}>
              {CHANNELS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          {channel === "store" && (
            <label className="field">
              <span>Kauplus</span>
              <input name="location" defaultValue="Viru Keskus" maxLength={60} />
            </label>
          )}
          <label className="field">
            <span>Makstud summa (€, pärast soodustusi)</span>
            <input name="amount" inputMode="decimal" defaultValue="18" required />
          </label>
          <Result state={purchase} />
          <button type="submit" className="btn btn--auto" disabled={buying}>
            {buying ? "Lisan…" : "Lisa ost"}
          </button>
        </form>
      </section>

      <section className="perk">
        <h2>Nimepäev ja sünnipäev</h2>
        <p>Viib demo kuupäeva sinu järgmisele nimepäevale või sünnipäevale. Sünnipäeval antakse 5 € sünnipäevakaart.</p>
        <div className="perk__actions">
          <form action={nameDayAction}>
            <button type="submit" className="btn btn--auto" disabled={namingDay}>
              {namingDay ? "Käivitan…" : "Käivita nimepäev"}
            </button>
          </form>
          <form action={birthdayAction}>
            <button type="submit" className="btn btn--auto" disabled={birthdaying}>
              {birthdaying ? "Käivitan…" : "Käivita sünnipäev"}
            </button>
          </form>
        </div>
        <Result state={nameDay} />
        <Result state={birthday} />
      </section>

      <section className="perk">
        <h2>Keri aega edasi</h2>
        <p>Auhinna valikuks on 3 päeva. Punktid aeguvad 6 kuud pärast viimast ostu.</p>
        <form action={skipAction} className="perk__actions">
          <button type="submit" name="skip" value="3d" className="btn btn--auto" disabled={skipping}>
            +3 päeva
          </button>
          <button type="submit" name="skip" value="6m" className="btn btn--auto" disabled={skipping}>
            +6 kuud
          </button>
        </form>
        <Result state={skip} />
        {demoDateSet && (
          <form action={resetAction} className="perk__actions">
            <button type="submit" className="btn btn--ghost btn--auto" disabled={resetting}>
              Tagasi tänasesse
            </button>
          </form>
        )}
        <Result state={reset} />
      </section>
    </div>
  );
}

function Result({ state }: { state: DemoState }) {
  if (state.status === "done") return <p className="note" role="status">{state.message}</p>;
  if (state.status === "error") return <p className="form-error" role="alert">{state.message}</p>;
  return null;
}
