import { signal } from '@preact/signals';
import { consumables } from '../../content/consumables';
import type { SkillId } from '../../content/skills';
import { experimentLines } from '../../core/alchemy/hut-view';
import { apply, type ApplyResult, type Command } from '../../core/commands';
import { advance, catchUp, type AwaySummary } from '../../core/sim';
import type { GameState } from '../../core/state/game-state';
import { createNewGame } from '../../core/state/new-game';
import { idlePeasants } from '../../core/systems/housing';
import { startAutosave } from '../../platform/autosave';
import { buildInfo } from '../../platform/build-info';
import { now } from '../../platform/clock';
import { isInstalledApp } from '../../platform/install';
import { requestPersistentStorage } from '../../platform/persist';
import { randomSeed } from '../../platform/random-seed';
import { createSaveStore, type SaveStore } from '../../platform/save-store';
import {
  browserBackend,
  createChannelStorage,
  type ChannelStorage,
  type KeyValueBackend,
} from '../../platform/storage';
import { captureErrors, DIAGNOSTICS_KEEP, type CapturedError } from '../../platform/diagnostics';
import { sideList, type SideList } from '../../platform/side-store';
import {
  afterReset,
  readAppSettings,
  withFirstSeen,
  writeAppSettings,
  DEFAULT_APP_SETTINGS,
  type AppSettings,
  type TextSize,
} from '../../platform/app-settings';
import { levelUpLines, noticeChanges, type Watched } from './lines';
import { skillLevels } from '../../core/skills/skills';

// Technical design §6.3 and §10: one mutable game state, plus a `version` signal
// bumped after every apply and advance. Components re-read selectors when it
// changes. This file wires the core to the browser; it holds no game rules.

const LIVE_TICK_MS = 1000;
/** Away at least this long: run catch-up instead of a plain advance (§6.3). */
const CATCH_UP_FROM_MS = 60 * 1000;
/** Away at least this long: show the "While you were away" sheet [JC 6]. */
const AWAY_SHEET_FROM_MS = 5 * 60 * 1000;

/** The screens, in tab order; a signal so a card can send the player to one (v0.11 card links). */
export const TABS = ['hold', 'contracts', 'hunters', 'bestiary', 'more'] as const;
export type Tab = (typeof TABS)[number];
export const tab = signal<Tab>('hold');
export const version = signal(0);
export const catchUpProgress = signal<{ done: number; total: number } | null>(null);
export const awaySummary = signal<AwaySummary | null>(null);
/** GDD §9.9: what experiments showed since the game opened (live play only), newest last. */
export const hutNews = signal<string[]>([]);
const HUT_NEWS_KEEP = 4;
/** GDD §5.8.6: skill level-ups in live play, as the lines the results show (session only; nothing is saved). */
export const emberNews = signal<string[]>([]);
let watchedSkills: Record<SkillId, number> | null = null;
/** Shown instead of the game when a save can't safely be used. */
export const blocked = signal<string | null>(null);
/** Problems from loading (quarantined saves, repairs), for the player to see once. */
export const loadNotes = signal<string[]>([]);
export const savingUnavailable = signal(false);
export const lastSavedAt = signal<number | null>(null);
/** Technical design §15: the last catch-up's duration, for checking phones. */
export const lastCatchUpMs = signal<number | null>(null);
/** The screen name recorded with captured errors (technical design §15.1). */
export const currentScreen = signal('hold');

export interface Report {
  at: number;
  summary: AwaySummary;
}
const REPORTS_KEEP = 3;

let state: GameState | null = null;

/** Live time passing: remembers what experiments showed, so the Hut can say so. */
const advanceLive = (s: GameState, t: number): void => {
  const log = advance(s, t);
  const lines = log.events.flatMap((e) =>
    e.type === 'experiment' ? experimentLines((id) => consumables[id].name, e) : [],
  );
  if (lines.length > 0) hutNews.value = [...hutNews.value, ...lines].slice(-HUT_NEWS_KEEP);
};
let store: SaveStore | null = null;
let channelStorage: ChannelStorage | null = null;
let canSave = true;

/** GDD §9.10 Reports: the last three away sheets, beside the save. */
export const reports = (): SideList<Report> | null =>
  channelStorage ? sideList<Report>(channelStorage, 'reports', REPORTS_KEEP) : null;
export const diagnostics = (): SideList<CapturedError> | null =>
  channelStorage ? sideList<CapturedError>(channelStorage, 'diagnostics', DIAGNOSTICS_KEEP) : null;
export const saveStore = (): SaveStore | null => store;

/** GDD §9.20: the settings outside the save (Text size, the backup reminder and its times). */
export const appSettings = signal<AppSettings>({ ...DEFAULT_APP_SETTINGS });
const changeAppSettings = (next: AppSettings): void => {
  appSettings.value = next;
  if (channelStorage) writeAppSettings(channelStorage, next);
};
export const setTextSize = (textSize: TextSize): void =>
  changeAppSettings({ ...appSettings.value, textSize });

/** Technical design §9.1: the install tip shows once, outside the installed app. */
export const installTipDue = signal(false);
export const dismissInstallTip = (): void => {
  installTipDue.value = false;
  try {
    channelStorage?.set('installTipSeen', '1');
  } catch {
    // Not fatal: the tip may simply show again next time.
  }
};

let watched: Watched | null = null;

const bump = (): void => {
  version.value++;
  if (!state) return;
  const current: Watched = {
    bought: state.stats.buildingsBought,
    peasants: state.peasants.total,
    idle: idlePeasants(state),
    age: state.cycle.age,
    won: state.stats.contractsWon,
  };
  if (watched) noticeChanges(watched, current);
  watched = current;
  const levels = skillLevels(state);
  if (watchedSkills) {
    const rose = levelUpLines(watchedSkills, levels);
    if (rose.length > 0) emberNews.value = [...emberNews.value, ...rose].slice(-HUT_NEWS_KEEP);
  }
  watchedSkills = levels;
};

/** The live state. Read it inside components that also read `version`. */
export const game = (): GameState => {
  if (!state) throw new Error('The game has not started yet.');
  return state;
};

export const saveNow = (): boolean => {
  if (!state || !store || !canSave) return false;
  const ok = store.save(state);
  if (ok) lastSavedAt.value = now();
  else savingUnavailable.value = true;
  return ok;
};

export const dispatch = (cmd: Command): ApplyResult => {
  const s = game();
  const t = now();
  advanceLive(s, t);
  const result = apply(s, cmd, t);
  bump();
  if (result.ok) saveNow();
  return result;
};

const nextFrame = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/** Catches up from the last moment the game ran, yielding so the bar paints. */
const runCatchUp = async (): Promise<void> => {
  const s = game();
  const started = performance.now();
  const gen = catchUp(s, now());
  let step = gen.next();
  while (!step.done) {
    catchUpProgress.value = step.value;
    await nextFrame();
    step = gen.next();
  }
  catchUpProgress.value = null;
  watchedSkills = skillLevels(s); // the away sheet words these; the live lines start from here
  lastCatchUpMs.value = performance.now() - started;
  if (step.value.away >= AWAY_SHEET_FROM_MS) {
    awaySummary.value = step.value;
    reports()?.push({ at: now(), summary: step.value });
  }
  bump();
  saveNow();
};

const memoryFallback = (): KeyValueBackend => {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    key: (i) => [...map.keys()][i] ?? null,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
};

export const startGame = async (): Promise<void> => {
  const backend = browserBackend();
  if (!backend) savingUnavailable.value = true;
  channelStorage = createChannelStorage(buildInfo.channel, backend ?? memoryFallback());
  store = createSaveStore(channelStorage, now);
  const seen = withFirstSeen(readAppSettings(channelStorage), now());
  changeAppSettings(seen);
  installTipDue.value = !isInstalledApp() && channelStorage.get('installTipSeen') === null;
  const errors = diagnostics();
  if (errors) captureErrors(errors, () => currentScreen.value);
  const outcome = store.load();
  if (outcome.kind === 'newer') {
    canSave = false;
    blocked.value = `${outcome.message} Update the app (close and reopen it) to keep playing this save.`;
    return;
  }
  if (outcome.kind === 'loaded') {
    state = outcome.loaded.state;
    loadNotes.value = [...outcome.problems, ...outcome.loaded.warnings, ...outcome.loaded.notes];
    await runCatchUp();
  } else {
    state = createNewGame(randomSeed(), now());
    loadNotes.value = outcome.problems;
    void requestPersistentStorage();
    saveNow();
  }
  bump();

  // not motion: the game clock's tick
  setInterval(() => {
    if (document.visibilityState !== 'visible' || catchUpProgress.value) return;
    advanceLive(game(), now());
    bump();
  }, LIVE_TICK_MS);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || catchUpProgress.value) return;
    if (now() - game().time >= CATCH_UP_FROM_MS) void runCatchUp();
    else {
      advanceLive(game(), now());
      bump();
    }
  });

  startAutosave(() => {
    saveNow();
  });
};

/** Replaces the running game (import, restore), then catches it up to now. */
export const adoptGame = async (next: GameState): Promise<void> => {
  state = next;
  watched = null;
  watchedSkills = null;
  emberNews.value = [];
  awaySummary.value = null;
  await runCatchUp();
  bump();
  saveNow();
};

/** GDD §9.10 "Reset everything": a fresh game. The backup slot still holds the old one. */
export const resetGame = (): void => {
  changeAppSettings(afterReset(appSettings.value));
  state = createNewGame(randomSeed(), now());
  watched = null;
  watchedSkills = null;
  emberNews.value = [];
  awaySummary.value = null;
  bump();
  saveNow();
};
