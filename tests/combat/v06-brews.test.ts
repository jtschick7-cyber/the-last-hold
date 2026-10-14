// Plan T6.5: the six v0.6 brews in the fight (GDD §5.8.5, D201). One test per effect,
// then Herbwise, Spoil, Saltburst and the Last Stand's bomb order.
import { describe, expect, it } from 'vitest';
import { num } from '../../src/core/balance-access';
import { runFight, type FightResult, type HunterSnapshot } from '../../src/core/combat';
import { waveBombs } from '../../src/core/stand/engine';
import type { Preparation } from '../../src/core/state/game-state';
import { hunters } from '../../src/content/hunters';
import { cyclic, snap, sponge } from './helpers';

/** A hunter nobody can wear down in a short fight, keeping their traits (Herbwise). */
const tank = (
  id: 'halvar' | 'zora' | 'vesna',
  over: Partial<HunterSnapshot> = {},
): HunterSnapshot =>
  snap(id, { base: { ...hunters[id].stats, health: 10_000_000, might: 1 }, ...over });

const prep = (over: Partial<Preparation> = {}): Preparation => ({
  oils: {},
  potions: {},
  bombs: [],
  ...over,
});

const fight = (
  party: readonly HunterSnapshot[],
  monster: Parameters<typeof runFight>[0]['monster'],
  p: Preparation | undefined,
  rolls = cyclic([0.5]),
  location: Parameters<typeof runFight>[0]['location'] = 'field',
): FightResult => runFight({ party, monster, location, rolls, prep: p });

const text = (r: FightResult) => r.log.map((l) => l.text).join('\n');
const firstDealt = (r: FightResult, by: string): number => {
  const hit = r.log.find((l) => (l.kind === 'hit' || l.kind === 'crit') && l.actor === by);
  if (!hit?.dealt) throw new Error('no hit');
  return hit.dealt;
};

describe('Hidebane Oil and Wright’s Oil (the oil rule)', () => {
  it('Hidebane Oil adds 35% damage vs Beasts & Wilds and does nothing against the Dead', () => {
    const party = [snap('halvar')];
    const bare = fight(party, { monster: 'wolf', tier: 1 }, undefined, cyclic([0.5]));
    const oiled = fight(
      party,
      { monster: 'wolf', tier: 1 },
      prep({ oils: { halvar: 'hidebane-oil' } }),
      cyclic([0.5]),
    );
    expect(firstDealt(oiled, 'halvar')).toBeCloseTo(firstDealt(bare, 'halvar') * 1.35, 9);
    const wrong = fight(
      party,
      { monster: 'upyr', tier: 2 },
      prep({ oils: { halvar: 'hidebane-oil' } }),
      cyclic([0.5]),
    );
    const wrongBare = fight(party, { monster: 'upyr', tier: 2 }, undefined, cyclic([0.5]));
    expect(wrong.log.map((l) => l.text).filter((t) => !t.includes('Oil'))).toEqual(
      wrongBare.log.map((l) => l.text),
    );
  });

  it('Wright’s Oil adds 35% damage vs the Cursed', () => {
    const party = [snap('halvar')];
    const m = { monster: 'ribbonshade', tier: 2 } as const;
    const bare = fight(party, m, undefined, cyclic([0.5]), 'ruin');
    const oiled = fight(party, m, prep({ oils: { halvar: 'wrights-oil' } }), cyclic([0.5]), 'ruin');
    expect(firstDealt(oiled, 'halvar')).toBeCloseTo(firstDealt(bare, 'halvar') * 1.35, 9);
  });
});

describe('Coldwater Draught', () => {
  const noonHeat = (r: FightResult, who: string): number[] =>
    r.log
      .filter((l) => l.kind === 'ability' && l.target === who && l.text.startsWith('Noon Heat'))
      .map((l) => l.amount ?? 0);

  it('cuts the holder’s Fire damage taken by 40% for the whole fight', () => {
    const party = [tank('halvar'), tank('zora')];
    const m = { monster: 'poludnitsa', tier: 2 } as const;
    const bare = noonHeat(fight(party, m, undefined), 'halvar').slice(0, 20);
    const drunk = fight(party, m, prep({ potions: { halvar: 'coldwater-draught' } }));
    const cut = noonHeat(drunk, 'halvar').slice(0, 20);
    expect(bare).toHaveLength(20);
    expect(cut).toHaveLength(20);
    cut.forEach((x, i) => expect(x).toBe(Math.floor((bare[i] ?? 0) * 0.6 + 0.5)));
    expect(text(drunk)).toContain(
      'drinks Coldwater Draught (−40% Fire damage taken for the fight)',
    );
    // Only the holder: the other hunter takes full damage.
    expect(noonHeat(drunk, 'zora').slice(0, 20)).toEqual(
      noonHeat(fight(party, m, undefined), 'zora').slice(0, 20),
    );
  });

  it('cuts Seal-burn too', () => {
    const strong = snap('halvar', { base: { ...hunters.halvar.stats, might: 300 } });
    const m = { monster: 'ribbonshade', tier: 2 } as const;
    const burn = (r: FightResult): number[] =>
      r.log.filter((l) => l.text.includes('Seal-burn')).map((l) => l.amount ?? 0);
    const bare = burn(fight([strong], m, undefined, cyclic([0.5]), 'ruin'));
    const cold = burn(
      fight([strong], m, prep({ potions: { halvar: 'coldwater-draught' } }), cyclic([0.5]), 'ruin'),
    );
    expect(bare.length).toBeGreaterThan(0);
    expect(bare[0]).toBeGreaterThan(10);
    expect(cold[0]).toBe(Math.floor((bare[0] ?? 0) * 0.6 + 0.5));
  });

  it('adds to Fire gear inside the 75% cap', () => {
    const heat = (r: FightResult) => r.log.find((l) => l.text.startsWith('Noon Heat'))?.amount ?? 0;
    const m = { monster: 'poludnitsa', tier: 2 } as const;
    // Herbwise (−50%) + Fire-touched (−20%) + Emberwright Plate (−10%) would be −80%: the cap holds it at −75%.
    const plate = tank('vesna', {
      armorGear: 'emberwright-plate',
      traits: ['herbwise', 'fire-touched'],
    });
    const plain = heat(fight([tank('vesna', { traits: [] })], m, undefined));
    const capped = heat(fight([plate], m, prep({ potions: { vesna: 'coldwater-draught' } })));
    expect(capped).toBe(Math.floor(plain * 0.25 + 0.5));
  });

  it('Herbwise makes it −50%', () => {
    const party = [tank('vesna')];
    const m = { monster: 'poludnitsa', tier: 2 } as const;
    const first = (r: FightResult) =>
      r.log.find((l) => l.text.startsWith('Noon Heat'))?.amount ?? 0;
    const bare = first(fight(party, m, undefined));
    const drunk = fight(party, m, prep({ potions: { vesna: 'coldwater-draught' } }));
    expect(first(drunk)).toBe(Math.floor(bare * 0.5 + 0.5));
    expect(text(drunk)).toContain('−50% Fire damage');
  });
});

describe('Owl-Eye Drops', () => {
  const base = num('combat.hitChance');
  const firstOutcome = (r: FightResult, by: string): string =>
    r.log.find((l) => l.actor === by && ['hit', 'crit', 'miss'].includes(l.kind))?.kind ?? '';

  it('adds 10 points to the holder’s hit chance for the whole fight', () => {
    const party = [snap('halvar'), snap('zora')];
    const roll = cyclic([base + 0.05]); // a miss at the base chance, a hit with +10 points
    const bare = fight(party, { monster: 'wolf', tier: 1 }, undefined, roll);
    expect(firstOutcome(bare, 'halvar')).toBe('miss');
    const drunk = fight(
      party,
      { monster: 'wolf', tier: 1 },
      prep({ potions: { halvar: 'owl-eye-drops' } }),
      cyclic([base + 0.05]),
    );
    expect(firstOutcome(drunk, 'halvar')).not.toBe('miss');
    // Only the holder.
    expect(firstOutcome(drunk, 'zora')).toBe('miss');
    expect(text(drunk)).toContain('uses Owl-Eye Drops (+10 points to hit for the fight)');
  });

  it('Herbwise makes it +12.5 points, and Lightless is still cut from it', () => {
    const herb = fight(
      [snap('vesna')],
      { monster: 'wolf', tier: 1 },
      prep({ potions: { vesna: 'owl-eye-drops' } }),
      cyclic([base + 0.11]),
    );
    expect(text(herb)).toContain('+12.5 points');
    expect(
      herb.log.find((l) => l.actor === 'vesna' && ['hit', 'miss'].includes(l.kind))?.kind,
    ).toBe('hit');
    // Gloam-moths' Lightless takes 10 points off every hunter; Owl-Eye gives them back.
    const moths = (p: Preparation | undefined) =>
      fight(
        [snap('halvar')],
        { monster: 'gloam-moths', tier: 2 },
        p,
        cyclic([base - 0.05]),
        'ruin',
      );
    const cut = moths(undefined).log.find(
      (l) => l.actor === 'halvar' && ['hit', 'miss'].includes(l.kind),
    );
    const back = moths(prep({ potions: { halvar: 'owl-eye-drops' } })).log.find(
      (l) => l.actor === 'halvar' && ['hit', 'miss'].includes(l.kind),
    );
    expect(cut?.kind).toBe('miss');
    expect(back?.kind).toBe('hit');
  });
});

describe('Steadfast Draught', () => {
  const skips = (r: FightResult, who: string) =>
    r.log.filter((l) => l.kind === 'skip' && l.actor === who).length;

  it('keeps the first action an ability would cost, and only the first', () => {
    const party = [sponge('halvar')];
    const m = { monster: 'draugr', tier: 3 } as const;
    const bare = fight(party, m, undefined);
    const steady = fight(party, m, prep({ potions: { halvar: 'steadfast-draught' } }));
    const held = (r: FightResult) => r.log.filter((l) => l.text.includes('is held'));
    expect(held(bare).length).toBeGreaterThan(2);
    expect(held(steady)[0]?.text).toContain('but their Steadfast Draught keeps their action');
    expect(
      held(steady)
        .slice(1)
        .every((l) => l.text.includes('(loses their next action)')),
    ).toBe(true);
    expect(skips(steady, 'halvar')).toBe(skips(bare, 'halvar') - 1);
    expect(steady.potionsUsed).toContain('halvar');
  });

  it('keeps the other effects: Drag Under’s ×2 next hit still lands', () => {
    const party = [sponge('halvar')];
    const r = fight(
      party,
      { monster: 'vodyanoy', tier: 3 },
      prep({ potions: { halvar: 'steadfast-draught' } }),
      cyclic([0.5]),
      'river',
    );
    const line = r.log.find((l) => l.text.includes('is dragged under, but'));
    expect(line?.text).toContain('keeps their action');
    expect(line?.text).toContain('takes ×2 next');
    expect(skips(r, 'halvar')).toBeLessThanOrEqual(
      skips(
        fight(party, { monster: 'vodyanoy', tier: 3 }, undefined, cyclic([0.5]), 'river'),
        'halvar',
      ),
    );
  });

  it('keeps a Drowning Song charm but the song still stops the monster’s attack', () => {
    const party = [sponge('halvar')];
    const r = fight(
      party,
      { monster: 'rusalka', tier: 2 },
      prep({ potions: { halvar: 'steadfast-draught' } }),
      cyclic([0.5]),
      'river',
    );
    const sung = r.log.find((l) => l.text.includes('is charmed, but'));
    expect(sung).toBeDefined();
    // The 1st action is the song: no attack from the monster on that action.
    expect(
      r.log.find((l) => l.actor === 'rusalka' && (l.kind === 'hit' || l.kind === 'miss'))?.tick,
    ).toBeGreaterThan(sung?.tick ?? 0);
  });

  it('a fight without an action-costing ability leaves it unspent', () => {
    const r = fight(
      [sponge('halvar')],
      { monster: 'wolf', tier: 1 },
      prep({ potions: { halvar: 'steadfast-draught' } }),
    );
    expect(r.potionsUsed).toEqual([]);
  });

  it('Spoil ruins it before it fires; Herbwise does nothing for it', () => {
    const ruined = fight(
      [sponge('halvar')],
      { monster: 'kikimora', tier: 1 },
      prep({ potions: { halvar: 'steadfast-draught' } }),
    );
    expect(text(ruined)).toContain("Spoil ruins Halvar Two-Smokes's Steadfast Draught");
    expect(ruined.potionsUsed).toContain('halvar');
    const herb = fight(
      [sponge('vesna')],
      { monster: 'draugr', tier: 3 },
      prep({ potions: { vesna: 'steadfast-draught' } }),
    );
    const plain = fight(
      [sponge('halvar')],
      { monster: 'draugr', tier: 3 },
      prep({ potions: { halvar: 'steadfast-draught' } }),
    );
    expect(herb.log.filter((l) => l.text.includes('keeps')).length).toBe(
      plain.log.filter((l) => l.text.includes('keeps')).length,
    );
  });
});

describe('Poppy Smoke', () => {
  const monsterSkips = (r: FightResult, id: string) =>
    r.log.filter((l) => l.kind === 'skip' && l.actor === id);

  it('at tick 1 the monster loses its next action', () => {
    const party = [sponge('halvar')];
    const bare = fight(party, { monster: 'wolf', tier: 1 }, undefined);
    const smoke = fight(party, { monster: 'wolf', tier: 1 }, prep({ bombs: ['poppy-smoke'] }));
    expect(monsterSkips(bare, 'wolf')).toHaveLength(0);
    expect(monsterSkips(smoke, 'wolf')).toHaveLength(1);
    expect(smoke.log.find((l) => l.kind === 'bomb')?.text).toContain(
      'Poppy Smoke: the Gaunt Wolf loses its next action',
    );
    const firstAttack = (r: FightResult) =>
      r.log.find((l) => l.actor === 'wolf' && (l.kind === 'hit' || l.kind === 'miss'))?.tick ?? 0;
    expect(firstAttack(smoke)).toBeGreaterThan(firstAttack(bare));
  });

  it('is no weak-to bomb, and a Saltburst does not cancel it', () => {
    const party = [sponge('halvar')];
    const both = fight(
      party,
      { monster: 'rusalka', tier: 2 },
      prep({ bombs: ['poppy-smoke', 'saltburst'] }),
      cyclic([0.5]),
      'river',
    );
    expect(monsterSkips(both, 'rusalka')).toHaveLength(1);
    expect(both.saltburstCancelled).toBe(true);
  });
});

describe('the Last Stand’s bombs (GDD §5.9.3, D201)', () => {
  it('weak-to bombs first, then one Saltburst, then one Poppy Smoke, up to the slots', () => {
    expect(num('prep.bombSlots')).toBe(2);
    // The wolf is weak to Fire: the slots fill with Fire Pots before anything else.
    expect(waveBombs('wolf', { 'fire-pot': 5, saltburst: 4, 'poppy-smoke': 4 })).toEqual([
      'fire-pot',
      'fire-pot',
    ]);
    // Nothing it is weak to: one Saltburst (never two), then one Poppy Smoke.
    expect(waveBombs('wolf', { saltburst: 4, 'poppy-smoke': 4 })).toEqual([
      'saltburst',
      'poppy-smoke',
    ]);
    expect(waveBombs('wolf', { 'poppy-smoke': 3 })).toEqual(['poppy-smoke']);
  });
});

describe('old fights are untouched', () => {
  it('the v0.3 prep still replays line for line with the new fields at their defaults', () => {
    const party = [snap('halvar'), snap('zora')];
    const p = prep({
      oils: { halvar: 'grave-oil' },
      potions: { zora: 'mending-draught' },
      bombs: ['fire-pot'],
    });
    const a = fight(party, { monster: 'upyr', tier: 2 }, p, cyclic([0.3, 0.6, 0.1]));
    const b = fight(party, { monster: 'upyr', tier: 2 }, p, cyclic([0.3, 0.6, 0.1]));
    expect(text(a)).toBe(text(b));
  });
});
