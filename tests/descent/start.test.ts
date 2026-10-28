// Plan TD.4b (technical design §22.4, §22.1, §22.6, D558, D561, D563, M3, M5): the Descent command, its
// frozen record, the log rebuild, and the debug path to an honest win. Every command goes through apply().
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { apply, type Command } from '../../src/core/commands';
import { HUNTER_IDS, type HunterId } from '../../src/content/hunters';
import { encodeSaveFile, loadEnvelope, makeEnvelope } from '../../src/core/save';
import { catchUpNow } from '../../src/core/sim/offline';
import type { GameState } from '../../src/core/state/game-state';
import {
  descentAvailable,
  eligibleForDescent,
  rebuildDescentLogs,
  rebuildMatches,
} from '../../src/core/systems/descent-record';

const fixture = (f: string): unknown =>
  JSON.parse(readFileSync(new URL(`../saves/fixtures/${f}`, import.meta.url), 'utf8'));
const load = (f: string): GameState => {
  const r = loadEnvelope(fixture(f));
  if (!r.ok) throw new Error(r.error);
  return r.value.state;
};
const run = (s: GameState, cmd: Command) => apply(s, cmd, s.time);
const reason = (s: GameState, cmd: Command): string => {
  const r = run(s, cmd);
  if (r.ok) throw new Error(`${cmd.type} was not refused`);
  return r.reason;
};
/** The owner's migrated save with the gate open and the hold at Bastion, before any Descent. */
const open = (): GameState => {
  const s = load('v14.json');
  catchUpNow(s, s.time);
  run(s, { type: 'debug.rememberingFinishActVI' });
  run(s, { type: 'debug.rememberingOpenGate' });
  s.cycle.age = 'bastion';
  return s;
};
/** The same, with the endgame roster. */
const ready = (): GameState => {
  const s = open();
  run(s, { type: 'debug.prepareEndgameRoster' });
  return s;
};
const everyone = (s: GameState): HunterId[] => eligibleForDescent(s);

describe('availability and refusals', () => {
  it('is closed while the gate is closed', () => {
    const s = load('v14.json');
    expect(descentAvailable(s)).toBe(false);
    expect(reason(s, { type: 'descent.start', order: [HUNTER_IDS[0] as HunterId] })).toMatch(
      /not open/,
    );
  });

  it('is closed below Bastion, even with the gate open', () => {
    const s = open();
    s.cycle.age = 'citadel';
    expect(descentAvailable(s)).toBe(false);
    expect(reason(s, { type: 'descent.start', order: everyone(s) })).toMatch(/not open/);
    s.cycle.age = 'bastion';
    expect(descentAvailable(s)).toBe(true);
  });

  it('refuses an empty order, a duplicate, an unknown or unowned hunter, and more than 14', () => {
    const s = ready();
    const some = everyone(s);
    expect(reason(s, { type: 'descent.start', order: [] })).toMatch(/at least one/);
    expect(reason(s, { type: 'descent.start', order: [some[0], some[0]] as HunterId[] })).toMatch(
      /twice/,
    );
    expect(reason(s, { type: 'descent.start', order: ['nobody' as HunterId] })).toMatch(/your own/);
    expect(reason(s, { type: 'descent.start', order: [...some, ...some] })).toMatch(/At most 14/);
    delete s.hunters.zora;
    expect(reason(s, { type: 'descent.start', order: ['zora'] })).toMatch(/your own/);
    expect(s.descent.attempts).toBe(0);
  });

  it('refuses hunters on a running contract or in a paused Delve', () => {
    const s = ready();
    const first = HUNTER_IDS[0] as HunterId;
    s.running.push({ party: [first] } as never);
    expect(eligibleForDescent(s)).not.toContain(first);
    expect(reason(s, { type: 'descent.start', order: [first] })).toMatch(/contract or in a Delve/);
    s.running.length = 0;
    const second = HUNTER_IDS[1] as HunterId;
    s.delve.run = { party: [second] } as never;
    expect(reason(s, { type: 'descent.start', order: [second] })).toMatch(/contract or in a Delve/);
  });

  it('refuses a preparation the stores cannot pay for, or for a hunter not marching', () => {
    const s = ready();
    const id = HUNTER_IDS[0] as HunterId;
    s.stores['mending-draught'] = 0;
    expect(
      reason(s, {
        type: 'descent.start',
        order: [id],
        prep: { oils: {}, potions: { [id]: 'mending-draught' } },
      }),
    ).toMatch(/Not enough/);
    s.stores['mending-draught'] = 5;
    expect(
      reason(s, {
        type: 'descent.start',
        order: [id],
        prep: { oils: {}, potions: { zora: 'mending-draught' } },
      }),
    ).toMatch(/only for hunters/);
    expect(s.stores['mending-draught']).toBe(5);
  });
});

describe('a win', () => {
  it('records the ending once, sets firstWin, last and unlitMet, and changes nothing else', () => {
    const s = ready();
    const before = structuredClone(s);
    const order = everyone(s);
    expect(run(s, { type: 'descent.start', order }).ok).toBe(true);
    const d = s.descent;
    expect(d.attempts).toBe(1);
    expect(d.last?.outcome).toBe('win');
    expect(d.last?.stagesCleared).toBe(3);
    expect(d.firstWin).toEqual(d.last);
    expect(d.unlitMet).toBe(true);
    expect(d.unreadResult).toBe(true);
    expect(s.remembering.endings.filter((e) => e.ending === 'descent')).toHaveLength(1);
    // Nothing else moved: no injuries, XP, deaths, Long Night, vigil, orders, skills, Threat.
    const strip = (x: GameState): unknown => {
      const c = structuredClone(x) as Partial<GameState>;
      delete c.descent;
      delete c.stores;
      c.remembering = { ...x.remembering, endings: [] };
      return c;
    };
    expect(strip(s)).toEqual(strip(before));
    expect(s.cycle).toEqual(before.cycle);
    expect(s.cycles).toHaveLength(before.cycles.length);
  });

  it('a later win updates last and leaves firstWin and the endings alone', () => {
    const s = ready();
    run(s, { type: 'descent.start', order: everyone(s) });
    const first = structuredClone(s.descent.firstWin);
    const endings = structuredClone(s.remembering.endings);
    expect(run(s, { type: 'descent.start', order: everyone(s) }).ok).toBe(true);
    expect(s.descent.attempts).toBe(2);
    expect(s.descent.last?.attempt).toBe(2);
    expect(s.descent.firstWin).toEqual(first);
    expect(s.remembering.endings).toEqual(endings);
  });

  it('spends the potions and oils set out and only the bombs thrown', () => {
    const s = ready();
    const id = HUNTER_IDS[0] as HunterId;
    s.stores['mending-draught'] = 3;
    s.stores['wrights-oil'] = 3;
    s.stores['fire-pot'] = 9;
    const r = run(s, {
      type: 'descent.start',
      order: everyone(s),
      prep: { oils: { [id]: 'wrights-oil' }, potions: { [id]: 'mending-draught' } },
    });
    expect(r.ok).toBe(true);
    expect(s.stores['mending-draught']).toBe(2);
    expect(s.stores['wrights-oil']).toBe(2);
    const thrown = 9 - s.stores['fire-pot'];
    expect(thrown).toBeGreaterThanOrEqual(0);
    expect(thrown).toBeLessThanOrEqual(6);
  });
});

describe('a loss', () => {
  /** One level-1 hunter cannot get through the Deep. */
  const weak = (): GameState => {
    const s = open();
    const id = HUNTER_IDS[0] as HunterId;
    (s.hunters[id] as NonNullable<(typeof s.hunters)[typeof id]>).level = 1;
    return s;
  };

  it('records last, spends what was thrown, sets unreadResult, and can be retried at once', () => {
    const s = weak();
    const id = HUNTER_IDS[0] as HunterId;
    s.stores['fire-pot'] = 4;
    const endings = structuredClone(s.remembering.endings);
    expect(run(s, { type: 'descent.start', order: [id] }).ok).toBe(true);
    expect(s.descent.last?.outcome).toBe('loss');
    expect(s.descent.firstWin).toBeNull();
    expect(s.descent.unreadResult).toBe(true);
    expect(s.descent.attempts).toBe(1);
    expect(s.remembering.endings).toEqual(endings);
    expect(s.stores['fire-pot']).toBeLessThan(4);
    expect(run(s, { type: 'descent.start', order: [id] }).ok).toBe(true);
    expect(s.descent.attempts).toBe(2);
    expect(s.descent.last?.seed).toMatch(/:descent:2$/);
  });
});

describe('the frozen record and the log rebuild (M3)', () => {
  const won = (): GameState => {
    const s = ready();
    run(s, { type: 'descent.start', order: everyone(s) });
    return s;
  };

  it('rebuilds all three stage logs from the record alone, line for line', () => {
    const s = won();
    const rec = s.descent.firstWin as NonNullable<typeof s.descent.firstWin>;
    const a = rebuildDescentLogs(rec);
    const b = rebuildDescentLogs(structuredClone(rec));
    expect(a.stages).toHaveLength(3);
    expect(a.stages.every((st) => st.log.length > 0)).toBe(true);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(rebuildMatches(rec, a)).toBe(true);
  });

  it('is immune to later changes in the hold', () => {
    const s = won();
    const rec = structuredClone(s.descent.firstWin) as NonNullable<typeof s.descent.firstWin>;
    const before = JSON.stringify(rebuildDescentLogs(rec));
    // Kill counts, levels, gear, relics, knowledge and constants-in-state all move on.
    for (const h of Object.values(s.hunters)) h.level = 1;
    s.items = [];
    s.relics = [];
    s.delve.relics = [];
    s.bestiary = {};
    s.delve.deep = {};
    s.skills = { alchemy: 0, smithing: 0, lore: 0, command: 0 };
    expect(JSON.stringify(rebuildDescentLogs(rec))).toBe(before);
  });

  it('freezes knowledge, the learned bonus, relics and the constants it fought with', () => {
    const rec = won().descent.last as NonNullable<GameState['descent']['last']>;
    expect(rec.rulesVersion).toBe(5);
    expect(rec.stageTiers).toHaveLength(3);
    expect(rec.unlitBaseHealth).toBeGreaterThan(0);
    expect(Object.keys(rec.bestiaryKnowledge).sort()).toEqual(
      [
        'anvil-wight',
        'dross-tide',
        'rimewrought',
        'the-forgotten',
        'unlit',
        'unlits-breath',
      ].sort(),
    );
    expect(rec.learned.mightAndHealth).toBeGreaterThan(0);
    expect(rec.learned.taken).toBeGreaterThan(0);
    expect(rec.order).toHaveLength(14);
    expect(rec.seed).toMatch(/:descent:1$/);
  });
});

describe('debug.descentWin and debug.prepareEndgameRoster (M5)', () => {
  it('prepareEndgameRoster builds the maxed profile and is idempotent', () => {
    const s = open();
    expect(run(s, { type: 'debug.prepareEndgameRoster' }).ok).toBe(true);
    expect(s.meta.debugUsed).toBe(true);
    expect(Object.keys(s.hunters)).toHaveLength(14);
    for (const h of Object.values(s.hunters)) {
      expect(h.level).toBe(10);
      expect(h.rank).toBe('masterWright');
      expect(h.stars).toBe(5);
      expect(h.talents).toHaveLength(5);
      expect(h.weapon).not.toBeNull();
      expect(h.armor).not.toBeNull();
    }
    expect(s.relics).toHaveLength(6);
    expect(s.delve.relics).toHaveLength(6);
    const once = JSON.stringify(s);
    run(s, { type: 'debug.prepareEndgameRoster' });
    expect(JSON.stringify(s)).toBe(once);
  });

  it('descentWin plays real attempts to a genuine win from a plain save', () => {
    const s = load('v14.json');
    catchUpNow(s, s.time);
    expect(run(s, { type: 'debug.descentWin' }).ok).toBe(true);
    expect(s.meta.debugUsed).toBe(true);
    expect(s.descent.firstWin?.outcome).toBe('win');
    expect(s.descent.attempts).toBeGreaterThanOrEqual(1);
    expect(s.remembering.endings.some((e) => e.ending === 'descent')).toBe(true);
    expect(
      rebuildMatches(s.descent.firstWin as never, rebuildDescentLogs(s.descent.firstWin as never)),
    ).toBe(true);
  });
});

describe('v14-played.json (made in TD.4b with the real commands)', () => {
  const loaded = () => {
    const r = loadEnvelope(fixture('v14-played.json'));
    if (!r.ok) throw new Error(r.error);
    return r.value;
  };

  it('loads, validates and round-trips', () => {
    const s = loaded().state;
    expect(s.descent.firstWin?.outcome).toBe('win');
    const again = loadEnvelope(JSON.parse(encodeSaveFile(makeEnvelope(s, s.time))));
    if (!again.ok) throw new Error(again.error);
    expect(again.value.state).toEqual(s);
  });

  it('replays honestly: the record rebuilds to the same result', () => {
    const rec = loaded().state.descent.firstWin as never;
    expect(rebuildMatches(rec, rebuildDescentLogs(rec))).toBe(true);
  });

  it('save growth is measured (M4)', () => {
    const d = loaded().state.descent;
    const record = JSON.stringify(d.firstWin).length;
    const block = JSON.stringify(d).length;
    // Two records (last and firstWin) of a full 14-hunter order; written down in progress.md.
    expect(record).toBeGreaterThan(0);
    expect(block).toBeLessThan(record * 2 + 400);
    console.info(`descent record ${record} bytes; block ${block} bytes`);
  });
});
