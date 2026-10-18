"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { deletePage, type DeleteResult } from "@/lib/admin/page-delete";

const text = z.string().max(80);

/** Permanently delete a page (and its client when it was their only page). */
export async function deletePageAction(username: string, confirmation: string): Promise<DeleteResult> {
  await requireAdmin();
  return deletePage(text.parse(username), text.parse(confirmation));
}
