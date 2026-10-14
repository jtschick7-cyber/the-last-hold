import { kamenfellNoticeEnd } from '../../content/story/scenes';
import { notices } from '../../content/text/notices';
import { villages } from '../../content/villages';
import { cyrb128 } from '../rng';
import type { ContractInstance } from '../state/game-state';

// The notice a contract carries (setting-primer §6.3): fixed by the contract's id,
// so the same contract always reads the same, and nothing is stored.

export interface Notice {
  readonly text: string;
  /** "— Marta Dubska, Dubno Ford" */
  readonly signature: string;
}

/**
 * `act` is the current cycle's act: in Act II, a fell village's ruin notice names the
 * ruin (lore-secrets §22.1).
 */
export const noticeFor = (
  c: ContractInstance,
  gameSeed: string,
  act: number | null = null,
): Notice => {
  const options = notices[c.village][c.location] ?? [];
  const head = villages[c.village];
  const pick =
    options[(cyrb128(`${gameSeed}:notice:${c.id}`)[0] ?? 0) % Math.max(1, options.length)];
  const kamenfell = act === 2 && c.location === 'ruin' && head.band === 'fells';
  const text = pick ?? 'Trouble, and no one will say more. Please come.';
  return {
    text: kamenfell ? `${text} ${kamenfellNoticeEnd}` : text,
    signature: `— ${head.head.name}, ${head.name}`,
  };
};
