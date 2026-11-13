// GDD §9.22: the one place the UI asks for a sound or sets the ambience mood. The settings live in
// the settings key outside the save, and the core never knows any of this exists.
import { signal } from '@preact/signals';
import { useLayoutEffect } from 'preact/hooks';
import {
  createBrowserAmbience,
  resolveMood,
  type AmbienceMood,
  type AmbiencePlayer,
  type MoodClaim,
} from '../../platform/sound/ambience';
import { soundFor, type Moment, type SoundId } from '../../platform/sound/moments';
import { createBrowserSound } from '../../platform/sound/browser';
import type { SoundPlayer } from '../../platform/sound/player';

let player: SoundPlayer | null = null;
const get = (): SoundPlayer => (player ??= createBrowserSound());

/** Sound switched On or Off. Call it inside the tap that did it, so the phone lets audio start. */
export const applySoundSetting = (on: boolean): void => {
  if (on || player) get().setEnabled(on);
};

/** One sound for one moment (D520); skipped, never queued, when it cannot play now. */
export const playMoment = (moment: Moment): boolean =>
  player ? player.request(soundFor(moment)) : false;

/** The debug panel's Play sound row: plays one of the ten straight away (UI-only). */
export const playSoundById = (id: SoundId): boolean => (player ? player.request(id) : false);

let ambience: AmbiencePlayer | null = null;
const getAmbience = (): AmbiencePlayer => (ambience ??= createBrowserAmbience());
const claims: MoodClaim[] = [];
/** The debug panel's UI-only mood override (`null` follows the open screen). */
export const ambiencePreview = signal<AmbienceMood | null>(null);

const syncAmbience = (): void => {
  if (ambience) ambience.setMood(resolveMood(claims, ambiencePreview.value));
};

let syncQueued = false;
const scheduleSync = (): void => {
  if (syncQueued) return;
  syncQueued = true;
  queueMicrotask(() => {
    syncQueued = false;
    syncAmbience();
  });
};

/** Ambience switched On or Off (D609). Call inside the tap so the phone lets audio start. */
export const applyAmbienceSetting = (on: boolean): void => {
  if (!on && !ambience) return;
  const a = getAmbience();
  a.setMood(resolveMood(claims, ambiencePreview.value));
  a.setEnabled(on);
};

/** Debug panel only: previews a mood (or returns to Auto) without touching `GameState`. */
export const setAmbiencePreview = (mood: AmbienceMood | null): void => {
  ambiencePreview.value = mood;
  syncAmbience();
};

/** Claims `watch` or `silent` while a component is on screen; falls back to `hearth` when left. */
export const useAmbienceMood = (claim: MoodClaim | null): void => {
  useLayoutEffect(() => {
    if (!claim) return;
    claims.push(claim);
    syncAmbience();
    return () => {
      const i = claims.indexOf(claim);
      if (i >= 0) claims.splice(i, 1);
      scheduleSync();
    };
  }, [claim]);
};
