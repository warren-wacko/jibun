import { z } from "zod";
import type { Tier } from "../entitlements";

/** What the admin records when a page changes tier: the price difference paid and whether a new card is included. */
export type TierChangeInput = { amountPaid: number; reprint: boolean; note?: string };

/** The same fields as typed in the form (the amount is text until it is checked). */
export type TierChangeForm = { amount: string; reprint: boolean; note: string };

export const emptyTierChangeForm = (): TierChangeForm => ({ amount: "", reprint: false, note: "" });

const RANK: Record<Tier, number> = { STARTER: 0, STANDARD: 1, CUSTOM: 2 };

export const TIER_LABEL: Record<Tier, string> = { STARTER: "Starter", STANDARD: "Standard", CUSTOM: "Custom" };

export function isUpgrade(from: Tier, to: Tier): boolean {
  return RANK[to] > RANK[from];
}

export const MAX_AMOUNT_PESOS = 1_000_000;

export const tierChangeSchema = z.object({
  amountPaid: z
    .number("Enter the amount paid")
    .int("Use whole pesos")
    .min(0, "The amount cannot be negative")
    .max(MAX_AMOUNT_PESOS, "That amount looks too large"),
  reprint: z.boolean(),
  note: z.string().trim().max(200, "Use at most 200 characters").optional(),
});

/** "1,500" or "₱1500" -> 1500. Returns null when it is not a whole number of pesos. */
export function parsePesos(text: string): number | null {
  const cleaned = text.replace(/[₱,\s]/g, "").replace(/^PHP/i, "");
  return /^\d{1,9}$/.test(cleaned) ? Number(cleaned) : null;
}

export type TierChangeErrors = { amount?: string; note?: string };

/** Checks the form; returns the values to save, or what is wrong. */
export function validateTierChange(form: TierChangeForm): { ok: true; value: TierChangeInput } | { ok: false; errors: TierChangeErrors } {
  const errors: TierChangeErrors = {};
  const pesos = parsePesos(form.amount);
  if (!form.amount.trim()) errors.amount = "Enter the amount paid (0 if there was no charge)";
  else if (pesos === null) errors.amount = "Use whole pesos, for example 800";
  else if (pesos > MAX_AMOUNT_PESOS) errors.amount = "That amount looks too large";

  const note = tierChangeSchema.shape.note.safeParse(form.note);
  if (!note.success) errors.note = note.error.issues[0].message;

  if (Object.keys(errors).length > 0 || pesos === null) return { ok: false, errors };
  return { ok: true, value: { amountPaid: pesos, reprint: form.reprint, note: form.note.trim() || undefined } };
}

const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });
export const formatPesos = (amount: number) => peso.format(amount);

/** "Starter → Standard · ₱800 · customized printed card included" */
export function describeTierChange(c: { fromTier: Tier; toTier: Tier; amountPaid: number; reprint: boolean }): string {
  const parts = [`${TIER_LABEL[c.fromTier]} → ${TIER_LABEL[c.toTier]}`, formatPesos(c.amountPaid)];
  parts.push(c.reprint ? "customized printed card included" : "keeps the current card");
  return parts.join(" · ");
}
