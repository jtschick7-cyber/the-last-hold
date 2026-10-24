// D553: lossless re-packing of the pictures for the production build. Every picture the game ships
// has at most 256 colours, so it can be stored as an indexed PNG (a palette and small numbers
// instead of four bytes a pixel). packPng hands back the smaller file, or null when it cannot
// improve the picture. It never changes a pixel: it decodes its own result and compares every
// byte of the red, green, blue and alpha of every pixel with the original before returning it.
// Build-time only (vite.config.ts); nothing here is in the game that runs on the phone.
import { deflateSync } from 'node:zlib';
import { PNG } from 'pngjs';

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MAX_COLOURS = 256;
// Chunks that decide how the pixels are read. Anything else (gamma, colour profile, ...) could
// change how the picture is shown, so a file that has one is left as it is.
const PLAIN_CHUNKS = new Set(['IHDR', 'PLTE', 'tRNS', 'IDAT', 'IEND']);

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
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), 8 + data.length);
  return out;
};

/** True for a plain, non-interlaced file whose only chunks are the ones that matter. */
const isPlain = (buf: Buffer): boolean => {
  if (buf.length < 33 || !buf.subarray(0, 8).equals(SIGNATURE)) return false;
  if (buf[28] !== 0) return false; // interlaced
  if (buf[24] === 16) return false; // 16 bits a channel: the decode below would round it
  for (let at = 8; at < buf.length;) {
    const length = buf.readUInt32BE(at);
    if (!PLAIN_CHUNKS.has(buf.toString('ascii', at + 4, at + 8))) return false;
    at += 12 + length;
  }
  return true;
};

/** The five PNG filters for one row, each as the bytes to store (bpp is 1 for indexed pictures). */
const filtered = (type: number, row: Uint8Array, prior: Uint8Array): Buffer => {
  const out = Buffer.alloc(row.length + 1);
  out[0] = type;
  for (let i = 0; i < row.length; i++) {
    const a = i > 0 ? (row[i - 1] ?? 0) : 0;
    const b = prior[i] ?? 0;
    const c = i > 0 ? (prior[i - 1] ?? 0) : 0;
    let predict = 0;
    if (type === 1) predict = a;
    else if (type === 2) predict = b;
    else if (type === 3) predict = (a + b) >> 1;
    else if (type === 4) {
      const p = a + b - c;
      const pa = Math.abs(p - a);
      const pb = Math.abs(p - b);
      const pc = Math.abs(p - c);
      predict = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
    }
    out[i + 1] = ((row[i] ?? 0) - predict) & 0xff;
  }
  return out;
};
const cost = (row: Buffer): number => {
  let sum = 0;
  for (let i = 1; i < row.length; i++) {
    const v = row[i] ?? 0;
    sum += v < 128 ? v : 256 - v;
  }
  return sum;
};

/** The image data: every row either unfiltered, or with the filter that looks cheapest. */
const rowsOf = (packed: Uint8Array[], adaptive: boolean): Buffer => {
  const zero = new Uint8Array(packed[0]?.length ?? 0);
  return Buffer.concat(
    packed.map((row, y) => {
      const prior = y > 0 ? (packed[y - 1] ?? zero) : zero;
      if (!adaptive) return filtered(0, row, prior);
      let best = filtered(0, row, prior);
      let bestCost = cost(best);
      for (let type = 1; type <= 4; type++) {
        const candidate = filtered(type, row, prior);
        const c = cost(candidate);
        if (c < bestCost) {
          best = candidate;
          bestCost = c;
        }
      }
      return best;
    }),
  );
};

export const packPng = (source: Buffer): Buffer | null => {
  if (!isPlain(source)) return null;
  let decoded: PNG;
  try {
    decoded = PNG.sync.read(source);
  } catch {
    return null;
  }
  const { width, height, data } = decoded;
  // The palette, in order of first use, then moved so that clear entries come first: the
  // transparency list can then stop at the last entry that is not fully opaque.
  const seen = new Map<number, number>();
  const colours: number[] = [];
  const indexed = new Uint32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const key = data.readUInt32BE(i * 4);
    let at = seen.get(key);
    if (at === undefined) {
      if (colours.length === MAX_COLOURS) return null;
      at = colours.length;
      seen.set(key, at);
      colours.push(key);
    }
    indexed[i] = at;
  }
  const order = colours
    .map((_, i) => i)
    .sort((a, b) => ((colours[a] ?? 0) & 0xff) - ((colours[b] ?? 0) & 0xff) || a - b);
  const newIndex = new Map(order.map((old, i) => [old, i]));
  const palette = Buffer.alloc(order.length * 3);
  const alpha = Buffer.alloc(order.length);
  order.forEach((old, i) => {
    const key = colours[old] ?? 0;
    palette[i * 3] = (key >>> 24) & 0xff;
    palette[i * 3 + 1] = (key >>> 16) & 0xff;
    palette[i * 3 + 2] = (key >>> 8) & 0xff;
    alpha[i] = key & 0xff;
  });
  let opaqueFrom = alpha.length;
  while (opaqueFrom > 0 && alpha[opaqueFrom - 1] === 255) opaqueFrom--;

  const depth = order.length <= 2 ? 1 : order.length <= 4 ? 2 : order.length <= 16 ? 4 : 8;
  const perByte = 8 / depth;
  const rowBytes = Math.ceil(width / perByte);
  const packed: Uint8Array[] = [];
  for (let y = 0; y < height; y++) {
    const row = new Uint8Array(rowBytes);
    for (let x = 0; x < width; x++) {
      const value = newIndex.get(indexed[y * width + x] ?? 0) ?? 0;
      const slot = Math.floor(x / perByte);
      row[slot] = (row[slot] ?? 0) | (value << (8 - depth - (x % perByte) * depth));
    }
    packed.push(row);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = depth;
  ihdr[9] = 3; // indexed colour
  const deflate = (raw: Buffer): Buffer => deflateSync(raw, { level: 9, memLevel: 9 });
  const idat = [false, true]
    .map((adaptive) => deflate(rowsOf(packed, adaptive)))
    .reduce((a, b) => (b.length < a.length ? b : a));
  const out = Buffer.concat([
    SIGNATURE,
    chunk('IHDR', ihdr),
    chunk('PLTE', palette),
    ...(opaqueFrom > 0 ? [chunk('tRNS', alpha.subarray(0, opaqueFrom))] : []),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  if (out.length >= source.length) return null;
  // The proof: decode the new file and compare every pixel with the old one.
  try {
    if (!PNG.sync.read(out).data.equals(data)) return null;
  } catch {
    return null;
  }
  return out;
};
