import { TIME_TARGETS } from '../targets';
import { timeCheck } from './helpers';
import type { Check } from './types';

// GDD §6.2 (v0.4), row "best-last-stand" (thresholds in sim/targets.ts), measured in cycle 1.
const target = TIME_TARGETS.find((t) => t.id === 'best-last-stand');
if (!target) throw new Error('targets.ts has no "best-last-stand" row');

export const bestLastStandCheck: Check = timeCheck(target, 'best-last-stand');
