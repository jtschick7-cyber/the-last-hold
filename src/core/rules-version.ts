// Technical design §5.3: bumps whenever combat math changes, so old fight
// replays can say "recorded with an older rules version". Version 1 is the first
// combat (v0.2); the locked seeded goldens in tests/golden belong to it, and its
// contract fights are unchanged in version 2. Version 2 (D139): the v0.4 tuning changed
// how Threat strengthens Last Stand waves (`threat.waveStrengthPerPoint`). Version 3
// (owner-approved, D175): the Cursed join the Last Stand's waves, so a stand recorded
// before v0.5 would replay with other monsters; contract fights are unchanged.
export const RULES_VERSION = 3;
