"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const INPUT = "rounded-lg border border-neutral-300 px-3 py-2 text-base font-normal";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Email
        <input name="email" type="email" autoComplete="username" required className={INPUT} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Password
        <input name="password" type="password" autoComplete="current-password" required className={INPUT} />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="rounded-lg bg-neutral-900 px-4 py-2.5 font-semibold text-white disabled:opacity-60">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
