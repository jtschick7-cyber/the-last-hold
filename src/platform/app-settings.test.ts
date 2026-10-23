// GDD §9.20, plan TV.4a: the settings key outside the save.
import { describe, expect, it } from 'vitest';
import { memoryBackend } from '../../tests/helpers/memory-storage';
import {
  afterReset,
  APP_SETTINGS_KEY,
  DEFAULT_APP_SETTINGS,
  parseAppSettings,
  readAppSettings,
  withFirstSeen,
  writeAppSettings,
  type AppSettings,
} from './app-settings';
import { createSaveStore, SAVE_KEYS } from './save-store';
import { createChannelStorage } from './storage';
import { createNewGame } from '../core/state/new-game';

const chosen: AppSettings = {
  textSize: 'largest',
  holdView: 'scene',
  backupReminder: false,
  sound: 'on',
  lastExportAt: 1_000,
  snoozeUntil: 2_000,
  firstSeenAt: 500,
};

describe('app settings key', () => {
  it('defaults: Match phone, reminder on, no times', () => {
    expect(DEFAULT_APP_SETTINGS).toEqual({
      textSize: 'match',
      holdView: 'grid',
      backupReminder: true,
      sound: 'off',
      lastExportAt: null,
      snoozeUntil: null,
      firstSeenAt: null,
    });
    const storage = createChannelStorage('live', memoryBackend());
    expect(readAppSettings(storage)).toEqual(DEFAULT_APP_SETTINGS);
  });

  it('round-trips through storage', () => {
    const storage = createChannelStorage('live', memoryBackend());
    expect(writeAppSettings(storage, chosen)).toBe(true);
    expect(readAppSettings(storage)).toEqual(chosen);
  });

  it('falls back field by field on junk', () => {
    expect(parseAppSettings('not json')).toEqual(DEFAULT_APP_SETTINGS);
    expect(parseAppSettings('[1,2]')).toEqual(DEFAULT_APP_SETTINGS);
    expect(
      parseAppSettings(
        JSON.stringify({
          textSize: 'huge',
          backupReminder: 'yes',
          lastExportAt: -5,
          snoozeUntil: 'x',
          firstSeenAt: 7,
        }),
      ),
    ).toEqual({ ...DEFAULT_APP_SETTINGS, firstSeenAt: 7 });
  });

  it('is namespaced by channel and never mixes preview with live', () => {
    const backend = memoryBackend();
    const live = createChannelStorage('live', backend);
    const preview = createChannelStorage('preview', backend);
    writeAppSettings(live, chosen);
    expect(Object.keys(backend.dump())).toEqual(['lasthold:settings']);
    expect(readAppSettings(preview)).toEqual(DEFAULT_APP_SETTINGS);
    writeAppSettings(preview, { ...chosen, textSize: 'large' });
    expect(readAppSettings(live).textSize).toBe('largest');
    expect(Object.keys(backend.dump()).sort()).toEqual([
      'lasthold-preview:settings',
      'lasthold:settings',
    ]);
  });

  it('reports a refused write instead of throwing', () => {
    const backend = memoryBackend();
    backend.failWrites = true;
    expect(writeAppSettings(createChannelStorage('live', backend), chosen)).toBe(false);
  });

  it('Reset everything keeps textSize, holdView, backupReminder and sound and clears the three times', () => {
    expect(afterReset(chosen)).toEqual({
      textSize: 'largest',
      holdView: 'scene',
      backupReminder: false,
      sound: 'on',
      lastExportAt: null,
      snoozeUntil: null,
      firstSeenAt: null,
    });
  });

  it('holdView: grid by default, an unknown value falls back, and only grid or scene are kept', () => {
    expect(parseAppSettings(JSON.stringify({ holdView: 'scene' })).holdView).toBe('scene');
    expect(parseAppSettings(JSON.stringify({ holdView: 'map' })).holdView).toBe('grid');
    expect(parseAppSettings(JSON.stringify({ textSize: 'large' })).holdView).toBe('grid');
  });

  // D525 (1), GDD §9.22: the Sound switch.
  it('sound: Off by default; a missing or broken value falls back to Off; on and off are kept', () => {
    expect(DEFAULT_APP_SETTINGS.sound).toBe('off');
    expect(parseAppSettings(null).sound).toBe('off');
    expect(parseAppSettings(JSON.stringify({ textSize: 'large' })).sound).toBe('off');
    for (const junk of ['loud', 1, true, null, ['on']])
      expect(parseAppSettings(JSON.stringify({ sound: junk })).sound).toBe('off');
    expect(parseAppSettings(JSON.stringify({ sound: 'on' })).sound).toBe('on');
    expect(parseAppSettings(JSON.stringify({ sound: 'off' })).sound).toBe('off');
  });

  it('sound round-trips through storage and a failed write leaves it for this session only', () => {
    const backend = memoryBackend();
    const storage = createChannelStorage('live', backend);
    expect(writeAppSettings(storage, { ...DEFAULT_APP_SETTINGS, sound: 'on' })).toBe(true);
    expect(readAppSettings(storage).sound).toBe('on');
    backend.failWrites = true;
    expect(writeAppSettings(storage, { ...DEFAULT_APP_SETTINGS, sound: 'off' })).toBe(false);
    backend.failWrites = false;
    expect(readAppSettings(storage).sound).toBe('on'); // the stored value did not change
  });

  it('firstSeenAt is set once and never moved', () => {
    const first = withFirstSeen(DEFAULT_APP_SETTINGS, 100);
    expect(first.firstSeenAt).toBe(100);
    expect(withFirstSeen(first, 999).firstSeenAt).toBe(100);
  });

  it('saving, backing up and loading the game leave the key untouched', () => {
    const backend = memoryBackend();
    const storage = createChannelStorage('live', backend);
    writeAppSettings(storage, chosen);
    const before = storage.get(APP_SETTINGS_KEY);
    let t = 0;
    const store = createSaveStore(storage, () => (t += 10 * 60_000));
    const state = createNewGame('seed-7', 0);
    expect(store.save(state)).toBe(true);
    expect(store.save(state)).toBe(true);
    expect(store.load().kind).toBe('loaded');
    expect(store.backup()).not.toBeNull();
    expect(storage.get(SAVE_KEYS.main)).not.toBeNull();
    expect(storage.get(APP_SETTINGS_KEY)).toBe(before);
  });
});
