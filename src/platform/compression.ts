import type { Codec } from '../core/save';

// Technical design §9.3: deflate-raw through the browser's own CompressionStream,
// no dependency. Null where the browser lacks it; codes then use LH0.
const pipe = async (
  bytes: Uint8Array,
  stream: CompressionStream | DecompressionStream,
): Promise<Uint8Array> => {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
};

export const browserCodec = (): Codec | null => {
  if (typeof CompressionStream === 'undefined' || typeof DecompressionStream === 'undefined')
    return null;
  try {
    new CompressionStream('deflate-raw');
  } catch {
    return null;
  }
  return {
    compress: (bytes) => pipe(bytes, new CompressionStream('deflate-raw')),
    decompress: (bytes) => pipe(bytes, new DecompressionStream('deflate-raw')),
  };
};
