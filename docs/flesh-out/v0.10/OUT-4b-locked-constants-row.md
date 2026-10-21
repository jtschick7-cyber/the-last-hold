# OUT-4b — The plan §0.6 row (held for T10.2)

Add this row to the table in `docs/implementation-plan.md` §0.6 (after the "Events" row) **at T10.2**, not in the docs commit.

| Area | Locked keys |
|---|---|
| Orders | `orders.seatsStart`, `orders.seatsMax`, `orders.thirdSeatTopOrders`, `orders.levels`, `orders.opposed`, `orders.perkCeiling` (D412, D418) |

And add under the table, after the `hunt.*` note:

*The `orders.*` standing weights, `orders.levelThresholds`, `orders.delveWindow`, `orders.delveWeeklyCap`, `orders.triumphantChunk`, `orders.backfillCapLevel`, `orders.swapCooldown` and the four `orders.perk.*` steps are **tunable** (D418). The thresholds, weights, chunk and cap start as sketches the Orderer measures at T10.17 and T10.18.*
