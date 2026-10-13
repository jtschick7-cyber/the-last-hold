// Technical design §5.3: bumps whenever combat math changes, so old fight
// replays can say "recorded with an older rules version". Version 1 is the first
// combat (v0.2); the locked seeded goldens in tests/golden belong to it.
export const RULES_VERSION = 1;
