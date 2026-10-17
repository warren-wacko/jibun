"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { addCard, deleteUnusedCard, resetCardUsage, updateCard, type CardResult } from "@/lib/admin/cards";

const id = z.string().min(1).max(60);
const change = z.object({ label: z.string().max(200).optional(), status: z.string().max(20).optional() });

export async function addCardAction(username: string, label: string): Promise<CardResult> {
  await requireAdmin();
  return addCard(id.parse(username), z.string().max(200).parse(label));
}

export async function updateCardAction(cardId: string, input: { label?: string; status?: string }): Promise<CardResult> {
  await requireAdmin();
  return updateCard(id.parse(cardId), change.parse(input));
}

export async function resetCardUsageAction(cardId: string): Promise<CardResult> {
  await requireAdmin();
  return resetCardUsage(id.parse(cardId));
}

export async function deleteCardAction(cardId: string): Promise<CardResult> {
  await requireAdmin();
  return deleteUnusedCard(id.parse(cardId));
}
