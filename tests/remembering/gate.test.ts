// Plan T11.2 (GDD §5.15.1, D449, D459 (4), D461): the Remembering's gate, worked out from the state
// each time and never stored; and the load-time checks that need it (technical design §5.2).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CONTRACT_SPECIES } from '../../src/content/remembering';
import { ROLL_SIZE } from '../../src/content/story/roll';
import { encodeSaveFile, loadEnvelope, makeEnvelope } from '../../src/core/save';
import type { CycleRecord, GameState } from '../../src/core/state/game-state';
import { createNewGame } from '../../src/core/state/new-game';
import { freshAct } from '../../src/core/state/story-state';
import {
  actVIStandApplied,
  endingChoosable,
  namesFound,
  rememberingGate,
  speciesStudied,
} from '../../src/core/story/remembering';

const T0 = Date.UTC(2026, 9, 21, 8);

const withNames = (s: GameState, count: number): GameState => {
  s.story.names = Array.from({ length: count }, (_, i) => ({ n: i + 1, cycle: 1, at: T0 }));
  return s;
};
const withStudied = (s: GameState, species = CONTRACT_SPECIES, kills = 4): GameState => {
  for (const m of species) s.bestiary[m] = { level: kills >= 10 ? 4 : 3, kills };
  return s;
};
const open = (): GameState => withStudied(withNames(createNewGame('gate', T0), ROLL_SIZE));
const cycleAt = (s: GameState, i: number): CycleRecord => {
  const c = s.cycles[i];
  if (!c) throw new Error(`no cycle ${i}`);
  return c;
};
const setStand = (s: GameState, i: number, stand: CycleRecord['stand']): void => {
  cycleAt(s, i).stand = stand;
};
const standApplied = (s: GameState): GameState => {
  s.story.acts.push(freshAct(6, 1, T0));
  setStand(s, 0, {} as never); // the guard is not run on these in-memory states
  return s;
};

describe('the gate (D449)', () => {
  it('is closed in a new game and counts names and species from the state', () => {
    const s = createNewGame('gate', T0);
    expect(namesFound(s)).toBe(0);
    expect(speciesStudied(s)).toBe(0);
    expect(rememberingGate(s)).toBe(false);
  });

  it('is closed with 39 names, however well the species are known', () => {
    const s = withStudied(withNames(createNewGame('gate', T0), 39));
    expect(namesFound(s)).toBe(39);
    expect(speciesStudied(s)).toBe(CONTRACT_SPECIES.length);
    expect(rememberingGate(s)).toBe(false);
  });

  it('is closed with one species at 3 kills, even when it is Identified and all 40 names are found', () => {
    const s = open();
    s.bestiary.wolf = { level: 2, kills: 3 };
    expect(speciesStudied(s)).toBe(CONTRACT_SPECIES.length - 1);
    expect(rememberingGate(s)).toBe(false);
  });

  it('reads the stored knowledge level, not raw kills', () => {
    const s = open();
    s.bestiary.wolf = { level: 2, kills: 99 };
    expect(rememberingGate(s)).toBe(false);
    s.bestiary.wolf = { level: 3, kills: 4 };
    expect(rememberingGate(s)).toBe(true);
  });

  it('is open with all 40 names and every contract species Studied; Mastered counts too', () => {
    const s = open();
    expect(rememberingGate(s)).toBe(true);
    s.bestiary.wolf = { level: 4, kills: 10 };
    expect(rememberingGate(s)).toBe(true);
  });

  it('counts a name once, and ignores numbers outside the roll', () => {
    const s = createNewGame('gate', T0);
    s.story.names = [1, 1, 2, 99, 0].map((n) => ({ n, cycle: 1, at: T0 }));
    expect(namesFound(s)).toBe(2);
  });

  it('does not count the Great Beasts, quarries or the Dross-Tide: only the contract species', () => {
    const s = createNewGame('gate', T0);
    expect(CONTRACT_SPECIES).toHaveLength(16);
    expect(
      rememberingGate(withStudied(withNames(s, ROLL_SIZE), CONTRACT_SPECIES.slice(0, 15))),
    ).toBe(false);
  });

  it('is never stored: it follows the state, and a save carries no gate', () => {
    const s = open();
    expect(rememberingGate(s)).toBe(true);
    delete s.bestiary.nix;
    expect(rememberingGate(s)).toBe(false);
    expect(JSON.stringify(s.remembering)).not.toMatch(/gate/i);
    expect(Object.keys(s.remembering).sort()).toEqual(['endings', 'nearSeen', 'readyNoted']);
  });
});

describe('Act VI’s stand applied (D459 (4))', () => {
  it('is false before Act VI, during it, and true once its cycle has a stand result', () => {
    const s = createNewGame('act6', T0);
    expect(actVIStandApplied(s)).toBe(false);
    s.story.acts.push(freshAct(6, 1, T0));
    expect(actVIStandApplied(s)).toBe(false);
    setStand(s, 0, {} as never);
    expect(actVIStandApplied(s)).toBe(true);
  });

  it('is true when a later cycle exists, and ignores a stand in another act’s cycle', () => {
    const s = createNewGame('act6', T0);
    s.story.acts.push(freshAct(5, 1, T0), freshAct(6, 2, T0));
    setStand(s, 0, {} as never);
    s.cycles.push({ ...cycleAt(s, 0), number: 2, stand: null });
    expect(actVIStandApplied(s)).toBe(false);
    s.cycles.push({ ...cycleAt(s, 0), number: 3, stand: null });
    expect(actVIStandApplied(s)).toBe(true);
  });

  it('makes an ending choosable only with the gate open as well', () => {
    const s = standApplied(createNewGame('both', T0));
    expect(endingChoosable(s)).toBe(false);
    expect(endingChoosable(open())).toBe(false);
    expect(endingChoosable(standApplied(open()))).toBe(true);
  });
});

describe('loading recorded endings (D461 (1))', () => {
  const fixture = (): GameState => {
    const env = JSON.parse(
      readFileSync(new URL('../saves/fixtures/v11.json', import.meta.url), 'utf8'),
    ) as { state: GameState };
    const loaded = loadEnvelope(env);
    if (!loaded.ok) throw new Error(loaded.error);
    return loaded.value.state;
  };
  const pastStand = (): CycleRecord['stand'] => {
    const c = fixture().cycles.find((x) => x.stand);
    if (!c) throw new Error('the fixture has no stand');
    return c.stand;
  };
  const reload = (s: GameState) => {
    const r = loadEnvelope(JSON.parse(encodeSaveFile(makeEnvelope(s, 0))));
    if (!r.ok) throw new Error(r.error);
    return r.value;
  };
  const record = (s: GameState) => {
    s.remembering.endings = [{ ending: 'remember', at: 5, cycle: s.cycle.number }];
  };

  it('drops an ending recorded while Act VI’s stand is not applied, with a warning', () => {
    const s = fixture();
    expect(actVIStandApplied(s)).toBe(false);
    record(s);
    const r = reload(s);
    expect(r.state.remembering.endings).toEqual([]);
    expect(r.warnings).toHaveLength(1);
  });

  it('keeps an ending whose gate no longer holds, with a warning', () => {
    const s = fixture();
    s.story.acts.push(freshAct(6, cycleAt(s, s.cycles.length - 1).number - 1, T0));
    expect(actVIStandApplied(s)).toBe(true);
    expect(rememberingGate(s)).toBe(false);
    record(s);
    const r = reload(s);
    expect(r.state.remembering.endings).toHaveLength(1);
    expect(r.warnings).toHaveLength(1);
  });

  it('is silent when the ending, the stand and the gate all agree', () => {
    const s = standApplied(open());
    s.cycles = [{ ...cycleAt(s, 0), stand: pastStand() }];
    record(s);
    const r = reload(s);
    expect(r.state.remembering.endings).toHaveLength(1);
    expect(r.warnings).toEqual([]);
  });

  it('is not changed by a clock set back: times are information only', () => {
    const s = standApplied(open());
    s.cycles = [{ ...cycleAt(s, 0), stand: pastStand() }];
    s.remembering.endings = [
      { ending: 'vigil', at: 9_000_000, cycle: 1 },
      { ending: 'remember', at: 10, cycle: 1 },
    ];
    expect(reload(s).state.remembering.endings.map((e) => e.ending)).toEqual(['vigil', 'remember']);
  });
});
