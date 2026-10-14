import { PlaceholderTemplate } from "./placeholder";
import type { TemplateComponent } from "./types";

/**
 * templateKey -> component. Real templates are added here only once their
 * design reference file exists in design-reference/ (see the PRD conversion rules).
 */
const registry: Record<string, TemplateComponent> = {
  placeholder: PlaceholderTemplate,
};

export const PLACEHOLDER_KEY = "placeholder";

/**
 * Resolve a page's templateKey. Launch keys that are not converted yet
 * (e.g. "pro-classic") render the placeholder rather than failing.
 */
export function getTemplate(templateKey: string): TemplateComponent {
  return registry[templateKey] ?? PlaceholderTemplate;
}

export function hasTemplate(templateKey: string): boolean {
  return templateKey in registry;
}
