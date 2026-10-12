import { failure, type Result } from '../result';
import type { SaveEnvelope } from './envelope';
import { loadEnvelope } from './load';
import type { Validated } from './validate';

// Technical design §9.3: a save code is
//   LH1. + base64url(deflate-raw(UTF-8 JSON envelope)) + "." + 8-hex FNV-1a checksum
// or LH0. with no compression when the browser lacks CompressionStream. Import
// checks, in order: prefix, checksum, decompression, parsing, version,
// migration, validation. A failure never touches the current save.

/** Compression is a browser feature, so the platform layer passes it in. */
export interface Codec {
  compress(bytes: Uint8Array): Promise<Uint8Array>;
  decompress(bytes: Uint8Array): Promise<Uint8Array>;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export const fnv1a = (text: string): string => {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
};

export const toBase64Url = (bytes: Uint8Array): string => {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const n = ((bytes[i] ?? 0) << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    const chars = Math.min(4, Math.ceil(((bytes.length - i) * 8) / 6));
    for (let c = 0; c < chars; c++) out += ALPHABET[(n >> (18 - 6 * c)) & 63];
  }
  return out;
};

/** Null if the text has characters outside the alphabet or an impossible length. */
export const fromBase64Url = (text: string): Uint8Array | null => {
  if (text.length % 4 === 1) return null;
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i += 4) {
    const group = text.slice(i, i + 4);
    let n = 0;
    for (let c = 0; c < 4; c++) {
      const ch = group[c];
      const v = ch === undefined ? 0 : ALPHABET.indexOf(ch);
      if (v < 0) return null;
      n = (n << 6) | v;
    }
    const count = Math.floor((group.length * 6) / 8);
    for (let b = 0; b < count; b++) bytes.push((n >> (16 - 8 * b)) & 255);
  }
  return Uint8Array.from(bytes);
};

export const encodeSaveCode = async (env: SaveEnvelope, codec: Codec | null): Promise<string> => {
  const bytes = new TextEncoder().encode(JSON.stringify(env));
  const prefix = codec ? 'LH1.' : 'LH0.';
  const payload = toBase64Url(codec ? await codec.compress(bytes) : bytes);
  return `${prefix}${payload}.${fnv1a(payload)}`;
};

export const IMPORT_ERRORS = {
  prefix: "That doesn't look like a Last Hold save code. Codes start with LH1. or LH0.",
  checksum: 'This code is damaged: part of it is missing or changed. Copy it again in full.',
  unsupported: "This browser can't unpack compressed codes. Try importing the save file instead.",
  unpack: "This code couldn't be unpacked. It may be damaged.",
  parse: "This code unpacked, but its contents aren't a readable save.",
} as const;

export const decodeSaveCode = async (
  code: string,
  codec: Codec | null,
): Promise<Result<Validated>> => {
  const text = code.replace(/\s+/g, '');
  const compressed = text.startsWith('LH1.');
  if (!compressed && !text.startsWith('LH0.')) return failure(IMPORT_ERRORS.prefix);
  const body = text.slice('LH1.'.length);
  const dot = body.lastIndexOf('.');
  const payload = dot < 0 ? '' : body.slice(0, dot);
  if (dot < 0 || fnv1a(payload) !== body.slice(dot + 1).toLowerCase())
    return failure(IMPORT_ERRORS.checksum);
  const raw = fromBase64Url(payload);
  if (!raw) return failure(IMPORT_ERRORS.checksum);
  let bytes = raw;
  if (compressed) {
    if (!codec) return failure(IMPORT_ERRORS.unsupported);
    try {
      bytes = await codec.decompress(raw);
    } catch {
      return failure(IMPORT_ERRORS.unpack);
    }
  }
  let json: unknown;
  try {
    json = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    return failure(IMPORT_ERRORS.parse);
  }
  return loadEnvelope(json);
};

/** A save file is the plain envelope JSON, human-readable on purpose (§9.3). */
export const encodeSaveFile = (env: SaveEnvelope): string => JSON.stringify(env, null, 2);

export const decodeSaveFile = (text: string): Result<Validated> => {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return failure("This file isn't a readable save. Pick a file the game exported.");
  }
  return loadEnvelope(json);
};
