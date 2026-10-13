// A fresh game seed (technical design §7.2). Randomness for seeds lives here,
// never in core/, which only ever receives the seed string.
export const randomSeed = (): string => {
  const words = new Uint32Array(2);
  crypto.getRandomValues(words);
  return Array.from(words, (w) => w.toString(16).padStart(8, '0')).join('');
};
