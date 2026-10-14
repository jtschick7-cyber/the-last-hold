// Plan T5.10 (D149, D151, D152): the v0.5 arrival, tested on the owner's real v0.4
// save (tests/saves/fixtures/v4-owner.json): migration, Ilse's arrival, Act I.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { apply } from '../../src/core/commands';
import { loadEnvelope } from '../../src/core/save';
import { createNewGame } from '../../src/core/state/new-game';
import type { GameState } from '../../src/core/state/game-state';
import { currentAct } from '../../src/core/story/documents';
import { rollOfWardens } from '../../src/core/story/wardens';

const ownerSave = (): GameState => {
  const env: unknown = JSON.parse(
    readFileSync(new URL('../saves/fixtures/v4-owner.json', import.meta.url), 'utf8'),
  );
  const r = loadEnvelope(env);
  if (!r.ok) throw new Error(r.error);
  return r.value.state;
};

describe("the v0.5 arrival on the owner's save", () => {
  it('meets Ilse once, hands over Act I’s first letter, names the wardens, and Act I runs', () => {
    const s = ownerSave();
    expect(s.story.arrivalDue).toBe(true);
    expect(currentAct(s)).toBe(1);
    expect(s.story.ilseAt).toBeNull();
    const r = apply(s, { type: 'story.arrive', names: { 1: 'Dobromila', 2: '  ' } }, s.time);
    expect(r.ok).toBe(true);
    expect(s.story.arrivalDue).toBe(false);
    expect(s.story.ilseAt).toBe(s.time);
    // The owner's save is in the Hamlet with no Upyr Mastered: only D1-01 is behind it.
    expect(s.story.documents).toEqual([{ id: 'D1-01', cycle: 2, at: s.time, via: 'arrival' }]);
    expect(rollOfWardens(s).map((w) => [w.name, w.current])).toEqual([
      ['Dobromila', false],
      ['the warden before', true],
    ]);
    // Once only.
    expect(apply(s, { type: 'story.arrive', names: {} }, s.time).ok).toBe(false);
  });

  it('finds what is already behind a save: a Rank reached, a Mastered species, a letter', () => {
    const s = ownerSave();
    const rec = s.cycles[s.cycles.length - 1];
    if (!rec) throw new Error('no cycle');
    rec.ranks.citadel = s.time;
    s.cycle.age = 'citadel';
    s.bestiary.upyr = { level: 4, kills: 12 };
    const h = s.hunters.halvar;
    if (!h) throw new Error('no Halvar');
    h.level = 5;
    expect(apply(s, { type: 'story.arrive', names: {} }, s.time).ok).toBe(true);
    expect(s.story.documents.map((d) => [d.id, d.via])).toEqual([
      ['D1-01', 'arrival'],
      ['D1-09', 'arrival'],
      ['D1-05', 'arrival'],
    ]);
    expect(s.story.letters.map((l) => `${l.hunter}:${l.slot}`)).toEqual(['halvar:0']);
  });

  it('waits for a pending v0.4 arrival', () => {
    const s = ownerSave();
    s.arrivalDue = true;
    const r = apply(s, { type: 'story.arrive', names: {} }, s.time);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('The first Long Night comes first.');
  });

  it('a new game never meets it; the debug action makes a save meet Ilse again', () => {
    const fresh = createNewGame('new', 0);
    expect(fresh.story.arrivalDue).toBe(false);
    expect(apply(fresh, { type: 'story.arrive', names: {} }, 0).ok).toBe(false);
    const s = ownerSave();
    apply(s, { type: 'story.arrive', names: {} }, s.time);
    expect(apply(s, { type: 'debug.runV05Arrival' }, s.time).ok).toBe(true);
    expect(s.story.arrivalDue).toBe(true);
    expect(s.meta.debugUsed).toBe(true);
  });
});
