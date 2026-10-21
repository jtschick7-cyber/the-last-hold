// Plan T11.10 (D463, lore §34.7): the ending changes nothing in the game. R-11 is derived from the
// saved ending (not a found document) and sits on the Rime shelf under "After the ending"; the Roll
// of Wardens marks the warden in office when Remember Them was chosen.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { apply } from '../../src/core/commands';
import { loadEnvelope } from '../../src/core/save';
import { catchUpNow } from '../../src/core/sim/offline';
import type { GameState } from '../../src/core/state/game-state';
import { endingSequence } from '../../src/core/story/ending-sequence';
import { rimeAfterEnding } from '../../src/core/story/remembering-view';
import { rimeShelf } from '../../src/core/story/archive';
import { rollOfWardens } from '../../src/core/story/wardens';

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

const stripped = (s: GameState): unknown => {
  const c = structuredClone(s) as unknown as Record<string, Record<string, unknown>>;
  delete c.remembering;
  if (c.meta) {
    delete c.meta.lastSeen;
    delete c.meta.clockHighWater;
  }
  if (c.events) delete c.events.clock;
  return c;
};

describe('Remember Them changes nothing but the record', () => {
  it('leaves orders, skills, documents and everything else as it was', () => {
    const s = ready();
    const before = stripped(s);
    const orders = structuredClone(s.orders);
    const skills = structuredClone(s.skills);
    const docs = structuredClone(s.story.documents);
    expect(apply(s, { type: 'remembering.choose', ending: 'remember' }, s.time).ok).toBe(true);
    expect(s.orders).toEqual(orders);
    expect(s.skills).toEqual(skills);
    expect(s.story.documents).toEqual(docs);
    expect(stripped(s)).toEqual(before);
  });

  it('playing the sequence does not touch the state', () => {
    const s = ready();
    apply(s, { type: 'remembering.choose', ending: 'remember' }, s.time);
    const before = structuredClone(s);
    endingSequence(s);
    expect(s).toEqual(before);
  });
});

describe('R-11 and the Roll mark', () => {
  it('R-11 is derived: none before, present after, and not a found document', () => {
    const s = ready();
    expect(rimeAfterEnding(s)).toBeNull();
    apply(s, { type: 'remembering.choose', ending: 'vigil' }, s.time);
    expect(rimeAfterEnding(s)).toBeNull();
    const rimeBefore = rimeShelf(s).length;
    apply(s, { type: 'remembering.choose', ending: 'remember' }, s.time);
    expect(rimeAfterEnding(s)?.id).toBe('R-11');
    expect(rimeShelf(s)).toHaveLength(rimeBefore);
    expect(s.story.documents.some((d) => d.id === 'R-11')).toBe(false);
    expect(s.story.unread.some((k) => k.includes('R-11'))).toBe(false);
  });

  it('marks only the warden in office when Remember Them was chosen', () => {
    const s = ready();
    expect(rollOfWardens(s).some((l) => l.readAloud)).toBe(false);
    apply(s, { type: 'remembering.choose', ending: 'remember' }, s.time);
    const marked = rollOfWardens(s).filter((l) => l.readAloud);
    expect(marked).toHaveLength(1);
    expect(marked[0]?.cycle).toBe(
      s.remembering.endings.find((e) => e.ending === 'remember')?.cycle,
    );
    expect(marked[0]?.current).toBe(true);
  });

  it('keeps the mark on that warden after a later warden takes office', () => {
    const s = ready();
    apply(s, { type: 'remembering.choose', ending: 'remember' }, s.time);
    const cycle = s.remembering.endings[0]?.cycle ?? 0;
    const later = structuredClone(s);
    const last = later.cycles[later.cycles.length - 1];
    if (!last) throw new Error('no cycle');
    later.cycles.push({ ...structuredClone(last), number: cycle + 1 });
    expect(
      rollOfWardens(later)
        .filter((l) => l.readAloud)
        .map((l) => l.cycle),
    ).toEqual([cycle]);
  });
});
