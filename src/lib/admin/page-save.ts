import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { generateCardCode } from "../card-code";
import { db } from "../db";
import { revalidatePage } from "../pages";
import { formValuesSchema, validateForm, type FieldErrors, type FormValues } from "./page-form";
import { tierChangeSchema } from "./tier-change";

export type SaveResult =
  | { ok: true; username: string; created: boolean }
  | { ok: false; errors: FieldErrors; message: string };

const fail = (message: string, errors: FieldErrors = {}): SaveResult => ({ ok: false, errors, message });

/** `JSON.parse(JSON.stringify())` drops `undefined` keys, so the stored JSON has only real values. */
const toJson = (data: unknown) => JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue;

const isUniqueViolation = (e: unknown, field: string) =>
  e instanceof Prisma.PrismaClientKnownRequestError &&
  e.code === "P2002" &&
  String((e.meta as { target?: unknown } | undefined)?.target ?? "").includes(field);

/**
 * Create a page (and its client and first card), or update an existing one. Re-validates everything:
 * the form's own checks are for the admin's convenience, not for safety.
 * `existingUsername` set = edit that page (its username never changes).
 * Changing a page's tier needs `tierChange` (amount paid, reprint): it is saved with the page in one transaction.
 */
export async function savePage(input: unknown, existingUsername?: string, tierChange?: unknown): Promise<SaveResult> {
  const shape = formValuesSchema.safeParse(input);
  if (!shape.success) return fail("The form data was not valid. Reload the page and try again.");
  const values: FormValues = shape.data;

  const result = validateForm(values, { requireUsername: !existingUsername });
  if (!result.ok) return fail("Fix the highlighted fields and save again.", result.errors);

  const client = {
    name: values.clientName.trim(),
    contactEmail: values.contactEmail.trim() || null,
    contactPhone: values.contactPhone.trim() || null,
    notes: values.notes.trim() || null,
  };
  const page = {
    tier: values.tier,
    templateKey: values.templateKey,
    status: values.status,
    paidUntil: result.paidUntil,
    addOns: values.addOns,
    data: toJson(result.data),
  };

  if (existingUsername) {
    const existing = await db.page.findUnique({ where: { username: existingUsername }, select: { id: true, tier: true } });
    if (!existing) return fail("That page no longer exists.");

    const update = () => db.page.update({ where: { id: existing.id }, data: { ...page, client: { update: client } } });
    if (existing.tier === values.tier) {
      await update();
    } else {
      // A tier change must say what was paid; check that before touching the page.
      const change = tierChangeSchema.safeParse(tierChange);
      if (!change.success) {
        return fail("Record the amount paid for the tier change.", { tierAmount: change.error.issues[0]?.message ?? "Enter the amount paid" });
      }
      await db.$transaction([
        update(),
        db.tierChange.create({
          data: {
            pageId: existing.id,
            fromTier: existing.tier,
            toTier: values.tier,
            amountPaid: change.data.amountPaid,
            reprint: change.data.reprint,
            note: change.data.note || null,
          },
        }),
      ]);
    }
    revalidatePage(existingUsername);
    return { ok: true, username: existingUsername, created: false };
  }

  const username = values.username;
  if (await db.page.findUnique({ where: { username }, select: { id: true } })) {
    return fail("That username is taken.", { username: "That username is already taken" });
  }

  // A card code is random; on the rare collision, draw another.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await db.client.create({
        data: { ...client, pages: { create: { username, ...page, cards: { create: { code: generateCardCode(), label: "Main" } } } } },
      });
      revalidatePage(username);
      return { ok: true, username, created: true };
    } catch (e) {
      if (isUniqueViolation(e, "username")) return fail("That username is taken.", { username: "That username is already taken" });
      if (!isUniqueViolation(e, "code")) throw e;
    }
  }
  return fail("Could not generate a unique card code. Try saving again.");
}

/** Whether a username can be used for a new page. */
export async function isUsernameFree(username: string): Promise<boolean> {
  return !(await db.page.findUnique({ where: { username }, select: { id: true } }));
}
