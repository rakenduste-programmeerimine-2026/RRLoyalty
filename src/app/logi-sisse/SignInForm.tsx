"use client";

import { useActionState } from "react";
import { signIn } from "./actions";

export function SignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signIn, undefined);

  return (
    <form action={action} className="sign-in__form" noValidate>
      <input type="hidden" name="next" value={next} />
      <label className="field">
        <span>E-posti aadress</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          defaultValue={state?.email}
          aria-invalid={state?.error ? true : undefined}
        />
      </label>
      <label className="field">
        <span>Parool</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          aria-invalid={state?.error ? true : undefined}
        />
      </label>
      {state?.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" className="btn" disabled={pending}>
        {pending ? "Login sisse…" : "Logi sisse"}
      </button>
    </form>
  );
}
