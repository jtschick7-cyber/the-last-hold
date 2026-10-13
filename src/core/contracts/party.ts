import type { AgeId } from '../../content/ages';
import { constantAt, num } from '../balance-access';

// GDD §5.4.1: up to 3 hunters at tiers 1–3, up to 4 at tiers 4–5, and at most 2
// in Hamlet (G6).
export const maxPartySize = (tier: number, rank: AgeId): number => {
  const bySize = constantAt('contract.partySize').value as readonly number[];
  const normal = bySize[tier - 1] ?? 0;
  return rank === 'hamlet' ? Math.min(normal, num('contract.hamletPartyMax')) : normal;
};
