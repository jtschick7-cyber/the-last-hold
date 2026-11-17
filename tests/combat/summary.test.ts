// Plan T19.4 (decisions D632, D634; technical design §26.3):
// `explainFight` ("Why?") models start-of-fight potions (Quickfoot, Owl-Eye, Hardwood, Coldwater,
// Steadfast), Alchemy potency, and tick-1 bombs accurately across rulesVersion 8 and legacy <= 7.
import { describe, expect, it } from 'vitest';
import { explainFight } from '../../src/core/combat/summary';
import { seeded } from '../../src/core/rng';
import type { Preparation } from '../../src/core/state/game-state';
import type { Breakdown } from '../../src/core/breakdown/breakdown';
import { snap } from './helpers';

const prep = (over: Partial<Preparation> = {}): Preparation => ({
  oils: {},
  potions: {},
  bombs: [],
  ...over,
});

const child = (b: Breakdown, prefix: string): Breakdown => {
  const found = b.children?.find((c) => c.label.startsWith(prefix));
  if (!found) throw new Error(`Missing child starting with "${prefix}"`);
  return found;
};

describe('explainFight ("Why?") start-of-fight potions, alchemy potency & tick-1 bombs', () => {
  it('Quickfoot Tincture raises Speed and party damage per 100 ticks (with Herbwise + Alchemy)', () => {
    const zora = snap('zora', { traits: [] }); // Speed 13
    const bare = explainFight(
      {
        party: [zora],
        monster: { monster: 'upyr', tier: 2 },
        location: 'field',
        rolls: seeded('w'),
      },
      0.5,
    );
    const qf = explainFight(
      {
        party: [zora],
        monster: { monster: 'upyr', tier: 2 },
        location: 'field',
        rolls: seeded('w'),
        prep: prep({ potions: { zora: 'quickfoot-tincture' } }),
        rulesVersion: 8,
      },
      0.5,
    );
    const bareDps = child(bare, 'Party damage').value;
    const qfDps = child(qf, 'Party damage').value;
    expect(qfDps).toBeCloseTo(bareDps * 1.15, 6);
    expect(child(qf, 'Party damage').children?.[0]?.label).toContain('Speed 14.95');

    // Herbwise (1.25×) + Alchemy 10 (1.30×) => 0.15 × 1.25 × 1.30 = +24.375% Speed
    const scaled = explainFight(
      {
        party: [snap('zora', { traits: ['herbwise'] })],
        monster: { monster: 'upyr', tier: 2 },
        location: 'field',
        rolls: seeded('w'),
        prep: prep({ potions: { zora: 'quickfoot-tincture' } }),
        alchemy: 10,
        rulesVersion: 8,
      },
      0.5,
    );
    expect(child(scaled, 'Party damage').value).toBeCloseTo(bareDps * (1 + 0.15 * 1.25 * 1.3), 6);
  });

  it('Owl-Eye Drops raises hit (capped at 1.0) and crit chance, answering Lightless & Ill Luck', () => {
    const zora = snap('zora', { traits: [] }); // crit 0.20, critMult 1.5
    // Against Gloam-moths (Lightless −10% hit: 0.80 -> 0.90) + Owl-Eye (+10 hit & +10 crit under v8)
    const bareMoth = explainFight(
      {
        party: [zora],
        monster: { monster: 'gloam-moths', tier: 2 },
        location: 'ruin',
        rolls: seeded('w'),
      },
      0.5,
    );
    const owlMoth = explainFight(
      {
        party: [zora],
        monster: { monster: 'gloam-moths', tier: 2 },
        location: 'ruin',
        rolls: seeded('w'),
        prep: prep({ potions: { zora: 'owl-eye-drops' } }),
        rulesVersion: 8,
      },
      0.5,
    );
    expect(child(owlMoth, 'Party damage').value).toBeGreaterThan(
      child(bareMoth, 'Party damage').value,
    );

    // Against Likho (Ill Luck −10% crit) with Alchemy 5 (1.15×): hit caps at 1.00 (not 1.015!), crit +11.5 pts
    const bareLikho = explainFight(
      {
        party: [zora],
        monster: { event: 'likho-one-eyed', tier: 3 },
        location: null,
        rolls: seeded('w'),
      },
      0.5,
    );
    const owlLikho = explainFight(
      {
        party: [zora],
        monster: { event: 'likho-one-eyed', tier: 3 },
        location: null,
        rolls: seeded('w'),
        prep: prep({ potions: { zora: 'owl-eye-drops' } }),
        alchemy: 5,
        rulesVersion: 8,
      },
      0.5,
    );
    expect(child(owlLikho, 'Party damage').value).toBeGreaterThan(
      child(bareLikho, 'Party damage').value,
    );
    // Hit chance is capped at 1.0: Alchemy 20 still leaves hit = 1.0 (only crit rises, up to 1.0).
    const maxHit = explainFight(
      {
        party: [zora],
        monster: { monster: 'wolf', tier: 1 },
        location: 'field',
        rolls: seeded('w'),
        prep: prep({ potions: { zora: 'owl-eye-drops' } }),
        alchemy: 10,
        rulesVersion: 8,
      },
      0.5,
    );
    const owlNoAlch = explainFight(
      {
        party: [zora],
        monster: { monster: 'wolf', tier: 1 },
        location: 'field',
        rolls: seeded('w'),
        prep: prep({ potions: { zora: 'owl-eye-drops' } }),
        alchemy: 0,
        rulesVersion: 8,
      },
      0.5,
    );
    // At Alchemy 0, hit is already 1.0 and crit is 0.30 (mult 1.15); at Alchemy 10, crit is 0.33 (mult 1.165)
    expect(
      child(maxHit, 'Party damage').value / child(owlNoAlch, 'Party damage').value,
    ).toBeLessThan(1.05);
  });

  it('Hardwood Tonic raises Armor (+40%) and cuts damage taken (−15%), scaled by Alchemy', () => {
    const halvar = snap('halvar', { traits: [] });
    const bare = explainFight(
      {
        party: [halvar],
        monster: { monster: 'upyr', tier: 2 },
        location: 'field',
        rolls: seeded('w'),
      },
      0.5,
    );
    const tonic = explainFight(
      {
        party: [halvar],
        monster: { monster: 'upyr', tier: 2 },
        location: 'field',
        rolls: seeded('w'),
        prep: prep({ potions: { halvar: 'hardwood-tonic' } }),
        rulesVersion: 8,
      },
      0.5,
    );
    const tonicAlch = explainFight(
      {
        party: [halvar],
        monster: { monster: 'upyr', tier: 2 },
        location: 'field',
        rolls: seeded('w'),
        prep: prep({ potions: { halvar: 'hardwood-tonic' } }),
        alchemy: 10,
        rulesVersion: 8,
      },
      0.5,
    );
    expect(child(tonic, 'Upyr damage').value).toBeLessThan(child(bare, 'Upyr damage').value);
    expect(child(tonicAlch, 'Upyr damage').value).toBeLessThan(child(tonic, 'Upyr damage').value);
    expect(child(tonic, 'Ticks until the party').value).toBeGreaterThan(
      child(bare, 'Ticks until the party').value,
    );
  });

  it('Coldwater Draught and Steadfast Draught add +10% Might (scaled by Herbwise + Alchemy) under v8', () => {
    const halvar = snap('halvar', { traits: [] });
    const bare = explainFight(
      {
        party: [halvar],
        monster: { monster: 'upyr', tier: 2 },
        location: 'field',
        rolls: seeded('w'),
      },
      0.5,
    );
    for (const potion of ['coldwater-draught', 'steadfast-draught'] as const) {
      const drunk = explainFight(
        {
          party: [halvar],
          monster: { monster: 'upyr', tier: 2 },
          location: 'field',
          rolls: seeded('w'),
          prep: prep({ potions: { halvar: potion } }),
          rulesVersion: 8,
        },
        0.5,
      );
      const scaled = explainFight(
        {
          party: [halvar],
          monster: { monster: 'upyr', tier: 2 },
          location: 'field',
          rolls: seeded('w'),
          prep: prep({ potions: { halvar: potion } }),
          alchemy: 10,
          rulesVersion: 8,
        },
        0.5,
      );
      expect(child(drunk, 'Party damage').value).toBeGreaterThan(child(bare, 'Party damage').value);
      expect(child(scaled, 'Party damage').value).toBeGreaterThan(
        child(drunk, 'Party damage').value,
      );
    }

    // Legacy v7 Steadfast gives no Might bonus
    const v7Steadfast = explainFight(
      {
        party: [halvar],
        monster: { monster: 'upyr', tier: 2 },
        location: 'field',
        rolls: seeded('w'),
        prep: prep({ potions: { halvar: 'steadfast-draught' } }),
        rulesVersion: 7,
      },
      0.5,
    );
    expect(child(v7Steadfast, 'Party damage').value).toBeCloseTo(
      child(bare, 'Party damage').value,
      9,
    );
  });

  it('Fire Pot reduces remaining Health (scaled by Alchemy) and strips Rimewrought Unthawed Armor', () => {
    const zora = snap('zora', { traits: [] });
    const bare = explainFight(
      {
        party: [zora],
        monster: { monster: 'rimewrought', tier: 3 },
        location: 'ruin',
        rolls: seeded('w'),
      },
      0.5,
    );
    const fire = explainFight(
      {
        party: [zora],
        monster: { monster: 'rimewrought', tier: 3 },
        location: 'ruin',
        rolls: seeded('w'),
        prep: prep({ bombs: ['fire-pot'] }),
        rulesVersion: 8,
      },
      0.5,
    );
    const fireAlch = explainFight(
      {
        party: [zora],
        monster: { monster: 'rimewrought', tier: 3 },
        location: 'ruin',
        rolls: seeded('w'),
        prep: prep({ bombs: ['fire-pot'] }),
        alchemy: 10,
        rulesVersion: 8,
      },
      0.5,
    );
    expect(child(fire, 'Tick-1 bomb damage').value).toBe(60); // 40 × 1.5 Fire resist
    expect(child(fireAlch, 'Tick-1 bomb damage').value).toBe(78); // 40 × 1.30 × 1.5 = 78
    // Unthawed stripped Rimewrought Armor by 30%, lifting party damage
    expect(child(fire, 'Party damage').value).toBeGreaterThan(child(bare, 'Party damage').value);
    expect(child(fireAlch, 'Ticks to bring it down').value).toBeLessThan(
      child(fire, 'Ticks to bring it down').value,
    );
  });

  it('Frost Pot deals tick-1 Frost damage and slows monster damage per 100 ticks by 30%', () => {
    const halvar = snap('halvar', { traits: [] });
    const bare = explainFight(
      {
        party: [halvar],
        monster: { monster: 'vodyanoy', tier: 3 },
        location: 'river',
        rolls: seeded('w'),
      },
      0.5,
    );
    const frost = explainFight(
      {
        party: [halvar],
        monster: { monster: 'vodyanoy', tier: 3 },
        location: 'river',
        rolls: seeded('w'),
        prep: prep({ bombs: ['frost-pot'] }),
        rulesVersion: 8,
      },
      0.5,
    );
    expect(child(frost, 'Tick-1 bomb damage').value).toBe(45); // 30 × 1.5 resist
    expect(child(frost, 'Vodyanoy damage').value).toBeCloseTo(
      child(bare, 'Vodyanoy damage').value * 0.7,
      6,
    );
    expect(child(frost, 'Ticks to bring it down').value).toBeLessThan(
      child(bare, 'Ticks to bring it down').value,
    );
  });

  it('Poppy Smoke boosts party hit/crit/dmg via Shrouded and delays party down via stun', () => {
    const zora = snap('zora', { traits: [] });
    const bare = explainFight(
      {
        party: [zora],
        monster: { monster: 'draugr', tier: 3 },
        location: 'barrow',
        rolls: seeded('w'),
      },
      0.5,
    );
    const smoke = explainFight(
      {
        party: [zora],
        monster: { monster: 'draugr', tier: 3 },
        location: 'barrow',
        rolls: seeded('w'),
        prep: prep({ bombs: ['poppy-smoke'] }),
        rulesVersion: 8,
      },
      0.5,
    );
    const smokeAlch = explainFight(
      {
        party: [zora],
        monster: { monster: 'draugr', tier: 3 },
        location: 'barrow',
        rolls: seeded('w'),
        prep: prep({ bombs: ['poppy-smoke'] }),
        alchemy: 10,
        rulesVersion: 8,
      },
      0.5,
    );
    expect(child(smoke, 'Party damage').value).toBeGreaterThan(child(bare, 'Party damage').value);
    expect(child(smokeAlch, 'Party damage').value).toBeGreaterThan(
      child(smoke, 'Party damage').value,
    );
    expect(child(smoke, 'Ticks until the party').value).toBeGreaterThan(
      child(bare, 'Ticks until the party').value,
    );
  });

  it('Saltburst deals 25 Rune damage (Alchemy-scaled) and cancels Lightless / Ill Luck under v8', () => {
    const zora = snap('zora', { traits: [] });
    const bareMoth = explainFight(
      {
        party: [zora],
        monster: { monster: 'gloam-moths', tier: 2 },
        location: 'ruin',
        rolls: seeded('w'),
        rulesVersion: 8,
      },
      0.5,
    );
    const saltMoth = explainFight(
      {
        party: [zora],
        monster: { monster: 'gloam-moths', tier: 2 },
        location: 'ruin',
        rolls: seeded('w'),
        prep: prep({ bombs: ['saltburst'] }),
        rulesVersion: 8,
      },
      0.5,
    );
    const saltMothAlch = explainFight(
      {
        party: [zora],
        monster: { monster: 'gloam-moths', tier: 2 },
        location: 'ruin',
        rolls: seeded('w'),
        prep: prep({ bombs: ['saltburst'] }),
        alchemy: 10,
        rulesVersion: 8,
      },
      0.5,
    );
    expect(child(saltMoth, 'Tick-1 bomb damage').value).toBe(25); // 25 × 1.0 Rune resist
    expect(child(saltMothAlch, 'Tick-1 bomb damage').value).toBe(33); // 25 × 1.30 = 32.5 -> 33
    expect(child(saltMoth, 'Party damage').value).toBeGreaterThan(
      child(bareMoth, 'Party damage').value,
    );

    const v7Moth = explainFight(
      {
        party: [zora],
        monster: { monster: 'gloam-moths', tier: 2 },
        location: 'ruin',
        rolls: seeded('w'),
        prep: prep({ bombs: ['saltburst'] }),
        rulesVersion: 7,
      },
      0.5,
    );
    expect(v7Moth.children?.some((c) => c.label.startsWith('Tick-1 bomb damage'))).toBe(false);
    expect(child(v7Moth, 'Party damage').value).toBeCloseTo(
      child(bareMoth, 'Party damage').value,
      9,
    );
  });
});
