// Event times are computed exactly (technical design §6.2), but a resource
// integrated to "the moment it reaches X" can land a few ulps short of X. A
// threshold counts as reached within this relative tolerance, so the event
// fires at its computed time instead of one float step later.
const REACHED_RELATIVE = 1e-12;

export const reached = (have: number, need: number): boolean =>
  have >= need - Math.abs(need) * REACHED_RELATIVE;
