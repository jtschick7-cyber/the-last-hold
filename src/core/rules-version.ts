// Technical design §5.3: bumps whenever combat math changes, so old fight
// replays can say "recorded with an older rules version". Version 1 is the first
// combat (v0.2); the locked seeded goldens in tests/golden belong to it, and its
// contract fights are unchanged in version 2. Version 2 (D139): the v0.4 tuning changed
// how Threat strengthens Last Stand waves (`threat.waveStrengthPerPoint`). Version 3
// (owner-approved, D175): the Cursed join the Last Stand's waves, so a stand recorded
// before v0.5 would replay with other monsters; contract fights are unchanged. Version 4
// (owner-approved, D251): Delve group fights (several monsters, targeting by role, group order
// in the same-tick rule); a one-monster fight takes exactly the steps it always did, so every
// contract fight and Last Stand wave recorded under versions 1 to 3 replays unchanged. Version 5
// (owner-approved, D308): the Wrights' use-skills, with the meter knock-back as a general fight
// rule, and the bonus lines of items; a hunter with no rank, no stars and only Common items fights
// exactly as before, so every golden fight and every recorded fight replays unchanged. Version 6
// (owner-approved, D584, Q62): the Breach. A Last Stand whose record holds a lane table fights under the
// version 6 rules (the wave's lane gives its wall cut and volley); a record without one replays under the
// version 5 rules, bit for bit. Every other fight's maths is the same in 5 and 6, and replay accepts both.
export const RULES_VERSION = 6;
