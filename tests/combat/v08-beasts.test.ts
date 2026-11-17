// Plan T19.5 (decisions D631, D632, D635; technical design §26.3):
// Great Beasts #4 & #5 (The Thorn-Stag & The Beacon-Bane), direct Fire attacks on EventCreature,
// boss.order of 5, Courtyard Marks #7–#8, and Great Beasts shelf / mark unlock integration.
import { describe, expect, it } from 'vitest';
import { balance } from '../../src/content/balance';
import { COURTYARD_MARK_IDS, markForBoss } from '../../src/content/courtyard-marks';
import { BOSS_IDS, bosses } from '../../src/content/great-beasts';
import {
  runFight,
  type EventInstance,
  type FightResult,
  type HunterSnapshot,
} from '../../src/core/combat';
import { buildMonster } from '../../src/core/combat/build';
import { apply } from '../../src/core/commands/apply';
import { createNewGame } from '../../src/core/state/new-game';
import { noPreparation, type GameState, type Preparation } from '../../src/core/state/game-state';
import { bossOfVisit, passOfVisit } from '../../src/core/systems/boss';
import { greatBeastsShelf } from '../../src/core/systems/events-results';
import { cyclic, lines, snap, sponge } from './helpers';

const NOW = 1_700_000_000_000;
const POOL = 24000;

const event = (id: EventInstance['event'], over: Partial<EventInstance> = {}): EventInstance => ({
  event: id,
  tier: 3,
  ...over,
});

const prep = (over: Partial<Preparation> = {}): Preparation => ({
  ...noPreparation(),
  ...over,
});

const tank = (
  id: Parameters<typeof sponge>[0],
  over: Partial<HunterSnapshot> = {},
): HunterSnapshot => {
  const s = sponge(id);
  return { ...s, base: { ...s.base, health: 100000, might: 1, armor: 8, speed: 7 }, ...over };
};

const run = (
  party: readonly HunterSnapshot[],
  monster: EventInstance,
  p: Preparation = noPreparation(),
  rolls = cyclic([0.5]),
  rulesVersion?: number,
): FightResult =>
  runFight({
    party,
    monster,
    location: null,
    prep: p,
    rolls,
    rulesVersion,
  });

describe('Great Beasts #4 & #5 data and Courtyard Marks (D631, D635)', () => {
  it('registers all 5 Great Beasts in boss.order order and 8 Courtyard Marks', () => {
    expect(BOSS_IDS).toEqual([
      'lindworm-of-velk-fjord',
      'barrow-king',
      'mother-of-the-river',
      'thorn-stag',
      'beacon-bane',
    ]);
    expect(balance.boss.order.value).toEqual([
      'lindworm',
      'barrow-king',
      'mother-of-the-river',
      'thorn-stag',
      'beacon-bane',
    ]);
    expect(COURTYARD_MARK_IDS).toHaveLength(8);
    expect(markForBoss('thorn-stag')).toBe('thorn-antler-rack');
    expect(markForBoss('beacon-bane')).toBe('beacon-iron-urn');
  });

  it('defines The Thorn-Stag with exact D631 stats, resistances, abilities and reagent', () => {
    const b = bosses['thorn-stag'];
    expect(b.name).toBe('The Thorn-Stag');
    expect(b.family).toBe('field-and-forest-spirits');
    expect([b.might, b.armor, b.speed, b.attacks]).toEqual([42, 11, 10, 1]);
    expect(b.damage ?? 'steel').toBe('steel');
    expect(b.resist).toEqual({
      steel: 1.5,
      silver: 1,
      fire: 1.25,
      frost: 0.75,
      rune: 1,
      venom: 0.5,
    });
    expect(b.abilities).toEqual([
      { kind: 'thornSnare', name: 'Thorn-Snare', every: 3 },
      { kind: 'brambleSweep', name: 'Bramble-Sweep', every: 4 },
    ]);
    expect(b.reagent).toBe('thornwood');
  });

  it('defines The Beacon-Bane with direct Fire damage, exact D631 stats, resistances, abilities and reagent', () => {
    const b = bosses['beacon-bane'];
    expect(b.name).toBe('The Beacon-Bane');
    expect(b.family).toBe('cursed');
    expect([b.might, b.armor, b.speed, b.attacks]).toEqual([44, 9, 9, 2]);
    expect(b.damage).toBe('fire');
    expect(b.resist).toEqual({
      steel: 0.75,
      silver: 1,
      fire: 0.25,
      frost: 1.25,
      rune: 1.5,
      venom: 1.25,
    });
    expect(b.abilities).toEqual([
      { kind: 'pitchFlare', name: 'Pitch-Flare', maxHealthFraction: 0.015 },
      { kind: 'curseBrand', name: 'Curse-Brand', every: 4, healCut: 0.5, actions: 2 },
    ]);
    expect(b.reagent).toBe('noon-poppy');
  });
});

describe('The Thorn-Stag: Thorn-Snare and Bramble-Sweep', () => {
  it('Thorn-Snare holds the fastest standing hunter on every 3rd action without replacing its attack', () => {
    const slow = tank('halvar', { base: { health: 100000, might: 1, armor: 8, speed: 5 } });
    const fast = tank('zora', { base: { health: 100000, might: 1, armor: 8, speed: 12 } });
    const r = run([slow, fast], event('thorn-stag', { healthOverride: POOL }));

    const snares = lines(r, 'ability', 'thorn-stag').filter((e) => e.text.includes('Thorn-Snare'));
    expect(snares.length).toBeGreaterThanOrEqual(2);
    expect(snares.every((e) => e.target === 'zora')).toBe(true);

    // Every 3rd action (NOT the 1st): check sequence of monster actions up to action 6.
    const actions: string[] = [];
    for (const e of r.log.filter((l) => l.actor === 'thorn-stag')) {
      if (e.kind === 'ability' && e.text.includes('Thorn-Snare')) actions.push(`snare@${e.tick}`);
      else if (e.kind === 'hit' || e.kind === 'miss' || e.kind === 'crit')
        actions.push(`hit@${e.tick}`);
      else if (e.kind === 'ability' && e.text.includes('Bramble-Sweep'))
        actions.push(`sweep@${e.tick}`);
    }
    expect(actions[0]).toMatch(/^hit@/); // 1st action: normal attack only
    expect(actions[1]).toMatch(/^hit@/); // 2nd action: normal attack only
    expect(actions[2]).toMatch(/^snare@/); // 3rd action: Thorn-Snare + normal attack
    expect(actions[3]).toBe(`hit@${actions[2]?.split('@')[1]}`);
    expect(lines(r, 'skip', 'zora').length).toBeGreaterThanOrEqual(2);
  });

  it('Bramble-Sweep lashes every standing hunter on every 4th action with direct Steel attacks', () => {
    const a = tank('halvar', { base: { health: 100000, might: 1, armor: 0, speed: 7 } });
    const b = tank('zora', { base: { health: 100000, might: 1, armor: 12, speed: 7 } });
    const c = tank('ostap', { base: { health: 100000, might: 1, armor: 6, speed: 7 } });
    const r = run([a, b, c], event('thorn-stag', { healthOverride: POOL }));

    const sweeps = lines(r, 'ability', 'thorn-stag').filter((e) =>
      e.text.includes('Bramble-Sweep'),
    );
    expect(sweeps.length).toBeGreaterThanOrEqual(2);
    const firstSweep = sweeps[0];
    if (!firstSweep) throw new Error('expected first Bramble-Sweep');
    const tickHits = r.log.filter(
      (e) =>
        e.actor === 'thorn-stag' &&
        e.tick === firstSweep.tick &&
        (e.kind === 'hit' || e.kind === 'crit' || e.kind === 'miss'),
    );
    expect(tickHits.map((e) => e.target).sort()).toEqual(['halvar', 'ostap', 'zora']);
    // Armor reduces Steel sweep damage cleanly: halvar (armor 0) = 42, ostap (6) = 36, zora (12) = 30
    const byTarget = Object.fromEntries(tickHits.map((e) => [e.target, e.amount]));
    expect(byTarget).toEqual({ halvar: 42, ostap: 36, zora: 30 });
  });

  it('Saltburst cancels Thorn-Snare and Steadfast Draught prevents lost actions', () => {
    const fast = tank('zora', { base: { health: 100000, might: 1, armor: 8, speed: 12 } });
    const burst = run(
      [fast],
      event('thorn-stag', { healthOverride: POOL }),
      prep({ bombs: ['saltburst'] }),
    );
    const bomb = burst.log.find((e) => e.kind === 'bomb' && e.text.includes('Thorn-Snare'));
    expect(bomb).toBeDefined();
    expect(bomb?.text).toContain('cancelled');

    const steadfast = run(
      [fast],
      event('thorn-stag', { healthOverride: POOL }),
      prep({ potions: { zora: 'steadfast-draught' } }),
    );
    expect(steadfast.log.some((e) => e.text.includes('Steadfast Draught'))).toBe(true);
    expect(lines(steadfast, 'skip', 'zora').length).toBeLessThan(
      lines(run([fast], event('thorn-stag', { healthOverride: POOL })), 'skip', 'zora').length,
    );
  });
});

describe('The Beacon-Bane: Fire attacks, Pitch-Flare, and Curse-Brand', () => {
  it('deals direct Fire attacks under rulesVersion >= 8 and falls back to steel under rulesVersion <= 7', () => {
    expect(buildMonster(event('beacon-bane'), 1, undefined, 0, 8).damage).toBe('fire');
    expect(buildMonster(event('beacon-bane'), 1, undefined, 0, 7).damage).toBe('steel');

    const bare = tank('halvar', { base: { health: 100000, might: 1, armor: 0, speed: 7 } });
    const plated = { ...bare, armorGear: 'emberwright-plate' as const };
    const touched = { ...bare, traits: ['fire-touched'] as const };

    const rBare = run([bare], event('beacon-bane', { healthOverride: POOL }));
    const rPlated = run([plated], event('beacon-bane', { healthOverride: POOL }));
    const rCold = run(
      [bare],
      event('beacon-bane', { healthOverride: POOL }),
      prep({ potions: { halvar: 'coldwater-draught' } }),
    );
    const rTouchedCold = run(
      [touched],
      event('beacon-bane', { healthOverride: POOL }),
      prep({ potions: { halvar: 'coldwater-draught' } }),
    );
    const rPlateCold = run(
      [plated],
      event('beacon-bane', { healthOverride: POOL }),
      prep({ potions: { halvar: 'coldwater-draught' } }),
    );

    const hit = (r: FightResult) => lines(r, 'hit', 'beacon-bane')[0];
    expect(hit(rBare)?.text).toContain('Fire 44.00');
    expect(hit(rBare)?.amount).toBe(44); // Might 44, Armor 0
    expect(hit(rPlated)?.amount).toBe(27); // Emberwright Plate (+8 Armor & -25% Fire): (44 - 8) * 0.75 = 27
    expect(hit(rCold)?.amount).toBe(22); // Coldwater Draught -50%: 44 * 0.50 = 22
    expect(hit(rTouchedCold)?.amount).toBe(13); // Fire-Touched (-20%) + Coldwater (-50%) = -70%: 44 * 0.30 = 13.2 -> 13
    expect(hit(rPlateCold)?.amount).toBe(9); // Plate (+8 Armor, -25%) + Coldwater (-50%) = 36 * 0.25 = 9
  });

  it('Pitch-Flare deals 1.5% max Health Fire damage ignoring Armor each action and Saltburst cancels/blocks it', () => {
    const bare = tank('halvar', { base: { health: 100000, might: 1, armor: 40, speed: 7 } });
    const plated = { ...bare, armorGear: 'emberwright-plate' as const };

    const rBare = run([bare], event('beacon-bane', { healthOverride: POOL }));
    const rPlated = run([plated], event('beacon-bane', { healthOverride: POOL }));
    const rCold = run(
      [bare],
      event('beacon-bane', { healthOverride: POOL }),
      prep({ potions: { halvar: 'coldwater-draught' } }),
    );

    const flare = (r: FightResult) =>
      lines(r, 'ability', 'beacon-bane').filter((e) => e.text.includes('Pitch-Flare'));

    expect(flare(rBare).length).toBeGreaterThanOrEqual(4);
    expect(flare(rBare)[0]?.amount).toBe(1500); // 1.5% of 100,000 ignoring Armor 40
    expect(flare(rBare)[0]?.text).toContain('Fire 1500.00 = 1500');
    expect(flare(rPlated)[0]?.amount).toBe(1125); // 1500 * (1 - 0.25) = 1125
    expect(flare(rCold)[0]?.amount).toBe(750); // 1500 * (1 - 0.50) = 750

    // Saltburst triggers on Beacon-Bane's 1st Pitch-Flare, deals Rune damage, and blocks for 3 actions.
    const rSalt = run(
      [bare],
      event('beacon-bane', { healthOverride: POOL }),
      prep({ bombs: ['saltburst'] }),
    );
    const bomb = rSalt.log.find((e) => e.kind === 'bomb' && e.text.includes('Pitch-Flare'));
    expect(bomb).toBeDefined();
    expect(flare(rSalt)[0]?.tick).toBeGreaterThan(bomb?.tick ?? 0);
  });

  it('Curse-Brand cuts healing by 50% on highest-Might hunter for 2 actions every 4th action, then expires', () => {
    // Halvar (highest Might, drops below 70% HP before Beacon-Bane action 4 while decoy/mender stay >95% HP)
    // gets branded on Beast action 4; Vesna heals Halvar before, during the 2-action window, and after expiry.
    const champion = snap('halvar', {
      traits: [],
      skill: undefined,
      base: { health: 700, might: 30, armor: 10, speed: 6 },
    });
    const decoy = tank('zora', { traits: [], skill: undefined });
    const mender = tank('vesna', {
      traits: [],
      skill: undefined,
      base: { health: 100000, might: 20, armor: 8, speed: 12 },
    });

    const r = run([decoy, champion, mender], event('beacon-bane', { healthOverride: POOL }));
    const brands = lines(r, 'ability', 'beacon-bane').filter((e) => e.text.includes('Curse-Brand'));
    expect(brands.length).toBeGreaterThanOrEqual(1);
    expect(brands[0]?.target).toBe('halvar'); // highest Might among standing hunters
    expect(lines(r, 'skip', 'halvar')).toHaveLength(0); // Curse-Brand cuts healing, never holds

    const firstBrand = brands[0];
    if (!firstBrand) throw new Error('expected Curse-Brand');
    // Check Halvar's own actions after firstBrand: window expires at the end of his 2nd action after being branded.
    const halvarActs = r.log
      .filter(
        (e) =>
          e.actor === 'halvar' &&
          e.tick >= firstBrand.tick &&
          (e.kind === 'hit' || e.kind === 'crit' || e.kind === 'miss'),
      )
      .map((e) => e.tick);
    expect(halvarActs.length).toBeGreaterThanOrEqual(3);
    const secondActTick = halvarActs[1] ?? 9999;

    const healsDuring = r.log.filter(
      (e) =>
        e.kind === 'heal' &&
        e.target === 'halvar' &&
        e.tick >= firstBrand.tick &&
        e.tick <= secondActTick,
    );
    const healsBefore = r.log.filter(
      (e) => e.kind === 'heal' && e.target === 'halvar' && e.tick < firstBrand.tick,
    );
    const healsAfterExpiry = r.log.filter(
      (e) =>
        e.kind === 'heal' &&
        e.target === 'halvar' &&
        e.tick > secondActTick &&
        (!brands[1] || e.tick < brands[1].tick),
    );
    expect(healsBefore[0]?.amount).toBe(30); // mender.healMult 1.5 * 20
    expect(healsDuring.length).toBeGreaterThan(0);
    expect(healsDuring.every((e) => e.amount === 15)).toBe(true); // 50% of 30
    expect(healsAfterExpiry.some((e) => e.amount === 30)).toBe(true); // restored after 2 actions
  });
});

describe('Events integration across 5-boss rotation', () => {
  const ready = (seed: string): GameState => {
    const s = createNewGame(seed, NOW);
    apply(s, { type: 'debug.prepareEndgameRoster' }, NOW);
    s.cycle.age = 'bastion';
    s.events.opened = true;
    apply(s, { type: 'debug.fillBank' }, NOW);
    return s;
  };

  it('cycles through all 5 bosses and advances pass at visit 5', () => {
    expect(bossOfVisit(0)).toBe('lindworm-of-velk-fjord');
    expect(bossOfVisit(1)).toBe('barrow-king');
    expect(bossOfVisit(2)).toBe('mother-of-the-river');
    expect(bossOfVisit(3)).toBe('thorn-stag');
    expect(bossOfVisit(4)).toBe('beacon-bane');
    expect(bossOfVisit(5)).toBe('lindworm-of-velk-fjord');
    expect(passOfVisit(4)).toBe(0);
    expect(passOfVisit(5)).toBe(1);
  });

  it('awards thornwood + thorn-antler-rack on Thorn-Stag kill and noon-poppy + beacon-iron-urn on Beacon-Bane kill', () => {
    const s = ready('kill-4-and-5');
    const party = s.roster.active.slice(0, 4);

    s.events.boss = { visit: 3, tier: 5, pool: 1, paid: 3, attempts: 4 };
    expect(apply(s, { type: 'boss.attempt', party }, NOW).ok).toBe(true);
    expect(s.events.last?.boss?.boss).toBe('thorn-stag');
    expect(s.events.last?.boss?.killed).toBe(true);
    expect(s.events.last?.boss?.reagents).toEqual({ thornwood: 6 });
    expect(s.cosmetics.marks['thorn-antler-rack']).toBe(true);
    expect(s.events.boss.visit).toBe(4);

    apply(s, { type: 'debug.fillBank' }, NOW);
    apply(s, { type: 'debug.endRests' }, NOW);
    s.events.boss = { visit: 4, tier: 5, pool: 1, paid: 3, attempts: 4 };
    expect(apply(s, { type: 'boss.attempt', party }, NOW).ok).toBe(true);
    expect(s.events.last?.boss?.boss).toBe('beacon-bane');
    expect(s.events.last?.boss?.killed).toBe(true);
    expect(s.events.last?.boss?.reagents).toEqual({ 'noon-poppy': 6 });
    expect(s.cosmetics.marks['beacon-iron-urn']).toBe(true);
    expect(s.events.boss.visit).toBe(5);
  });

  it('lists all 5 Great Beasts and 3 quarries on the Great Beasts shelf', () => {
    const s = ready('shelf-8');
    s.events.boss = { visit: 3, tier: 5, pool: 1000, paid: 0, attempts: 1 };
    const shelf = greatBeastsShelf(s);
    expect(shelf.entries).toHaveLength(8);
    expect(shelf.entries.find((e) => e.id === 'thorn-stag')?.identified).toBe(true);
    expect(shelf.entries.find((e) => e.id === 'beacon-bane')?.identified).toBe(false);
  });
});
