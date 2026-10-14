import { TIME_TARGETS } from '../targets';
import { timeCheck } from './helpers';
import type { Check } from './types';

// GDD §6.2 (v0.4), row "first-long-night" (thresholds in sim/targets.ts), measured in cycle 1.
const target = TIME_TARGETS.find((t) => t.id === 'first-long-night');
if (!target) throw new Error('targets.ts has no "first-long-night" row');

export const firstLongNightCheck: Check = timeCheck(target, 'first-long-night');
