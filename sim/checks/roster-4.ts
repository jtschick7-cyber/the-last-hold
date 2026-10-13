import { TIME_TARGETS } from '../targets';
import { timeCheck } from './helpers';
import type { Check } from './types';

// GDD §6.2 "roster-4": four hunters owned by the end of day 2 (sim/targets.ts).
const target = TIME_TARGETS.find((t) => t.id === 'roster-4');
if (!target) throw new Error('targets.ts has no "roster-4" row');

export const roster4Check: Check = timeCheck(target, 'roster-4');
