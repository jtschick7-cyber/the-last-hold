// Technical design §12.3: fallback sprites, one silhouette per asset kind, drawn
// from tiny pixel grids (original, CC0 by authorship). <Sprite> shows these when
// an asset has no file yet. Run: npx vite-node tools/gen-placeholders.ts
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

// '#' = silhouette, '.' = transparent.
const SHAPES: Record<string, string[]> = {
  building: [
    '................',
    '.......##.......',
    '......####......',
    '.....######.....',
    '....########....',
    '...##########...',
    '..############..',
    '...##########...',
    '...##########...',
    '...###....###...',
    '...###....###...',
    '...###....###...',
    '...###....###...',
    '...##########...',
    '................',
    '................',
  ],
  icon: [
    '................',
    '................',
    '.....######.....',
    '....########....',
    '...##########...',
    '...##########...',
    '...##########...',
    '...##########...',
    '...##########...',
    '...##########...',
    '....########....',
    '.....######.....',
    '................',
    '................',
    '................',
    '................',
  ],
  scene: [
    '........................................',
    '...................#..#..#..............',
    '...................#######..............',
    '....................#####...............',
    '....................#####........#......',
    '..........#.........#####.......###.....',
    '.........###........#####......#####....',
    '........#####.......#####......#####....',
    '..#.....#####...#############..#####....',
    '.###....#####...#############..#####..#.',
    '#####..###################################',
    '########################################',
    '########################################',
    '########################################',
    '########################################',
    '########################################',
  ],
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

/** A grayscale-alpha PNG: the silhouette is mid-gray at 60% opacity; CSS tints the box behind it. */
const png = (rows: string[]): Buffer => {
  const h = rows.length;
  const w = rows[0]?.length ?? 0;
  const raw = Buffer.alloc((w * 2 + 1) * h);
  rows.forEach((row, y) => {
    raw[y * (w * 2 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const on = row[x] === '#';
      raw[y * (w * 2 + 1) + 1 + x * 2] = on ? 0x80 : 0;
      raw[y * (w * 2 + 1) + 2 + x * 2] = on ? 0x99 : 0;
    }
  });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 4; // grayscale + alpha
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
};

const out = new URL('../public/assets/placeholders/', import.meta.url);
mkdirSync(out, { recursive: true });
for (const [kind, rows] of Object.entries(SHAPES)) {
  writeFileSync(new URL(`${kind}.png`, out), png(rows));
}
// Portraits arrive in v0.2; until then they reuse the icon shape.
writeFileSync(new URL('portrait.png', out), png(SHAPES.icon ?? []));
console.log('placeholders written to public/assets/placeholders/');
