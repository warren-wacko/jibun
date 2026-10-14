import type { ComponentType } from "react";
import type { PageData } from "@/lib/page-schema";

export type Theme = "light" | "dark";

/** Every template receives typed page data and a theme, and contains no client data. */
export type TemplateProps = {
  data: PageData;
  theme: Theme;
};

export type TemplateComponent = ComponentType<TemplateProps>;
