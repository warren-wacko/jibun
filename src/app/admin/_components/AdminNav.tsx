"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/renewals", label: "Renewals" },
];

/** The main admin links, with the current one marked. Editing a page counts as being in Clients. */
export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="adm-nav" aria-label="Admin">
      {LINKS.map((l) => {
        const here = l.exact
          ? path === l.href
          : path === l.href || path.startsWith(`${l.href}/`) || (l.href === "/admin/clients" && path.startsWith("/admin/pages"));
        return (
          <Link key={l.href} href={l.href} aria-current={here ? "page" : undefined}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
