# OUT-4b — `implementation-plan.md` §0.6: the locked row for v0.9 (flesh-out, 2026-10-20)

**Apply with task T9.2**, together with GDD §7.11 and the `balance.ts` keys, because the key test compares them.

---

## REPLACE the "Events" row of the table in §0.6 "Balance tuning: locked and tunable constants":

| Events | `boss.partySize`, `boss.tokenInterval`, `boss.tokenMax`, `boss.hunterRest`, `boss.openAge`, `boss.order`, `boss.poolBase`, `boss.baseTier`, `boss.passTierStep`, `boss.milestones`, `boss.silverBounties`, `boss.reagents`, `boss.itemChance`, `boss.itemRarityWeights`, `boss.xpPerTier`, `boss.previewSamples` (the whole `boss.*` namespace, D370–D379), `riftglass.bankWeeks` |

## ADD one sentence under the table in §0.6:

*The `hunt.*` constants (`hunt.unlockPoints`, `hunt.trackPoints`, `hunt.trackTiers`, `hunt.xpPerTier`, `hunt.lossXpShare`, `hunt.replayReagents`, D380) are **tunable.** `boss.poolBase` starts as a sketch and is replaced only by a decisions row the owner approves (T9.13).*
