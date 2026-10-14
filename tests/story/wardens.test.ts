// Plan T5.9: bands, warden names and the Roll of Wardens, letters at levels 5 and 8
// from the highest level ever reached, and the Citadel and Bastion inscriptions
// (GDD §5.14.5, §5.14.7, §5.14.8; D145, D152, D153, D155, D160).
import { describe, expect, it } from 'vitest';
import { ages } from '../../src/content/ages';
import { bandLines, inscriptions } from '../../src/content/story/scenes';
import { wardenNames } from '../../src/content/story/wardens';
import { apply } from '../../src/core/commands';
import { createNewGame, freshCycleRecord } from '../../src/core/state/new-game';
import type { StandRecord } from '../../src/core/state/game-state';
import { letterKey, notePeak } from '../../src/core/story/letters';
import { residentLines, rollOfWardens, suggestWardenName } from '../../src/core/story/wardens';

const T0 = Date.UTC(2026, 9, 14, 8);

describe('warden names (D152)', () => {
  it('names a cycle’s warden, trims it, and refuses more than 24 characters', () => {
    const s = createNewGame('names', T0);
    expect(apply(s, { type: 'warden.name', cycle: 1, name: '  Dobromila  ' }, T0).ok).toBe(true);
    expect(s.cycles[0]?.warden).toBe('Dobromila');
    const long = apply(s, { type: 'warden.name', cycle: 1, name: 'x'.repeat(25) }, T0);
    expect(long.ok).toBe(false);
    expect(s.cycles[0]?.warden).toBe('Dobromila');
    expect(apply(s, { type: 'warden.name', cycle: 1, name: '' }, T0).ok).toBe(true);
    expect(s.cycles[0]?.warden).toBeNull();
    expect(apply(s, { type: 'warden.name', cycle: 9, name: 'Åsa' }, T0).ok).toBe(false);
  });

  it('Suggest offers a listed name, never one already carved, and always the same for the same press', () => {
    const s = createNewGame('suggest', T0);
    const a = suggestWardenName(s, 0);
    expect(wardenNames).toContain(a);
    expect(suggestWardenName(s, 0)).toBe(a);
    s.cycles[0] = { ...(s.cycles[0] ?? freshCycleRecord(1, T0, 1)), warden: a };
    for (let press = 0; press < 30; press++) expect(suggestWardenName(s, press)).not.toBe(a);
  });
});

describe('the Roll of Wardens (D153)', () => {
  it('one line per warden: name, years, Ranks, band and waves, relics; the current one keeps the hearth', () => {
    const s = createNewGame('roll', T0);
    const first = s.cycles[0];
    if (!first) throw new Error('no cycle');
    first.ranks.keep = T0 + 1;
    first.ranks.citadel = T0 + 2;
    first.stand = { wavesHeld: 12, relicsFound: ['tally-stick'] } as unknown as StandRecord;
    s.cycles.push(freshCycleRecord(2, T0 + 3, 2));
    s.cycles[1] = { ...(s.cycles[1] ?? freshCycleRecord(2, T0, 2)), warden: 'Torgny' };
    const lines = rollOfWardens(s);
    expect(lines[0]).toMatchObject({
      cycle: 1,
      name: 'the warden before',
      named: false,
      fromYear: 300,
      toYear: 303,
      ranks: ['hamlet', 'keep', 'citadel'],
      stand: { band: 'triumphant', waves: 12 },
      relics: ['tally-stick'],
      current: false,
    });
    expect(lines[1]).toMatchObject({ name: 'Torgny', fromYear: 303, toYear: 306, current: true });
  });
});

describe('the stand’s band and the residents’ lines (GDD §5.14.8)', () => {
  it('one line each from Pechko and Brana, from the band’s set, fixed by the stand seed', () => {
    const a = residentLines('g:stand:1', 'held');
    expect(bandLines.held.pechko).toContain(a.pechko);
    expect(bandLines.held.brana).toContain(a.brana);
    expect(residentLines('g:stand:1', 'held')).toEqual(a);
    const seen = new Set(
      Array.from({ length: 30 }, (_, i) => residentLines(`g:stand:${i}`, 'broken').pechko),
    );
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe('letters (GDD §5.14.7, D155)', () => {
  it('arrive at levels 5 and 8 of the highest level ever, carrying their names', () => {
    const s = createNewGame('letters', T0);
    expect(notePeak(s, 'ostap', 4)).toEqual([]);
    expect(notePeak(s, 'ostap', 5)).toEqual([letterKey('ostap', 0), 'name:28']);
    // The Long Night halves his level; the letter isn't taken away or given twice.
    expect(notePeak(s, 'ostap', 3)).toEqual([]);
    expect(s.story.peakLevels.ostap).toBe(5);
    expect(notePeak(s, 'ostap', 8)).toEqual([letterKey('ostap', 1), 'name:31']);
    expect(notePeak(s, 'halvar', 9)).toEqual([letterKey('halvar', 0), letterKey('halvar', 1)]);
    expect(s.story.unread).toEqual(expect.arrayContaining(['letter:ostap:0', 'name:31']));
  });
});

describe('inscriptions (D160)', () => {
  it('the Citadel and Bastion restorations carry them', () => {
    expect(ages.citadel.ageUp?.restores.inscription).toBe(inscriptions.citadel);
    expect(ages.bastion.ageUp?.restores.inscription).toBe(inscriptions.bastion);
  });
});

describe('Suggest with names already in other fields (T5.11b1, D183)', () => {
  it('never offers a name another field already holds', () => {
    const s = createNewGame('suggest-taken', T0);
    const first = suggestWardenName(s, 0);
    for (let press = 0; press < 40; press++)
      expect(suggestWardenName(s, press, [first])).not.toBe(first);
  });
});
