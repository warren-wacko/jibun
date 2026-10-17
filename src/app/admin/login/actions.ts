"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAdminLogin } from "@/lib/admin/credentials";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/admin/session";
import { db } from "@/lib/db";
import { getClientIp } from "@/lib/rate-limit";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const result = await verifyAdminLogin(
    { email: formData.get("email"), password: formData.get("password") },
    getClientIp(await headers()),
    (email) => db.user.findUnique({ where: { email }, select: { id: true, passwordHash: true, role: true } }),
  );

  if (!result.ok) {
    if (result.reason === "rate-limited") {
      return { error: `Too many attempts. Try again in ${Math.ceil((result.retryAfterSec ?? 60) / 60)} minute(s).` };
    }
    return { error: "Wrong email or password." };
  }

  (await cookies()).set(SESSION_COOKIE, await signSession(result.userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: SESSION_MAX_AGE,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete({ name: SESSION_COOKIE, path: "/admin" });
  redirect("/admin/login");
}
