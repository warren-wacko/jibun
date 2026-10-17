"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { changeEdits, deactivatePage, renewPage, setReminderSent, type OpResult } from "@/lib/admin/renewal-ops";

const id = z.string().min(1).max(60);

export async function setReminderSentAction(pageId: string, sent: boolean): Promise<OpResult> {
  await requireAdmin();
  return setReminderSent(id.parse(pageId), z.boolean().parse(sent));
}

export async function renewPageAction(pageId: string): Promise<OpResult> {
  await requireAdmin();
  return renewPage(id.parse(pageId));
}

export async function changeEditsAction(pageId: string, action: "add" | "remove" | "reset"): Promise<OpResult> {
  await requireAdmin();
  return changeEdits(id.parse(pageId), z.enum(["add", "remove", "reset"]).parse(action));
}

export async function deactivatePageAction(pageId: string): Promise<OpResult> {
  await requireAdmin();
  return deactivatePage(id.parse(pageId));
}
