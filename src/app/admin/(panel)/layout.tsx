import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { requireAdmin } from "@/lib/admin/auth";
import { logout } from "../login/actions";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Jibun admin" },
  robots: { index: false, follow: false },
};

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-neutral-500">Loading…</p>}>
      <Gate>{children}</Gate>
    </Suspense>
  );
}

/** Reads the session at request time, so everything behind it streams in. */
async function Gate({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2">
        <nav className="flex items-center gap-4 text-sm sm:gap-5">
          <Link href="/admin" className="inline-flex min-h-11 items-center whitespace-nowrap text-lg font-bold">
            Jibun admin
          </Link>
          <Link href="/admin/clients" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
            Clients
          </Link>
          <Link href="/admin/renewals" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
            Renewals
          </Link>
        </nav>
        <form action={logout} className="flex items-center gap-3 text-sm">
          <span className="hidden text-neutral-600 sm:inline">{admin.email}</span>
          <button type="submit" className="min-h-10 whitespace-nowrap rounded-lg border border-neutral-300 px-3 py-1.5">
            Sign out
          </button>
        </form>
      </header>
      {children}
    </div>
  );
}
