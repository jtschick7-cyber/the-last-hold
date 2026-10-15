import { RARITIES } from '../../content/delves/blessing-types';
import { blessingById, blessings } from '../../content/delves/blessings';
import { PATRON_IDS, patrons, type PatronId } from '../../content/delves/patrons';
import { apply, type Command } from '../commands';
import { suggestedParty } from '../delves/access';
import { chosenStartProblem, lateHoursProblem, rerollProblem } from '../delves/shop';
import type { DelveResult, DelveRun } from '../state/delve-state';
import type { GameState } from '../state/game-state';
import { balance } from '../../content/balance';

// GDD §6.1 (D269, D270): what the Delver does in a Delve session. Standard plays the rest of the
// day exactly as before; a session is only Delves. Every choice is a Command through apply().

/** Runs a session starts at most (D270), and a guard against a run that never ends. */
const MAX_RUNS = 3;
const MAX_STEPS = 100;

/** The patrons in the order a tie is broken (D270): Hearth-Crone first. */
const TIE_ORDER: readonly PatronId[] = [...PATRON_IDS].sort(
  (a, b) => patrons[a].tieOrder - patrons[b].tieOrder,
);

/** How many blessings of each patron the run has taken. */
const takenFrom = (run: DelveRun): Map<PatronId, number> => {
  const n = new Map<PatronId, number>();
  for (const id of run.blessings) {
    const patron = blessingById(id)?.patron;
    if (patron) n.set(patron, (n.get(patron) ?? 0) + 1);
  }
  return n;
};

/** The patron taken most this run; ties in the fixed order (D270). */
export const favouredPatron = (run: DelveRun, among: readonly PatronId[]): PatronId | null => {
  const taken = takenFrom(run);
  const ranked = [...among].sort(
    (a, b) =>
      (taken.get(b) ?? 0) - (taken.get(a) ?? 0) || TIE_ORDER.indexOf(a) - TIE_ORDER.indexOf(b),
  );
  return ranked[0] ?? null;
};

/** The best card: highest rarity, then the content list's order (D270). */
export const bestBlessing = (cards: readonly string[]): string | null => {
  const rank = (id: string): number => RARITIES.indexOf(blessingById(id)?.rarity ?? 'faint');
  const order = (id: string): number => blessings.findIndex((b) => b.id === id);
  return [...cards].sort((a, b) => rank(b) - rank(a) || order(a) - order(b))[0] ?? null;
};

/** Every card on offer is of the lowest rarity (D321's Re-roll trigger). */
const allFaint = (cards: readonly string[]): boolean =>
  cards.length > 0 && cards.every((id) => blessingById(id)?.rarity === 'faint');

/** What a session did: the commands it applied, and the result of every run it finished. */
export interface DelveSessionRecord {
  readonly commands: readonly Command[];
  readonly results: readonly DelveResult[];
}

/**
 * One Delve session at `now` (GDD §6.1): spend Riftglass on Chosen start and Re-roll, then Late
 * hours; then, with a party of three free and Riftglass left in the allowance, up to three runs.
 * It never leaves a run early and never buys traits or cosmetics.
 */
export const delveSession = (state: GameState, now: number): DelveSessionRecord => {
  const commands: Command[] = [];
  const results: DelveResult[] = [];
  const act = (cmd: Command): boolean => {
    if (!apply(state, cmd, now).ok) return false;
    commands.push(cmd);
    return true;
  };

  const spend = (): void => {
    if (!chosenStartProblem(state)) act({ type: 'riftglass.buy', item: 'chosen-start' });
    if (!rerollProblem(state)) act({ type: 'riftglass.buy', item: 'reroll' });
    while (!lateHoursProblem(state)) {
      if (!act({ type: 'riftglass.buy', item: 'late-hours' })) break;
    }
  };

  /** Plays the open run's every step until it ends. */
  const playRun = (): void => {
    for (let step = 0; step < MAX_STEPS; step++) {
      const run = state.delve.run;
      if (!run) return;
      const stage = run.stage;
      let moved: boolean;
      if (stage.kind === 'fight') moved = act({ type: 'delve.fight' });
      else if (stage.kind === 'doors') {
        const door = favouredPatron(run, stage.doors);
        moved = door !== null && act({ type: 'delve.chooseDoor', patron: door });
      } else if (stage.kind === 'offer') {
        // GDD §6.1 (v0.8, D321): the Re-roll is used once a run, on the first offer where every
        // card is Faint; the new offer is then played like any other.
        if (state.delve.shop.reroll && !run.rerollUsed && allFaint(stage.cards)) {
          if (!act({ type: 'delve.reroll' })) throw new Error('The Delver could not re-roll.');
          continue;
        }
        const pick = bestBlessing(stage.cards);
        moved = pick !== null && act({ type: 'delve.chooseBlessing', blessing: pick });
      } else if (stage.patron === null) {
        // Chosen start: the favoured patron of an empty run is the first in the tie order.
        const open = TIE_ORDER.filter(
          (p) => !patrons[p].lockedUntilActFive || state.delve.unlitOpen,
        );
        const patron = favouredPatron(run, open);
        moved = patron !== null && act({ type: 'delve.chooseStart', patron });
      } else {
        const pick = bestBlessing(stage.cards);
        moved = pick !== null && act({ type: 'delve.chooseBlessing', blessing: pick });
      }
      if (!moved)
        throw new Error(`The Delver is stuck at stage "${stage.kind}" of floor ${run.floor}.`);
    }
    throw new Error('A Delve took more than a hundred steps.');
  };

  for (let n = 0; n < MAX_RUNS; n++) {
    spend();
    if (state.delve.allowance < 1) break;
    const party = suggestedParty(state);
    if (party.length < balance.delve.partySize.value) break;
    if (!act({ type: 'delve.start', party })) break;
    playRun();
    const result = state.delve.result;
    if (result) {
      results.push(result);
      act({ type: 'delve.ackResult' });
    }
  }
  return { commands, results };
};
