import { kamenfellNoticeEnd } from '../../content/story/scenes';
import {
  startingTrust,
  TRUST_LEVELS,
  trustClosingLines,
  type TrustLevel,
} from '../../content/story/trust';
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
  /** A head's line from the Thanes' Moot, after everything else (lore §33 E1), only while seated. */
  readonly headLine?: string;
}

/**
 * `act` is the current cycle's act: in Act II, a fell village's ruin notice names the
 * ruin (lore-secrets §22.1). `trust` is the village's trust now: once it's above where
 * the village started, the notice closes with that level's line (GDD §5.14.6, D180).
 * `headLine` is the Moot's line for this village, or null; it is added last.
 */
export const noticeFor = (
  c: ContractInstance,
  gameSeed: string,
  act: number | null = null,
  trust: TrustLevel | null = null,
  headLine: string | null = null,
): Notice => {
  const options = notices[c.village][c.location] ?? [];
  const head = villages[c.village];
  const pick =
    options[(cyrb128(`${gameSeed}:notice:${c.id}`)[0] ?? 0) % Math.max(1, options.length)];
  const kamenfell = act === 2 && c.location === 'ruin' && head.band === 'fells';
  const base = pick ?? 'Trouble, and no one will say more. Please come.';
  const warmer =
    trust !== null && TRUST_LEVELS.indexOf(trust) > TRUST_LEVELS.indexOf(startingTrust[c.village])
      ? trustClosingLines[trust]
      : null;
  const placed = kamenfell ? `${base} ${kamenfellNoticeEnd}` : base;
  return {
    text: warmer ? `${placed} ${warmer}` : placed,
    signature: `— ${head.head.name}, ${head.name}`,
    ...(headLine ? { headLine } : {}),
  };
};
