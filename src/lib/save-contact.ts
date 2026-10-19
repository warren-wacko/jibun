"use client";

import { useRef, type MouseEvent } from "react";

/** "/maria/vcard" -> "maria.vcf" */
function fileName(href: string): string {
  const slug = href.split("/").filter(Boolean)[0] ?? "contact";
  return `${slug.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "contact"}.vcf`;
}

/** Hands the contact to the phone the way the reference designs do: a file made in the browser and opened at once. */
function openContact(vcard: string, name: string) {
  const url = URL.createObjectURL(new Blob([vcard], { type: "text/vcard;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/**
 * Save Contact for a link to `href` (the page's vCard). The contact text is already on the page (`vcard`, built on
 * the server), so a tap can open it straight away, inside the tap: phones only open a file made by a tap, and
 * waiting for a request first can make Safari ignore it. The server copy also holds the profile photo, so it is
 * fetched when a finger or the pointer comes near the button, and used if it has arrived by the time of the tap.
 * Without scripts the link still goes to the server copy.
 */
export function useSaveContact(href: string, vcard: string) {
  const full = useRef<string | null>(null);
  const started = useRef(false);

  const prime = () => {
    if (started.current) return;
    started.current = true;
    fetch(href)
      .then((r) => (r.ok ? r.text() : null))
      .then((text) => {
        full.current = text && text.startsWith("BEGIN:VCARD") ? text : null;
      })
      .catch(() => {
        started.current = false;
      });
  };

  const onClick = (e: MouseEvent) => {
    e.preventDefault();
    openContact(full.current ?? vcard, fileName(href));
  };

  return { prime, onClick };
}
