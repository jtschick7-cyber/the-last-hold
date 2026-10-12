import { TIME_TARGETS } from '../targets';
import { timeCheck } from './helpers';
import type { Check } from './types';

// GDD §6.2, row "peasants-10" (thresholds in sim/targets.ts).
const target = TIME_TARGETS.find((t) => t.id === 'peasants-10');
if (!target) throw new Error('targets.ts has no "peasants-10" row');

export const peasants10Check: Check = timeCheck(target, 'peasants-10');
