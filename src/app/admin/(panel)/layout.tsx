import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { requireAdmin } from "@/lib/admin/auth";
import { AdminFrame } from "../_components/AdminFrame";
import { AdminNav } from "../_components/AdminNav";
import { logout } from "../login/actions";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Jibun admin" },
  robots: { index: false, follow: false },
};

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <AdminFrame>
      <Suspense fallback={<p className="p-6 text-sm text-neutral-500">Loading…</p>}>
        <Gate>{children}</Gate>
      </Suspense>
    </AdminFrame>
  );
}

/** Reads the session at request time, so everything behind it streams in. */
async function Gate({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  return (
    <>
      <header className="adm-head">
        <div className="adm-head-in">
          <Link href="/admin" className="adm-brand" aria-label="Jibun admin home">
            <span>
              jibun<span className="dot">.</span>
            </span>
            <small>admin</small>
          </Link>
          <AdminNav />
          <form action={logout} className="flex items-center gap-3 text-sm">
            <span className="hidden text-neutral-600 md:inline">{admin.email}</span>
            <button type="submit" className="min-h-10 whitespace-nowrap rounded-lg border border-neutral-300 bg-white px-4 py-1.5 text-sm">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <div className="adm-main">{children}</div>
    </>
  );
}
