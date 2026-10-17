import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "../db";
import { SESSION_COOKIE, verifySession } from "./session";

export type AdminUser = { id: string; email: string };

/**
 * The signed-in admin, or a redirect to the login page. Call it in every admin page and Server Action,
 * close to the data: the proxy only checks the cookie's signature, this also confirms the user still exists.
 * Reads cookies, so it must sit inside <Suspense>.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login");
  const user = await db.user.findUnique({ where: { id: session.userId }, select: { id: true, email: true, role: true } });
  if (!user || user.role !== "ADMIN") redirect("/admin/login");
  return { id: user.id, email: user.email };
}
