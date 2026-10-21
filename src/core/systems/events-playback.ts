import {
  eventCreatureSpriteId,
  eventCreaturePortraitId,
  hunterSpriteId,
} from '../../content/assets';
import { bosses, type BossId } from '../../content/great-beasts';
import { hunters, type HunterId } from '../../content/hunters';
import { quarries, type QuarryId } from '../../content/hunts';
import { runFight } from '../combat';
import { playbackSteps, type FloorCombatant, type FloorPlayback } from '../delves/view';
import { seeded } from '../rng';
import type { FightRef, GameState } from '../state/game-state';
import { poolAtTier } from './boss';

// GDD §9.17 (plan T9.15): an event attempt plays back like a Delve floor. The attempt was worked out
// at once from its seed (boss.ts, hunt.ts); this runs the same fight again with its log, so what it
// shows is what happened. The log is regenerated, never stored (technical design §5.3).

const isBoss = (id: string): id is BossId => id in bosses;

/** The fight a kept event reference stands for, as a playback. */
export const eventPlayback = (ref: FightRef): FloorPlayback => {
  if (!('event' in ref.monster)) throw new Error('Not an event fight.');
  const creature = ref.monster.event;
  const r = runFight({
    party: ref.party,
    monster: ref.monster,
    location: null,
    rolls: seeded(ref.seed),
    prep: ref.prep,
    alchemy: ref.alchemy,
  });
  // A boss's bar is its share of the whole pool the visit began with, so a hurt boss shows hurt.
  const boss = isBoss(creature);
  const poolStart = boss ? poolAtTier(ref.monster.tier) : 0;
  const before = ref.monster.healthOverride ?? 0;
  const combatants: FloorCombatant[] = [
    ...r.hunters.map((h) => ({
      id: h.id,
      name: hunters[h.id as HunterId].shortName,
      side: 'hunter' as const,
      spriteId: hunterSpriteId(h.id as HunterId),
      portraitId: `portrait.hunter.${h.id}`,
      start: 1,
    })),
    ...r.monsters.map((m) => ({
      id: m.id,
      name: m.name,
      side: 'monster' as const,
      spriteId: eventCreatureSpriteId(creature),
      portraitId: eventCreaturePortraitId(creature),
      start: boss && poolStart > 0 ? Math.min(1, before / poolStart) : 1,
    })),
  ];
  const barMax = boss
    ? Object.fromEntries(r.monsters.map((m) => [m.id, poolStart > 0 ? poolStart : m.maxHealth]))
    : {};
  const { steps, end } = playbackSteps(r, combatants, barMax);
  const name = boss ? bosses[creature].name : quarries[creature as QuarryId].name;
  return {
    floor: 0,
    guardian: false,
    title: name,
    subtitle: boss ? bosses[creature].whatItWas : quarries[creature as QuarryId].whatItWas,
    combatants,
    steps,
    end,
    result: r.result,
    log: r.log.map((l) => ({ tick: l.tick, text: l.text })),
  };
};

/** The newest attempt's playback, or null before any attempt. */
export const lastPlayback = (state: GameState): FloorPlayback | null => {
  const last = state.events.last;
  if (!last) return null;
  const ref = state.events.recent.find((f) => f.event?.attempt === last.attempt);
  return ref ? eventPlayback(ref) : null;
};
