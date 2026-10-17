"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { changeEditsAction } from "../(panel)/renewals/actions";

const BTN =
  "inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-neutral-300 bg-white px-2 text-sm font-medium hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900";

/** The small edits made for a client in the first year. `allowed` is null when the tier does not limit them. */
export function EditsCounter({ pageId, used, allowed }: { pageId: string; used: number; allowed: number | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const over = allowed !== null && used > allowed;

  const change = (action: "add" | "remove" | "reset") => {
    if (action === "reset" && !window.confirm("Start the edit count again from 0?")) return;
    setError(null);
    start(async () => {
      try {
        const r = await changeEditsAction(pageId, action);
        if (r.ok) router.refresh();
        else setError(r.message);
      } catch {
        setError("Could not reach the server.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <button type="button" className={BTN} disabled={pending || used === 0} onClick={() => change("remove")} aria-label="One edit fewer">
          −
        </button>
        <span className={`min-w-16 text-center text-sm font-medium tabular-nums ${over ? "text-red-800" : ""}`} aria-live="polite">
          {allowed === null ? used : `${used} of ${allowed}`}
        </span>
        <button type="button" className={BTN} disabled={pending} onClick={() => change("add")} aria-label="One edit more">
          +
        </button>
        <button type="button" className={`${BTN} text-xs`} disabled={pending || used === 0} onClick={() => change("reset")}>
          Reset
        </button>
      </div>
      {over && <p className="text-xs text-red-800">Over the included edits: extra edits are paid.</p>}
      {allowed === null && <p className="text-xs text-neutral-600">Not limited on this tier.</p>}
      {error && (
        <p role="alert" className="text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
