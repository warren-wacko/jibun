"use server";

import type { ReactElement } from "react";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { buildTemplateMeta } from "@/lib/page-meta";
import { PageDataSchema } from "@/lib/page-schema";
import { validateUsername } from "@/lib/usernames";
import { renderTemplate } from "@/templates/registry";

const requestSchema = z.object({
  templateKey: z.string().max(60),
  data: PageDataSchema,
  theme: z.enum(["light", "dark"]),
  /** The saved page's username, or null for a page that does not exist yet (the sample card's QR is shown instead). */
  username: z.string().max(60).nullable(),
  tier: z.enum(["STARTER", "STANDARD", "CUSTOM"]),
  addOns: z.array(z.string().max(40)).max(20), // unknown add-ons are ignored by getEntitlements
});

export type PreviewRequest = z.input<typeof requestSchema>;

/**
 * Renders a template with the form's current values, for the live preview. The result is the same markup
 * a visitor gets. Save Contact and QR point at the real page when it exists, else at the sample card.
 */
export async function renderPreviewAction(input: unknown): Promise<ReactElement | null> {
  await requireAdmin();
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return null;
  const { templateKey, data, theme, username, tier, addOns } = parsed.data;
  const saved = username && validateUsername(username).ok ? username : "maria";
  const meta = buildTemplateMeta({ username: saved, tier, addOns });
  return renderTemplate(templateKey, { data, theme, meta });
}
