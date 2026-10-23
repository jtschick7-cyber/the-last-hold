// Technical design §20.3–§20.4 (D520–D522): the readiness rules, the 150 ms hold and the loading,
// with every outside thing (the audio output, the network, the page's visibility, timers) passed in
// so the rules can be tested without a browser. A sound that cannot play now is skipped, never
// queued and never replayed.
import { strongest, type SoundId, SOUND_IDS } from './moments';

/** iOS also reports `interrupted` after a call or a lock; like `suspended`, it means "paused". */
export type ContextState = 'running' | 'suspended' | 'interrupted' | 'closed';

/** The output side only: the real Web Audio engine, or the recording fake a test installs. */
export interface Engine {
  state(): ContextState;
  resume(): Promise<void>;
  decode(bytes: ArrayBuffer): Promise<unknown>;
  play(id: SoundId, buffer: unknown): void;
}

export interface Timers {
  set(fn: () => void, ms: number): unknown;
  clear(handle: unknown): void;
}

export interface PlayerDeps {
  /** Called only when Sound is turned on; null when the browser has no Web Audio. */
  createEngine(): Engine | null;
  fetchBytes(id: SoundId): Promise<ArrayBuffer>;
  isVisible(): boolean;
  timers: Timers;
}

/** A UI timing, not a game constant (D520 (5) (b)): owner chose the short hold, 2026-10-23. */
export const HOLD_MS = 150;

export interface SoundPlayer {
  /** Sound switched On or Off. Turning On must happen inside the tap (the iPhone's rule). */
  setEnabled(on: boolean): void;
  /** Called on `click` or `touchend`: resumes a paused context. Never plays anything itself. */
  unlock(): void;
  /** The page was hidden: whatever was waiting in the hold is dropped. */
  hidden(): void;
  /** Ask for a sound. False when it was skipped. */
  request(id: SoundId): boolean;
}

export const createSoundPlayer = (deps: PlayerDeps): SoundPlayer => {
  let enabled = false;
  let engine: Engine | null = null;
  let unlocking = false;
  const buffers = new Map<SoundId, unknown>();
  const tried = new Set<SoundId>();
  let pending: SoundId[] = [];
  let timer: unknown = null;

  const dropPending = (): void => {
    pending = [];
    if (timer !== null) deps.timers.clear(timer);
    timer = null;
  };

  const load = (): void => {
    const e = engine;
    if (!e) return;
    for (const id of SOUND_IDS) {
      if (buffers.has(id) || tried.has(id)) continue;
      tried.add(id);
      // Failure is silence: no retry, no message, nothing thrown.
      deps
        .fetchBytes(id)
        .then((bytes) => e.decode(bytes))
        .then((buffer) => {
          if (enabled) buffers.set(id, buffer);
        })
        .catch(() => undefined);
    }
  };

  const unlock = (): void => {
    if (!enabled || !engine || engine.state() === 'running' || unlocking) return;
    unlocking = true;
    engine
      .resume()
      .catch(() => undefined)
      .then(() => {
        unlocking = false;
      });
  };

  const fire = (): void => {
    const due = pending;
    pending = [];
    timer = null;
    // Checked again now: the page may have been hidden or the audio paused during the hold.
    if (!enabled || !engine || !deps.isVisible() || engine.state() !== 'running') return;
    const id = strongest(due);
    const buffer = id === null ? undefined : buffers.get(id);
    if (id !== null && buffer !== undefined) engine.play(id, buffer);
  };

  return {
    setEnabled(on) {
      if (on === enabled) return;
      enabled = on;
      if (!on) {
        dropPending();
        buffers.clear();
        tried.clear();
        return;
      }
      engine ??= deps.createEngine();
      if (!engine) {
        enabled = false;
        return;
      }
      unlock();
      load();
    },
    unlock,
    hidden: dropPending,
    request(id) {
      if (!enabled || !engine || !deps.isVisible() || !buffers.has(id)) return false;
      // A tap that is resuming the audio right now may still play (resume finishes within the hold).
      if (engine.state() !== 'running' && !unlocking) return false;
      pending.push(id);
      timer ??= deps.timers.set(fire, HOLD_MS);
      return true;
    },
  };
};
