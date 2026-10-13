import { seeded, type RollSource } from './roll-source';

// Technical design §7.2: every kind of randomness has its own seed string, so
// adding a roll in one system never shifts another system's results.
export type StreamPart = string | number;

/** Joins the parts of a stream seed: streamSeed(gameSeed, 'board', 3) → "<seed>:board:3". */
export const streamSeed = (gameSeed: string, ...parts: readonly StreamPart[]): string =>
  [gameSeed, ...parts].join(':');

export const stream = (gameSeed: string, ...parts: readonly StreamPart[]): RollSource =>
  seeded(streamSeed(gameSeed, ...parts));
