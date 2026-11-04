import {
  hunterPortraitId,
  hunterSpriteId,
  monsterPortraitId,
  monsterSpriteId,
} from '../../content/assets';
import { hunters, type HunterId } from '../../content/hunters';
import { monsters } from '../../content/monsters';
import { runFight } from '../combat';
import type { FightResult } from '../combat/types';
import { playbackSteps, type FloorCombatant, type FloorPlayback } from '../delves/view';
import { fightReplayDiffers, OLDER_RULES_NOTE } from '../replay-check';
import { seeded } from '../rng';
import type { FightRef, GameState } from '../state/game-state';

// GDD §9.4, technical design §24.2 (v1.7, D606): pure read-only Contract fight playback view.
// Re-runs the settled fight deterministically from its frozen FightRef without mutating state.

export interface ContractPlayback extends FloorPlayback {
  readonly fight: FightResult;
  readonly differs: boolean;
  readonly olderNote: string | null;
}

/** Looks up a contract's recent fight reference while it is still kept in `log.recentFights`. */
export const findFight = (state: GameState, contractId: string): FightRef | undefined =>
  state.log.recentFights.find((f) => f.contractId === contractId);

/** Replays a saved FightRef deterministically from its frozen seed and party snapshots. */
export const replayFight = (ref: FightRef): FightResult =>
  runFight({
    party: ref.party,
    monster: ref.monster,
    location: ref.location,
    rolls: seeded(ref.seed),
    prep: ref.prep,
    alchemy: ref.alchemy,
  });

/** Builds the Arena playback view (`{Monster} · T{tier}`) for a settled contract fight. */
export const contractPlayback = (_state: GameState, ref: FightRef): ContractPlayback => {
  if (!('monster' in ref.monster)) throw new Error('Not a contract fight.');
  const species = ref.monster.monster;
  const tier = ref.monster.tier;
  const fight = replayFight(ref);
  const differs = fightReplayDiffers(ref, fight);
  const combatants: FloorCombatant[] = [
    ...fight.hunters.map((h) => ({
      id: h.id,
      name: hunters[h.id as HunterId].shortName,
      side: 'hunter' as const,
      spriteId: hunterSpriteId(h.id as HunterId),
      portraitId: hunterPortraitId(h.id as HunterId),
      start: 1,
    })),
    ...fight.monsters.map((m) => ({
      id: m.id,
      name: m.name,
      side: 'monster' as const,
      spriteId: monsterSpriteId(species),
      portraitId: monsterPortraitId(species),
      start: 1,
    })),
  ];
  const { steps, end } = playbackSteps(fight, combatants);
  return {
    floor: 0,
    guardian: false,
    title: `${monsters[species].name} · T${tier}`,
    subtitle: '',
    combatants,
    steps,
    end,
    result: fight.result,
    log: fight.log.map((l) => ({ tick: l.tick, text: l.text })),
    fight,
    differs,
    olderNote: differs ? OLDER_RULES_NOTE : null,
  };
};
