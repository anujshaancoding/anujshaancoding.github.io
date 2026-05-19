// Tiny, dependency-free scale + path helpers.
// Hand-rolled on purpose: the same primitives D3 gives you (linear/band
// scales, line/area generators, arc math) — kept local so the portfolio is
// a self-contained demonstration of the maths, not just an import.

export type Scale = (v: number) => number;

/** Maps a numeric domain [d0,d1] onto a pixel range [r0,r1]. */
export function linearScale(
  [d0, d1]: [number, number],
  [r0, r1]: [number, number],
): Scale {
  const span = d1 - d0 || 1;
  return (v: number) => r0 + ((v - d0) / span) * (r1 - r0);
}

/** Evenly spaced band positions (one per category) with inner padding. */
export function bandScale(
  count: number,
  [r0, r1]: [number, number],
  padding = 0.2,
) {
  const step = (r1 - r0) / Math.max(count, 1);
  const bandWidth = step * (1 - padding);
  const offset = (step - bandWidth) / 2;
  return {
    bandWidth,
    x: (i: number) => r0 + i * step + offset,
  };
}

/** SVG path "d" for a polyline through [x,y] points. */
export function linePath(points: [number, number][]): string {
  return points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
}

/** Closed area path from a polyline down to a baseline y. */
export function areaPath(points: [number, number][], baseY: number): string {
  if (points.length === 0) return "";
  const [fx] = points[0];
  const [lx] = points[points.length - 1];
  return `${linePath(points)} L${lx.toFixed(2)},${baseY.toFixed(
    2,
  )} L${fx.toFixed(2)},${baseY.toFixed(2)} Z`;
}

/** Point on a circle (degrees, 0° = 12 o'clock, clockwise). */
export function polar(
  cx: number,
  cy: number,
  r: number,
  deg: number,
): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

/** SVG arc path between two angles at a fixed radius. */
export function arcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  const [sx, sy] = polar(cx, cy, r, endDeg);
  const [ex, ey] = polar(cx, cy, r, startDeg);
  const large = endDeg - startDeg <= 180 ? 0 : 1;
  return `M${sx.toFixed(2)},${sy.toFixed(2)} A${r},${r} 0 ${large} 0 ${ex.toFixed(
    2,
  )},${ey.toFixed(2)}`;
}

/** Deterministic pseudo-random (seeded) — stable charts across renders/SSR. */
export function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
