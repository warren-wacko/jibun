"use client";

import { getEntitlements } from "@/lib/entitlements";
import { DEFAULT_FONTS, TEMPLATES_WITH_FONT_PAIRS, fontPairsFor } from "@/templates/font-pairs";
import { RadioCard } from "./Pickers";
import { FieldShell, useEditor } from "./ui";

/** Choose one of the template's font pairs (Standard and up). No choice keeps the template's own fonts. */
export function FontPairPicker() {
  const { values, set } = useEditor();
  const ent = getEntitlements({ tier: values.tier, addOns: values.addOns });
  const pairs = fontPairsFor(values.templateKey);
  const defaultFonts = DEFAULT_FONTS[values.templateKey] ?? "the template’s own fonts";

  if (ent.fonts === "default") {
    return (
      <div className="flex flex-col gap-1" data-field="fontPair">
        <span className="text-sm font-medium">Font pair</span>
        <p className="text-xs text-neutral-600">Font pairs need the Standard tier. This page uses {defaultFonts}.</p>
        {values.fontPair && (
          <p role="alert" className="text-xs font-medium text-red-700">
            This page has the “{values.fontPair}” pair, which this tier cannot keep.{" "}
            <button type="button" className="underline" onClick={() => set("fontPair", "")}>
              Go back to the template’s fonts
            </button>
          </p>
        )}
      </div>
    );
  }
  if (pairs.length === 0) {
    return (
      <div className="flex flex-col gap-1" data-field="fontPair">
        <span className="text-sm font-medium">Font pair</span>
        <p className="text-xs text-neutral-600">This template has one font set ({defaultFonts}), so there is nothing to choose.</p>
      </div>
    );
  }

  const chosen = values.fontPair;
  return (
    <FieldShell name="fontPair" label="Font pair" hint="Headings and body text. The template keeps its own fonts unless you choose a pair.">
      {() => (
        <div className="flex flex-col gap-2">
          <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Font pair">
            <RadioCard name="fontPair" value="" checked={chosen === ""} onSelect={() => set("fontPair", "")} title="Template default">
              {defaultFonts}
            </RadioCard>
            {pairs.map((p) => (
              <RadioCard key={p.id} name="fontPair" value={p.id} checked={chosen === p.id} onSelect={() => set("fontPair", p.id)} title={p.label}>
                {p.heading === p.body ? p.heading : `${p.heading} + ${p.body}`}
              </RadioCard>
            ))}
          </div>
          {!TEMPLATES_WITH_FONT_PAIRS.has(values.templateKey) && (
            <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
              This template does not apply font pairs yet. The choice is saved with the page and will show once its Standard design is built.
            </p>
          )}
        </div>
      )}
    </FieldShell>
  );
}
