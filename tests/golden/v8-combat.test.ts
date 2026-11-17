// Plan T19.8 (D631-D634, D636): Comprehensive rulesVersion 8 golden combat tests with frozen
// cyrb128 log fingerprints covering T19.3-T19.7 brews, Emberwright Plate, Fire damage,
// The Thorn-Stag, The Beacon-Bane, and v8 bomb/burn/Saltburst logs + Arena callouts.
import { describe, expect, it } from 'vitest';
import { runFight, type FightInput, type FightResult } from '../../src/core/combat';
import { playbackSteps, type FloorCombatant } from '../../src/core/delves/view';
import { stream } from '../../src/core/rng';
import { cyrb128 } from '../../src/core/rng/cyrb128';
import { RULES_VERSION } from '../../src/core/rules-version';
import { snap } from '../combat/helpers';

const fingerprint = (r: FightResult) => ({
  result: r.result,
  ticks: r.ticks,
  health: r.hunters.map((h) => h.health),
  monster: r.monsterHealth,
  lines: r.log.length,
  hash: ((cyrb128(r.log.map((e) => e.text).join('\n'))[0] ?? 0) >>> 0).toString(16),
});

const runGolden = (
  seedKey: string,
  input: Omit<FightInput, 'rolls' | 'rulesVersion'>,
  rulesVersion = RULES_VERSION,
): FightResult =>
  runFight({
    ...input,
    rolls: stream('golden', 'v8', seedKey),
    rulesVersion,
  });

describe('rulesVersion 8 golden combat tests (T19.3-T19.7)', () => {
  it('The Thorn-Stag (v8 vs v7): Steadfast, Hardwood, Quickfoot, Owl-Eye, Fire Pot & Saltburst', () => {
    const input: Omit<FightInput, 'rolls' | 'rulesVersion'> = {
      party: [
        snap('halvar', {
          level: 10,
          armorGear: 'emberwright-plate',
          talents: ['vanguard-wall-1', 'vanguard-warden-1'],
        }),
        snap('zora', {
          level: 10,
          weapon: 'iron-blade',
          talents: ['striker-edge-1', 'striker-hunt-1'],
        }),
        snap('sigrun', {
          level: 10,
          weapon: 'silvered-blade',
          armorGear: 'emberwright-plate',
          skill: 'the-other-hand',
          talents: ['striker-pace-1'],
        }),
        snap('vesna', {
          level: 10,
          skill: 'stopping-root',
          talents: ['mender-hands-1', 'mender-herbs-1'],
        }),
      ],
      monster: { event: 'thorn-stag', tier: 5, healthOverride: 12000 },
      location: null,
      prep: {
        oils: { zora: 'thornbane-oil', sigrun: 'thornbane-oil' },
        potions: {
          halvar: 'hardwood-tonic',
          zora: 'steadfast-draught',
          sigrun: 'owl-eye-drops',
          vesna: 'quickfoot-tincture',
        },
        bombs: ['fire-pot', 'saltburst'],
      },
      alchemy: 6,
    };

    const v8 = runGolden('thorn-stag', input, 8);
    const v7 = runGolden('thorn-stag', input, 7);

    expect(fingerprint(v8)).toEqual({
      result: 'loss',
      ticks: 190,
      health: [0, 0, 0, 0],
      monster: 7011,
      lines: 150,
      hash: '1bb03ddc',
    });
    expect(fingerprint(v7)).toEqual({
      result: 'loss',
      ticks: 190,
      health: [0, 0, 0, 0],
      monster: 8137,
      lines: 144,
      hash: '5326e361',
    });

    // Verify v8 start potions, Fire Pot + burn logs with target, Saltburst Thorn-Snare cancel, and Bramble-Sweep.
    expect(v8.log[0]?.text).toContain(
      'Hardwood Tonic (+47.2% Armor and −17.7% damage taken for 8 actions)',
    );
    expect(v8.log[1]?.text).toContain(
      'Steadfast Draught (+11.8% Might for the fight, keeps next 2 lost actions)',
    );
    expect(v8.log[2]?.text).toContain(
      'Owl-Eye Drops (+11.8 points to hit and +11.8 points to crit for the fight)',
    );
    expect(v8.log[3]?.text).toContain('Quickfoot Tincture (+23.9% Speed for the fight)');

    const fireBomb = v8.log.find((e) => e.kind === 'bomb' && e.text.includes('Fire Pot'));
    const burn = v8.log.find((e) => e.kind === 'burn');
    const salt = v8.log.find((e) => e.kind === 'bomb' && e.text.includes('Saltburst goes off'));
    expect(fireBomb).toMatchObject({ target: 'thorn-stag', amount: 59, targetHealth: 11941 });
    expect(burn).toMatchObject({ target: 'thorn-stag', amount: 15, targetHealth: 11689 });
    expect(salt).toMatchObject({ target: 'thorn-stag', amount: 30, targetHealth: 10886 });
    expect(salt?.text).toContain('Thorn-Snare is cancelled');
    expect(v8.log.some((e) => e.kind === 'ability' && e.text.includes('Bramble-Sweep'))).toBe(true);
    expect(v8.log.some((e) => e.kind === 'ability' && e.text.includes('Thorn-Snare'))).toBe(true);
  });

  it('The Beacon-Bane (v8 vs v7): Fire attacks, Emberwright Plate, Coldwater, Mending, Poppy Smoke & Saltburst', () => {
    const input: Omit<FightInput, 'rolls' | 'rulesVersion'> = {
      party: [
        snap('arvid', {
          level: 12,
          weapon: 'silvered-blade',
          armorGear: 'emberwright-plate',
          skill: 'hold-the-stair',
          talents: ['vanguard-wall-1', 'vanguard-warden-1'],
        }),
        snap('bjarna', {
          level: 12,
          weapon: 'steel-blade',
          skill: 'rime-dipped',
          talents: ['striker-edge-1'],
        }),
        snap('sigrun', {
          level: 12,
          weapon: 'silvered-blade',
          armorGear: 'emberwright-plate',
          skill: 'the-other-hand',
          talents: ['striker-pace-1'],
        }),
        snap('ostap', {
          level: 12,
          skill: 'bonesetters-hands',
          talents: ['mender-hands-1', 'mender-herbs-1'],
        }),
      ],
      monster: { event: 'beacon-bane', tier: 5, healthOverride: 10000 },
      location: null,
      prep: {
        oils: { bjarna: 'wrights-oil', sigrun: 'wrights-oil' },
        potions: {
          arvid: 'coldwater-draught',
          bjarna: 'coldwater-draught',
          sigrun: 'owl-eye-drops',
          ostap: 'mending-draught',
        },
        bombs: ['poppy-smoke', 'saltburst'],
      },
      alchemy: 6,
    };

    const v8 = runGolden('beacon-bane', input, 8);
    const v7 = runGolden('beacon-bane', input, 7);

    expect(fingerprint(v8)).toEqual({
      result: 'loss',
      ticks: 400,
      health: [242, 186, 158, 167],
      monster: 2011,
      lines: 408,
      hash: '1f48288',
    });
    expect(fingerprint(v7)).toEqual({
      result: 'loss',
      ticks: 263,
      health: [0, 0, 0, 0],
      monster: 6511,
      lines: 215,
      hash: '538492e6',
    });

    // Direct Fire attacks + Emberwright Plate (-25%) + Coldwater (-50%) in v8 vs Steel (-10%/-40%) in v7.
    expect(v8.log.find((e) => e.actor === 'beacon-bane' && e.kind === 'hit')?.text).toBe(
      'The Beacon-Bane hits Arvid Netmender — Fire 78.61 −18.00 armor = 15 · Arvid Netmender 353/368',
    );
    expect(v7.log.find((e) => e.actor === 'beacon-bane' && e.kind === 'hit')?.text).toBe(
      'The Beacon-Bane hits Arvid Netmender — Steel 78.61 −18.00 armor = 52 · Arvid Netmender 316/368',
    );

    expect(
      v8.log.some((e) => e.kind === 'bomb' && e.text.includes('and is Shrouded for 2 actions')),
    ).toBe(true);
    const salt = v8.log.find((e) => e.kind === 'bomb' && e.text.includes('Saltburst goes off'));
    expect(salt).toMatchObject({ target: 'beacon-bane', amount: 44, targetHealth: 9543 });
    expect(salt?.text).toContain('Pitch-Flare is cancelled');
    expect(
      v8.log.some((e) => e.kind === 'ability' && e.text.includes('Pitch-Flare scorches')),
    ).toBe(true);
    expect(v8.log.some((e) => e.kind === 'ability' && e.text.includes('Curse-Brand marks'))).toBe(
      true,
    );
    expect(
      v8.log.some(
        (e) => e.actor === 'ostap' && e.kind === 'prep' && e.text.includes('Mending Draught'),
      ),
    ).toBe(true);
  });

  it('Frost Pot + Rime-Dipped slow stacking + Fire Pot burn + Arena callouts (v8 vs v7)', () => {
    const input: Omit<FightInput, 'rolls' | 'rulesVersion'> = {
      party: [
        snap('halvar', { level: 6, armorGear: 'emberwright-plate' }),
        snap('bjarna', { level: 6, skill: 'rime-dipped' }),
      ],
      monster: { monster: 'draugr', tier: 4 },
      location: 'barrow',
      prep: {
        oils: { bjarna: 'grave-oil' },
        potions: { halvar: 'hardwood-tonic', bjarna: 'quickfoot-tincture' },
        bombs: ['frost-pot', 'fire-pot'],
      },
      alchemy: 5,
    };

    const v8 = runGolden('frost-burn', input, 8);
    const v7 = runGolden('frost-burn', input, 7);

    expect(fingerprint(v8)).toEqual({
      result: 'loss',
      ticks: 400,
      health: [96, 11],
      monster: 68,
      lines: 109,
      hash: '202d509a',
    });
    expect(fingerprint(v7)).toEqual({
      result: 'loss',
      ticks: 400,
      health: [66, 120],
      monster: 48,
      lines: 111,
      hash: 'e52e478c',
    });

    const frostBomb = v8.log.find((e) => e.kind === 'bomb' && e.text.includes('Frost Pot'));
    const fireBomb = v8.log.find((e) => e.kind === 'bomb' && e.text.includes('Fire Pot'));
    const burnTicks = v8.log.filter((e) => e.kind === 'burn');
    expect(frostBomb).toMatchObject({ target: 'draugr', amount: 9, targetHealth: 342 });
    expect(fireBomb).toMatchObject({ target: 'draugr', amount: 69, targetHealth: 273 });
    expect(burnTicks).toHaveLength(3);
    expect(burnTicks.every((b) => b.target === 'draugr' && b.amount === 17)).toBe(true);
    expect(v8.log.some((e) => e.text.includes('Rime-Dipped: Draugr is slowed'))).toBe(true);

    // Arena playback callouts consume target on v8 bomb/burn logs (T19.7).
    const actors: FloorCombatant[] = [
      {
        id: 'halvar',
        name: 'Halvar',
        side: 'hunter',
        spriteId: 'sprite.hunter.halvar',
        portraitId: 'portrait.hunter.halvar',
        start: 1,
      },
      {
        id: 'bjarna',
        name: 'Bjarna',
        side: 'hunter',
        spriteId: 'sprite.hunter.bjarna',
        portraitId: 'portrait.hunter.bjarna',
        start: 1,
      },
      {
        id: 'draugr',
        name: 'Draugr',
        side: 'monster',
        spriteId: 'sprite.monster.draugr',
        portraitId: 'portrait.monster.draugr',
        start: 1,
      },
    ];
    const callouts = playbackSteps(v8, actors)
      .steps.filter((s) => s.kind === 'bomb' || s.kind === 'burn')
      .map((s) => ({ kind: s.kind, callout: s.callout }));
    expect(callouts).toEqual([
      { kind: 'bomb', callout: { target: 'draugr', tone: 'hit', text: '-9' } },
      { kind: 'bomb', callout: { target: 'draugr', tone: 'hit', text: '-69' } },
      { kind: 'burn', callout: { target: 'draugr', tone: 'hit', text: '-17' } },
      { kind: 'burn', callout: { target: 'draugr', tone: 'hit', text: '-17' } },
      { kind: 'burn', callout: { target: 'draugr', tone: 'hit', text: '-17' } },
    ]);
  });

  it('Passive Saltburst (Seal-burn & Noon Heat) + Emberwright Plate Fire mitigation (v8 vs v7)', () => {
    const shadeInput: Omit<FightInput, 'rolls' | 'rulesVersion'> = {
      party: [
        snap('halvar', { level: 6, armorGear: 'emberwright-plate' }),
        snap('zora', { level: 6, weapon: 'iron-blade' }),
      ],
      monster: { monster: 'ribbonshade', tier: 3 },
      location: 'ruin',
      prep: {
        oils: { zora: 'wrights-oil' },
        potions: { halvar: 'coldwater-draught', zora: 'owl-eye-drops' },
        bombs: ['poppy-smoke', 'saltburst'],
      },
      alchemy: 5,
    };
    const shadeV8 = runGolden('ribbonshade', shadeInput, 8);
    const shadeV7 = runGolden('ribbonshade', shadeInput, 7);
    expect(fingerprint(shadeV8)).toEqual({
      result: 'win',
      ticks: 19,
      health: [242, 150],
      monster: 0,
      lines: 12,
      hash: 'b8e78c66',
    });
    expect(fingerprint(shadeV7)).toEqual({
      result: 'win',
      ticks: 25,
      health: [241, 131],
      monster: 0,
      lines: 17,
      hash: '22a7c5e8',
    });
    const shadeSalt = shadeV8.log.find(
      (e) => e.kind === 'bomb' && e.text.includes('Saltburst goes off'),
    );
    expect(shadeSalt).toMatchObject({ target: 'ribbonshade', amount: 22, targetHealth: 115 });
    expect(shadeSalt?.text).toContain('Seal-burn is cancelled');
    expect(
      shadeV8.log.filter((e) => e.kind === 'ability' && e.text.includes('Seal-burn')),
    ).toHaveLength(0);
    expect(
      shadeV7.log.filter((e) => e.kind === 'ability' && e.text.includes('Seal-burn')),
    ).toHaveLength(5);

    const noonInput: Omit<FightInput, 'rolls' | 'rulesVersion'> = {
      party: [
        snap('halvar', { level: 5, armorGear: 'emberwright-plate' }),
        snap('zora', { level: 5, weapon: 'iron-blade' }),
      ],
      monster: { monster: 'poludnitsa', tier: 4 },
      location: 'field',
      prep: {
        oils: { zora: 'thornbane-oil' },
        potions: { halvar: 'mending-draught', zora: 'coldwater-draught' },
        bombs: ['poppy-smoke', 'saltburst'],
      },
      alchemy: 5,
    };
    const noonV8 = runGolden('poludnitsa', noonInput, 8);
    const noonV7 = runGolden('poludnitsa', noonInput, 7);
    expect(fingerprint(noonV8)).toEqual({
      result: 'win',
      ticks: 29,
      health: [225, 121],
      monster: 0,
      lines: 14,
      hash: 'd98922fb',
    });
    expect(fingerprint(noonV7)).toEqual({
      result: 'win',
      ticks: 44,
      health: [225, 87],
      monster: 0,
      lines: 19,
      hash: '341a8fd5',
    });
    const noonSalt = noonV8.log.find(
      (e) => e.kind === 'bomb' && e.text.includes('Saltburst goes off'),
    );
    expect(noonSalt).toMatchObject({ target: 'poludnitsa', amount: 29, targetHealth: 106 });
    expect(noonSalt?.text).toContain('Noon Heat is cancelled');

    // Uncancelled Noon Heat directly exercises Emberwright Plate (-25% in v8 vs -10% in v7).
    const plateInput: Omit<FightInput, 'rolls' | 'rulesVersion'> = {
      party: [
        snap('halvar', { level: 5, armorGear: 'emberwright-plate' }),
        snap('zora', { level: 5, weapon: 'iron-blade', armorGear: 'emberwright-plate' }),
      ],
      monster: { monster: 'poludnitsa', tier: 4 },
      location: 'field',
    };
    const plateV8 = runGolden('noon-plate', plateInput, 8);
    const plateV7 = runGolden('noon-plate', plateInput, 7);
    expect(fingerprint(plateV8)).toEqual({
      result: 'win',
      ticks: 57,
      health: [155, 94],
      monster: 0,
      lines: 31,
      hash: '320a4974',
    });
    expect(fingerprint(plateV7)).toEqual({
      result: 'win',
      ticks: 57,
      health: [149, 94],
      monster: 0,
      lines: 31,
      hash: 'de4be0ac',
    });
    expect(plateV8.log.find((e) => e.text.includes('Noon Heat'))?.amount).toBe(5);
    expect(plateV7.log.find((e) => e.text.includes('Noon Heat'))?.amount).toBe(6);
  });
});
