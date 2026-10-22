// Generates the placeholder PWA icons (technical design §11.1: "icons generated
// from one source"). The source is the 16×16 pixel grid below, original work made
// for this project, in the Zughy 32 palette (D58).
// Run: npx vite-node tools/make-icons.ts
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

// A tower with a lit window. '#' stone, 'o' ember, '.' background.
const GRID = [
  '................',
  '................',
  '...#..#..#..#...',
  '...##########...',
  '....########....',
  '....########....',
  '....###oo###....',
  '....###oo###....',
  '....########....',
  '....########....',
  '....########....',
  '....###..###....',
  '....###..###....',
  '..############..',
  '................',
  '................',
];

type Rgb = readonly [number, number, number];
const BACKGROUND: Rgb = [0x30, 0x2c, 0x2e]; // Zughy 32 (D58)
/** v1.0 (D489 (5)): the preview build's icon wears a cyan corner so the two installs can be told apart. */
const MARK: Rgb = [0x28, 0xcc, 0xdf];
const MARK_EDGE: Rgb = [0xdf, 0xf6, 0xf5];
const COLORS: Record<string, Rgb> = {
  '.': BACKGROUND,
  '#': [0xa0, 0x93, 0x8e],
  o: [0xf4, 0x7e, 0x1b],
};

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf: Buffer): number => {
  let c = 0xffffffff;
  for (const b of buf) c = (crcTable[(c ^ b) & 0xff] ?? 0) ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type: string, data: Buffer): Buffer => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

/** Renders the grid at `size` px; `inset` is the fraction of padding per side. */
const png = (size: number, inset: number, mark = false): Buffer => {
  const pad = Math.round(size * inset);
  const cell = (size - pad * 2) / GRID.length;
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const gy = Math.floor((y - pad) / cell);
      const gx = Math.floor((x - pad) / cell);
      const ch = GRID[gy]?.[gx] ?? '.';
      let [r, g, b] = COLORS[ch] ?? BACKGROUND;
      if (mark) {
        // A triangle in the top-right corner of the padded square (inside a maskable's safe zone).
        const span = size - pad * 2;
        const d = span - 1 - (x - pad) + (y - pad);
        const leg = span * 0.3;
        if (x >= pad && y >= pad && x < size - pad && y < size - pad) {
          if (d < leg) [r, g, b] = MARK;
          else if (d < leg + cell * 0.6) [r, g, b] = MARK_EDGE;
        }
      }
      const i = y * (size * 3 + 1) + 1 + x * 3;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolor RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
};

const write = (dir: URL, mark: boolean): void => {
  mkdirSync(dir, { recursive: true });
  writeFileSync(new URL('icon-192.png', dir), png(192, 0, mark));
  writeFileSync(new URL('icon-512.png', dir), png(512, 0, mark));
  // Maskable icons keep their content inside the central 80% safe zone.
  writeFileSync(new URL('icon-maskable-512.png', dir), png(512, 0.1, mark));
  writeFileSync(new URL('apple-touch-icon.png', dir), png(180, 0.05, mark));
  writeFileSync(new URL('favicon-32.png', dir), png(32, 0, mark));
};
write(new URL('../public/icons/', import.meta.url), false);
// The preview build copies these over the live icons (vite.config.ts), so the live bundle never carries them.
write(new URL('../art-src/icons-preview/', import.meta.url), true);
console.log('icons written to public/icons/ and art-src/icons-preview/');
