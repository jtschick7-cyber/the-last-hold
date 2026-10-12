import { TIME_TARGETS } from '../targets';
import { timeCheck } from './helpers';
import type { Check } from './types';

// GDD §6.2, row "mill-3" (thresholds in sim/targets.ts).
const target = TIME_TARGETS.find((t) => t.id === 'mill-3');
if (!target) throw new Error('targets.ts has no "mill-3" row');

export const mill3Check: Check = timeCheck(target, 'mill-3');
