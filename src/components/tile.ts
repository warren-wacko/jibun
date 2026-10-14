/** Shared look for tappable tiles. At least 44px tall, theme tokens only. */
export const TILE =
  "flex min-h-11 items-center justify-center rounded-lg border border-line bg-surface px-4 py-3 text-center font-medium text-ink";

export const TILE_PRIMARY =
  "flex min-h-11 items-center justify-center rounded-lg bg-accent px-4 py-3 text-center font-semibold text-on-accent";

/** Grid that reflows cleanly for 1, 2 or 3+ items. */
export function gridCols(count: number): string {
  if (count <= 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-2";
  return "grid-cols-2 sm:grid-cols-3";
}
