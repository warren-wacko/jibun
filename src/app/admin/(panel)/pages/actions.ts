"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { savePage, isUsernameFree, type SaveResult } from "@/lib/admin/page-save";
import { validateUsername } from "@/lib/usernames";

/** Create a page, or save changes to the page with `existingUsername`. */
export async function savePageAction(input: unknown, existingUsername?: string): Promise<SaveResult> {
  await requireAdmin();
  const target = z.string().max(60).optional().parse(existingUsername);
  return savePage(input, target);
}

/** Live "is this username free?" check while typing. */
export async function checkUsernameAction(username: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  await requireAdmin();
  const name = String(username).trim().toLowerCase().slice(0, 60);
  const valid = validateUsername(name);
  if (!valid.ok) return valid;
  return (await isUsernameFree(name)) ? { ok: true } : { ok: false, reason: "That username is already taken" };
}
