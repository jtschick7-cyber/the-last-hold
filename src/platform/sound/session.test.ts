import { describe, expect, it } from 'vitest';
import { declareAmbient } from './session';

describe('declareAmbient', () => {
  it('sets the audio session to ambient so the silent switch applies', () => {
    const nav = { audioSession: { type: 'auto' } };
    expect(declareAmbient(nav)).toBe(true);
    expect(nav.audioSession.type).toBe('ambient');
  });

  it('does nothing where the browser has no audio session', () => {
    expect(declareAmbient({})).toBe(false);
  });

  it('survives a browser that refuses the value', () => {
    const nav = {
      audioSession: {
        get type(): string {
          return 'auto';
        },
        set type(_v: string) {
          throw new Error('no');
        },
      },
    };
    expect(declareAmbient(nav)).toBe(false);
  });
});
