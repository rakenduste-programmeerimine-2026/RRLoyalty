"use client";

import { useActionState } from "react";
import { choosePrizeAction, type PerkActionState } from "../actions";

type PrizeFormProps = {
  perkId: number;
  /** The stop reached: 100, 200, 300 or 400. */
  stop: number;
  /** "dd.mm.yyyy hh:mm", the last moment to choose. */
  chooseBy: string;
  /** settings.donation_school, or null when it can't be read. */
  school: string | null;
};

export function PrizeForm({ perkId, stop, chooseBy, school }: PrizeFormProps) {
  const [state, action, pending] = useActionState<PerkActionState, FormData>(
    choosePrizeAction.bind(null, perkId),
    undefined,
  );

  return (
    <form className="prize" action={action}>
      <div className="screen__body">
        <h1>Vali oma {stop} punkti tasu</h1>
        <fieldset disabled={pending}>
          <legend className="muted small">Aega valida kuni {chooseBy}</legend>
          <label className="choice">
            <input type="radio" name="prize" value="gift_card" defaultChecked />
            <span><b>5 € kinkekaart</b>Kehtib 60 päeva valikust, ostul alates 20 €.</span>
          </label>
          <label className="choice">
            <input type="radio" name="prize" value="donation" />
            <span>
              <b>Anneta 5 € kooliraamatukogule</b>
              {school
                ? `Rahva Raamat annab raamatud ${school} raamatukogule.`
                : "Rahva Raamat annab raamatud kooliraamatukogule."}
            </span>
          </label>
        </fieldset>
        <p className="muted small">Kui sa 3 päeva jooksul ei vali, saad kinkekaardi automaatselt.</p>
      </div>
      <div className="screen__foot">
        {state?.error && <p className="form-error" role="alert">{state.error}</p>}
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Salvestan…" : "Kinnita valik"}
        </button>
      </div>
    </form>
  );
}
