// Plan T2.9: five seeded fights, recorded once from the v0.2 combat code and then
// frozen. They are locked (CLAUDE.md): a mismatch means the combat math changed,
// which needs a `rulesVersion` bump and the owner's approval, never an edit here.
// Fight c's fingerprint was re-recorded once, with the owner's approval (Q7, D71): the log
// now prints the Armor a hit actually met. Its result, ticks and Health did not change.
// Each fingerprint hashes every log line, so any change to a single line shows.
import { describe, expect, it } from 'vitest';
import { runFight } from '../../src/core/combat';
import { stream } from '../../src/core/rng';
import { cyrb128 } from '../../src/core/rng/cyrb128';
import { RULES_VERSION } from '../../src/core/rules-version';
import { snap } from '../combat/helpers';

const CASES = [
  {
    key: 'a',
    party: ['halvar', 'zora', 'ostap'],
    monster: 'upyr',
    tier: 2,
    location: 'field',
    want: {
      result: 'win',
      ticks: 58,
      health: [181, 110, 127],
      monster: 0,
      lines: 24,
      hash: 'ea4496aa',
    },
  },
  {
    key: 'b',
    party: ['zora', 'bjarna', 'vesna'],
    monster: 'rusalka',
    tier: 2,
    location: 'river',
    want: {
      result: 'win',
      ticks: 25,
      health: [109, 105, 116],
      monster: 0,
      lines: 11,
      hash: '9032398e',
    },
  },
  {
    key: 'c',
    party: ['halvar', 'radek', 'ostap'],
    monster: 'draugr',
    tier: 3,
    location: 'barrow',
    want: {
      result: 'win',
      ticks: 343,
      health: [136, 146, 95],
      monster: 0,
      lines: 99,
      hash: 'd3a686c3',
    },
  },
  {
    key: 'd',
    party: ['halvar', 'toma', 'bjarna', 'ostap'],
    monster: 'leshy',
    tier: 5,
    location: 'forest',
    want: {
      result: 'loss',
      ticks: 400,
      health: [156, 114, 80, 106],
      monster: 421,
      lines: 261,
      hash: 'ac8177f0',
    },
  },
  {
    key: 'e',
    party: ['sigrun', 'zora', 'ostap'],
    monster: 'strzyga',
    tier: 4,
    location: 'barrow',
    want: {
      result: 'win',
      ticks: 64,
      health: [101, 84, 86],
      monster: 0,
      lines: 32,
      hash: '867de6fc',
    },
  },
] as const;

describe('seeded golden fights (locked)', () => {
  it.each(CASES)('fight $key: $monster tier $tier replays exactly', (c) => {
    const party = c.party.map((id, i) =>
      snap(id, {
        level: i === 0 ? 3 : 2,
        weapon: id === 'zora' ? 'iron-blade' : null,
        armorGear: id === 'halvar' ? 'hide-armor' : null,
      }),
    );
    const r = runFight({
      party,
      monster: { monster: c.monster, tier: c.tier },
      location: c.location,
      rolls: stream('golden', 'fight', c.key),
    });
    const hash = ((cyrb128(r.log.map((e) => e.text).join('\n'))[0] ?? 0) >>> 0).toString(16);
    expect({
      result: r.result,
      ticks: r.ticks,
      health: r.hunters.map((h) => h.health),
      monster: r.monsterHealth,
      lines: r.log.length,
      hash,
    }).toEqual(c.want);
  });

  it('these goldens belong to combat rules version 1', () => {
    expect(RULES_VERSION).toBe(1);
  });
});
