import { ORDER_IDS, type OrderId } from '../../content/orders';
import type { GameState } from '../state/game-state';
import { checkThirdSeat } from './orders';

// GDD §5.13.1 (D413, D421, D422): when each Order opens. Each opens once, for good, at its trigger, or
// on load for a save already past it. Opening queues the opening scene and nothing else: no Order ever
// seats itself. The tests derive what should be open from the state, not from one act.

/** The Keep has been reached in any cycle (a Rank is never lost from the history). */
const keepReached = (s: GameState): boolean =>
  s.cycle.age !== 'hamlet' || s.cycles.some((c) => c.ranks.keep !== undefined);

/**
 * An Alchemist's Hut has stood: one stands now, or the save shows kettle work (the Hut resets at the
 * Long Night, so a later cycle is told by the skill, the Book's tried pairs or the Orders counts).
 */
const hutBuilt = (s: GameState): boolean =>
  s.buildings['alchemists-hut'] > 0 ||
  s.skills.alchemy > 0 ||
  s.book.tried.length > 0 ||
  (s.orders.counts.greyWives.brew ?? 0) + (s.orders.counts.greyWives.experiment ?? 0) > 0;

const triggers: Record<OrderId, (s: GameState) => boolean> = {
  moot: keepReached,
  greyWives: hutBuilt,
  bellWatchers: (s) => s.story.ilseAt !== null,
  // D5-08 is the document at the crack (Act V); isFound is inlined to keep this file free of cycles.
  quenchers: (s) => s.story.documents.some((d) => d.id === 'D5-08'),
};

/**
 * Opens every Order whose trigger has been passed, in list order (Moot, Grey Wives, Bell-Watchers,
 * Quenchers), and queues each opening scene. Idempotent. With `onLoad`, if this is the save's first
 * openings (a save from before the Orders, D421), the one-time "Seat your Orders" sheet is pending.
 * Then the third-seat check runs, so it opens whichever condition came last. Returns who opened now.
 */
export const openOrders = (state: GameState, now: number, onLoad = false): OrderId[] => {
  const o = state.orders;
  const first = ORDER_IDS.every((id) => !o.opened[id]);
  const opened: OrderId[] = [];
  for (const id of ORDER_IDS) {
    if (o.opened[id] || !triggers[id](state)) continue;
    o.opened[id] = { at: now };
    o.openingQueue.push(id);
    opened.push(id);
  }
  if (onLoad && first && opened.length > 0) o.seatStepPending = true;
  checkThirdSeat(state);
  return opened;
};
