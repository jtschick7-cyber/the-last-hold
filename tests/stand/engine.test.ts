// Plan T4.6 (GDD §5.9.3, D107, D115): the Last Stand engine. The contract fights and
// every golden fight are unchanged (tests/golden); these test the stand's own rules.
import { describe, expect, it } from 'vitest';
import { monsters } from '../../src/content/monsters';
import { num } from '../../src/core/balance-access';
import { runFight } from '../../src/core/combat';
import { roundHalfUp } from '../../src/core/combat/build';
import { seeded } from '../../src/core/rng';
import {
  runStand,
  standTaken,
  standVolley,
  waveBombs,
  type StandInput,
} from '../../src/core/stand/engine';
import { replayStand } from '../../src/core/stand/replay';
import { speciesForTier, waveAt, waveList, waveTier } from '../../src/core/stand/waves';
import { snap } from '../combat/helpers';

const SIX = (['halvar', 'zora', 'ostap', 'bjarna', 'vesna', 'radek'] as const).map((id) =>
  snap(id, { level: 8, weapon: 'iron-blade' }),
);

const input = (over: Partial<StandInput> = {}): StandInput => ({
  seed: 'test:stand:1',
  threat: 0,
  party: SIX,
  prep: { oils: {}, potions: {}, bombs: [] },
  bombs: {},
  defenses: { walls: 0, watchtower: 0 },
  relics: [],
  knowledge: {},
  ...over,
});

describe('the wave list (GDD §5.9.3)', () => {
  it('wave 1 is tier 2, and every 2 waves add a tier, past tier 5 too', () => {
    expect([1, 2, 3, 4, 5, 8, 9, 10].map(waveTier)).toEqual([2, 2, 3, 3, 4, 5, 6, 6]);
  });

  it('each wave is a species whose range includes its tier (above 5: those that reach 5)', () => {
    for (const w of waveList('any-seed', 20)) {
      const [lo, hi] = monsters[w.monster].tiers;
      const t = Math.min(w.tier, 5);
      expect(lo <= t && hi >= t, `${w.n} ${w.monster}`).toBe(true);
    }
    expect(speciesForTier(9)).toEqual(speciesForTier(5));
  });

  it('comes from the seed alone, and differs between seeds', () => {
    expect(waveList('a', 12)).toEqual(waveList('a', 12));
    expect(waveList('a', 12).map((w) => w.monster)).not.toEqual(
      waveList('b', 12).map((w) => w.monster),
    );
    expect(waveAt('a', 7)).toEqual(waveList('a', 7)[6]);
  });
});

describe('runStand (GDD §5.9.3)', () => {
  const base = runStand(input({ log: true }));

  it('holds some waves, ends when the party falls or a wave runs out of time', () => {
    expect(base.wavesHeld).toBeGreaterThan(2);
    expect(base.waves.length).toBe(base.wavesHeld + 1);
    expect(base.waves[base.waves.length - 1]?.fight.result).toBe('loss');
    for (const w of base.waves.slice(0, -1)) expect(w.fight.result).toBe('win');
  });

  it('is fixed by its inputs: the logs rebuild exactly, and practice runs give the same result', () => {
    const again = runStand(input({ log: true }));
    expect(again).toEqual(base);
    expect(runStand(input()).wavesHeld).toBe(base.wavesHeld);
    for (const w of base.waves) expect(w.fight.log.length).toBeGreaterThan(0);
  });

  it('downed hunters stay down; standing ones carry their Health, plus 20% of max', () => {
    for (let i = 1; i < base.waves.length; i++) {
      const before = base.waves[i - 1]?.fight;
      const now = base.waves[i]?.fight;
      if (!before || !now) throw new Error('missing wave');
      const standing = before.hunters.filter((h) => !h.downed).map((h) => h.id);
      expect(now.hunters.map((h) => h.id)).toEqual(standing);
    }
    // Starting Health is honoured by the fight itself.
    const weak = runFight({
      party: [snap('zora', { level: 8 })],
      monster: { monster: 'upyr', tier: 3 },
      location: null,
      rolls: seeded('x'),
      stand: { health: { zora: 1 }, monsterStrength: 1, partyTaken: 0, volley: 0 },
    });
    expect(weak.result).toBe('loss');
    expect(weak.ticks).toBeLessThan(40);
    // Each standing hunter starts the next wave with its Health plus 20% of max, capped.
    const recover = num('laststand.recoverBetween');
    for (let i = 1; i < base.waves.length; i++) {
      const before = base.waves[i - 1]?.fight;
      const next = base.waves[i];
      for (const h of before?.hunters ?? []) {
        if (h.downed) continue;
        expect(next?.startHealth[h.id], `wave ${i + 1} ${h.id}`).toBe(
          Math.min(h.maxHealth, h.health + roundHalfUp(h.maxHealth * recover)),
        );
      }
    }
    expect(base.waves[0]?.startHealth).toEqual({});
  });

  it('each potion fires once in the whole stand', () => {
    const potions = Object.fromEntries(SIX.map((h) => [h.id, 'mending-draught' as const]));
    // Threat 200 so hunters get low enough to drink in more than one wave (from v0.5 the
    // Cursed join the waves, and at Threat 0 this stand now ends on a Rimewrought's tick limit).
    const r = runStand(input({ threat: 200, prep: { oils: {}, potions, bombs: [] } }));
    const used = r.waves.flatMap((w) => w.fight.potionsUsed);
    expect(used.length).toBeGreaterThan(1);
    expect(r.waves.filter((w) => w.fight.potionsUsed.length > 0).length).toBeGreaterThan(1);
    expect(new Set(used).size).toBe(used.length);
  });

  it('bombs come from the stores: weak-to first, then one Saltburst, up to 2 a wave', () => {
    const wolf = monsters.wolf.resist;
    const stock = { 'fire-pot': 1, 'frost-pot': 5, saltburst: 3 };
    const picks = waveBombs('wolf', stock);
    expect(picks.length).toBeLessThanOrEqual(num('prep.bombSlots'));
    const weak = (['fire-pot', 'frost-pot'] as const).filter(
      (b) => (b === 'fire-pot' ? wolf.fire : wolf.frost) >= num('prep.weakAt'),
    );
    for (const b of picks) expect([...weak, 'saltburst']).toContain(b);
    const r = runStand(input({ bombs: { saltburst: 2 } }));
    const thrown = r.waves.flatMap((w) => w.bombs);
    expect(thrown).toEqual(['saltburst', 'saltburst']);
    expect(r.waves[0]?.bombs).toEqual(['saltburst']);
  });

  it('Threat makes every wave stronger: +0.61% Health and Might per point (D138)', () => {
    const r = runStand(input({ threat: 100 }));
    const w = r.waves[0];
    if (!w) throw new Error('no wave');
    const def = monsters[w.wave.monster];
    const steps = w.wave.tier - def.tiers[0];
    let scale = 1;
    for (let i = 0; i < steps; i++) scale *= num('monster.statGrowth');
    expect(w.fight.monsterMaxHealth).toBe(roundHalfUp(def.health * scale * 1.61));
    expect(r.wavesHeld).toBeLessThanOrEqual(base.wavesHeld);
  });

  it('Walls and the Iron Shutter reduce damage taken; the Watchtower volleys at tick 1', () => {
    expect(standTaken({ walls: 10, watchtower: 0 }, [])).toBeCloseTo(0.2);
    expect(standTaken({ walls: 10, watchtower: 0 }, ['iron-shutter'])).toBeCloseTo(0.25);
    expect(standVolley({ walls: 0, watchtower: 3 })).toBe(60);
    const r = runStand(
      input({ defenses: { walls: 15, watchtower: 15 }, relics: ['iron-shutter'], log: true }),
    );
    const first = r.waves[0]?.fight.log[0];
    expect(first?.kind).toBe('volley');
    expect(first?.tick).toBe(1);
    expect(r.wavesHeld).toBeGreaterThanOrEqual(base.wavesHeld);
  });

  it('location traits do not apply (the hold is not a contract location)', () => {
    const fight = (location: 'river' | null) =>
      runFight({
        party: [snap('zora', { level: 5 })], // Fen-born: +might on river
        monster: { monster: 'rusalka', tier: 2 },
        location,
        rolls: seeded('loc'),
      });
    const river = fight('river').log.find((e) => e.actor === 'zora' && e.dealt !== undefined);
    const none = fight(null).log.find((e) => e.actor === 'zora' && e.dealt !== undefined);
    expect(river?.dealt).toBeGreaterThan(none?.dealt ?? Infinity);
  });

  it('refuses an empty party or more than six', () => {
    expect(() => runStand(input({ party: [] }))).toThrow();
    expect(() => runStand(input({ party: [...SIX, snap('sigrun')] }))).toThrow();
  });
});

describe('wave logs from the saved record (technical design §5.3)', () => {
  it('a StandRecord rebuilds the same waves and logs', () => {
    const made = runStand(input({ log: true, threat: 7, bombs: { 'fire-pot': 2 } }));
    const record = {
      at: 0,
      seed: 'test:stand:1',
      rank: 'bastion' as const,
      threat: 7,
      party: SIX,
      prep: { oils: {}, potions: {}, bombs: [] },
      bombs: { 'fire-pot': 2 },
      defenses: { walls: 0, watchtower: 0 },
      relics: [],
      knowledge: {},
      rulesVersion: 1,
      wavesHeld: made.wavesHeld,
      embers: { waves: 0, trophies: 0, total: 0 },
      relicsFound: [],
      arrival: false,
      trustSteps: [],
      seen: false,
    };
    expect(replayStand(record)).toEqual(made);
  });
});
