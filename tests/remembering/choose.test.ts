// Plan T11.5 (GDD §5.15.3, D461, D462): choosing an ending, and the two debug commands that are the
// owner's path to it. Every refusal has a test; every command goes through apply().
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { apply, type Command } from '../../src/core/commands';
import { encodeSaveFile, loadEnvelope, makeEnvelope } from '../../src/core/save';
import { runFight } from '../../src/core/combat';
import { fightReplayDiffers, standReplayDiffers } from '../../src/core/replay-check';
import { seeded } from '../../src/core/rng';
import { replayStand } from '../../src/core/stand/replay';
import type { GameState } from '../../src/core/state/game-state';
import { catchUpNow } from '../../src/core/sim/offline';
import {
  actVIStandApplied,
  endingChoosable,
  rememberingGate,
} from '../../src/core/story/remembering';
import { rememberingCardView } from '../../src/core/story/remembering-view';

const readFixture = (f: string): { schemaVersion: number; state: GameState } =>
  JSON.parse(readFileSync(new URL(`../saves/fixtures/${f}`, import.meta.url), 'utf8'));
const load = (f: string): GameState => {
  const r = loadEnvelope(readFixture(f));
  if (!r.ok) throw new Error(r.error);
  return r.value.state;
};
/** The owner's migrated save, caught up: a real mid-game state to work on. */
const base = (): GameState => {
  const s = load('v11.json');
  catchUpNow(s, s.time);
  return s;
};
const run = (s: GameState, cmd: Command) => apply(s, cmd, s.time);
const reasonOf = (s: GameState, cmd: Command): string => {
  const r = run(s, cmd);
  if (r.ok) throw new Error(`${cmd.type} was not refused`);
  return r.reason;
};
const ready = (): GameState => {
  const s = base();
  expect(run(s, { type: 'debug.rememberingFinishActVI' }).ok).toBe(true);
  expect(run(s, { type: 'remembering.seeNear' }).ok).toBe(true);
  expect(run(s, { type: 'debug.rememberingOpenGate' }).ok).toBe(true);
  return s;
};

describe('choosing an ending (refusals)', () => {
  it('is refused before Act VI’s stand, even with the gate open', () => {
    const s = base();
    run(s, { type: 'debug.rememberingOpenGate' });
    expect(rememberingGate(s)).toBe(true);
    expect(actVIStandApplied(s)).toBe(false);
    expect(reasonOf(s, { type: 'remembering.choose', ending: 'remember' })).toMatch(/Act VI/);
    expect(reasonOf(s, { type: 'remembering.choose', ending: 'vigil' })).toMatch(/Act VI/);
    expect(s.remembering.endings).toEqual([]);
  });

  it('is refused while the gate is closed, even after Act VI’s stand', () => {
    const s = base();
    run(s, { type: 'debug.rememberingFinishActVI' });
    expect(actVIStandApplied(s)).toBe(true);
    s.story.names = s.story.names.slice(0, 39);
    s.bestiary.wolf = { level: 2, kills: 3 };
    expect(rememberingGate(s)).toBe(false);
    expect(endingChoosable(s)).toBe(false);
    expect(reasonOf(s, { type: 'remembering.choose', ending: 'remember' })).toMatch(/roll/);
    expect(reasonOf(s, { type: 'remembering.choose', ending: 'vigil' })).toMatch(/roll/);
    expect(s.remembering.endings).toEqual([]);
  });

  it('refuses a made-up ending', () => {
    const s = ready();
    expect(reasonOf(s, { type: 'remembering.choose', ending: 'descent' as never })).toMatch(
      /No such ending/,
    );
  });

  it('records Remember Them once, and refuses it twice', () => {
    const s = ready();
    expect(run(s, { type: 'remembering.choose', ending: 'remember' }).ok).toBe(true);
    expect(s.remembering.endings).toEqual([
      { ending: 'remember', at: s.time, cycle: s.cycle.number },
    ]);
    expect(reasonOf(s, { type: 'remembering.choose', ending: 'remember' })).toMatch(/already/);
    expect(s.remembering.endings).toHaveLength(1);
  });

  it('records Keep the Vigil once, and refuses it twice', () => {
    const s = ready();
    expect(run(s, { type: 'remembering.choose', ending: 'vigil' }).ok).toBe(true);
    expect(reasonOf(s, { type: 'remembering.choose', ending: 'vigil' })).toMatch(/already/);
    expect(s.remembering.endings).toHaveLength(1);
  });

  it('allows Remember Them after the vigil, but refuses the vigil after Remember Them', () => {
    const s = ready();
    expect(run(s, { type: 'remembering.choose', ending: 'vigil' }).ok).toBe(true);
    expect(run(s, { type: 'remembering.choose', ending: 'remember' }).ok).toBe(true);
    expect(s.remembering.endings.map((e) => e.ending)).toEqual(['vigil', 'remember']);
    const t = ready();
    run(t, { type: 'remembering.choose', ending: 'remember' });
    expect(reasonOf(t, { type: 'remembering.choose', ending: 'vigil' })).toMatch(/no longer/);
    expect(t.remembering.endings.map((e) => e.ending)).toEqual(['remember']);
  });

  it('changes nothing but the list: the rest of the state is as it was', () => {
    const s = ready();
    const before = structuredClone(s);
    run(s, { type: 'remembering.choose', ending: 'vigil' });
    expect({ ...s, remembering: null }).toEqual({ ...before, remembering: null });
  });
});

describe('the card’s pre-choice forms', () => {
  it('is hidden, then not open, then open, as the owner’s path goes', () => {
    const s = base();
    expect(rememberingCardView(s)).toBeNull();
    run(s, { type: 'debug.rememberingFinishActVI' });
    expect(rememberingCardView(s)).toBeNull(); // the scene has not been seen
    run(s, { type: 'remembering.seeNear' });
    expect(rememberingCardView(s)?.form).toBe('notOpen');
    run(s, { type: 'debug.rememberingOpenGate' });
    expect(rememberingCardView(s)?.form).toBe('open');
    run(s, { type: 'remembering.choose', ending: 'vigil' });
    expect(rememberingCardView(s)?.form).toBe('afterVigil');
    run(s, { type: 'remembering.choose', ending: 'remember' });
    expect(rememberingCardView(s)?.form).toBe('afterRemember');
  });
});

describe('the debug commands (D462)', () => {
  it('open the gate by writing real names and levels, and file no document', () => {
    const s = base();
    const docs = s.story.documents.length;
    const standing = structuredClone(s.orders);
    const skills = structuredClone(s.skills);
    s.story.names = [];
    s.bestiary = {};
    expect(run(s, { type: 'debug.rememberingOpenGate' }).ok).toBe(true);
    expect(s.meta.debugUsed).toBe(true);
    expect(rememberingGate(s)).toBe(true);
    expect(s.story.names).toHaveLength(40);
    expect(s.story.documents.length).toBe(docs);
    expect(s.orders).toEqual(standing);
    expect(s.skills).toEqual(skills);
  });

  it('keep a species that is already Mastered', () => {
    const s = base();
    s.bestiary.wolf = { level: 4, kills: 25 };
    run(s, { type: 'debug.rememberingOpenGate' });
    expect(s.bestiary.wolf).toEqual({ level: 4, kills: 25 });
  });

  it('finish Act VI with a stand that replays, and refuse to do it twice', () => {
    const s = base();
    const r = run(s, { type: 'debug.rememberingFinishActVI' });
    expect(r.ok).toBe(true);
    expect(s.meta.debugUsed).toBe(true);
    expect(actVIStandApplied(s)).toBe(true);
    const stand = s.cycles.find((c) => c.stand && c.act === 6)?.stand;
    expect(stand).toBeTruthy();
    if (stand) expect(standReplayDiffers(stand, replayStand(stand))).toBe(false);
    expect(reasonOf(s, { type: 'debug.rememberingFinishActVI' })).toMatch(/already/);
  });
});

describe('the scripted played fixture (v11-played.json)', () => {
  it('loads on the current schema, validates, round-trips, and has the vigil before Remember Them', () => {
    const s = load('v11-played.json');
    expect(s.remembering.nearSeen).toBe(true);
    expect(s.remembering.endings.map((e) => e.ending)).toEqual(['vigil', 'remember']);
    expect(actVIStandApplied(s)).toBe(true);
    expect(rememberingCardView(s)?.form).toBe('afterRemember');
    const again = loadEnvelope(JSON.parse(encodeSaveFile(makeEnvelope(s, 0))));
    if (!again.ok) throw new Error(again.error);
    expect(again.value.state).toEqual(s);
    expect(again.value.warnings).toEqual([]);
  });

  it('keeps every recorded fight and stand result', () => {
    const s = load('v11-played.json');
    for (const ref of s.log.recentFights)
      expect(
        fightReplayDiffers(
          ref,
          runFight({
            party: ref.party,
            monster: ref.monster,
            location: ref.location,
            rolls: seeded(ref.seed),
            prep: ref.prep,
            alchemy: ref.alchemy,
          }),
        ),
      ).toBe(false);
    for (const c of s.cycles)
      if (c.stand && c.stand.rulesVersion >= 4)
        expect(standReplayDiffers(c.stand, replayStand(c.stand))).toBe(false);
  });
});
