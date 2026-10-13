import { TIME_TARGETS } from '../targets';
import { timeCheck } from './helpers';
import type { Check } from './types';

// GDD §6.2, row "first-mine" (thresholds in sim/targets.ts).
const target = TIME_TARGETS.find((t) => t.id === 'first-mine');
if (!target) throw new Error('targets.ts has no "first-mine" row');

export const firstMineCheck: Check = timeCheck(target, 'first-mine');
