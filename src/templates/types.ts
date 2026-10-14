import type { ComponentType } from "react";
import type { PageData } from "@/lib/page-schema";

export type Theme = "light" | "dark";

/** Page-level context that is not client content: URLs and entitlement-derived flags. */
export type TemplateMeta = {
  username: string;
  /** Absolute public URL of the page, used by Share. */
  pageUrl: string;
  vcardHref: string;
  /** QR image of the card URL (with the source flag), shown on the QR face. */
  qrHref: string;
  /** False when branding is removed (remove_branding add-on or CUSTOM). */
  showBranding: boolean;
};

/** Every template receives typed page data and a theme, and contains no client data. */
export type TemplateProps = {
  data: PageData;
  theme: Theme;
  meta: TemplateMeta;
};

export type TemplateComponent = ComponentType<TemplateProps>;
