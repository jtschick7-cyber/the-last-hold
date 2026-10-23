// GDD §9.22: which moment (if any) a thing the game just did is. Worked out from the command and
// from what the game already shows; nothing in src/core/ knows about sound. Anything not listed
// here is silent.
import type { Command } from '../../core/commands';
import type { AdvanceLog } from '../../core/sim/advance';
import type { BuildingId } from '../../content/buildings';
import type { Moment } from '../../platform/sound/moments';

/** A command that has just succeeded. `owned` reads the Hold before the command ran. */
export const momentForCommand = (cmd: Command, owned: (b: BuildingId) => number): Moment | null => {
  switch (cmd.type) {
    // "Buying" and "building" are the same Hold-screen purchase command (D520 (5) (d)).
    case 'build.buy':
    case 'build.upgrade':
      return owned(cmd.building) === 0 ? 'hold.newBuilding' : 'hold.buy';
    case 'contract.launch':
      return 'contract.launch';
    case 'layout.place': // a completed move or swap in Arrange Hold
      return 'arrange.place';
    case 'age.up':
      return 'hold.rankUp';
    case 'hunter.rankUp':
      return 'hunter.rankUp';
    default:
      return null;
  }
};

/** Contracts that finished in a live tick (never a catch-up): one moment each. */
export const momentsForLiveTick = (log: AdvanceLog): Moment[] =>
  log.events.flatMap((e) =>
    e.type === 'contract'
      ? [e.result.success ? ('contract.won' as const) : ('contract.lost' as const)]
      : [],
  );
