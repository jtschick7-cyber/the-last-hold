// Plan TD.7b (GDD §9.24, technical design §22.4, S4, S9): what the playback and the result sheet show,
// built from the record alone, and the command that marks a result as seen.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { apply, type Command } from '../../src/core/commands';
import { DESCENT_CARDS } from '../../src/content/story/descent';
import { HUNTER_IDS } from '../../src/content/hunters';
import { loadEnvelope } from '../../src/core/save';
import { catchUpNow } from '../../src/core/sim/offline';
import type { GameState } from '../../src/core/state/game-state';
import { rebuildDescentLogs } from '../../src/core/systems/descent-record';
import { descentPlaybackOf, lastDescentView } from '../../src/core/systems/descent-playback';
import { suggestDescentOrder } from '../../src/core/systems/descent-order';

const run = (s: GameState, cmd: Command) => apply(s, cmd, s.time);
const open = (): GameState => {
  const r = loadEnvelope(
    JSON.parse(readFileSync(new URL('../saves/fixtures/v14.json', import.meta.url), 'utf8')),
  );
  if (!r.ok) throw new Error(r.error);
  const s = r.value.state;
  catchUpNow(s, s.time);
  run(s, { type: 'debug.rememberingFinishActVI' });
  run(s, { type: 'debug.rememberingOpenGate' });
  s.cycle.age = 'bastion';
  run(s, { type: 'debug.prepareEndgameRoster' });
  return s;
};
const last = (s: GameState) => {
  const l = s.descent.last;
  if (!l) throw new Error('no Descent yet');
  return l;
};
/** A hold whose hunters are weak, so the front falls and the reserve steps in. */
const weak = (): GameState => {
  const s = open();
  for (const id of HUNTER_IDS) {
    const h = s.hunters[id];
    if (h) h.level = 1;
  }
  return s;
};
const beatNames = (b: ReturnType<typeof descentPlaybackOf>['beats']): string[] =>
  b.map((x) => (x.kind === 'card' ? x.card.id : `stage-${x.stage}`));

describe('a won Descent', () => {
  it('plays D-01 to D-06 around the three stages and says it won', () => {
    const s = open();
    expect(run(s, { type: 'descent.start', order: suggestDescentOrder(s) }).ok).toBe(true);
    const pb = descentPlaybackOf(last(s));
    expect(last(s).outcome).toBe('win');
    expect(beatNames(pb.beats)).toEqual([
      'D-01',
      'D-02',
      'stage-1',
      'D-03',
      'stage-2',
      'D-04',
      'stage-3',
      'D-05',
      'D-06',
    ]);
    expect(pb.result.won).toBe(true);
    expect(pb.result.heading).toBe('Victory — The Unlit is scattered.');
    expect(pb.result.summary).toBe(
      `Hunters standing: ${last(s).standingCount} · Fallen on the stair: ${last(s).downedCount}`,
    );
    expect(pb.stages.map((x) => x.logLabel)).toEqual(['Stage 1 log', 'Stage 2 log', 'Stage 3 log']);
    expect(pb.stages.map((x) => x.heading)[2]).toBe('Stage 3: Below the Seal — The Unlit');
    expect(pb.stages.map((x) => x.banner)).toEqual([
      'scene.descent.stage-1',
      'scene.descent.stage-2',
      'scene.descent.stage-3',
    ]);
  });

  it('shows the cards word for word from the lore file', () => {
    const s = open();
    run(s, { type: 'descent.start', order: suggestDescentOrder(s) });
    for (const b of descentPlaybackOf(last(s)).beats)
      if (b.kind === 'card') expect(b.card).toBe(DESCENT_CARDS[b.card.id]);
  });

  it("has each stage's log equal to the rebuilt run's, and bars that start and end where the run says", () => {
    const s = open();
    run(s, { type: 'descent.start', order: suggestDescentOrder(s) });
    const pb = descentPlaybackOf(last(s));
    const rebuilt = rebuildDescentLogs(last(s));
    pb.stages.forEach((st, i) => {
      expect(st.log.map((l) => l.text)).toEqual((rebuilt.stages[i]?.log ?? []).map((l) => l.text));
      expect(st.steps).toHaveLength(st.log.length);
      for (const step of st.steps)
        for (const m of st.combatants.filter((c) => c.side === 'monster'))
          expect(step.present, `${m.id} is always on the field`).toContain(m.id);
      for (const c of st.combatants) expect(st.end[c.id]).toBeGreaterThanOrEqual(0);
    });
  });

  it('is built from the record alone: wiping the hold changes nothing', () => {
    const s = open();
    run(s, { type: 'descent.start', order: suggestDescentOrder(s) });
    const before = JSON.stringify(descentPlaybackOf(last(s)));
    for (const id of HUNTER_IDS) {
      const h = s.hunters[id];
      if (h) h.level = 1;
    }
    s.stores['fire-pot'] = 0;
    expect(JSON.stringify(descentPlaybackOf(last(s)))).toBe(before);
  });
});

describe('a lost Descent', () => {
  it('plays D-07 after the stage it fell in, and says where', () => {
    const s = weak();
    const order = suggestDescentOrder(s).slice(0, 6);
    run(s, { type: 'descent.start', order });
    expect(last(s).outcome).toBe('loss');
    const pb = descentPlaybackOf(last(s));
    const stages = pb.stages.length;
    expect(beatNames(pb.beats).at(-1)).toBe('D-07');
    expect(beatNames(pb.beats)).not.toContain('D-05');
    expect(pb.result.won).toBe(false);
    expect(pb.result.heading).toBe(`Driven back at Stage ${last(s).stagesCleared + 1}.`);
    expect(stages).toBe(last(s).stagesCleared + 1);
    expect(pb.stages.at(-1)?.won).toBe(false);
  });

  it('shows reserves stepping in: the present list changes at the step-in line', () => {
    const s = weak();
    run(s, { type: 'descent.start', order: suggestDescentOrder(s) });
    const pb = descentPlaybackOf(last(s));
    const stepIns = pb.stages.flatMap((st) =>
      st.steps.filter((x) => x.text.includes('in from the reserve')),
    );
    expect(stepIns.length).toBeGreaterThan(0);
    for (const x of stepIns) {
      const hunterIds = x.present.filter((id) => (HUNTER_IDS as readonly string[]).includes(id));
      expect(hunterIds.length).toBeGreaterThan(0);
      expect(hunterIds.length).toBeLessThanOrEqual(6);
    }
  });
});

describe('the unread result (S9)', () => {
  it('is set by the attempt, offered by the view, and cleared by descent.markRead', () => {
    const s = open();
    expect(lastDescentView(s)).toBeNull();
    run(s, { type: 'descent.start', order: suggestDescentOrder(s) });
    expect(lastDescentView(s)?.unread).toBe(true);
    expect(run(s, { type: 'descent.markRead' }).ok).toBe(true);
    expect(lastDescentView(s)?.unread).toBe(false);
    expect(last(s).attempt).toBe(1);
  });

  it('keeps firstWin and last when the result is marked read', () => {
    const s = open();
    run(s, { type: 'descent.start', order: suggestDescentOrder(s) });
    const wins = JSON.stringify(s.descent.firstWin);
    run(s, { type: 'descent.markRead' });
    expect(JSON.stringify(s.descent.firstWin)).toBe(wins);
    expect(s.descent.last).not.toBeNull();
  });
});
