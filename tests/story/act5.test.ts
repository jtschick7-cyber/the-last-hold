// Plan T8.1 (lore-secrets §30, D301–D302): Act V begins with the next warden after Act IV's stand
// (Pechko at the crack, D5-01); Yrsa's letters are delivered by the crack; the Last Stand of
// Act V opens the Unlit's door (D257) and brings Yrsa's Thole's line. The save's on-load start
// (D246) needs saved state, so it is T8.5.
import { describe, expect, it } from 'vitest';
import { act5Arrival, act5ArrivalOnLoad, sixthDoorLine } from '../../src/content/story/act5';
import { acts, actNumeral, allDocuments } from '../../src/content/story/acts';
import { riftCardView } from '../../src/core/delves/view';
import type { GameState } from '../../src/core/state/game-state';
import { createNewGame, freshCycleRecord } from '../../src/core/state/new-game';
import { freshAct } from '../../src/core/state/story-state';
import { describeCondition, foundLine } from '../../src/core/story/archive';
import { foundLines } from '../../src/core/story/found-lines';
import { T0, keepRich, run } from '../contracts/helpers';

/** A bastion in cycle `n`, ready to make the stand that ends that cycle's act. */
const standReady = (seed: string, n: number): GameState => {
  const s = keepRich(seed);
  s.cycle = { number: n, age: 'bastion' };
  for (let c = 2; c <= n; c++) {
    s.cycles.push(freshCycleRecord(c, s.time, c));
    s.story.acts.push(freshAct(c, c, s.time));
  }
  s.story.ilseAt = s.time;
  return s;
};

describe('Act V begins with the next warden (D302)', () => {
  it('Act V is written, with Yrsa as its witness', () => {
    expect(acts.map((a) => a.act)).toContain(5);
    expect(actNumeral(5)).toBe('V');
    expect(acts[4]).toMatchObject({ heading: 'V. The Hearthblade', witness: 'Yrsa Varn' });
  });

  it('the stand that closes Act IV brings D5-01 after D4-07, and Act V’s counters start fresh', () => {
    const s = standReady('act5-arrives', 4);
    expect(run(s, { type: 'stand.make', party: ['halvar'] }).ok).toBe(true);
    expect(s.cycle.number).toBe(5);
    expect(s.cycles[s.cycles.length - 1]?.act).toBe(5);
    expect(s.story.acts.find((a) => a.act === 5)).toMatchObject({
      cycle: 5,
      wins: 0,
      ruinWins: 0,
      winsByFamily: {},
    });
    expect(s.story.documents.find((d) => d.id === 'D5-01')).toMatchObject({
      cycle: 5,
      via: 'warden',
    });
    const ids = s.story.documents.map((d) => d.id);
    expect(ids.indexOf('D4-07')).toBeLessThan(ids.indexOf('D5-01'));
    expect(ids.filter((id) => id.startsWith('D5-'))).toEqual(['D5-01']);
  });

  it('the Act IV stand does not open the Unlit’s door; the Act V stand does (D257)', () => {
    const four = standReady('door-4', 4);
    expect(run(four, { type: 'stand.make', party: ['halvar'] }).ok).toBe(true);
    expect(four.delve.unlitOpen).toBe(false);
    const five = standReady('door-5', 5);
    expect(run(five, { type: 'stand.make', party: ['halvar'] }).ok).toBe(true);
    expect(five.story.documents.some((d) => d.id === 'D5-06')).toBe(true);
    expect(five.delve.unlitOpen).toBe(true);
    // The door stays open through the Long Night and into the next cycle.
    expect(five.cycle.number).toBe(6);
  });

  it('the Rift card says the sixth door is there until a blessing has been taken from the Unlit', () => {
    const s = standReady('rift-line', 5);
    expect(riftCardView(s)?.unlitLine).toBeNull();
    s.delve.unlitOpen = true;
    expect(riftCardView(s)?.unlitLine).toBe(sixthDoorLine);
    s.delve.taken.unlit = ['faint'];
    expect(riftCardView(s)?.unlitLine).toBeNull();
  });
});

describe('how Act V’s letters arrive (D302)', () => {
  const get = (id: string) => {
    const d = allDocuments.find((x) => x.id === id);
    if (!d) throw new Error(`missing ${id}`);
    return d;
  };

  it('Yrsa’s letters come up at the crack; Věra’s comes with the bounty', () => {
    const s = createNewGame('delivery', T0);
    expect(foundLines(s, ['doc:D5-02'])).toEqual([
      "Pechko found a letter at the crack: 'The first night'.",
    ]);
    expect(foundLines(s, ['doc:D5-03'])).toEqual([
      "Pechko found a letter at the crack: 'The rings'.",
    ]);
    expect(foundLines(s, ['doc:D5-08'])).toEqual([
      "A letter came with the bounty: 'A mouth, not a hearth'.",
    ]);
    // Earlier acts keep the old line.
    expect(foundLines(s, ['doc:D4-08'])).toEqual([
      "A letter came with the bounty: 'Bread at the gate'.",
    ]);
  });

  it('describes the conditions in the Library’s "Found:" line', () => {
    expect(describeCondition(get('D5-01'))).toBe('Act V begins');
    expect(describeCondition(get('D5-03'))).toBe('the first Ravenfell contract won in Act V');
    expect(foundLine(get('D5-08'), { id: 'D5-08', cycle: 5, at: 0, via: 'contract' })).toBe(
      'Found: the 2nd Kozly Hollow contract won in Act V, cycle 5.',
    );
  });

  it('has the two arrival lines (lore-secrets §30)', () => {
    expect(act5Arrival).toContain('Pechko is kneeling at the crack behind the stove');
    expect(act5ArrivalOnLoad).toContain('calls you over to the crack');
  });
});
