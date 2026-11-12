"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";

/** `school` is settings.donation_school, or null while it loads or when it can't be read. */
export function PrizeForm({ stop, school }: { stop: number; school: string | null }) {
  const router = useRouter();

  function confirmChoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prize = new FormData(event.currentTarget).get("prize");
    router.push(`/konto/gustavi-rada/${prize}`);
  }

  return (
    <form className="prize" onSubmit={confirmChoice}>
      <div className="screen__body">
        <h1>Vali oma {stop} punkti tasu</h1>
        <fieldset>
          <legend className="muted small">Aega valida: 3 päeva</legend>
          <label className="choice">
            <input type="radio" name="prize" value="kinkekaart" defaultChecked />
            <span><b>5 € kinkekaart</b>Kehtib 60 päeva, ostul alates 20 €.</span>
          </label>
          <label className="choice">
            <input type="radio" name="prize" value="annetus" />
            <span>
              <b>Anneta 5 € kooliraamatukogule</b>
              {school
                ? `Rahva Raamat annab raamatud ${school} raamatukogule.`
                : "Rahva Raamat annab raamatud kooliraamatukogule."}
            </span>
          </label>
        </fieldset>
      </div>
      <div className="screen__foot">
        <button type="submit" className="btn">Kinnita valik</button>
      </div>
    </form>
  );
}
