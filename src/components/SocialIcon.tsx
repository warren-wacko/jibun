import type { CSSProperties } from "react";
import type { SocialType } from "@/lib/page-schema";
import { BRAND_GLYPHS, type BrandGlyphType } from "./brand-glyphs";
import { LinkIcon } from "./icons";

const hasGlyph = (type: SocialType): type is BrandGlyphType => type in BRAND_GLYPHS;

/**
 * Just the network's glyph in the current text colour (no chip), for tiles that paint their own
 * background. Networks without a glyph yet fall back to the neutral link icon.
 */
export function BrandGlyph({ type, size = 26, className }: { type: SocialType | undefined; size?: number; className?: string }) {
  if (!type || !hasGlyph(type)) return <LinkIcon size={size} className={className} />;
  const glyph = BRAND_GLYPHS[type];
  return (
    <svg
      width={size}
      height={size}
      viewBox={glyph.viewBox}
      fill="currentColor"
      aria-hidden="true"
      className={className}
      data-glyph={type}
    >
      <path d={glyph.d} />
    </svg>
  );
}

/**
 * Brand colour chip with the network's glyph. Colours come from brands.css variables.
 * Networks whose glyph has not been added yet (they arrive with the templates that use them)
 * fall back to a neutral link icon rather than an empty or wrong mark.
 */
export function SocialIcon({
  type,
  size = 34,
  glyphSize = 17,
  radius = 10,
}: {
  type: SocialType | undefined;
  size?: number;
  glyphSize?: number;
  radius?: number;
}) {
  const chip: CSSProperties = {
    width: size,
    height: size,
    borderRadius: radius,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };

  if (!type || !hasGlyph(type)) {
    return (
      <span style={{ ...chip, background: "var(--brand-generic)", color: "var(--brand-generic-ink)" }}>
        <LinkIcon size={glyphSize} />
      </span>
    );
  }

  const glyph = BRAND_GLYPHS[type];
  const style: CSSProperties = {
    ...chip,
    background: `var(--brand-${type})`,
    color: "var(--brand-ink)",
    ...(type === "tiktok" ? { boxShadow: "inset 0 0 0 1px var(--brand-tiktok-ring)" } : {}),
  };
  const glyphStyle: CSSProperties | undefined =
    type === "tiktok"
      ? { filter: "drop-shadow(-1px -1px 0 var(--brand-tiktok-cyan)) drop-shadow(1px 1px 0 var(--brand-tiktok-red))" }
      : undefined;

  return (
    <span style={style}>
      <svg
        width={glyphSize}
        height={glyphSize}
        viewBox={glyph.viewBox}
        fill="currentColor"
        role="img"
        aria-hidden="true"
        style={glyphStyle}
      >
        <path d={glyph.d} />
      </svg>
    </span>
  );
}
