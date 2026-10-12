import { signal } from '@preact/signals';
import { apply, type ApplyResult, type Command } from '../../core/commands';
import { advance, catchUp, type AwaySummary } from '../../core/sim';
import type { GameState } from '../../core/state/game-state';
import { createNewGame } from '../../core/state/new-game';
import { idlePeasants } from '../../core/systems/housing';
import { startAutosave } from '../../platform/autosave';
import { buildInfo } from '../../platform/build-info';
import { now } from '../../platform/clock';
import { requestPersistentStorage } from '../../platform/persist';
import { randomSeed } from '../../platform/random-seed';
import { createSaveStore, type SaveStore } from '../../platform/save-store';
import { browserBackend, createChannelStorage, type KeyValueBackend } from '../../platform/storage';
import { noticeChanges, type Watched } from './lines';

// Technical design §6.3 and §10: one mutable game state, plus a `version` signal
// bumped after every apply and advance. Components re-read selectors when it
// changes. This file wires the core to the browser; it holds no game rules.

const LIVE_TICK_MS = 1000;
/** Away at least this long: run catch-up instead of a plain advance (§6.3). */
const CATCH_UP_FROM_MS = 60 * 1000;
/** Away at least this long: show the "While you were away" sheet [JC 6]. */
const AWAY_SHEET_FROM_MS = 5 * 60 * 1000;

export const version = signal(0);
export const catchUpProgress = signal<{ done: number; total: number } | null>(null);
export const awaySummary = signal<AwaySummary | null>(null);
/** Shown instead of the game when a save can't safely be used. */
export const blocked = signal<string | null>(null);
/** Problems from loading (quarantined saves, repairs), for the player to see once. */
export const loadNotes = signal<string[]>([]);
export const savingUnavailable = signal(false);
export const lastSavedAt = signal<number | null>(null);

let state: GameState | null = null;
let store: SaveStore | null = null;
let canSave = true;

let watched: Watched | null = null;

const bump = (): void => {
  version.value++;
  if (!state) return;
  const current: Watched = {
    bought: state.stats.buildingsBought,
    peasants: state.peasants.total,
    idle: idlePeasants(state),
    age: state.cycle.age,
  };
  if (watched) noticeChanges(watched, current);
  watched = current;
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
  advance(s, t);
  const result = apply(s, cmd, t);
  bump();
  if (result.ok) saveNow();
  return result;
};

const nextFrame = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/** Catches up from the last moment the game ran, yielding so the bar paints. */
const runCatchUp = async (): Promise<void> => {
  const s = game();
  const gen = catchUp(s, now());
  let step = gen.next();
  while (!step.done) {
    catchUpProgress.value = step.value;
    await nextFrame();
    step = gen.next();
  }
  catchUpProgress.value = null;
  if (step.value.away >= AWAY_SHEET_FROM_MS) awaySummary.value = step.value;
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
  store = createSaveStore(
    createChannelStorage(buildInfo.channel, backend ?? memoryFallback()),
    now,
  );
  const outcome = store.load();
  if (outcome.kind === 'newer') {
    canSave = false;
    blocked.value = `${outcome.message} Update the app (close and reopen it) to keep playing this save.`;
    return;
  }
  if (outcome.kind === 'loaded') {
    state = outcome.loaded.state;
    loadNotes.value = [...outcome.problems, ...outcome.loaded.warnings];
    await runCatchUp();
  } else {
    state = createNewGame(randomSeed(), now());
    loadNotes.value = outcome.problems;
    void requestPersistentStorage();
    saveNow();
  }
  bump();

  setInterval(() => {
    if (document.visibilityState !== 'visible' || catchUpProgress.value) return;
    advance(game(), now());
    bump();
  }, LIVE_TICK_MS);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || catchUpProgress.value) return;
    if (now() - game().time >= CATCH_UP_FROM_MS) void runCatchUp();
    else {
      advance(game(), now());
      bump();
    }
  });

  startAutosave(() => {
    saveNow();
  });
};

/** Replaces the running game (import, reset), saving it straight away. */
export const replaceGame = (next: GameState): void => {
  state = next;
  watched = null;
  awaySummary.value = null;
  bump();
  saveNow();
};
