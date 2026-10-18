"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { DeleteSummary } from "@/lib/admin/page-delete";
import { deletePageAction } from "../delete-action";
import { CONTROL, FOCUS } from "./ui";

/** Permanent delete for a page that should not exist any more (for example a client who backed out). */
export function DangerZone({ username, summary }: { username: string; summary: DeleteSummary }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const matches = typed.trim().toLowerCase() === username;

  const remove = () =>
    start(async () => {
      setError(null);
      try {
        const r = await deletePageAction(username, typed);
        if (r.ok) router.push(`/admin/clients?deleted=${encodeURIComponent(username)}`);
        else setError(r.message);
      } catch {
        setError("Could not reach the server. Try again.");
      }
    });

  return (
    <section className="adm-danger" aria-labelledby="danger-title">
      <h2 id="danger-title">Delete this page</h2>
      <p>
        For a client who backed out. This permanently removes <strong>/{username}</strong>, its {summary.cards} {summary.cards === 1 ? "card" : "cards"} and {summary.taps}{" "}
        {summary.taps === 1 ? "tap" : "taps"}
        {summary.clientRemoved ? (
          <>
            , and the client <strong>{summary.clientName}</strong>.
          </>
        ) : (
          <>. The client {summary.clientName} has other pages, so they stay.</>
        )}{" "}
        It cannot be undone, and a card already written to a chip will open the &ldquo;inactive&rdquo; page. To keep the history, switch the page to Inactive instead.
      </p>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className={`adm-btn adm-btn-danger-line ${FOCUS}`}>
          Delete this page…
        </button>
      ) : (
        <div className="adm-danger-confirm">
          <label className="text-sm font-medium">
            Type <span className="font-mono">{username}</span> to confirm
            <input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} aria-label="Type the username to confirm" className={`${CONTROL} ${FOCUS} mt-1 font-mono`} />
          </label>
          <div className="adm-actions">
            <button type="button" disabled={!matches || pending} onClick={remove} className={`adm-btn adm-btn-danger ${FOCUS}`}>
              {pending ? "Deleting…" : "Delete for good"}
            </button>
            <button type="button" disabled={pending} onClick={() => { setOpen(false); setTyped(""); setError(null); }} className={`adm-btn adm-btn-line ${FOCUS}`}>
              Cancel
            </button>
          </div>
          {error && (
            <p role="alert" className="text-sm font-medium text-red-700">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
