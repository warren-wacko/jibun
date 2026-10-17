"use client";

import { ACCENT_PRESETS, contrastRatio, resolveAccent } from "@/lib/accents";
import { getEntitlements } from "@/lib/entitlements";
import { CONTROL, FOCUS, FieldShell, useEditor } from "./ui";

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function Swatch({ id, label, color, secondary, selected, onPick }: { id: string; label: string; color: string; secondary?: string; selected: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={selected}
      aria-label={label}
      title={label}
      data-preset={id}
      className={`relative size-9 rounded-full border border-black/15 ${FOCUS} ${selected ? "ring-2 ring-neutral-900 ring-offset-2" : ""}`}
      style={{ background: secondary ? `linear-gradient(135deg, ${color} 55%, ${secondary} 55%)` : color }}
    />
  );
}

/** Preset colours for everyone; a free hex colour from the Standard tier up. */
export function AccentPicker() {
  const { values, set, touch } = useEditor();
  const ent = getEntitlements({ tier: values.tier, addOns: values.addOns });
  const accent = values.accent.trim();
  const isPreset = ACCENT_PRESETS.some((p) => p.id === accent);
  const hexOk = HEX.test(accent);
  const resolved = resolveAccent(accent || "blue");
  const palette = ACCENT_PRESETS.filter((p) => p.group === "palette");
  const school = ACCENT_PRESETS.filter((p) => p.group === "school");
  const hexAllowed = ent.accent === "hex";

  return (
    <FieldShell name="accent" label="Accent colour" hint="Used for buttons, highlights and tape. Text on top of it switches between light and dark automatically.">
      {({ describedBy }) => (
        <div className="flex flex-col gap-3" aria-describedby={describedBy}>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Preset colours">
            {palette.map((p) => (
              <Swatch key={p.id} id={p.id} label={p.label} color={p.accent} selected={accent === p.id} onPick={() => set("accent", p.id)} />
            ))}
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-neutral-600">School colours</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="School colour pairs">
              {school.map((p) => (
                <Swatch key={p.id} id={p.id} label={p.label} color={p.accent} secondary={p.secondary} selected={accent === p.id} onPick={() => set("accent", p.id)} />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <span className="font-medium">Custom colour</span>
              <input
                type="text"
                value={isPreset ? "" : values.accent}
                placeholder="#2563EB"
                disabled={!hexAllowed}
                maxLength={7}
                spellCheck={false}
                aria-invalid={Boolean(accent) && !isPreset && !hexOk}
                onBlur={() => {
                  // Allow "2563eb" without the "#".
                  if (/^(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(values.accent.trim())) set("accent", `#${values.accent.trim()}`);
                  touch("accent");
                }}
                onChange={(e) => set("accent", e.target.value)}
                className={`${CONTROL} ${FOCUS} w-28 font-mono`}
              />
            </label>
            <input
              type="color"
              aria-label="Pick a custom colour"
              disabled={!hexAllowed}
              value={hexOk ? (accent.length === 4 ? `#${accent[1]}${accent[1]}${accent[2]}${accent[2]}${accent[3]}${accent[3]}` : accent.toLowerCase()) : resolved.accent}
              onChange={(e) => set("accent", e.target.value)}
              className={`h-9 w-12 cursor-pointer rounded border border-neutral-300 bg-white p-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`}
            />
            {!hexAllowed && <span className="text-xs text-neutral-600">Any colour needs the Standard tier.</span>}
          </div>

          <p className="flex items-center gap-2 text-xs text-neutral-600">
            <span
              className="inline-flex h-6 items-center rounded-full px-3 text-xs font-semibold"
              style={{ background: resolved.accent, color: resolved.onAccent }}
            >
              Save contact
            </span>
            {contrastRatio(resolved.accent, resolved.onAccent) >= 4.5
              ? "Button text is easy to read on this colour."
              : "Button text is hard to read on this colour. Try a darker or lighter one."}
          </p>
        </div>
      )}
    </FieldShell>
  );
}
