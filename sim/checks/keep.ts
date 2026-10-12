import { TIME_TARGETS } from '../targets';
import { timeCheck } from './helpers';
import type { Check } from './types';

// GDD §6.2, row "keep" (thresholds in sim/targets.ts).
const target = TIME_TARGETS.find((t) => t.id === 'keep');
if (!target) throw new Error('targets.ts has no "keep" row');

export const keepCheck: Check = timeCheck(target, 'keep');
