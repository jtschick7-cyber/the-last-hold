import { TIME_TARGETS } from '../targets';
import { timeCheck } from './helpers';
import type { Check } from './types';

// GDD §6.2, row "first-cottage" (thresholds in sim/targets.ts).
const target = TIME_TARGETS.find((t) => t.id === 'first-cottage');
if (!target) throw new Error('targets.ts has no "first-cottage" row');

export const firstCottageCheck: Check = timeCheck(target, 'first-cottage');
