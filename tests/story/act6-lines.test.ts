// Plan T9.10, T9.11: Act VI's fixed lines.
import { describe, expect, it } from 'vitest';
import { LAST_WRITTEN_ACT, UNWRITTEN_ACT_LINE, accountEvents } from '../../src/content/story/acts';
import { act6Arrival, act6ArrivalOnLoad, rimeLine } from '../../src/content/story/act6';
import { actClosing } from '../../src/core/story/documents';

describe('Act VI as shipped', () => {
  it('is the last written act; the cycle after it shows the unwritten line', () => {
    expect(LAST_WRITTEN_ACT).toBe(6);
    expect(actClosing(7)).toBe(UNWRITTEN_ACT_LINE);
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
