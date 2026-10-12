import type { GameState, Settings } from '../state/game-state';
import { ok, refuse, type ApplyResult } from './types';

const ALLOWED: { readonly [K in keyof Settings]: readonly Settings[K][] } = {
  theme: ['dark', 'light'],
  bestBuyHint: [true, false],
  rateUnit: ['minute', 'hour'],
  reduceMotion: ['system', 'on', 'off'],
};

export const setSettings = (state: GameState, patch: Partial<Settings>): ApplyResult => {
  if (typeof patch !== 'object' || patch === null) return refuse('No settings given.');
  for (const [key, value] of Object.entries(patch)) {
    const allowed = (ALLOWED as Record<string, readonly unknown[] | undefined>)[key];
    if (!allowed) return refuse(`Unknown setting: ${key}.`);
    if (!allowed.includes(value)) return refuse(`${String(value)} isn't a valid ${key}.`);
  }
  state.settings = { ...state.settings, ...patch };
  return ok;
};
