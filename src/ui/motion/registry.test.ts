// Plan TV.5: motion is reduced if the phone says so OR the switch is on; the switch never overrides the phone.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { isReduced, motionInterval } from './registry';

describe('isReduced', () => {
  it('phone or switch', () => {
    expect(isReduced('system', false)).toBe(false);
    expect(isReduced('off', false)).toBe(false);
    expect(isReduced('on', false)).toBe(true);
    expect(isReduced('system', true)).toBe(true);
    expect(isReduced('off', true)).toBe(true);
    expect(isReduced('on', true)).toBe(true);
  });
});

describe('motionInterval', () => {
  afterEach(() => vi.useRealTimers());

  it('steps at the same pace, whatever is reduced, and stops when told', () => {
    vi.useFakeTimers();
    const step = vi.fn();
    const stop = motionInterval(step, 250);
    vi.advanceTimersByTime(1000);
    expect(step).toHaveBeenCalledTimes(4);
    stop();
    vi.advanceTimersByTime(1000);
    expect(step).toHaveBeenCalledTimes(4);
  });
});
