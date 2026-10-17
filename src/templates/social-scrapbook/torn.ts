/**
 * Torn-paper bottom edge for the photo, as a CSS polygon. A fixed seed means every page gets the
 * same ragged edge (the design's own recipe), so the markup is stable between renders.
 */
export function tornPolygon(seed = 11): string {
  const pts = ["0% 0%", "100% 0%"];
  let state = seed;
  const rnd = () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
  for (let x = 100; x >= 0; x -= 4) {
    const y = 100 - (x % 8 === 0 ? 0 : 1.2) - rnd() * 1.4;
    pts.push(`${x}% ${y.toFixed(2)}%`);
  }
  return `polygon(${pts.join(", ")})`;
}

export const TORN_CLIP = tornPolygon();
