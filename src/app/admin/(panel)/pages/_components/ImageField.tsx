"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { CONTROL, FOCUS, FieldShell, useEditor } from "./ui";

/**
 * A picture link with a small preview. Real upload and crop come with the Cloudinary account (last step of the
 * plan); until then the admin pastes a link, and the Upload button is switched off on purpose.
 */
export function ImageField({
  name,
  label,
  hint,
  shape = "round",
}: {
  name: "photoUrl" | "logoUrl";
  label: string;
  hint?: ReactNode;
  shape?: "round" | "square";
}) {
  const { values, set, touch } = useEditor();
  const value = values[name];
  const url = value.trim();
  // Remember which link failed to load, so a corrected link is tried again.
  const [failed, setFailed] = useState<string | null>(null);
  const showPreview = /^https?:\/\//i.test(url) && failed !== url;

  return (
    <FieldShell name={name} label={label} optional hint={hint}>
      {({ id, describedBy, invalid }) => (
        <div className="flex items-start gap-3">
          <div
            className={`flex size-16 shrink-0 items-center justify-center overflow-hidden border border-neutral-200 bg-neutral-100 text-[10px] text-neutral-500 ${shape === "round" ? "rounded-full" : "rounded-lg"}`}
            aria-hidden={showPreview ? undefined : true}
          >
            {showPreview ? (
              <Image src={url} alt={`${label} preview`} width={64} height={64} unoptimized className="size-full object-cover" onError={() => setFailed(url)} />
            ) : failed === url && url ? (
              "No image"
            ) : (
              "None"
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <input
              id={id}
              name={name}
              type="url"
              inputMode="url"
              value={value}
              placeholder="https://…"
              autoComplete="off"
              aria-invalid={invalid}
              aria-describedby={describedBy}
              onBlur={() => touch(name)}
              onChange={(e) => set(name, e.target.value)}
              className={`${CONTROL} ${FOCUS}`}
            />
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600">
              <button type="button" disabled className="cursor-not-allowed rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium opacity-50" title="Upload and crop come with the Cloudinary account">
                Upload and crop
              </button>
              <span>Coming later (needs the Cloudinary account). Paste an image link for now.</span>
              {failed === url && url && <span className="font-medium text-amber-800">That link did not load as an image.</span>}
            </div>
          </div>
        </div>
      )}
    </FieldShell>
  );
}
