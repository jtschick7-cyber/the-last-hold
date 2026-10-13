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

export const noticeFor = (c: ContractInstance, gameSeed: string): Notice => {
  const options = notices[c.village][c.location] ?? [];
  const head = villages[c.village];
  const pick =
    options[(cyrb128(`${gameSeed}:notice:${c.id}`)[0] ?? 0) % Math.max(1, options.length)];
  return {
    text: pick ?? 'Trouble, and no one will say more. Please come.',
    signature: `— ${head.head.name}, ${head.name}`,
  };
};
