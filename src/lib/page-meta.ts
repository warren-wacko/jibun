import { getEntitlements, type Tier } from "./entitlements";
import { pageUrl } from "./site";
import type { TemplateMeta } from "@/templates/types";

export function buildTemplateMeta(page: { username: string; tier: Tier; addOns: readonly string[] }): TemplateMeta {
  return {
    username: page.username,
    pageUrl: pageUrl(page.username),
    vcardHref: `/${page.username}/vcard`,
    qrHref: `/${page.username}/qr`,
    showBranding: getEntitlements(page).brandingFooter,
  };
}
