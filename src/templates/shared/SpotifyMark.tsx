import { BRAND_GLYPHS } from "@/components/brand-glyphs";

/** The Spotify mark, drawn in the current text colour. */
export function SpotifyMark({ size = 20 }: { size?: number }) {
  const g = BRAND_GLYPHS.spotify;
  return (
    <svg width={size} height={size} viewBox={g.viewBox} fill="currentColor" aria-hidden="true">
      <path d={g.d} />
    </svg>
  );
}
