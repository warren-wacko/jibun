import { existsSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { buildTemplateMeta } from "./page-meta";
import { PageDataSchema } from "./page-schema";
import {
  FULL_PREVIEW_DATA,
  PREVIEW_DEFAULT_ACCENT,
  PREVIEW_PHOTO,
  SPARSE_PREVIEW_DATA,
  buildPreviewData,
  isPreviewEnabled,
} from "./preview";
import { registeredTemplateKeys, renderTemplate } from "@/templates/registry";

describe("isPreviewEnabled", () => {
  it("is on in development and test, off in production unless switched on", () => {
    expect(isPreviewEnabled({ NODE_ENV: "development" })).toBe(true);
    expect(isPreviewEnabled({ NODE_ENV: "test" })).toBe(true);
    expect(isPreviewEnabled({ NODE_ENV: "production" })).toBe(false);
    expect(isPreviewEnabled({ NODE_ENV: "production", ENABLE_PREVIEW: "0" })).toBe(false);
    expect(isPreviewEnabled({ NODE_ENV: "production", ENABLE_PREVIEW: "1" })).toBe(true);
  });
});

describe("preview data", () => {
  // The preview photo is a path in public/, which the schema (absolute URLs only) would reject.
  const asRealData = <T extends { profile: { photoUrl?: string } }>(d: T) => ({
    ...d,
    profile: { ...d.profile, photoUrl: d.profile.photoUrl ? "https://res.cloudinary.com/demo/p.jpg" : undefined },
  });

  it("is valid PageData", () => {
    expect(PageDataSchema.safeParse(asRealData(FULL_PREVIEW_DATA)).success).toBe(true);
    expect(PageDataSchema.safeParse(asRealData(SPARSE_PREVIEW_DATA)).success).toBe(true);
  });

  it("points at a portrait that exists", () => {
    expect(existsSync(path.join(process.cwd(), "public", PREVIEW_PHOTO))).toBe(true);
  });

  it("is fictional and the sparse data really is sparse", () => {
    expect(FULL_PREVIEW_DATA.contact.email).toMatch(/@example\.com$/);
    expect(SPARSE_PREVIEW_DATA.profile.fullName).toHaveLength(30);
    expect(SPARSE_PREVIEW_DATA.profile.photoUrl).toBeUndefined();
    expect(SPARSE_PREVIEW_DATA.contact.showPhoneNumbers).toBe(false);
  });
});

describe("buildPreviewData", () => {
  it("picks the variant, theme and accent from the query, with safe defaults", () => {
    const sparse = buildPreviewData("pro-classic", { variant: "sparse", theme: "dark", accent: "graphite" });
    expect(sparse.profile.fullName).toBe(SPARSE_PREVIEW_DATA.profile.fullName);
    expect(sparse.style).toMatchObject({ theme: "dark", accent: "graphite" });

    const full = buildPreviewData("pro-classic", {});
    expect(full.profile.fullName).toBe("Maria Santos");
    expect(full.style).toMatchObject({ theme: "light", accent: PREVIEW_DEFAULT_ACCENT["pro-classic"] });
  });

  it("ignores nonsense for theme and accent", () => {
    const d = buildPreviewData("pro-magazine", { theme: "neon", accent: "red; background:url(x)" });
    expect(d.style.theme).toBe("light");
    expect(d.style.accent).toBe(PREVIEW_DEFAULT_ACCENT["pro-magazine"]);
  });

  it("accepts a hex accent", () => {
    expect(buildPreviewData("pro-magazine", { accent: "#123abc" }).style.accent).toBe("#123abc");
  });
});

describe("every registered template renders the preview data", () => {
  const meta = buildTemplateMeta({ username: "maria", tier: "STARTER", addOns: [] });

  for (const key of registeredTemplateKeys()) {
    for (const variant of ["full", "sparse"] as const) {
      for (const theme of ["light", "dark"] as const) {
        it(`${key} / ${variant} / ${theme}`, () => {
          const data = buildPreviewData(key, { variant, theme });
          const html = renderToStaticMarkup(renderTemplate(key, { data, theme: data.style.theme, meta }));
          expect(html).toContain(data.profile.fullName.split(" ")[0]);
          expect(html).toContain(`data-theme="${theme}"`);
          if (variant === "full") expect(html).toContain("Save");
        });
      }
    }
  }
});
