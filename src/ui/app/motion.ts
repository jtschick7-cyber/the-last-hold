import { isReduced, phoneSaysReduce } from '../motion/registry';
import { game } from './runtime';

/**
 * Whether motion should be still (GDD §9.20, Settings → Reduce motion): the switch is on, or the
 * phone asks for it. CSS follows the same rule through the gate in tokens.css; this is for what
 * JavaScript draws (battle sprite frames).
 */
export const reducedMotion = (): boolean =>
  isReduced(game().settings.reduceMotion, phoneSaysReduce());
