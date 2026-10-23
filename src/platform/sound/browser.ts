// The real browser side of the sound player (technical design §20.3): Web Audio buffer sources,
// `fetch`, the page's visibility. No `<audio>` elements and no tricks around the silent switch.
import { createSoundPlayer, type ContextState, type Engine, type SoundPlayer } from './player';
import type { SoundId } from './moments';
import { declareAmbient } from './session';

/**
 * The one documented test hook (D522 (7)): a test sets `window.__lastholdSoundTest` before the app
 * starts. It replaces only the output: the files are still fetched, and every readiness rule still
 * runs. A test changes `state` to simulate a lock or a call. Does nothing unless a test sets it.
 */
export interface SoundTestHook {
  state: ContextState;
  /** False keeps a paused fake paused when the app asks to resume (default: a tap resumes it). */
  resumable?: boolean;
  played: SoundId[];
}
declare global {
  interface Window {
    __lastholdSoundTest?: SoundTestHook;
    webkitAudioContext?: typeof AudioContext;
  }
}

const fakeEngine = (hook: SoundTestHook): Engine => ({
  state: () => hook.state,
  resume: () => {
    // A tap resumes a suspended or interrupted fake, like a real phone.
    if (hook.resumable !== false) hook.state = 'running';
    return Promise.resolve();
  },
  decode: (bytes) => Promise.resolve(bytes.byteLength),
  play: (id) => {
    hook.played.push(id);
  },
});

const webAudioEngine = (): Engine | null => {
  const Ctor = window.AudioContext ?? window.webkitAudioContext;
  if (!Ctor) return null;
  declareAmbient(navigator); // before the context exists: the silent switch must apply to it (D521 (5))
  const ctx = new Ctor();
  return {
    state: () => ctx.state as ContextState, // iOS adds 'interrupted', which the DOM types lack
    resume: () => ctx.resume(),
    decode: (bytes) => ctx.decodeAudioData(bytes),
    play: (_id, buffer) => {
      const source = ctx.createBufferSource();
      source.buffer = buffer as AudioBuffer;
      source.connect(ctx.destination);
      source.start();
    },
  };
};

export const soundUrl = (id: SoundId): string =>
  `${import.meta.env.BASE_URL}assets/audio/${id}.mp3`;

export const createBrowserSound = (): SoundPlayer => {
  const player = createSoundPlayer({
    createEngine: () => {
      const hook = window.__lastholdSoundTest;
      return hook ? fakeEngine(hook) : webAudioEngine();
    },
    fetchBytes: (id) =>
      fetch(soundUrl(id)).then((r) => {
        if (!r.ok) throw new Error(`sound ${id}: ${r.status}`);
        return r.arrayBuffer();
      }),
    isVisible: () => document.visibilityState === 'visible',
    timers: {
      set: (fn, ms) => window.setTimeout(fn, ms),
      clear: (h) => window.clearTimeout(h as number),
    },
  });
  // `click` and `touchend` count as a gesture for audio on recent iOS; `pointerdown` and
  // `touchstart` do not (D522 (3)). Capturing, so the resume starts before the tap's own handler.
  const unlock = (): void => player.unlock();
  document.addEventListener('click', unlock, { capture: true, passive: true });
  document.addEventListener('touchend', unlock, { capture: true, passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') player.hidden();
  });
  return player;
};
