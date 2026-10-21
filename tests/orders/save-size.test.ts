// GDD §6.5 (D445): the Orders block of a save stays within 2 KB with all four Orders opened and
// every chapter read with a full seat record.
import { describe, expect, it } from 'vitest';
import { ORDER_IDS } from '../../src/content/orders';
import { newOrdersState } from '../../src/core/state/orders-state';

describe('the Orders block of a save', () => {
  it('stays within 2 KB when everything is opened and read', () => {
    const o = newOrdersState();
    for (const id of ORDER_IDS) {
      o.opened[id] = { at: 1_700_000_000_000 };
      o.levelHigh[id] = 4;
      o.chaptersRead[id] = 4;
      o.start[id] = 25;
      o.readWith[id] = [[...ORDER_IDS], [...ORDER_IDS], [...ORDER_IDS], [...ORDER_IDS]];
      for (const k of Object.keys(o.counts[id] ?? {}))
        (o.counts[id] as Record<string, number>)[k] = 99_999;
    }
    o.seats = ['moot', 'greyWives', 'bellWatchers'];
    o.thirdSeat = true;
    o.triumphant = 99;
    o.lastChange = 1_700_000_000_000;
    o.delveWindow = { start: 1_700_000_000_000, used: 20 };
    expect(JSON.stringify(o).length).toBeLessThanOrEqual(2048);
  });
});
