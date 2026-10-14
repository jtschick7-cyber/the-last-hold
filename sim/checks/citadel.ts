import { TIME_TARGETS } from '../targets';
import { timeCheck } from './helpers';
import type { Check } from './types';

// GDD §6.2 (v0.4), row "citadel" (thresholds in sim/targets.ts), measured in cycle 1.
const target = TIME_TARGETS.find((t) => t.id === 'citadel');
if (!target) throw new Error('targets.ts has no "citadel" row');

export const citadelCheck: Check = timeCheck(target, 'citadel');
