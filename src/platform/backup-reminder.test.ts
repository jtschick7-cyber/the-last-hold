// GDD §9.20, technical design §18.6, plan TV.7: the backup reminder, with a fake clock.
import { describe, expect, it } from 'vitest';
import { memoryBackend } from '../../tests/helpers/memory-storage';
import { createNewGame } from '../core/state/new-game';
import { formatDuration } from '../core/format/duration';
import {
  afterReset,
  DEFAULT_APP_SETTINGS,
  readAppSettings,
  withFirstSeen,
  writeAppSettings,
  type AppSettings,
} from './app-settings';
import {
  afterExport,
  BACK_UP_NOW_SNOOZE_DAYS,
  backupReminder,
  lastExportedText,
  NOT_NOW_SNOOZE_DAYS,
  snoozedFor,
  withExportAge,
} from './backup-reminder';
import { createSaveStore } from './save-store';
import { createChannelStorage } from './storage';

const DAY = 86_400_000;
const T0 = 1_000_000_000_000;
const seen = (over: Partial<AppSettings> = {}): AppSettings => ({
  ...DEFAULT_APP_SETTINGS,
  firstSeenAt: T0,
  ...over,
});

describe('backupReminder (table)', () => {
  const rows: [string, number, AppSettings, number | null][] = [
    ['13 days 23 h after first run', T0 + 14 * DAY - 1, seen(), null],
    ['exactly 14 days after first run', T0 + 14 * DAY, seen(), 14],
    ['20 whole days', T0 + 20 * DAY + 5 * 3_600_000, seen(), 20],
    [
      'uses the later of export and first run',
      T0 + 20 * DAY,
      seen({ lastExportAt: T0 + 10 * DAY }),
      null,
    ],
    ['export 15 days ago', T0 + 25 * DAY, seen({ lastExportAt: T0 + 10 * DAY }), 15],
    [
      'export older than first run is ignored',
      T0 + 14 * DAY,
      seen({ lastExportAt: T0 - 90 * DAY }),
      14,
    ],
    ['switch off', T0 + 30 * DAY, seen({ backupReminder: false }), null],
    ['snoozed', T0 + 20 * DAY, seen({ snoozeUntil: T0 + 21 * DAY }), null],
    ['snooze just over', T0 + 21 * DAY + 1, seen({ snoozeUntil: T0 + 21 * DAY }), 21],
    ['clock set backward', T0 - DAY, seen(), null],
    ['clock behind the last export', T0 + 30 * DAY, seen({ lastExportAt: T0 + 40 * DAY }), null],
    [
      'nothing stamped yet (after Reset everything)',
      T0 + 99 * DAY,
      seen({ firstSeenAt: null }),
      null,
    ],
    [
      'export known but never stamped',
      T0 + 30 * DAY,
      seen({ firstSeenAt: null, lastExportAt: T0 + DAY }),
      29,
    ],
  ];
  it.each(rows)('%s', (_name, now, settings, expected) => {
    expect(backupReminder(now, settings)).toBe(expected);
  });
});

describe('the buttons and exports', () => {
  const due = T0 + 20 * DAY;
  it('"Not now" hides it for 7 days, then it comes back', () => {
    const s = snoozedFor(seen(), due, NOT_NOW_SNOOZE_DAYS);
    expect(backupReminder(due, s)).toBeNull();
    expect(backupReminder(due + 7 * DAY, s)).toBeNull();
    expect(backupReminder(due + 7 * DAY + 1, s)).toBe(27);
  });
  it('"Back up now" hides it for 1 day', () => {
    const s = snoozedFor(seen(), due, BACK_UP_NOW_SNOOZE_DAYS);
    expect(backupReminder(due + DAY - 1, s)).toBeNull();
    expect(backupReminder(due + DAY + 1, s)).toBe(21);
  });
  it('an export resets the count and clears the snooze', () => {
    const s = afterExport(snoozedFor(seen(), due, 7), due);
    expect(s.lastExportAt).toBe(due);
    expect(backupReminder(due + 13 * DAY, s)).toBeNull();
    expect(backupReminder(due + 14 * DAY, s)).toBe(14);
  });
  it('the debug action makes it due at once, and only writes the settings', () => {
    const s = withExportAge(seen({ firstSeenAt: due }), due, 20);
    expect(s.lastExportAt).toBe(due - 20 * DAY);
    expect(backupReminder(due, s)).toBe(20);
  });
  it('after Reset everything it is silent until a start stamps firstSeenAt', () => {
    const r = afterReset(seen({ lastExportAt: T0, snoozeUntil: T0 }));
    expect(backupReminder(T0 + 90 * DAY, r)).toBeNull();
    expect(backupReminder(T0 + 104 * DAY, withFirstSeen(r, T0 + 90 * DAY))).toBe(14);
  });
});

describe('Last exported text', () => {
  const t = (ago: number | null) =>
    lastExportedText(T0, ago === null ? null : T0 - ago, formatDuration);
  it('reads as E3 says', () => {
    expect(t(null)).toBe('not recorded');
    expect(t(9 * DAY + 5000)).toBe('9d ago');
    expect(t(30_000)).toBe('just now');
    expect(t(3 * 3_600_000 + 20 * 60_000)).toBe('3h 20m ago');
  });
});

describe('the save is not touched', () => {
  it('snoozing, exporting and the debug age change only the settings key', () => {
    const backend = memoryBackend();
    const storage = createChannelStorage('live', backend);
    const store = createSaveStore(storage, () => T0);
    expect(store.save(createNewGame('seven', T0))).toBe(true);
    const saveKeys = (): Record<string, string> =>
      Object.fromEntries(Object.entries(backend.dump()).filter(([k]) => !k.endsWith(':settings')));
    const before = saveKeys();
    let s = readAppSettings(storage);
    for (const next of [
      snoozedFor(s, T0, 7),
      afterExport(s, T0 + DAY),
      withExportAge(s, T0 + 2 * DAY, 30),
    ]) {
      s = next;
      writeAppSettings(storage, s);
    }
    expect(saveKeys()).toEqual(before);
    expect(readAppSettings(storage).lastExportAt).toBe(T0 + 2 * DAY - 30 * DAY);
  });
});
