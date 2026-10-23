import type { ChannelStorage } from './storage';

// Technical design §18.1, GDD §9.20: the settings that live outside the save, under one
// channel-namespaced key (lasthold:settings, lasthold-preview:settings). The save schema
// does not change, and Paste code, Load file and Restore never touch this key.
export const APP_SETTINGS_KEY = 'settings';

export const TEXT_SIZES = ['match', 'large', 'largest'] as const;
export type TextSize = (typeof TEXT_SIZES)[number];

export const HOLD_VIEWS = ['grid', 'scene'] as const;
export type HoldView = (typeof HOLD_VIEWS)[number];

/** GDD §9.22, technical design §20.1: short sounds, off by default. */
export const SOUND_SETTINGS = ['off', 'on'] as const;
export type SoundSetting = (typeof SOUND_SETTINGS)[number];

export interface AppSettings {
  textSize: TextSize;
  /** GDD §9.21: the Hold screen's header, the 8 × 8 grid or the v1.0 pixel scene. */
  holdView: HoldView;
  backupReminder: boolean;
  /** GDD §9.22: the Sound switch. Never read by anything in `src/core/`. */
  sound: SoundSetting;
  /** Milliseconds since the epoch; null until recorded. */
  lastExportAt: number | null;
  snoozeUntil: number | null;
  firstSeenAt: number | null;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  textSize: 'match',
  holdView: 'grid',
  backupReminder: true,
  sound: 'off',
  lastExportAt: null,
  snoozeUntil: null,
  firstSeenAt: null,
};

const timestamp = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;

/** Anything missing or malformed falls back to its default, so a bad key never blocks the app. */
export const parseAppSettings = (text: string | null): AppSettings => {
  let raw: unknown;
  try {
    raw = text === null ? null : JSON.parse(text);
  } catch {
    raw = null;
  }
  const o = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const size = TEXT_SIZES.find((t) => t === o.textSize);
  const view = HOLD_VIEWS.find((v) => v === o.holdView);
  const sound = SOUND_SETTINGS.find((v) => v === o.sound);
  return {
    textSize: size ?? DEFAULT_APP_SETTINGS.textSize,
    holdView: view ?? DEFAULT_APP_SETTINGS.holdView,
    backupReminder:
      typeof o.backupReminder === 'boolean'
        ? o.backupReminder
        : DEFAULT_APP_SETTINGS.backupReminder,
    sound: sound ?? DEFAULT_APP_SETTINGS.sound,
    lastExportAt: timestamp(o.lastExportAt),
    snoozeUntil: timestamp(o.snoozeUntil),
    firstSeenAt: timestamp(o.firstSeenAt),
  };
};

export const readAppSettings = (storage: ChannelStorage): AppSettings => {
  try {
    return parseAppSettings(storage.get(APP_SETTINGS_KEY));
  } catch {
    return { ...DEFAULT_APP_SETTINGS };
  }
};

/** False when storage refused; the settings then last for this session only. */
export const writeAppSettings = (storage: ChannelStorage, settings: AppSettings): boolean => {
  try {
    storage.set(APP_SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
};

/** GDD §9.20, technical design §19.4: "Reset everything…" clears the three timestamps and keeps the choices (Sound too, GDD §9.22). */
export const afterReset = (s: AppSettings): AppSettings => ({
  textSize: s.textSize,
  holdView: s.holdView,
  backupReminder: s.backupReminder,
  sound: s.sound,
  lastExportAt: null,
  snoozeUntil: null,
  firstSeenAt: null,
});

/** `firstSeenAt` is set once, on the first run of v1.0, and never moved after that. */
export const withFirstSeen = (s: AppSettings, now: number): AppSettings =>
  s.firstSeenAt === null ? { ...s, firstSeenAt: now } : s;
