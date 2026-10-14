// Plan T5.14 (GDD §6.1, D167): the simulated player's v0.5 rules.
import { describe, expect, it } from 'vitest';
import { apply, type Command } from '../../src/core/commands';
import { refillRoster } from '../../src/core/policies/contracts';
import { freshHunter } from '../../src/core/state/hunters-state';
import type { GameState } from '../../src/core/state/game-state';
import { rosterCap } from '../../src/core/systems/hunters';
import { HOUR, T0, keepRich } from '../contracts/helpers';

const actor = (s: GameState) => {
  const done: Command[] = [];
  return {
    done,
    act: (cmd: Command): boolean => {
      const ok = apply(s, cmd, s.time).ok;
      if (ok) done.push(cmd);
      return ok;
    },
  };
};

const withLevels = (s: GameState, levels: Record<string, number>): void => {
  for (const [id, level] of Object.entries(levels)) {
    s.hunters[id as 'halvar'] = { ...freshHunter(), level };
  }
};

describe('the simulated player fills its roster (D167)', () => {
  it('moves reserve hunters in, highest level first, while the active roster has room', () => {
    const s = keepRich('roster-refill');
    s.hunters = {};
    s.roster.active = ['halvar'];
    withLevels(s, { halvar: 1, zora: 5, ostap: 3, bjarna: 7, vesna: 2 });
    const cap = rosterCap(s).value;
    expect(cap).toBeGreaterThanOrEqual(3);
    const { act, done } = actor(s);
    const n = refillRoster(s, act);
    expect(n).toBe(4); // everyone owned moves in; the cap leaves room for more
    expect(s.roster.active).toHaveLength(5);
    expect(done.map((c) => (c.type === 'roster.set' ? c.hunter : '?')).slice(0, 2)).toEqual([
      'bjarna',
      'zora',
    ]);
  });

  it('does nothing when the roster is full or the reserve is empty, and skips the hurt', () => {
    const s = keepRich('roster-refill-2');
    s.hunters = {};
    withLevels(s, { halvar: 1 });
    s.roster.active = ['halvar'];
    s.hunters.zora = {
      ...freshHunter(),
      level: 5,
      recovery: { kind: 'wounded', until: T0 + 9 * HOUR },
    };
    const { act } = actor(s);
    expect(refillRoster(s, act)).toBe(0); // zora is recovering; nobody else is owned
    s.roster.active = ['halvar', 'zora'];
    expect(refillRoster(s, act)).toBe(0);
  });
});

describe('the cap limits it', () => {
  it('stops when the active roster is full', () => {
    const s = keepRich('roster-refill-3');
    s.hunters = {};
    const cap = rosterCap(s).value;
    s.roster.active = [];
    const ids = [
      'halvar',
      'zora',
      'ostap',
      'bjarna',
      'vesna',
      'radek',
      'sigrun',
      'toma',
      'stanko',
      'herdis',
    ];
    ids.forEach((id, i) => withLevels(s, { [id]: i + 1 }));
    const { act } = actor(s);
    expect(refillRoster(s, act)).toBe(cap);
    expect(s.roster.active).toHaveLength(cap);
    expect(s.roster.active[0]).toBe('herdis'); // the highest level went first
  });
});
