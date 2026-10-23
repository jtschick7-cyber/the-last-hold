import type { ChannelStorage } from './storage';

// Technical design §18.1, GDD §9.20: the settings that live outside the save, under one
// channel-namespaced key (lasthold:settings, lasthold-preview:settings). The save schema
// does not change, and Paste code, Load file and Restore never touch this key.
export const APP_SETTINGS_KEY = 'settings';

export const TEXT_SIZES = ['match', 'large', 'largest'] as const;
export type TextSize = (typeof TEXT_SIZES)[number];

export const HOLD_VIEWS = ['grid', 'scene'] as const;
export type HoldView = (typeof HOLD_VIEWS)[number];

export interface AppSettings {
  textSize: TextSize;
  /** GDD §9.21: the Hold screen's header, the 8 × 8 grid or the v1.0 pixel scene. */
  holdView: HoldView;
  backupReminder: boolean;
  /** Milliseconds since the epoch; null until recorded. */
  lastExportAt: number | null;
  snoozeUntil: number | null;
  firstSeenAt: number | null;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  textSize: 'match',
  holdView: 'grid',
  backupReminder: true,
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
  return {
    textSize: size ?? DEFAULT_APP_SETTINGS.textSize,
    holdView: view ?? DEFAULT_APP_SETTINGS.holdView,
    backupReminder:
      typeof o.backupReminder === 'boolean'
        ? o.backupReminder
        : DEFAULT_APP_SETTINGS.backupReminder,
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

/** GDD §9.20, technical design §19.4: "Reset everything…" clears the three timestamps and keeps the three choices. */
export const afterReset = (s: AppSettings): AppSettings => ({
  textSize: s.textSize,
  holdView: s.holdView,
  backupReminder: s.backupReminder,
  lastExportAt: null,
  snoozeUntil: null,
  firstSeenAt: null,
});

/** `firstSeenAt` is set once, on the first run of v1.0, and never moved after that. */
export const withFirstSeen = (s: AppSettings, now: number): AppSettings =>
  s.firstSeenAt === null ? { ...s, firstSeenAt: now } : s;
