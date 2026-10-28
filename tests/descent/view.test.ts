// Plan TD.7a (GDD §9.24, S3, S4, S6): what the Remembering card and the Descent sheet show, from the core.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { apply, type Command } from '../../src/core/commands';
import { DESCENT_STRINGS } from '../../src/content/descent-text';
import { loadEnvelope } from '../../src/core/save';
import { catchUpNow } from '../../src/core/sim/offline';
import { rememberingCardView } from '../../src/core/story/remembering-view';
import type { GameState } from '../../src/core/state/game-state';
import { learnedBonus } from '../../src/core/systems/descent';
import { previewDescent } from '../../src/core/systems/descent-odds';
import { descentPreviewInputFor } from '../../src/core/systems/descent-record';
import { suggestDescentOrder } from '../../src/core/systems/descent-order';
import { descentPreviewLines, descentSheetView } from '../../src/core/systems/descent-view';

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
  s.remembering.nearSeen = true;
  return s;
};
const card = (s: GameState) => {
  const v = rememberingCardView(s);
  if (!v) throw new Error('no card');
  return v;
};
const record = (s: GameState, ...e: ('remember' | 'vigil' | 'descent')[]): void => {
  s.remembering.endings = e.map((ending) => ({ ending, at: 0, cycle: 1 }));
};

describe('the card forms (S3, S6)', () => {
  it('offers The Descent only with the gate open and the hold at Bastion', () => {
    const s = open();
    expect(card(s)).toMatchObject({ form: 'open', descentAvailable: true });
    s.cycle.age = 'citadel';
    expect(card(s).descentAvailable).toBe(false);
  });

  it('1 nothing chosen, 2 vigil chosen', () => {
    const s = open();
    expect(card(s).form).toBe('open');
    record(s, 'vigil');
    expect(card(s)).toMatchObject({ form: 'afterVigil', descentWon: false, vigilChosen: true });
  });

  it('3 remember chosen, descent not won', () => {
    const s = open();
    record(s, 'remember');
    expect(card(s)).toMatchObject({ form: 'afterRemember', descentWon: false });
  });

  it('4 descent won, remember unchosen (vigil chosen or not)', () => {
    const s = open();
    record(s, 'descent');
    expect(card(s)).toMatchObject({ form: 'afterDescent', descentWon: true, vigilChosen: false });
    record(s, 'vigil', 'descent');
    expect(card(s)).toMatchObject({ form: 'afterDescent', vigilChosen: true });
  });

  it('5 both remember and descent', () => {
    const s = open();
    record(s, 'descent', 'remember');
    expect(card(s)).toMatchObject({ form: 'afterRemember', descentWon: true });
  });
});

describe('the sheet view', () => {
  it('prints the learned line from learnedBonus and lists the five contributors', () => {
    const s = open();
    run(s, { type: 'debug.prepareEndgameRoster' });
    const v = descentSheetView(s);
    const b = learnedBonus(s);
    expect(v.learnedLine).toBe(
      `What the hold learned: +${b.summary.mightPct}% Might and Health · −${b.summary.takenPct}% damage taken`,
    );
    expect(v.learned.children).toHaveLength(5);
    expect(v.relicsHeading).toBe(DESCENT_STRINGS.activeRelics);
  });

  it('names who is away and why', () => {
    const s = open();
    expect(descentSheetView(s).unavailable).toEqual([]);
    const id = suggestDescentOrder(s)[0];
    if (!id) throw new Error('no hunter');
    s.running.push({ party: [id] } as unknown as GameState['running'][number]);
    expect(descentSheetView(s).unavailable).toEqual([
      { id, reason: DESCENT_STRINGS.away.contract },
    ]);
  });

  it('words the preview lines from the preview', () => {
    const s = open();
    run(s, { type: 'debug.prepareEndgameRoster' });
    const p = previewDescent(
      descentPreviewInputFor(s, suggestDescentOrder(s), { oils: {}, potions: {} }, 4),
    );
    const l = descentPreviewLines(p);
    expect(l.win).toBe(
      `Win chance: ${Math.round(p.winChance * 100)}% ±${Math.round(p.margin * 100)}%`,
    );
    expect(l.expected).toMatch(
      p.outcome === 'win' ? /^Expected outcome: Victory/ : /^Expected stage reached: Stage \d/,
    );
    expect(l.why).toBe(DESCENT_STRINGS.preview.why);
  });
});
