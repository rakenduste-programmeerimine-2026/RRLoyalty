"use client";

import { useState, type FormEvent } from "react";

// The four kinds of email from the prototype. Saving is simulated (decided on
// #61): nothing is stored and no emails are sent (docs/program-rules.md).
const NEWSLETTERS = [
  { id: "offers", label: "Sünni- ja nimepäeva pakkumised", description: "Isiklikud soodustused sinu tähtpäevadel", on: true },
  { id: "trail", label: "Gustavi raja teated", description: "Kui jõuad uude peatusse või hüve hakkab aeguma", on: true },
  { id: "news", label: "Uued raamatud", description: "Iganädalane ülevaade uudisraamatutest", on: false },
  { id: "events", label: "Literaadi üritused", description: "Kohtumised autoritega ja raamatuklubid", on: false },
] as const;

type NewsletterId = (typeof NEWSLETTERS)[number]["id"];

export function NewsletterForm() {
  const [choices, setChoices] = useState<Record<NewsletterId, boolean>>(
    () => Object.fromEntries(NEWSLETTERS.map((item) => [item.id, item.on])) as Record<NewsletterId, boolean>,
  );
  const [saved, setSaved] = useState(false);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(true);
  }

  return (
    <form className="newsletters" onSubmit={save}>
      <fieldset>
        <legend className="muted">Vali, milliseid e-kirju soovid saada.</legend>
        {NEWSLETTERS.map((item) => (
          <label key={item.id} className="toggle-row">
            <span>
              <b>{item.label}</b>
              <small className="muted">{item.description}</small>
            </span>
            <input
              type="checkbox"
              role="switch"
              checked={choices[item.id]}
              onChange={(event) => {
                setChoices({ ...choices, [item.id]: event.target.checked });
                setSaved(false);
              }}
            />
          </label>
        ))}
      </fieldset>
      {saved && <p className="note" role="status">Eelistused salvestatud.</p>}
      <button type="submit" className="btn btn--auto">Salvesta eelistused</button>
    </form>
  );
}
