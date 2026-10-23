// Technical design §20.3–§20.4 (D520–D522): readiness, the 150 ms hold, loading, silence on failure.
import { beforeEach, describe, expect, it } from 'vitest';
import { SOUND_IDS, type SoundId } from './moments';
import { createSoundPlayer, HOLD_MS, type ContextState, type SoundPlayer } from './player';

// A fake clock and a fake output; nothing here touches a browser.
const setup = (opts: { failDecode?: SoundId; failFetch?: SoundId; noEngine?: boolean } = {}) => {
  const log = {
    fetched: [] as SoundId[],
    decoded: 0,
    played: [] as SoundId[],
    created: 0,
    resumes: 0,
  };
  const env = { visible: true, state: 'suspended' as ContextState, now: 0 };
  const timers: { at: number; fn: () => void; h: number }[] = [];
  let next = 1;
  const player: SoundPlayer = createSoundPlayer({
    createEngine: () => {
      log.created++;
      if (opts.noEngine) return null;
      return {
        state: () => env.state,
        resume: () => {
          log.resumes++;
          env.state = 'running';
          return Promise.resolve();
        },
        decode: (bytes) => {
          log.decoded++;
          return opts.failDecode && bytes.byteLength === 1
            ? Promise.reject(new Error('bad'))
            : Promise.resolve(bytes.byteLength);
        },
        play: (id) => log.played.push(id),
      };
    },
    fetchBytes: (id) => {
      log.fetched.push(id);
      if (opts.failFetch === id) return Promise.reject(new Error('404'));
      return Promise.resolve(new ArrayBuffer(opts.failDecode === id ? 1 : 8));
    },
    isVisible: () => env.visible,
    timers: {
      set: (fn, ms) => {
        const h = next++;
        timers.push({ at: env.now + ms, fn, h });
        return h;
      },
      clear: (h) => {
        const i = timers.findIndex((t) => t.h === h);
        if (i >= 0) timers.splice(i, 1);
      },
    },
  });
  const advance = (ms: number): void => {
    env.now += ms;
    for (const t of timers.filter((x) => x.at <= env.now).sort((a, b) => a.at - b.at)) {
      timers.splice(timers.indexOf(t), 1);
      t.fn();
    }
  };
  const settle = async (): Promise<void> => {
    for (let i = 0; i < 6; i++) await Promise.resolve();
  };
  return { player, log, env, advance, settle, timers };
};

describe('Sound Off', () => {
  it('creates no audio, fetches nothing and decodes nothing, and plays nothing', async () => {
    const t = setup();
    t.player.unlock();
    expect(t.player.request('win')).toBe(false);
    t.advance(1000);
    await t.settle();
    expect(t.log).toEqual({ fetched: [], decoded: 0, played: [], created: 0, resumes: 0 });
  });

  it('turning it Off drops what was waiting and forgets the buffers', async () => {
    const t = setup();
    t.player.setEnabled(true);
    await t.settle();
    t.player.request('win');
    t.player.setEnabled(false);
    t.advance(500);
    expect(t.log.played).toEqual([]);
    expect(t.player.request('win')).toBe(false);
  });
});

describe('turning Sound On', () => {
  it('creates the audio, resumes it in the same tap and loads all seven files once', async () => {
    const t = setup();
    t.player.setEnabled(true);
    await t.settle();
    expect(t.log.created).toBe(1);
    expect(t.log.resumes).toBe(1);
    expect([...t.log.fetched].sort()).toEqual([...SOUND_IDS].sort());
    expect(t.log.decoded).toBe(7);
    t.player.setEnabled(false);
    t.player.setEnabled(true);
    expect(t.log.created).toBe(1); // one context for the session
  });

  it('does nothing if the browser has no Web Audio', async () => {
    const t = setup({ noEngine: true });
    t.player.setEnabled(true);
    await t.settle();
    expect(t.log.fetched).toEqual([]);
    expect(t.player.request('win')).toBe(false);
  });
});

describe('playing', () => {
  let t: ReturnType<typeof setup>;
  beforeEach(async () => {
    t = setup();
    t.player.setEnabled(true);
    await t.settle();
  });

  it('plays a requested sound once, after the 150 ms hold', () => {
    expect(t.player.request('build')).toBe(true);
    t.advance(HOLD_MS - 1);
    expect(t.log.played).toEqual([]);
    t.advance(1);
    expect(t.log.played).toEqual(['build']);
    t.advance(1000);
    expect(t.log.played).toEqual(['build']); // never replayed
  });

  it('plays only the strongest when several are due inside the hold', () => {
    t.player.request('place');
    t.advance(50);
    t.player.request('win');
    t.advance(50);
    t.player.request('build');
    t.advance(50);
    expect(t.log.played).toEqual(['win']);
  });

  it('starts a new hold for a request after the first one has played', () => {
    t.player.request('place');
    t.advance(HOLD_MS);
    t.player.request('launch');
    t.advance(HOLD_MS);
    expect(t.log.played).toEqual(['place', 'launch']);
  });

  it('skips, never queues, while the audio is suspended, interrupted or closed', () => {
    for (const state of ['suspended', 'interrupted', 'closed'] as const) {
      t.env.state = state;
      expect(t.player.request('win')).toBe(false);
    }
    t.advance(1000);
    t.env.state = 'running';
    t.advance(1000);
    expect(t.log.played).toEqual([]); // the skipped ones did not come back
  });

  it('skips while the page is hidden, and drops what was waiting when it is hidden', () => {
    t.env.visible = false;
    expect(t.player.request('win')).toBe(false);
    t.env.visible = true;
    t.player.request('lose');
    t.env.visible = false;
    t.player.hidden();
    t.env.visible = true;
    t.advance(1000);
    expect(t.log.played).toEqual([]);
  });

  it('checks again when the hold ends: hidden or paused during the hold means silence', () => {
    t.player.request('win');
    t.env.visible = false;
    t.advance(HOLD_MS);
    t.env.visible = true;
    t.player.request('lose');
    t.env.state = 'interrupted';
    t.advance(HOLD_MS);
    expect(t.log.played).toEqual([]);
  });

  it('a sound whose file never loaded is skipped', async () => {
    const f = setup({ failFetch: 'lose' });
    f.player.setEnabled(true);
    await f.settle();
    expect(f.player.request('lose')).toBe(false);
    expect(f.player.request('win')).toBe(true); // one failure never stops the others
  });

  it('a file that fails to decode is silent and throws nothing', async () => {
    const f = setup({ failDecode: 'fanfare' });
    f.player.setEnabled(true);
    await f.settle();
    expect(f.player.request('fanfare')).toBe(false);
    f.advance(1000);
    expect(f.log.played).toEqual([]);
  });
});

describe('the first tap after a restart with Sound already On', () => {
  it('lets the sound for that very tap play, because the resume finishes inside the hold', async () => {
    const t = setup();
    t.player.setEnabled(true);
    await t.settle();
    // The app was reopened: the context is paused again until the first tap.
    t.env.state = 'suspended';
    t.player.unlock(); // the capturing click listener, before the tap's own handler
    expect(t.player.request('build')).toBe(true);
    t.advance(HOLD_MS);
    expect(t.log.played).toEqual(['build']);
  });
});
