"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { school } from "@/lib/sample-data";

export function PrizeForm() {
  const router = useRouter();

  function confirmChoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prize = new FormData(event.currentTarget).get("prize");
    router.push(`/konto/gustavi-rada/${prize}`);
  }

  return (
    <form className="prize" onSubmit={confirmChoice}>
      <div className="screen__body">
        <h1>Vali oma 100 punkti tasu</h1>
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
              Rahva Raamat annab raamatud {school} raamatukogule.
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
