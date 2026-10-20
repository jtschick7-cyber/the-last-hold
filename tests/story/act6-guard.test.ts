// Plan T9.10: Act VI's machinery with the real content as it stands before its texts (T9.11).
import { describe, expect, it } from 'vitest';
import { LAST_WRITTEN_ACT, UNWRITTEN_ACT_LINE, accountEvents } from '../../src/content/story/acts';
import { act6Arrival, act6ArrivalOnLoad, rimeLine } from '../../src/content/story/act6';
import { actClosing } from '../../src/core/story/documents';
import { createNewGame, freshCycleRecord } from '../../src/core/state/new-game';
import { freshAct } from '../../src/core/state/story-state';
import { actDue } from '../../src/core/story/act-start';

describe('Act VI with no texts yet', () => {
  it('is not an act yet: it has no documents, so the last written act is still V', () => {
    expect(LAST_WRITTEN_ACT).toBe(5);
    expect(actClosing(6)).toBe(UNWRITTEN_ACT_LINE);
  });

  it('never asks to play an opening scene it does not have', () => {
    const s = createNewGame('guard', 0);
    s.cycles.push(freshCycleRecord(2, 0, 6));
    s.story.acts.push(freshAct(6, 2, 0));
    expect(actDue(s)).toBeNull();
  });

  it('has the arrival lines word for word, and the Accounts event', () => {
    expect(act6Arrival).toBe(
      'Ilse is back from Velkvik with the archive. Pechko is sitting by the crack behind the stove, and the frost on the floor has shapes in it.',
    );
    expect(act6ArrivalOnLoad).toBe(
      'Pechko is sitting by the crack when you come in. The frost on the floor has shapes in it.',
    );
    expect(rimeLine('X')).toBe("There is new writing in the rime by the crack: 'X'.");
    expect(accountEvents.find((e) => e.id === 'cold')?.heading).toBe('What the cold wants');
  });
});
