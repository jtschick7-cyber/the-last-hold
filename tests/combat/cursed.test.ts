// Plan T5.4: the Cursed creatures' four abilities (GDD §8.3, D158), with constant
// rolls so every number can be worked out by hand. Readings where the GDD is silent
// are in D176: passives (Lightless, Seal-burn) and Unthawed, a weakness, are not
// cancelled by a Saltburst; Re-forge is.
import { describe, expect, it } from 'vitest';
import { monsters } from '../../src/content/monsters';
import { RUIN_VILLAGES } from '../../src/content/villages';
import { runFight } from '../../src/core/combat';
import { generateContract } from '../../src/core/contracts/board';
import { speciesForTier } from '../../src/core/stand/waves';
import { T0, keepRich } from '../contracts/helpers';
import { cyclic, fightOf, lines, snap, sponge } from './helpers';

const tough = { health: 1000000, might: 1, armor: 8, speed: 7 };

describe('Gloam-moths: Lightless', () => {
  it("lowers every hunter's hit chance by 10 points while the swarm stands", () => {
    const z = sponge('zora');
    const moths = fightOf([z], 'gloam-moths', 2, cyclic([0.85]), 'ruin');
    const wolf = fightOf([z], 'wolf', 2, cyclic([0.85]));
    expect(lines(moths, 'miss', 'zora')[0]?.rollNotes?.[0]).toBe('Hit 0.850 ≥ 80% → miss');
    expect(lines(moths, 'hit', 'zora')).toHaveLength(0);
    expect(lines(wolf, 'hit', 'zora').length).toBeGreaterThan(0);
  });

  it("doesn't touch the swarm's own hit chance", () => {
    const r = fightOf(
      [sponge('halvar', { base: tough })],
      'gloam-moths',
      2,
      cyclic([0.85]),
      'ruin',
    );
    expect(lines(r, 'hit', 'gloam-moths').length).toBeGreaterThan(0);
  });
});

describe('Ribbonshade: Seal-burn', () => {
  it('a direct hit burns the attacker for 10% of the damage dealt, as Fire, no Armor', () => {
    const z = snap('zora', { traits: [], base: { health: 1000, might: 60, armor: 3, speed: 13 } });
    const r = fightOf([z], 'ribbonshade', 2, cyclic([0.5]), 'ruin');
    // Might 60 × variance 1.0 × Steel 1.0 = 60, − Armor 2 = 58; 10% = 5.8 → 6.
    expect(lines(r, 'hit', 'zora')[0]?.amount).toBe(58);
    const burn = lines(r, 'ability', 'ribbonshade')[0];
    expect(burn?.target).toBe('zora');
    expect(burn?.amount).toBe(6);
    expect(burn?.text).toContain('Seal-burn');
  });

  it('Fire-touched takes less of the burn (taken% applies, Armor does not)', () => {
    const s = snap('sigrun', {
      traits: ['fire-touched'],
      damage: 'steel',
      base: { health: 1000, might: 60, armor: 50, speed: 11 },
    });
    const r = fightOf([s], 'ribbonshade', 2, cyclic([0.5]), 'ruin');
    // 60 × 1.0 − 2 = 58; 5.8 × (1 − 20%) = 4.64 → 5, Armor 50 ignored.
    expect(lines(r, 'ability', 'ribbonshade')[0]?.amount).toBe(5);
  });

  it('a miss burns no one, and the burn can down the attacker', () => {
    const z = snap('zora', { traits: [], base: { health: 3, might: 60, armor: 3, speed: 13 } });
    const missed = fightOf([z], 'ribbonshade', 2, cyclic([0.95]), 'ruin');
    expect(lines(missed, 'ability', 'ribbonshade')).toHaveLength(0);
    const r = fightOf([z], 'ribbonshade', 2, cyclic([0.5]), 'ruin');
    expect(r.hunters[0]?.downed).toBe(true);
    expect(r.result).toBe('loss');
  });

  it('a Saltburst does not cancel it (a passive, like Swell)', () => {
    const z = snap('zora', { traits: [], base: { health: 1000, might: 60, armor: 3, speed: 13 } });
    const r = runFight({
      party: [z],
      monster: { monster: 'ribbonshade', tier: 2 },
      location: 'ruin',
      rolls: cyclic([0.5]),
      prep: { oils: {}, potions: {}, bombs: ['saltburst'] },
    });
    expect(lines(r, 'ability', 'ribbonshade')[0]?.amount).toBe(6);
  });
});

describe('Anvil-wight: Re-forge', () => {
  it('every 3rd action, instead of attacking, restores 10% of max Health', () => {
    const z = snap('zora', {
      traits: [],
      base: { health: 1000000, might: 60, armor: 3, speed: 13 },
    });
    const r = fightOf([z], 'anvil-wight', 3, cyclic([0.5]), 'ruin');
    const own = r.log.filter((e) => e.actor === 'anvil-wight' && e.kind !== 'end');
    // Actions 1 and 2 attack; 3 re-forges; 4 and 5 attack; 6 re-forges.
    expect(own.slice(0, 6).map((e) => (e.kind === 'ability' ? 'forge' : 'attack'))).toEqual([
      'attack',
      'attack',
      'forge',
      'attack',
      'attack',
      'forge',
    ]);
    // Steel 60 × 0.5 = 30, − Armor 11 = 19 a hit; max Health 250 → +25 when it has room.
    const forge = own[2];
    expect(forge?.text).toContain('Re-forge');
    expect(forge?.amount).toBe(25);
  });

  it('a Saltburst cancels the first one, and it attacks instead', () => {
    const r = runFight({
      party: [sponge('halvar', { base: tough })],
      monster: { monster: 'anvil-wight', tier: 3 },
      location: 'ruin',
      rolls: cyclic([0.5]),
      prep: { oils: {}, potions: {}, bombs: ['saltburst'] },
    });
    expect(r.saltburstCancelled).toBe(true);
    const own = r.log.filter((e) => e.actor === 'anvil-wight' && e.kind !== 'end');
    // Action 3 is cancelled (it attacks); 4–6 are blocked, so 6 attacks too; 9 re-forges.
    expect(own.slice(0, 9).map((e) => (e.kind === 'ability' ? 'forge' : 'attack'))).toEqual([
      'attack',
      'attack',
      'attack',
      'attack',
      'attack',
      'attack',
      'attack',
      'attack',
      'forge',
    ]);
  });
});

describe('Rimewrought: Unthawed', () => {
  it('the first Fire hit strips 30% of its Armor for the rest of the fight', () => {
    const s = snap('sigrun', {
      traits: [],
      base: { health: 1000000, might: 60, armor: 4, speed: 11 },
    });
    const r = fightOf([s], 'rimewrought', 4, cyclic([0.5]), 'ruin');
    // Fire 60 × 1.5 = 90. First hit meets Armor 14: 76. Then Armor 9.8: 80.2 → 80.
    const hits = lines(r, 'hit', 'sigrun').map((e) => e.amount);
    expect(hits.slice(0, 3)).toEqual([76, 80, 80]);
    expect(lines(r, 'hit', 'sigrun')[0]?.text).toContain('Unthawed');
  });

  it('a Fire Pot counts as the first Fire hit; other damage types gain from it', () => {
    const z = snap('zora', {
      traits: [],
      base: { health: 1000000, might: 60, armor: 3, speed: 13 },
    });
    const bare = fightOf([z], 'rimewrought', 4, cyclic([0.5]), 'ruin');
    const potted = runFight({
      party: [z],
      monster: { monster: 'rimewrought', tier: 4 },
      location: 'ruin',
      rolls: cyclic([0.5]),
      prep: { oils: {}, potions: {}, bombs: ['fire-pot'] },
    });
    // Steel 60 × 0.75 = 45: − 14 = 31 bare; − 9.8 = 35.2 → 35 once the rime has cracked.
    expect(lines(bare, 'hit', 'zora')[0]?.amount).toBe(31);
    expect(lines(potted, 'hit', 'zora')[0]?.amount).toBe(35);
  });

  it('Frost does nothing to it', () => {
    const b = snap('bjarna', {
      traits: [],
      base: { health: 1000000, might: 60, armor: 3, speed: 12 },
    });
    const r = fightOf([b], 'rimewrought', 4, cyclic([0.5]), 'ruin');
    expect(lines(r, 'hit', 'bjarna')[0]?.amount).toBe(0);
  });
});

describe('ruins and the Cursed in play (GDD §8.2, §8.3.1, D157, D158)', () => {
  it('ruin contracts come only from Kozly Hollow, Velkvik and Ravenfell, at tier 2 and up, with a Cursed species', () => {
    const s = keepRich('ruins');
    s.board.tierWins = [99, 99, 99, 99, 99];
    const made = Array.from({ length: 600 }, (_, i) => generateContract(s, i, T0));
    const ruins = made.filter((c) => c.location === 'ruin');
    // About 1 in 5 (D157): 3 of 5 villages, 1 of their 3 tags.
    expect(ruins.length / made.length).toBeGreaterThan(0.12);
    expect(ruins.length / made.length).toBeLessThan(0.28);
    for (const c of ruins) {
      expect(RUIN_VILLAGES).toContain(c.village);
      expect(c.tier).toBeGreaterThanOrEqual(2);
      expect(monsters[c.monster].family).toBe('cursed');
    }
    const t1 = keepRich('ruins-t1');
    t1.board.tierWins = [0, 0, 0, 0, 0]; // only tier 1 unlocked
    const low = Array.from({ length: 200 }, (_, i) => generateContract(t1, i, T0));
    expect(low.every((c) => c.tier === 1 && c.location !== 'ruin')).toBe(true);
  });

  it('the Cursed join the Last Stand waves at their tiers', () => {
    expect(speciesForTier(2)).toEqual(expect.arrayContaining(['gloam-moths', 'ribbonshade']));
    expect(speciesForTier(3)).toEqual(
      expect.arrayContaining(['gloam-moths', 'ribbonshade', 'anvil-wight']),
    );
    expect(speciesForTier(5)).toEqual(expect.arrayContaining(['anvil-wight', 'rimewrought']));
    expect(speciesForTier(5)).not.toContain('gloam-moths');
  });
});
