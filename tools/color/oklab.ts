// Technical design §12.2: nearest palette color by perceptual distance in OKLab
// (Björn Ottosson's published matrices). tools/ is exempt from the portable-math
// rule (§7.4): this never feeds game state.
export type Rgb = readonly [number, number, number];
type Lab = readonly [number, number, number];

const toLinear = (c: number): number => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};

export const rgbToOklab = ([r8, g8, b8]: Rgb): Lab => {
  const r = toLinear(r8);
  const g = toLinear(g8);
  const b = toLinear(b8);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
};

export const hexToRgb = (hex: string): Rgb => {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

/** Returns a function mapping any color to the nearest palette color (cached). */
export const nearestIn = (paletteHex: readonly string[]): ((c: Rgb) => Rgb) => {
  const palette = paletteHex.map((h) => {
    const rgb = hexToRgb(h);
    return { rgb, lab: rgbToOklab(rgb) };
  });
  const cache = new Map<number, Rgb>();
  return (c) => {
    const key = (c[0] << 16) | (c[1] << 8) | c[2];
    const hit = cache.get(key);
    if (hit) return hit;
    const [L, a, b] = rgbToOklab(c);
    let best = palette[0];
    let bestD = Infinity;
    for (const p of palette) {
      const d = (p.lab[0] - L) ** 2 + (p.lab[1] - a) ** 2 + (p.lab[2] - b) ** 2;
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    if (!best) throw new Error('The palette is empty.');
    cache.set(key, best.rgb);
    return best.rgb;
  };
};
