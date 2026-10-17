import { buildActions, type Action } from "@/components/ActionRow";
import type { PageData } from "@/lib/page-schema";
import { groupSocials } from "@/lib/socials";
import { pickFeatured } from "../shared/model";

export { displayUrl } from "../shared/model";
export type { Featured } from "../shared/model";

/** Visual order of the round action buttons in the design. */
const ACTION_ORDER: readonly Action["key"][] = ["call", "email", "text", "directions", "book"];

/**
 * Everything the template shows, derived from PageData. Anything empty comes back empty/null
 * so the template can leave it out.
 */
export function buildModel(data: PageData) {
  const { profile, contact, socials, sections } = data;
  const booking = sections.find((s) => s.kind === "booking");

  const actions = [...buildActions(contact, booking?.url)].sort(
    (a, b) => ACTION_ORDER.indexOf(a.key) - ACTION_ORDER.indexOf(b.key),
  );

  const { featured, used } = pickFeatured(data);
  const { profiles, messaging } = groupSocials(socials.filter((s) => s !== used));

  return {
    cardLabel: [profile.company, profile.location].filter(Boolean).join(" · "),
    actions,
    featured,
    email: contact.email ?? null,
    profiles,
    messaging,
  };
}
