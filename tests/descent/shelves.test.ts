// Plan TD.7c (GDD §5.12.8, §5.14.5, §5.15.10, §9.24): the Roll of Wardens mark, the Library entry and its
// replay, the post-Descent resident lines, and The Unlit on the Great Beasts shelf.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { apply, type Command } from '../../src/core/commands';
import { DESCENT_CARDS, descentResidentLines } from '../../src/content/story/descent';
import { afterEndingLines } from '../../src/content/text/remembering';
import { loadEnvelope } from '../../src/core/save';
import { catchUpNow } from '../../src/core/sim/offline';
import type { GameState } from '../../src/core/state/game-state';
import { afterEndingLine, rememberingShelf } from '../../src/core/story/remembering-view';
import { rollOfWardens } from '../../src/core/story/wardens';
import { suggestDescentOrder } from '../../src/core/systems/descent-order';
import { descentReplayView, unlitShelfEntry } from '../../src/core/systems/descent-playback';

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
const won = (): GameState => {
  const s = open();
  run(s, { type: 'descent.start', order: suggestDescentOrder(s) });
  if (s.descent.last?.outcome !== 'win') throw new Error('the fixture should win');
  return s;
};

describe('the Roll of Wardens', () => {
  it('marks the warden in office when The Descent was first won, and no other', () => {
    const s = won();
    const lines = rollOfWardens(s);
    const led = lines.filter((l) => l.ledDescent);
    expect(led.map((l) => l.cycle)).toEqual([s.descent.firstWin?.cycle]);
  });

  it('marks nobody before a win', () => {
    expect(rollOfWardens(open()).some((l) => l.ledDescent)).toBe(false);
  });
});

describe('the Library shelf', () => {
  it('lists The Descent only once it is won, with a title and no blurb', () => {
    const s = open();
    expect(rememberingShelf(s).map((e) => e.id)).not.toContain('descent');
    const w = won();
    const entry = rememberingShelf(w).find((e) => e.id === 'descent');
    expect(entry).toEqual({ id: 'descent', title: 'The Descent', blurb: '' });
  });

  it('replays D-01 to D-06 and the three stage logs from the first win, whatever came after', () => {
    const s = won();
    const before = JSON.stringify(descentReplayView(s));
    const view = descentReplayView(s);
    expect(view?.cards.map((c) => c.id)).toEqual(['D-01', 'D-02', 'D-03', 'D-04', 'D-05', 'D-06']);
    for (const c of view?.cards ?? []) expect(c).toBe(DESCENT_CARDS[c.id]);
    expect(view?.stages.map((x) => x.logLabel)).toEqual([
      'Stage 1 log',
      'Stage 2 log',
      'Stage 3 log',
    ]);
    // A second attempt replaces `last`, never `firstWin`.
    run(s, { type: 'descent.start', order: suggestDescentOrder(s) });
    expect(JSON.stringify(descentReplayView(s))).toBe(before);
    expect(descentReplayView(open())).toBeNull();
  });
});

describe('the resident lines', () => {
  const texts = (lines: readonly { text: string }[]) => lines.map((l) => l.text);
  it('are the eight after Remember Them, the three after The Descent, and all eleven after both', () => {
    const s = open();
    expect(afterEndingLine(s, 0)).toBeNull();
    s.remembering.endings = [{ ending: 'remember', at: 0, cycle: 1 }];
    const only = new Set(Array.from({ length: 80 }, (_, i) => afterEndingLine(s, i / 80)?.text));
    expect([...only].sort()).toEqual(texts(afterEndingLines).sort());
    s.remembering.endings = [{ ending: 'descent', at: 0, cycle: 1 }];
    const three = new Set(Array.from({ length: 30 }, (_, i) => afterEndingLine(s, i / 30)?.text));
    expect([...three].sort()).toEqual(texts(descentResidentLines).sort());
    s.remembering.endings = [
      { ending: 'remember', at: 0, cycle: 1 },
      { ending: 'descent', at: 0, cycle: 1 },
    ];
    const all = new Set(Array.from({ length: 110 }, (_, i) => afterEndingLine(s, i / 110)?.text));
    expect(all.size).toBe(afterEndingLines.length + descentResidentLines.length);
  });
});

describe('The Unlit on the Great Beasts shelf', () => {
  it('appears once Stage 3 has been reached, with its abilities and weaknesses', () => {
    expect(unlitShelfEntry(open())).toBeNull();
    const e = unlitShelfEntry(won());
    expect(e?.name).toBe('The Unlit');
    expect(e?.portraitId).toBe('portrait.monster.unlit');
    expect(e?.abilities).toEqual(['First Cold', 'Heavy Dark']);
    expect(e?.weak).toMatch(/Rune ×1\.5/);
    expect(e?.resists).toMatch(/Steel ×0\.75/);
    expect(e?.whatItWas.length).toBeGreaterThan(10);
  });
});
