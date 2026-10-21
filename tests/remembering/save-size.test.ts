// Plan T11.16 (D464 (5)): the `remembering` block of a save grows by at most 0.5 KB, with the near-scene
// seen, the ready line noted and both endings recorded.
import { describe, expect, it } from 'vitest';
import { newRememberingState } from '../../src/core/state/remembering-state';

describe('the remembering block of a save', () => {
  it('stays within 0.5 KB when everything is recorded', () => {
    const r = newRememberingState();
    r.nearSeen = true;
    r.readyNoted = true;
    r.endings.push(
      { ending: 'vigil', at: 1_700_000_000_000, cycle: 99 },
      { ending: 'remember', at: 1_700_000_000_000, cycle: 99 },
    );
    expect(JSON.stringify(r).length).toBeLessThanOrEqual(512);
  });

  it('is small when empty, too', () => {
    expect(JSON.stringify(newRememberingState()).length).toBeLessThanOrEqual(80);
  });
});
