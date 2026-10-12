// Technical design §6.1: the only place the game reads the real clock.
export const now = (): number => Date.now();
