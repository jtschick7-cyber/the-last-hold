import { TIME_TARGETS } from '../targets';
import { timeCheck } from './helpers';
import type { Check } from './types';

// GDD §6.2 "first-studied": the first species Studied falls on days 2–3 (sim/targets.ts).
// Studied is 4 kills since Q16 (D99): at 3, the Hamlet's two species gave a third kill
// within about 15 hours, before day 2.
const target = TIME_TARGETS.find((t) => t.id === 'first-studied');
if (!target) throw new Error('targets.ts has no "first-studied" row');

export const firstStudiedCheck: Check = timeCheck(target, 'first-studied');
