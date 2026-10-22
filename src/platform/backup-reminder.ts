import type { AppSettings } from './app-settings';

// GDD §9.20, technical design §18.6: the backup reminder. Pure: the UI shows only what
// backupReminder() returns. These are presentation timings, not game numbers.
const DAY = 86_400_000;
const DUE_AFTER_DAYS = 14;
export const NOT_NOW_SNOOZE_DAYS = 7;
export const BACK_UP_NOW_SNOOZE_DAYS = 1;

/** The whole days to show, or null when nothing is due. */
export const backupReminder = (now: number, s: AppSettings): number | null => {
  if (!s.backupReminder) return null;
  const known = [s.lastExportAt, s.firstSeenAt].filter((t): t is number => t !== null);
  // After "Reset everything" nothing is known until the next start stamps firstSeenAt.
  if (known.length === 0) return null;
  const since = Math.max(...known);
  // A clock set backward shows nothing.
  if (now < since) return null;
  if (s.snoozeUntil !== null && now <= s.snoozeUntil) return null;
  const days = Math.floor((now - since) / DAY);
  return days >= DUE_AFTER_DAYS ? days : null;
};

export const snoozedFor = (s: AppSettings, now: number, days: number): AppSettings => ({
  ...s,
  snoozeUntil: now + days * DAY,
});

/** Copy save code (copied) and Download save file (started) are the only exports. */
export const afterExport = (s: AppSettings, now: number): AppSettings => ({
  ...s,
  lastExportAt: now,
  snoozeUntil: null,
});

/** Debug only: pretend the last export (and the first run) were `days` ago. */
export const withExportAge = (s: AppSettings, now: number, days: number): AppSettings => {
  const at = now - days * DAY;
  return {
    ...s,
    lastExportAt: at,
    snoozeUntil: null,
    firstSeenAt: s.firstSeenAt === null ? at : Math.min(s.firstSeenAt, at),
  };
};

/** "Last exported: …" (GDD §9.20, E3): "9d ago", "3h 20m ago", "just now" or "not recorded". */
export const lastExportedText = (
  now: number,
  lastExportAt: number | null,
  duration: (seconds: number) => string,
): string => {
  if (lastExportAt === null) return 'not recorded';
  const ms = now - lastExportAt;
  if (ms >= DAY) return `${Math.floor(ms / DAY)}d ago`;
  if (ms < 60_000) return 'just now';
  return `${duration(ms / 1000)} ago`;
};
