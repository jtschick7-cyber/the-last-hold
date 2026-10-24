// Plan KV.4 (GDD §5.9.10, technical design §21.3–§21.4, D542, D544): the switch, the level a stand
// is fought at, the debug command, and what Keep the Vigil does not touch.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { apply } from '../../src/core/commands';
import { standReplayDiffers } from '../../src/core/replay-check';
import { loadEnvelope } from '../../src/core/save';
import { catchUpNow } from '../../src/core/sim/offline';
import { embersPayout } from '../../src/core/stand/embers';
import { replayStand, standInputOf } from '../../src/core/stand/replay';
import type { GameState, StandRecord } from '../../src/core/state/game-state';
import { vigilAvailable, vigilLevelFor } from '../../src/core/systems/vigil';

const fixture = (f: string): GameState => {
  const env = JSON.parse(readFileSync(new URL(`../saves/fixtures/${f}`, import.meta.url), 'utf8'));
  const r = loadEnvelope(env);
  if (!r.ok) throw new Error(r.error);
  catchUpNow(r.value.state, r.value.state.time);
  return r.value.state;
};
const must = (s: GameState, cmd: Parameters<typeof apply>[1]): void => {
  const r = apply(s, cmd, s.time);
  if (!r.ok) throw new Error(`${cmd.type}: ${r.reason}`);
};
/** The owner's save, past Act VI with the gate open (the Remembering debug path, D462). */
const open = (): GameState => {
  const s = fixture('v13.json');
  must(s, { type: 'debug.rememberingFinishActVI' });
  must(s, { type: 'remembering.seeNear' });
  must(s, { type: 'debug.rememberingOpenGate' });
  return s;
};
const standNow = (s: GameState): StandRecord | null => {
  s.cycle.age = 'bastion';
  const rec = s.cycles[s.cycles.length - 1];
  if (rec) rec.ranks.bastion ??= s.time;
  const party = s.roster.active.slice(0, 6) as never;
  must(s, { type: 'stand.make', party });
  return s.cycles[s.cycles.length - 2]?.stand ?? null;
};

describe('vigil.set (D544 (1))', () => {
  it('refuses On while the gate is closed, and changes nothing', () => {
    const s = fixture('v13.json');
    expect(vigilAvailable(s)).toBe(false);
    const before = structuredClone(s);
    const r = apply(s, { type: 'vigil.set', on: true }, s.time);
    expect(r.ok).toBe(false);
    expect(s).toEqual(before);
  });

  it('accepts Off, and On again, once the gate is open; setting the same value changes nothing', () => {
    const s = open();
    expect(vigilAvailable(s)).toBe(true);
    for (const on of [true, true, false, false, true]) {
      const before = structuredClone(s);
      expect(apply(s, { type: 'vigil.set', on }, s.time).ok).toBe(true);
      expect(s.vigil.on).toBe(on);
      expect({ ...s, vigil: null }).toEqual({ ...before, vigil: null });
    }
  });

  it('sets no debug flag and refuses a non-boolean', () => {
    const s = open();
    s.meta.debugUsed = false;
    expect(apply(s, { type: 'vigil.set', on: true }, s.time).ok).toBe(true);
    expect(s.meta.debugUsed).toBe(false);
    expect(apply(s, { type: 'vigil.set', on: 'yes' as never }, s.time).ok).toBe(false);
    expect(s.vigil.on).toBe(true);
  });

  it('has no "stand started" window: the Long Night follows the stand in the same command', () => {
    const s = open();
    expect(apply(s, { type: 'vigil.set', on: true }, s.time).ok).toBe(true);
    standNow(s);
    // The new cycle's record has no stand yet, so the switch is not read-only afterwards.
    expect(s.cycles[s.cycles.length - 1]?.stand).toBeNull();
    expect(apply(s, { type: 'vigil.set', on: false }, s.time).ok).toBe(true);
    expect(apply(s, { type: 'vigil.set', on: true }, s.time).ok).toBe(true);
  });
});

describe('the level a stand is fought at (D544 (2))', () => {
  it('On: level = stands + 1, the count goes up, the record carries it, and the Embers use it', () => {
    const s = open();
    must(s, { type: 'vigil.set', on: true });
    expect(vigilLevelFor(s)).toBe(1);
    const first = standNow(s);
    expect(first?.vigilLevel).toBe(1);
    expect(s.vigil).toEqual({ on: true, stands: 1 });
    expect(vigilLevelFor(s)).toBe(2);
    const second = standNow(s);
    expect(second?.vigilLevel).toBe(2);
    expect(s.vigil.stands).toBe(2);
    if (second)
      expect(second.embers.total).toBe(
        embersPayout({
          rank: second.rank,
          waves: second.wavesHeld,
          threat: second.threat,
          trophies: second.embers.trophies,
          vigilLevel: 2,
        }).value,
      );
  });

  it('Off: an ordinary stand with no level written, the count kept, the switch kept', () => {
    const s = open();
    must(s, { type: 'vigil.set', on: true });
    standNow(s);
    must(s, { type: 'vigil.set', on: false });
    expect(vigilLevelFor(s)).toBe(0);
    const off = standNow(s);
    expect(off).not.toBeNull();
    expect(off && 'vigilLevel' in off).toBe(false);
    expect(s.vigil).toEqual({ on: false, stands: 1 });
    must(s, { type: 'vigil.set', on: true });
    expect(standNow(s)?.vigilLevel).toBe(2); // carries on where the last On stand left off
  });

  it('starting twice cannot add two levels', () => {
    const s = open();
    must(s, { type: 'vigil.set', on: true });
    standNow(s);
    s.cycle.age = 'hamlet'; // the new cycle: the stand opens only at Bastion
    const again = apply(
      s,
      { type: 'stand.make', party: s.roster.active.slice(0, 6) as never },
      s.time,
    );
    expect(again.ok).toBe(false);
    expect(s.vigil.stands).toBe(1);
  });

  it('a switch left On with the gate closed makes an ordinary stand', () => {
    const s = fixture('v13.json');
    s.vigil = { on: true, stands: 2 };
    expect(vigilLevelFor(s)).toBe(0);
  });

  it('a stand with the switch Off equals a level 0 stand, whatever the count', () => {
    const a = open();
    const b = structuredClone(a);
    a.vigil = { on: false, stands: 7 };
    const ra = standNow(a);
    const rb = standNow(b);
    expect(ra).toEqual(rb);
    expect(a.embers).toBe(b.embers);
  });
});

describe('a rebuilt stand uses the saved level (CLAUDE.md, v1.3 rule 2)', () => {
  it('flipping the switch afterwards changes nothing in the rebuild', () => {
    const s = open();
    must(s, { type: 'vigil.set', on: true });
    standNow(s);
    must(s, { type: 'vigil.set', on: true });
    const rec = standNow(s);
    if (!rec) throw new Error('no stand');
    expect(rec.vigilLevel).toBe(2);
    const first = replayStand(rec);
    s.vigil = { on: false, stands: 40 };
    expect(replayStand(rec)).toEqual(first);
    expect(standReplayDiffers(rec, first)).toBe(false);
    expect(standInputOf(rec).vigilLevel).toBe(2);
  });
});

describe('Keep the Vigil and Remember Them leave Rising Vigil alone (D453, D539)', () => {
  it('remembering.choose("vigil") leaves state.vigil identical', () => {
    const s = open();
    must(s, { type: 'vigil.set', on: true });
    standNow(s);
    const before = structuredClone(s.vigil);
    must(s, { type: 'remembering.choose', ending: 'vigil' });
    expect(s.vigil).toEqual(before);
  });

  it('Rising Vigil stays available after Remember Them', () => {
    const s = open();
    must(s, { type: 'remembering.choose', ending: 'remember' });
    expect(vigilAvailable(s)).toBe(true);
    expect(apply(s, { type: 'vigil.set', on: true }, s.time).ok).toBe(true);
  });
});

describe('debug.vigilSetStands (D544 (7))', () => {
  it('sets the count, marks debugUsed, and the next On stand carries on from it', () => {
    const s = open();
    s.meta.debugUsed = false;
    must(s, { type: 'debug.vigilSetStands', stands: 6 });
    expect(s.vigil.stands).toBe(6);
    expect(s.meta.debugUsed).toBe(true);
    must(s, { type: 'vigil.set', on: true });
    expect(vigilLevelFor(s)).toBe(7);
  });

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, '3', null])(
    'refuses %s and changes nothing',
    (bad) => {
      const s = open();
      s.meta.debugUsed = false;
      const before = structuredClone(s);
      expect(apply(s, { type: 'debug.vigilSetStands', stands: bad as never }, s.time).ok).toBe(
        false,
      );
      expect(s).toEqual(before);
    },
  );
});
