import type { GameState } from '../state/game-state';
import type { VigilState } from '../state/vigil-state';
import { bool, count, Invalid, obj } from './guards';

// Technical design §21.1 and §21.6 (D543): the Rising Vigil part of the save guard. An unknown
// field drops with a warning; a bad switch or count refuses the load as damage.
export const vigilFrom = (v: unknown, warnings: string[]): VigilState => {
  const o = obj(v, 'vigil');
  for (const k of Object.keys(o))
    if (k !== 'on' && k !== 'stands') warnings.push(`Dropped unknown vigil.${k}.`);
  return { on: bool(o.on, 'vigil.on'), stands: count(o.stands, 'vigil.stands') };
};

/** The saved level of a stand record: an integer of 1 or more, or absent (0). */
export const vigilLevelFrom = (v: unknown, where: string): { vigilLevel?: number } => {
  if (v === undefined) return {};
  return { vigilLevel: positiveCount(v, where) };
};

const positiveCount = (v: unknown, where: string): number => {
  const n = count(v, where);
  if (n < 1) throw new Invalid(`${where} must be 1 or more.`);
  return n;
};

/**
 * `stands` could be derived from the stand records with a level (D549 (8)), so a mismatch is a
 * warning only: never a refusal, never a repair. Ignored once the debug panel has been used.
 */
export const reconcileVigil = (state: GameState, warnings: string[]): GameState => {
  if (state.meta.debugUsed) return state;
  const fought = state.cycles.filter((c) => (c.stand?.vigilLevel ?? 0) > 0).length;
  if (fought !== state.vigil.stands)
    warnings.push(
      `vigil.stands says ${state.vigil.stands}, but ${fought} recorded stands were fought with Rising Vigil; kept.`,
    );
  return state;
};
