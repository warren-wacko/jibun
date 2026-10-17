"use client";

import { useRef, useState } from "react";
import { isBlankSocial, resolveSocialUrl, type SocialRow } from "@/lib/admin/page-form";
import type { SocialType } from "@/lib/page-schema";
import { MESSAGING_TYPES, PROFILE_TYPES, SOCIAL_LABELS } from "@/lib/socials";
import { CONTROL, FOCUS, useEditor } from "./ui";

const HANDLE_HINT: Record<SocialType, string> = {
  linkedin: "username from linkedin.com/in/…",
  facebook: "page or profile name",
  instagram: "@username",
  tiktok: "@username",
  youtube: "@channel",
  github: "username",
  behance: "username",
  x: "@username",
  spotify: "name shown on the card",
  pinterest: "username",
  website: "shown text, e.g. maria.dev (optional)",
  messenger: "username from m.me/…",
  whatsapp: "+63 917 123 4567",
  viber: "+63 917 123 4567",
  telegram: "@username",
  discord: "username",
};

const NEEDS_LINK: ReadonlySet<SocialType> = new Set(["spotify", "website", "discord"]);

const ICON_BTN =
  "inline-flex size-9 items-center justify-center rounded-lg border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40";

/** Add, edit, reorder and remove the page's social links. The link is built from the handle unless one is typed. */
export function SocialsEditor() {
  const { values, set, errorFor, touch } = useEditor();
  const rows = values.socials;
  const nextId = useRef(rows.length + 1000);
  const [adding, setAdding] = useState<SocialType>("instagram");

  const update = (id: string, patch: Partial<SocialRow>) =>
    set("socials", rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const move = (index: number, by: -1 | 1) => {
    const next = [...rows];
    const [item] = next.splice(index, 1);
    next.splice(index + by, 0, item);
    set("socials", next);
  };
  const add = () => {
    const id = `n${nextId.current++}`;
    set("socials", [...rows, { id, type: adding, handle: "", url: "", note: "" }]);
    // The new row gets the cursor in its handle field once it is on screen.
    requestAnimationFrame(() => document.querySelector<HTMLInputElement>(`[data-handle-id="${id}"]`)?.focus());
  };

  const listError = errorFor("socials");

  return (
    <div data-field="socials" className="flex flex-col gap-3">
      {rows.length === 0 && (
        <p className="rounded-lg border border-dashed border-neutral-300 p-4 text-center text-sm text-neutral-600">
          No links yet. Add the client&rsquo;s social profiles and messaging apps below.
        </p>
      )}

      <ol className="flex flex-col gap-3">
        {rows.map((row, i) => {
          const url = resolveSocialUrl(row);
          const blank = isBlankSocial(row);
          const urlError = errorFor(`socials.${i}.url`);
          const handleError = errorFor(`socials.${i}.handle`);
          const noteError = errorFor(`socials.${i}.note`);
          const needsLink = NEEDS_LINK.has(row.type);
          return (
            <li key={row.id} data-field={`socials.${i}`} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <div className="flex items-center gap-2">
                <span className="w-5 text-center text-xs font-medium text-neutral-500" aria-hidden="true">
                  {i + 1}
                </span>
                <select
                  aria-label={`Link ${i + 1} network`}
                  value={row.type}
                  onChange={(e) => update(row.id, { type: e.target.value as SocialType })}
                  className={`${CONTROL} ${FOCUS} max-w-44 font-medium`}
                >
                  <optgroup label="Profiles">
                    {PROFILE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {SOCIAL_LABELS[t]}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Messaging">
                    {MESSAGING_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {SOCIAL_LABELS[t]}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <div className="ml-auto flex gap-1">
                  <button type="button" className={`${ICON_BTN} ${FOCUS}`} disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move link ${i + 1} up`}>
                    ↑
                  </button>
                  <button type="button" className={`${ICON_BTN} ${FOCUS}`} disabled={i === rows.length - 1} onClick={() => move(i, 1)} aria-label={`Move link ${i + 1} down`}>
                    ↓
                  </button>
                  <button
                    type="button"
                    className={`${ICON_BTN} ${FOCUS} text-red-700`}
                    onClick={() => set("socials", rows.filter((r) => r.id !== row.id))}
                    aria-label={`Remove link ${i + 1}`}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs font-medium text-neutral-700">
                  Handle
                  <input
                    data-handle-id={row.id}
                    value={row.handle}
                    placeholder={HANDLE_HINT[row.type]}
                    maxLength={100}
                    aria-invalid={Boolean(handleError)}
                    onBlur={() => touch(`socials.${i}.handle`)}
                    onChange={(e) => update(row.id, { handle: e.target.value })}
                    className={`${CONTROL} ${FOCUS} font-normal`}
                  />
                  {handleError && <span className="font-medium text-red-700">{handleError}</span>}
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-neutral-700">
                  Link {needsLink ? "" : "(optional)"}
                  <input
                    value={row.url}
                    placeholder={needsLink ? "https://…" : "Built from the handle"}
                    inputMode="url"
                    aria-invalid={Boolean(urlError)}
                    onBlur={() => touch(`socials.${i}.url`)}
                    onChange={(e) => update(row.id, { url: e.target.value })}
                    className={`${CONTROL} ${FOCUS} font-normal`}
                  />
                  {urlError && <span className="font-medium text-red-700">{urlError}</span>}
                </label>
              </div>

              <label className="mt-2 flex flex-col gap-1 text-xs font-medium text-neutral-700">
                Tile note (optional)
                <input
                  value={row.note}
                  placeholder="e.g. say hi!, mostly anime edits"
                  maxLength={40}
                  aria-invalid={Boolean(noteError)}
                  onBlur={() => touch(`socials.${i}.note`)}
                  onChange={(e) => update(row.id, { note: e.target.value })}
                  className={`${CONTROL} ${FOCUS} font-normal`}
                />
                {noteError && <span className="font-medium text-red-700">{noteError}</span>}
              </label>

              <p className="mt-2 truncate text-xs text-neutral-600" aria-live="polite">
                {blank ? (
                  "Empty rows are left out."
                ) : url ? (
                  <>
                    Goes to <span className="font-mono">{url}</span>
                  </>
                ) : (
                  <span className="text-amber-800">Needs a link: paste the full URL above.</span>
                )}
              </p>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="add-social-type">
          Network to add
        </label>
        <select id="add-social-type" value={adding} onChange={(e) => setAdding(e.target.value as SocialType)} className={`${CONTROL} ${FOCUS} max-w-44`}>
          <optgroup label="Profiles">
            {PROFILE_TYPES.map((t) => (
              <option key={t} value={t}>
                {SOCIAL_LABELS[t]}
              </option>
            ))}
          </optgroup>
          <optgroup label="Messaging">
            {MESSAGING_TYPES.map((t) => (
              <option key={t} value={t}>
                {SOCIAL_LABELS[t]}
              </option>
            ))}
          </optgroup>
        </select>
        <button type="button" onClick={add} disabled={rows.length >= 30} className={`rounded-lg border border-neutral-900 px-3 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-100 disabled:opacity-40 ${FOCUS}`}>
          + Add link
        </button>
        <span className="text-xs text-neutral-600">{rows.length}/30</span>
      </div>
      {listError && (
        <p role="alert" className="text-xs font-medium text-red-700">
          {listError}
        </p>
      )}
    </div>
  );
}
