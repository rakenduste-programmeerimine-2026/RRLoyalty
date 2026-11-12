"use client";

import { useActionState } from "react";
import { saveProfile, type ProfileFormState } from "./actions";

type ProfileFormProps = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthday: string;
};

export function ProfileForm(props: ProfileFormProps) {
  const [state, action, pending] = useActionState(saveProfile, { status: "idle" } as ProfileFormState);
  const errors = state.status === "invalid" ? state.errors : {};
  // After a refused or failed save, keep what the member typed.
  const typed = state.status === "invalid" || state.status === "failed" ? state.values : null;

  return (
    <form action={action} className="profile-form" noValidate>
      <label className="field">
        <span>Eesnimi</span>
        <input value={props.firstName} readOnly aria-describedby="first-name-note" />
        <small id="first-name-note" className="muted">Eesnimi määrab sinu nimepäeva, seda ei saa siin muuta.</small>
      </label>
      <Field name="lastName" label="Perekonnanimi" defaultValue={typed?.lastName ?? props.lastName} autoComplete="family-name" error={errors.lastName} />
      <label className="field">
        <span>E-post</span>
        <input type="email" value={props.email} readOnly />
      </label>
      <Field name="phone" label="Telefon" type="tel" defaultValue={typed?.phone ?? props.phone} autoComplete="tel" error={errors.phone} />
      <Field name="birthday" label="Sünnipäev" type="date" defaultValue={typed?.birthday ?? props.birthday} autoComplete="bday" error={errors.birthday} />

      {state.status === "saved" && <p className="note" role="status">Andmed salvestatud.</p>}
      {state.status === "failed" && (
        <p className="form-error" role="alert">Salvestamine ebaõnnestus. Proovi hetke pärast uuesti.</p>
      )}
      <button type="submit" className="btn btn--auto" disabled={pending}>
        {pending ? "Salvestan…" : "Salvesta"}
      </button>
    </form>
  );
}

type FieldProps = {
  name: string;
  label: string;
  defaultValue: string;
  type?: string;
  autoComplete?: string;
  error?: string;
};

function Field({ name, label, defaultValue, type = "text", autoComplete, error }: FieldProps) {
  const errorId = `${name}-error`;
  return (
    <label className="field">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {error && <small id={errorId} className="form-error">{error}</small>}
    </label>
  );
}
