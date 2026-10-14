import { createElement, type ReactElement } from "react";
import { PlaceholderTemplate } from "./placeholder";
import type { TemplateComponent, TemplateProps } from "./types";

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

/** Render a page's template by key. Looking the component up here keeps routes free of render-time component creation. */
export function renderTemplate(templateKey: string, props: TemplateProps): ReactElement {
  return createElement(getTemplate(templateKey), props);
}

export function hasTemplate(templateKey: string): boolean {
  return templateKey in registry;
}
