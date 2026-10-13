import { TIME_TARGETS } from '../targets';
import { timeCheck } from './helpers';
import type { Check } from './types';

// GDD §6.2 "first-tier-3": the first tier-3 success falls on day 2 (sim/targets.ts).
const target = TIME_TARGETS.find((t) => t.id === 'first-tier-3');
if (!target) throw new Error('targets.ts has no "first-tier-3" row');

export const firstTier3Check: Check = timeCheck(target, 'first-tier-3');
