import { buildActions, type Action } from "@/components/ActionRow";
import type { PageData } from "@/lib/page-schema";
import { groupSocials } from "@/lib/socials";
import { initials, pickFeatured } from "../shared/model";

export { initials };

/** Visual order of the action bar in the design. */
const ACTION_ORDER: readonly Action["key"][] = ["call", "email", "text", "directions", "book"];

/** The handwritten sign-off: the page's `signature` field, else the first name. */
export function signatureText(profile: PageData["profile"]): string {
  return profile.signature?.trim() || profile.fullName.trim().split(/\s+/)[0] || "";
}

/** Everything the template shows, derived from PageData. Empty things come back empty so they can be left out. */
export function buildSignatureModel(data: PageData) {
  const { profile, contact, socials, sections } = data;
  const booking = sections.find((s) => s.kind === "booking");

  const actions = [...buildActions(contact, booking?.url)].sort(
    (a, b) => ACTION_ORDER.indexOf(a.key) - ACTION_ORDER.indexOf(b.key),
  );

  const { featured, used } = pickFeatured(data);
  const { profiles, messaging } = groupSocials(socials.filter((s) => s !== used));

  return {
    initials: initials(profile.fullName),
    cardLabel: [profile.company, profile.location].filter(Boolean).join(" · "),
    signature: signatureText(profile),
    actions,
    featured,
    email: contact.email ?? null,
    profiles,
    messaging,
  };
}
