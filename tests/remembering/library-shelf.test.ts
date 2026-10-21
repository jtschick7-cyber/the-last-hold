// Plan T11.13 (GDD §9.19, lore §34.8): the Library shelf "The Remembering" and the card's four forms.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { rememberingCard, rememberingShelfEntries } from '../../src/content/text/remembering';
import { apply } from '../../src/core/commands';
import { loadEnvelope } from '../../src/core/save';
import { catchUpNow } from '../../src/core/sim/offline';
import type { GameState } from '../../src/core/state/game-state';
import { endingSequence } from '../../src/core/story/ending-sequence';
import { rememberingCardView, rememberingShelf } from '../../src/core/story/remembering-view';
import { rememberingGate } from '../../src/core/story/remembering';

const lore = readFileSync(new URL('../../docs/lore-secrets.md', import.meta.url), 'utf8');

const ready = (): GameState => {
  const r = loadEnvelope(
    JSON.parse(readFileSync(new URL('../saves/fixtures/v11.json', import.meta.url), 'utf8')),
  );
  if (!r.ok) throw new Error(r.error);
  const s = r.value.state;
  catchUpNow(s, s.time);
  for (const type of [
    'debug.rememberingFinishActVI',
    'remembering.seeNear',
    'debug.rememberingOpenGate',
  ] as const)
    expect(apply(s, { type }, s.time).ok).toBe(true);
  return s;
};

const choose = (s: GameState, ending: 'remember' | 'vigil'): void => {
  expect(apply(s, { type: 'remembering.choose', ending }, s.time).ok).toBe(true);
};

describe('the shelf', () => {
  it('is hidden until an entry is reached', () => {
    expect(rememberingShelf(ready())).toEqual([]);
  });

  it('shows "Later" after the vigil, and "The reading" after Remember Them', () => {
    const s = ready();
    choose(s, 'vigil');
    expect(rememberingShelf(s).map((e) => e.id)).toEqual(['later']);
    choose(s, 'remember');
    expect(rememberingShelf(s)).toEqual([
      { id: 'reading', ...rememberingShelfEntries.reading },
      { id: 'later', ...rememberingShelfEntries.later },
    ]);
  });

  it('shows only "The reading" when Remember Them came first', () => {
    const s = ready();
    choose(s, 'remember');
    expect(rememberingShelf(s).map((e) => e.id)).toEqual(['reading']);
  });

  it('has the titles and blurbs of lore §34.8', () => {
    expect(lore).toContain(
      `**${rememberingShelfEntries.reading.title}** — *"${rememberingShelfEntries.reading.blurb}"*`,
    );
    expect(lore).toContain(
      `**${rememberingShelfEntries.later.title}** — *"${rememberingShelfEntries.later.blurb}"*`,
    );
  });

  it('replays the whole ending, the same every time, with nothing changed in the game', () => {
    const s = ready();
    choose(s, 'remember');
    const before = structuredClone(s);
    const first = endingSequence(s);
    expect(endingSequence(s)).toEqual(first);
    expect(first.map((x) => (x.kind === 'reading' ? 'reading' : x.card.id))).toContain('R-11');
    expect(s).toEqual(before);
  });
});

describe('the card’s four forms', () => {
  it('are not open, open, after the vigil, after Remember Them', () => {
    const s = ready();
    s.story.names.pop();
    expect(rememberingGate(s)).toBe(false);
    expect(rememberingCardView(s)?.form).toBe('notOpen');
    const t = ready();
    expect(rememberingCardView(t)?.form).toBe('open');
    choose(t, 'vigil');
    expect(rememberingCardView(t)?.form).toBe('afterVigil');
    choose(t, 'remember');
    expect(rememberingCardView(t)?.form).toBe('afterRemember');
  });

  it('keep their after-choice forms with the gate artificially closed', () => {
    const s = ready();
    choose(s, 'vigil');
    const dropped = s.story.names.pop();
    if (!dropped) throw new Error('no name');
    expect(rememberingGate(s)).toBe(false);
    expect(rememberingCardView(s)?.form).toBe('afterVigil');
    s.story.names.push(dropped);
    choose(s, 'remember');
    s.story.names.pop();
    expect(rememberingGate(s)).toBe(false);
    const v = rememberingCardView(s);
    expect(v?.form).toBe('afterRemember');
    expect(v?.counts).toEqual([]);
  });

  it('say what lore §34.2 says', () => {
    expect(lore).toContain(rememberingCard.afterRemember.line);
    expect(lore).toContain(rememberingCard.afterVigil.line);
    expect(rememberingCard.afterRemember.again).toBe('Read it again');
  });
});
