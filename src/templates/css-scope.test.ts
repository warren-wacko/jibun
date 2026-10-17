import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * All template stylesheets end up in one bundle and apply to every page, so a rule that is meant for one template
 * must name it. Class names carry each template's own prefix, but attribute selectors (`[data-block]`, `[data-design]`,
 * `[data-font-pair]`) are shared by every template and need the template's `[data-template="..."]` in front.
 */
const dirs = readdirSync(__dirname, { withFileTypes: true }).filter((d) => d.isDirectory());

/** Every selector in a stylesheet, with comments and declaration blocks removed. */
function selectorsOf(css: string): string[] {
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const selectors: string[] = [];
  for (const m of noComments.matchAll(/([^{}]+)\{/g)) {
    const text = m[1].trim();
    if (text.startsWith("@")) continue; // @media, @keyframes ...
    for (const part of text.split(",")) selectors.push(part.trim());
  }
  return selectors;
}

describe("template stylesheets", () => {
  for (const dir of dirs) {
    const files = readdirSync(path.join(__dirname, dir.name)).filter((f) => f.endsWith(".css"));
    for (const file of files) {
      it(`${dir.name}/${file}: shared attribute selectors name the template`, () => {
        const css = readFileSync(path.join(__dirname, dir.name, file), "utf8");
        const loose = selectorsOf(css).filter(
          (s) => /\[data-(block|design|font-pair)/.test(s) && !s.includes(`[data-template="${dir.name}"]`) && !/\.(?:p[a-z]{1,2}|mn|ps|pco)-/.test(s),
        );
        expect(loose, `rules in ${dir.name} that would also apply to other templates`).toEqual([]);
      });
    }
  }
});
