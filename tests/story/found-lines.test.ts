// Plan T5.11b2 (GDD §5.14.2, §5.14.4, §5.14.6): the one-line texts a contract result
// shows for what the story brought, built from the result's `found` keys.
import { describe, expect, it } from 'vitest';
import { roll } from '../../src/content/story/roll';
import { firstRibbon, laterRibbon, plainRibbon } from '../../src/content/story/scenes';
import { trustStepLine } from '../../src/content/story/trust';
import { createNewGame } from '../../src/core/state/new-game';
import { foundLines } from '../../src/core/story/found-lines';

const T0 = Date.UTC(2026, 9, 14, 8);

describe('what a contract result says the story brought', () => {
  const s = createNewGame('found-lines', T0);

  it('a document: its type and heading, as the GDD words it', () => {
    expect(foundLines(s, ['doc:D1-04'])).toEqual([
      "A letter came with the bounty: 'My boy writes no letters'.",
    ]);
    expect(foundLines(s, ['doc:D1-03'])).toEqual([
      "A ledger page came with the bounty: 'Apprentice roll, Mirograd'.",
    ]);
  });

  it('a Ribbonshade: Jaro’s ribbon first, a named ribbon after, a plain one once all six are found', () => {
    expect(foundLines(s, ['ribbon:1', 'name:39'])).toEqual([firstRibbon]);
    const second = roll.find((r) => r.source.kind === 'ribbonshade' && r.source.order === 2);
    expect(foundLines(s, ['ribbon:2', `name:${second?.n}`])).toEqual([
      laterRibbon(second?.name ?? ''),
    ]);
    expect(foundLines(s, ['ribbon:7'])).toEqual([plainRibbon]);
  });

  it('a village stepping up: the GDD’s line', () => {
    expect(foundLines(s, ['trust:mirograd:trusting'])).toEqual([
      trustStepLine('Mirograd', 'trusting'),
    ]);
  });

  it('a hunter’s letter; names and unknown keys say nothing', () => {
    expect(foundLines(s, ['letter:ostap:0'])).toEqual(['Ostap wrote you a letter.']);
    expect(foundLines(s, ['letter:halvar:0'])).toEqual(['Halvar wrote you a letter.']);
    expect(foundLines(s, ['name:28', 'what:ever', 'doc:nope'])).toEqual([]);
  });
});
