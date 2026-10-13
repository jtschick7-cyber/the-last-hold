import { TIME_TARGETS } from '../targets';
import { timeCheck } from './helpers';
import type { Check } from './types';

// GDD §6.2 "first-studied": the first species Studied (3 kills) falls on days 2–3 (sim/targets.ts).
// Pending Q16: the Hamlet's tier-1 contracts (two species) give a third kill against the
// same species within about 15 hours, before day 2. The target and the 3-kill threshold are
// both locked, so this waits for the owner (docs/questions.md).
const target = TIME_TARGETS.find((t) => t.id === 'first-studied');
if (!target) throw new Error('targets.ts has no "first-studied" row');

const inner = timeCheck(target, 'first-studied');

export const firstStudiedCheck: Check = {
  ...inner,
  judge: (runs) => ({ ...inner.judge(runs), pending: 'Q16' }),
};
