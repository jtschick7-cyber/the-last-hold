import type { HunterId } from '../../src/content/hunters';
import type { Command } from '../../src/core/commands';
import { apply } from '../../src/core/commands';
import type { GameState } from '../../src/core/state/game-state';
import { keepRich, wear } from '../contracts/helpers';

export const PARTY: HunterId[] = ['halvar', 'zora', 'ostap'];

/** A Keep with a full roster, the three Delve hunters at a high level with the best gear. */
export const strongKeep = (
  seed = 'delve',
  rank: 'keep' | 'citadel' | 'bastion' = 'keep',
): GameState => {
  const s = keepRich(seed);
  s.cycle.age = rank;
  const rec = s.cycles[s.cycles.length - 1];
  if (rec) rec.ranks.keep = s.time;
  s.roster.active = [...PARTY, 'bjarna', 'vesna', 'radek'];
  for (const id of PARTY) {
    const h = s.hunters[id];
    if (h) h.level = 25;
    wear(s, id, 'wrights-blade');
    wear(s, id, 'emberwright-plate');
  }
  s.delve.allowance = 140;
  s.delve.allowanceAt = s.time;
  return s;
};

/** A weak party: level 1, no gear. */
export const frailKeep = (seed = 'frail'): GameState => {
  const s = strongKeep(seed);
  for (const id of PARTY) {
    const h = s.hunters[id];
    if (h) Object.assign(h, { level: 1, weapon: null, armor: null });
  }
  s.items = []; // no gear at all
  return s;
};

export const cmd = (s: GameState, c: Command) => apply(s, c, s.time);

/** Plays a run to its end: first door, first card, fight, until the run is over. Returns the steps taken. */
export const playRun = (
  s: GameState,
  choose: {
    door?: (doors: readonly string[]) => string;
    card?: (cards: readonly string[]) => string;
  } = {},
): string[] => {
  const steps: string[] = [];
  for (let guard = 0; guard < 80 && s.delve.run; guard++) {
    const stage = s.delve.run.stage;
    if (stage.kind === 'start') {
      const r = stage.patron
        ? cmd(s, {
            type: 'delve.chooseBlessing',
            blessing: choose.card?.(stage.cards) ?? (stage.cards[0] as string),
          })
        : cmd(s, { type: 'delve.chooseStart', patron: 'wolf' });
      if (!r.ok) throw new Error(r.reason);
      steps.push(`start:${stage.patron ?? 'wolf'}`);
    } else if (stage.kind === 'doors') {
      const door = (choose.door?.(stage.doors) ?? stage.doors[0]) as (typeof stage.doors)[number];
      const r = cmd(s, { type: 'delve.chooseDoor', patron: door });
      if (!r.ok) throw new Error(r.reason);
      steps.push(`door:${door}`);
    } else if (stage.kind === 'offer') {
      const card = choose.card?.(stage.cards) ?? (stage.cards[0] as string);
      const r = cmd(s, { type: 'delve.chooseBlessing', blessing: card });
      if (!r.ok) throw new Error(r.reason);
      steps.push(`card:${card}`);
    } else {
      const r = cmd(s, { type: 'delve.fight' });
      if (!r.ok) throw new Error(r.reason);
      steps.push(`fight:${s.delve.run?.floor ?? 'end'}`);
    }
  }
  return steps;
};
