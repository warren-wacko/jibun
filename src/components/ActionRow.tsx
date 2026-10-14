import type { PageData } from "@/lib/page-schema";
import { TILE, gridCols } from "./tile";

type Action = { key: string; label: string; href: string; external?: boolean };

/**
 * Call, Text, Email, Directions and Book. Every phone-number action is hidden when
 * showPhoneNumbers is off (the number would otherwise sit in the link). Directions appears
 * only with an office address, and Book only when the page has a booking section.
 */
export function buildActions(contact: PageData["contact"], bookingUrl?: string): Action[] {
  const actions: Action[] = [];
  if (contact.phone && contact.showPhoneNumbers) {
    actions.push({ key: "call", label: "Call", href: `tel:${contact.phone}` });
    if (contact.sms) actions.push({ key: "text", label: "Text", href: `sms:${contact.phone}` });
  }
  if (contact.email) actions.push({ key: "email", label: "Email", href: `mailto:${contact.email}` });
  if (contact.officeAddress) {
    actions.push({
      key: "directions",
      label: "Directions",
      href: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(contact.officeAddress)}`,
      external: true,
    });
  }
  if (bookingUrl) actions.push({ key: "book", label: "Book", href: bookingUrl, external: true });
  return actions;
}

export function ActionRow({ contact, bookingUrl }: { contact: PageData["contact"]; bookingUrl?: string }) {
  const actions = buildActions(contact, bookingUrl);
  if (actions.length === 0) return null;
  return (
    <nav aria-label="Contact actions" className={`grid gap-2 ${gridCols(actions.length)}`}>
      {actions.map((a) => (
        <a
          key={a.key}
          href={a.href}
          className={TILE}
          {...(a.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {a.label}
        </a>
      ))}
    </nav>
  );
}
