import { createElement, type ReactElement } from "react";
import { PlaceholderTemplate } from "./placeholder";
import { ProClassicTemplate } from "./pro-classic";
import { ProCompanyTemplate } from "./pro-company";
import { ProMagazineTemplate } from "./pro-magazine";
import { ProSignatureTemplate } from "./pro-signature";
import { SocialBentoTemplate } from "./social-bento";
import { SocialMinimalistTemplate } from "./social-minimalist";
import { SocialScrapbookTemplate } from "./social-scrapbook";
import { StudentNotebookTemplate } from "./student-notebook";
import type { TemplateComponent, TemplateProps } from "./types";

/**
 * templateKey -> component. Real templates are added here only once their
 * design reference exists in design-reference/ (see the PRD conversion rules).
 */
const registry: Record<string, TemplateComponent> = {
  placeholder: PlaceholderTemplate,
  "pro-classic": ProClassicTemplate,
  "pro-magazine": ProMagazineTemplate,
  "pro-signature": ProSignatureTemplate,
  "pro-company": ProCompanyTemplate,
  "student-notebook": StudentNotebookTemplate,
  "social-bento": SocialBentoTemplate,
  "social-scrapbook": SocialScrapbookTemplate,
  "social-minimalist": SocialMinimalistTemplate,
};

export const PLACEHOLDER_KEY = "placeholder";

/**
 * Resolve a page's templateKey. Launch keys that are not converted yet
 * (or unknown) render the placeholder rather than failing.
 */
export function getTemplate(templateKey: string): TemplateComponent {
  return registry[templateKey] ?? PlaceholderTemplate;
}

/** Render a page's template by key. Looking the component up here keeps routes free of render-time component creation. */
export function renderTemplate(templateKey: string, props: TemplateProps): ReactElement {
  return createElement(getTemplate(templateKey), props);
}

/** Every registered key, placeholder first, then the converted templates. */
export function registeredTemplateKeys(): string[] {
  return Object.keys(registry);
}

export function hasTemplate(templateKey: string): boolean {
  return templateKey in registry;
}
