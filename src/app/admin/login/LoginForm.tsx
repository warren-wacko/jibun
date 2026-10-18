"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const INPUT = "min-h-12 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-base font-normal";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Email
        <input name="email" type="email" autoComplete="username" required className={INPUT} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Password
        <input name="password" type="password" autoComplete="current-password" required className={INPUT} />
      </label>
      {state.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="mt-1 min-h-12 rounded-full bg-neutral-900 px-5 py-2.5 text-base font-bold text-white disabled:opacity-60">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
