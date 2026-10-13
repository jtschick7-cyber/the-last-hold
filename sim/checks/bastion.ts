import { TIME_TARGETS } from '../targets';
import { timeCheck } from './helpers';
import type { Check } from './types';

// GDD §6.2 (v0.4), row "bastion" (thresholds in sim/targets.ts), measured in cycle 1.
const target = TIME_TARGETS.find((t) => t.id === 'bastion');
if (!target) throw new Error('targets.ts has no "bastion" row');

export const bastionCheck: Check = timeCheck(target, 'bastion');
