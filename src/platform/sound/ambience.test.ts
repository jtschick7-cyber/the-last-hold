// Technical design §24.3, GDD §9.22 (D609): the procedural ambience's rules, tested without a browser.
// Off makes nothing; On starts on a tap; hidden pauses at once; the Remembering and the Descent's
// story cards fade to complete silence; Hearth & Wind and Night Watch cross-fade.
import { describe, expect, it } from 'vitest';
import {
  createAmbiencePlayer,
  MOOD_FADE_MS,
  resolveMood,
  SILENCE_FADE_MS,
  type AmbienceMood,
  type AmbienceVoice,
} from './ambience';
import type { ContextState } from './player';

const setup = (opts: { noVoice?: boolean; resumable?: boolean } = {}) => {
  const log = {
    created: 0,
    resumes: 0,
    suspends: 0,
    fades: [] as [AmbienceMood, number][],
  };
  const env = { visible: true, state: 'suspended' as ContextState };
  const voice: AmbienceVoice = {
    state: () => env.state,
    resume: () => {
      log.resumes++;
      if (opts.resumable !== false) env.state = 'running';
      return Promise.resolve();
    },
    suspend: () => {
      log.suspends++;
      env.state = 'suspended';
      return Promise.resolve();
    },
    fadeTo: (mood, ms) => {
      log.fades.push([mood, ms]);
    },
  };
  const player = createAmbiencePlayer({
    createVoice: () => {
      log.created++;
      return opts.noVoice ? null : voice;
    },
    isVisible: () => env.visible,
  });
  const moods = (): AmbienceMood[] => log.fades.map(([m]) => m);
  return { player, log, env, moods };
};

const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

describe('ambience player', () => {
  it('Off by default: no audio context is made, whatever the screen asks for', () => {
    const { player, log } = setup();
    player.setMood('watch');
    player.unlock();
    player.hidden();
    player.shown();
    player.setMood('hearth');
    expect(log.created).toBe(0);
    expect(player.audible()).toBe('silent');
  });

  it('turning On makes one context inside the tap, resumes it and fades in Hearth & Wind', async () => {
    const { player, log, env, moods } = setup();
    player.setEnabled(true);
    await flush();
    expect(log.created).toBe(1);
    expect(log.resumes).toBe(1);
    expect(env.state).toBe('running');
    expect(log.fades).toEqual([['hearth', MOOD_FADE_MS]]);
    expect(player.audible()).toBe('hearth');
    player.setEnabled(true); // already on: nothing new
    expect(log.created).toBe(1);
    expect(moods()).toEqual(['hearth']);
  });

  it('cross-fades between Hearth & Wind and Night Watch and never repeats a mood it is already in', () => {
    const { player, log } = setup();
    player.setEnabled(true);
    player.setMood('watch');
    player.setMood('watch');
    player.setMood('hearth');
    expect(log.fades).toEqual([
      ['hearth', MOOD_FADE_MS],
      ['watch', MOOD_FADE_MS],
      ['hearth', MOOD_FADE_MS],
    ]);
  });

  it('the Remembering and the Descent cards fade to complete silence and resume only after', () => {
    const { player, log } = setup();
    player.setEnabled(true);
    player.setMood('silent');
    expect(player.audible()).toBe('silent');
    player.setMood('watch');
    expect(log.fades).toEqual([
      ['hearth', MOOD_FADE_MS],
      ['silent', SILENCE_FADE_MS],
      ['watch', MOOD_FADE_MS],
    ]);
  });

  it('a mood chosen while Off is the one heard when turned On', () => {
    const { player, log } = setup();
    player.setMood('silent');
    player.setEnabled(true);
    expect(log.fades).toEqual([]); // complete silence: nothing to fade in
    expect(player.audible()).toBe('silent');
    player.setMood('watch');
    expect(log.fades).toEqual([['watch', MOOD_FADE_MS]]);
  });

  it('hidden: silenced and suspended at once; shown again: resumes and fades back in', async () => {
    const { player, log, env } = setup();
    player.setEnabled(true);
    player.setMood('watch');
    await flush();
    env.visible = false;
    player.hidden();
    expect(log.fades.at(-1)).toEqual(['silent', 0]);
    expect(log.suspends).toBe(1);
    expect(env.state).toBe('suspended');
    // While hidden, a tap or a new screen starts nothing.
    player.unlock();
    player.setMood('hearth');
    expect(log.resumes).toBe(1);
    expect(log.fades.at(-1)).toEqual(['silent', 0]);
    env.visible = true;
    player.shown();
    await flush();
    expect(log.resumes).toBe(2);
    expect(env.state).toBe('running');
    expect(log.fades.at(-1)).toEqual(['hearth', MOOD_FADE_MS]);
  });

  it('a phone that will not resume stays paused until a later tap resumes it', async () => {
    const { player, log, env } = setup({ resumable: false });
    player.setEnabled(true);
    await flush();
    expect(env.state).toBe('suspended');
    player.unlock();
    await flush();
    expect(log.resumes).toBe(2);
    env.state = 'interrupted'; // a call
    player.unlock();
    await flush();
    expect(log.resumes).toBe(3);
  });

  it('turning Off silences at once and suspends; turning On again reuses the one context', async () => {
    const { player, log } = setup();
    player.setEnabled(true);
    await flush();
    player.setEnabled(false);
    expect(log.fades.at(-1)).toEqual(['silent', 0]);
    expect(log.suspends).toBe(1);
    expect(player.audible()).toBe('silent');
    player.unlock(); // a tap while Off resumes nothing
    expect(log.resumes).toBe(1);
    player.setEnabled(true);
    await flush();
    expect(log.created).toBe(1);
    expect(log.resumes).toBe(2);
    expect(log.fades.at(-1)).toEqual(['hearth', MOOD_FADE_MS]);
  });

  it('no Web Audio in the browser: stays silent and Off', () => {
    const { player, log } = setup({ noVoice: true });
    player.setEnabled(true);
    player.setMood('watch');
    expect(log.created).toBe(1);
    expect(player.audible()).toBe('silent');
  });
});

describe('resolveMood', () => {
  it('Hearth & Wind with no claim; Night Watch when a watch screen is open', () => {
    expect(resolveMood([], null)).toBe('hearth');
    expect(resolveMood(['watch'], null)).toBe('watch');
  });

  it('silence wins over everything, including the debug preview', () => {
    expect(resolveMood(['watch', 'silent'], null)).toBe('silent');
    expect(resolveMood(['silent'], 'hearth')).toBe('silent');
  });

  it('the debug preview overrides the screen otherwise', () => {
    expect(resolveMood([], 'watch')).toBe('watch');
    expect(resolveMood(['watch'], 'hearth')).toBe('hearth');
    expect(resolveMood([], 'silent')).toBe('silent');
  });
});
