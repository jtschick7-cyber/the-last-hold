# OUT-2b — `gdd.md` §7: the constants for v0.9 (flesh-out, 2026-10-20)

**Apply with task T9.2**, together with the `balance.ts` keys that read them, because `tests/content/balance.test.ts` compares §7 with `balance.ts` (the v0.8 order for §7.10). Do not apply earlier.

Delta-only.

---

## REPLACE the "World-boss tokens *(v0.9)*" row of the table in §7.4:

| World-boss tokens *(v0.9)* | See §7.11: tokens, rest, pool, tiers and rewards are all there | `boss.*` (**locked**) | 5.12 |

---

## NEW: §7.11 Events *(v0.9, D357–D387)*

**Every `boss.*` constant is `locked`** (plan §0.6): it changes only through a decisions row the owner approves. Every `hunt.*` constant, and `events.recentKeep`, is tunable. Starting values marked *sketch* are first estimates for the simulator to calibrate in T9.13; a changed locked value comes back to the owner as a new row, never silently.

| Formula | Expression | Constants (key = starting value) | § |
|---|---|---|---|
| Party size | up to this many hunters per boss or hunt attempt | `boss.partySize` = 4 **(locked)** | 5.12.3 |
| Tokens | 1 per interval, banked by real time up to the max; hard cap; the bank starts empty when events first open | `boss.tokenInterval` = 8 h **(locked)**, `boss.tokenMax` = 6 **(locked)** | 5.12.2 |
| Rest | per hunter after a boss or hunt attempt; blocks only other event attempts | `boss.hunterRest` = 24 h **(locked)** | 5.12.2 |
| Opening | the age at which events open (for good, once) | `boss.openAge` = citadel **(locked)** | 5.12.1 |
| Order | the fixed order of bosses; the order repeats a tier higher | `boss.order` = [lindworm, barrow-king, mother-of-the-river] **(locked)** | 5.12.4 |
| Pool | `poolBase × 1.35^(tier − 3)` (the §7.4 Health growth per tier above the stat tier 3) | `boss.poolBase` = 24,000 **(locked, sketch)** | 5.12.4 |
| Visit tier | the Rank's base tier when the visit's first attempt is made, plus the pass step per completed pass | `boss.baseTier` = { citadel 4, bastion 5 } **(locked)**, `boss.passTierStep` = 1 **(locked)** | 5.12.4 |
| Milestones | shares of the pool, each paid once per visit | `boss.milestones` = [0.25, 0.5, 0.75, 1.0] **(locked)** | 5.12.5 |
| Milestone silver | multiples of one bounty at the visit's tier and the current age (§7.4); **not bounty silver** for the §6.3 #6 share (it counts in the total only) | `boss.silverBounties` = { milestone: 1, kill: 3 } **(locked)** | 5.12.5 |
| Milestone reagents | units of the boss's one kind (the Barrow-King pays grave dust only) | `boss.reagents` = { milestone: 3, kill: 6 } **(locked)** | 5.12.5 |
| Kill item | chance, and rarity weights (the §5.11.2 loot rules otherwise) | `boss.itemChance` = 1 **(locked)**, `boss.itemRarityWeights` = { fine: 40, rare: 40, heroic: 20 } **(locked)** | 5.12.5 |
| Boss XP | per attendee per attempt, win or lose: `xpPerTier × visit tier` (inside the level cap) | `boss.xpPerTier` = 15 **(locked)** | 5.12.5 |
| Boss preview | practice fights for the expected-damage preview | `boss.previewSamples` = 100 **(locked)** | 5.12.4 |
| Hunt unlock | points a hunt needs to unlock its legendary hunter | `hunt.unlockPoints` = 100 | 5.12.6 |
| Hunt points | per track: points for a win and for a loss | `hunt.trackPoints` = { I: { win: 12, loss: 4 }, II: { win: 20, loss: 6 }, III: { win: 32, loss: 10 } } | 5.12.6 |
| Hunt tiers | the tier of tracks I, II and III | `hunt.trackTiers` = [3, 4, 5] | 5.12.6 |
| Hunt XP | per attendee: `xpPerTier × track tier` for a win; the loss share of that for a loss | `hunt.xpPerTier` = 15, `hunt.lossXpShare` = 0.5 | 5.12.6 |
| Hunt replay | reagents of the quarry's kind on a replay win | `hunt.replayReagents` = 1 | 5.12.6 |
| Recent list | event fights kept for the "recent" list | `events.recentKeep` = 10 | 9.17 |

**Notes**
- The 8 h, 6 and 24 h values are the same numbers as the old §7.4 row (D31, G7) and are re-proposed as D371.
- **Not constants but saved state:** the token count and its timestamp, each hunter's rest-until time, the boss visit, the hunt points and `standPool` (technical design §5.2).
- **Tunable content values** (not in §7.11): every Great Beast and quarry stat (§8.13, §8.14), the legendary hunters' stats and traits (§8.5), their use-skills (§8.5b).
- **Calibration (T9.13):** `boss.poolBase` is the only locked number that is a sketch. T9.13 measures the median damage of the Eventer's party at tiers 4 and 5, proposes the pool that makes a visit about 12 attempts, and returns it as a new decisions row. If the other locked numbers fail a check, the build stops and asks (plan §0.6).
