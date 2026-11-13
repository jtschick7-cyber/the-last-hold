// GDD §9.22, technical design §24.3 (D609): procedural frontier ambience. Everything is made in Web
// Audio from filtered noise, slow LFOs and two quiet sine tones: 0 bytes of audio files, no loops.
// The rules (Off makes nothing, a tap starts it, hidden pauses at once, story screens fade to complete
// silence) live in `createAmbiencePlayer`, with the outside world passed in so they test without a
// browser. Nothing in `src/core/` knows this exists.
import type { ContextState } from './player';
import { declareAmbient } from './session';

/** `hearth` is Hearth & Wind, `watch` is Night Watch, `silent` is complete silence. */
export const AMBIENCE_MOODS = ['hearth', 'watch', 'silent'] as const;
export type AmbienceMood = (typeof AMBIENCE_MOODS)[number];
/** What an open screen asks for: Night Watch (a Delve, the Last Stand, the Descent arena) or silence. */
export type MoodClaim = 'watch' | 'silent';

/** UI timings, not game constants: a gentle cross-fade, and a slightly quicker fade into silence. */
export const MOOD_FADE_MS = 2000;
export const SILENCE_FADE_MS = 1200;

/** The output side only: the Web Audio graph, or the recording fake a test installs. */
export interface AmbienceVoice {
  state(): ContextState;
  resume(): Promise<void>;
  suspend(): Promise<void>;
  /** Ramp to the mood's mix over `ms` (0: at once). */
  fadeTo(mood: AmbienceMood, ms: number): void;
}

export interface AmbienceDeps {
  /** Called only when Ambience is turned on; null when the browser has no Web Audio. */
  createVoice(): AmbienceVoice | null;
  isVisible(): boolean;
}

export interface AmbiencePlayer {
  /** Ambience switched On or Off. Turning On must happen inside the tap (the iPhone's rule). */
  setEnabled(on: boolean): void;
  /** The mood the screen on show wants. */
  setMood(mood: AmbienceMood): void;
  /** Called on `click` or `touchend`: resumes a paused context. */
  unlock(): void;
  /** The page was hidden or put away: silent and suspended at once. */
  hidden(): void;
  /** The page is visible again. */
  shown(): void;
  /** What is being faded towards right now. */
  audible(): AmbienceMood;
}

/** Silence always wins (D520, D609); then the debug preview; then Night Watch; else Hearth & Wind. */
export const resolveMood = (
  claims: readonly MoodClaim[],
  preview: AmbienceMood | null,
): AmbienceMood =>
  claims.includes('silent')
    ? 'silent'
    : (preview ?? (claims.includes('watch') ? 'watch' : 'hearth'));

export const createAmbiencePlayer = (deps: AmbienceDeps): AmbiencePlayer => {
  let enabled = false;
  let voice: AmbienceVoice | null = null;
  let visible = deps.isVisible();
  let wanted: AmbienceMood = 'hearth';
  let sent: AmbienceMood = 'silent';
  let unlocking = false;

  const push = (): void => {
    const target: AmbienceMood = enabled && visible ? wanted : 'silent';
    if (!voice || target === sent) return;
    sent = target;
    voice.fadeTo(target, target === 'silent' ? SILENCE_FADE_MS : MOOD_FADE_MS);
  };

  const stopNow = (): void => {
    if (!voice) return;
    sent = 'silent';
    voice.fadeTo('silent', 0);
    voice.suspend().catch(() => undefined);
  };

  const unlock = (): void => {
    if (!enabled || !visible || !voice || voice.state() === 'running' || unlocking) return;
    unlocking = true;
    voice
      .resume()
      .catch(() => undefined)
      .then(() => {
        unlocking = false;
      });
  };

  return {
    setEnabled(on) {
      if (on === enabled) return;
      enabled = on;
      if (!on) return stopNow();
      voice ??= deps.createVoice();
      if (!voice) {
        enabled = false;
        return;
      }
      unlock();
      push();
    },
    setMood(mood) {
      wanted = mood;
      push();
    },
    unlock,
    hidden() {
      visible = false;
      stopNow();
    },
    shown() {
      visible = true;
      unlock();
      push();
    },
    audible: () => (enabled && voice ? sent : 'silent'),
  };
};

/**
 * The documented test hook, parallel to `__lastholdSoundTest`: a test sets
 * `window.__lastholdAmbienceTest` before the app starts. It replaces only the output; every rule
 * above still runs. `moods` records each fade in order; a test changes `state` to simulate a lock.
 */
export interface AmbienceTestHook {
  state: ContextState;
  /** False keeps a paused fake paused when the app asks to resume (default: a tap resumes it). */
  resumable?: boolean;
  created: number;
  suspends: number;
  moods: AmbienceMood[];
}
declare global {
  interface Window {
    __lastholdAmbienceTest?: AmbienceTestHook;
  }
}

const fakeVoice = (hook: AmbienceTestHook): AmbienceVoice => {
  hook.created++;
  return {
    state: () => hook.state,
    resume: () => {
      if (hook.resumable !== false) hook.state = 'running';
      return Promise.resolve();
    },
    suspend: () => {
      hook.suspends++;
      hook.state = 'suspended';
      return Promise.resolve();
    },
    fadeTo: (mood) => {
      hook.moods.push(mood);
    },
  };
};

const LAYERS = ['wind', 'crackle', 'rumble', 'drone'] as const;
type Layer = (typeof LAYERS)[number];
// Quiet on purpose (GDD §9.22): warm crackle and a light wind by the hearth; on watch the fire dies
// back, the wind drops lower and colder, and a faint low drone comes in.
const MIX: Record<Exclude<AmbienceMood, 'silent'>, Record<Layer, number>> = {
  hearth: { wind: 0.05, crackle: 0.05, rumble: 0.05, drone: 0 },
  watch: { wind: 0.07, crackle: 0, rumble: 0.015, drone: 0.02 },
};
const WIND_HZ: Record<Exclude<AmbienceMood, 'silent'>, number> = { hearth: 520, watch: 260 };

const webAudioVoice = (): AmbienceVoice | null => {
  const Ctor = window.AudioContext ?? window.webkitAudioContext;
  if (!Ctor) return null;
  declareAmbient(navigator); // before the context exists: the silent switch must apply to it (D529)
  const ctx = new Ctor();
  // Two seconds of white noise from a fixed LCG: the same bed every time, no file.
  const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = noise.getChannelData(0);
  let seed = 0x2f6b;
  for (let i = 0; i < data.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    data[i] = seed / 2147483648 - 1;
  }
  const gain = (v: number): GainNode => {
    const g = ctx.createGain();
    g.gain.value = v;
    return g;
  };
  const filter = (type: BiquadFilterType, hz: number, q = 0.7): BiquadFilterNode => {
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = hz;
    f.Q.value = q;
    return f;
  };
  const bed = (): AudioBufferSourceNode => {
    const s = ctx.createBufferSource();
    s.buffer = noise;
    s.loop = true;
    s.start();
    return s;
  };
  const osc = (hz: number, type: OscillatorType = 'sine'): OscillatorNode => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = hz;
    o.start();
    return o;
  };
  /** A slow wobble added onto a parameter. */
  const lfo = (hz: number, depth: number, param: AudioParam): void => {
    osc(hz).connect(gain(depth)).connect(param);
  };

  const master = gain(0);
  master.connect(ctx.destination);
  const layer = Object.fromEntries(
    LAYERS.map((l) => {
      const g = gain(0);
      g.connect(master);
      return [l, g];
    }),
  ) as Record<Layer, GainNode>;

  // Wind: band-passed noise whose centre sways and whose strength comes in gusts.
  const wind = filter('bandpass', WIND_HZ.hearth, 0.8);
  const gust = gain(0.7);
  bed().connect(wind).connect(gust).connect(layer.wind);
  lfo(0.07, 140, wind.frequency);
  lfo(0.13, 0.3, gust.gain);
  // Crackle: bright noise let through in short pops where three uneven sawtooths line up.
  const sparks = gain(0);
  bed().connect(filter('highpass', 1800)).connect(sparks).connect(layer.crackle);
  const sum = gain(1 / 3);
  for (const hz of [2.9, 4.3, 6.7]) osc(hz, 'sawtooth').connect(sum);
  const shaper = ctx.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < curve.length; i++) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    curve[i] = x > 0.6 ? (x - 0.6) / 0.4 : 0;
  }
  shaper.curve = curve;
  sum.connect(shaper).connect(sparks.gain);
  // Rumble: the fire's low breath.
  const breath = gain(0.8);
  bed().connect(filter('lowpass', 160)).connect(breath).connect(layer.rumble);
  lfo(0.3, 0.2, breath.gain);
  // Drone: a low fifth, slightly beating, for the cold of the watch.
  const drone = gain(0.5);
  for (const hz of [55, 55.4, 82.5]) osc(hz).connect(drone);
  drone.connect(layer.drone);
  lfo(0.11, 0.2, drone.gain);

  return {
    state: () => ctx.state as ContextState, // iOS adds 'interrupted', which the DOM types lack
    resume: () => ctx.resume(),
    suspend: () => ctx.suspend(),
    fadeTo(mood, ms) {
      const t = ctx.currentTime;
      const ramp = (p: AudioParam, v: number): void => {
        p.cancelScheduledValues(t);
        p.setValueAtTime(p.value, t);
        if (ms <= 0) p.setValueAtTime(v, t);
        else p.linearRampToValueAtTime(v, t + ms / 1000);
      };
      ramp(master.gain, mood === 'silent' ? 0 : 1);
      if (mood === 'silent') return; // the mix stays where it was, ready to fade back in
      for (const l of LAYERS) ramp(layer[l].gain, MIX[mood][l]);
      ramp(wind.frequency, WIND_HZ[mood]);
    },
  };
};

export const createBrowserAmbience = (): AmbiencePlayer => {
  const player = createAmbiencePlayer({
    createVoice: () => {
      const hook = window.__lastholdAmbienceTest;
      return hook ? fakeVoice(hook) : webAudioVoice();
    },
    isVisible: () => document.visibilityState === 'visible',
  });
  // `click` and `touchend` count as a gesture for audio on recent iOS (D522 (3)); capturing, so the
  // resume starts before the tap's own handler.
  const unlock = (): void => player.unlock();
  document.addEventListener('click', unlock, { capture: true, passive: true });
  document.addEventListener('touchend', unlock, { capture: true, passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') player.shown();
    else player.hidden();
  });
  window.addEventListener('pagehide', () => player.hidden());
  window.addEventListener('pageshow', () => {
    if (document.visibilityState === 'visible') player.shown();
  });
  return player;
};
