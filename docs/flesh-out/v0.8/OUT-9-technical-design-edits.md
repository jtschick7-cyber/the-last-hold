# OUT-9 — Edits to `docs/technical-design.md` (v0.8 flesh-out)

These are owner-approved with the flesh-out (D308, D317–D320, D328). Apply them in the docs commit. T8.5 and T8.15 then check that the code matches.

---

**§5.2 Game state, the `GameState` sketch** — *add before `stats`:*
```
  items: ItemState[]                             // v0.8; every item owned: equipped or in Stores (cap 40)
  legendaries: { id: LegendaryId; cycle: number }[]  // v0.8; found, kept forever
```
*and in `HunterState` (described in the text): rank, stars, talent picks, the keepsake, and the equipped weapon and armor as item ids.*

**§5.2, add a bullet after "Delves and Act IV":**
- **Hunter depth and Act V** *(v0.8, plan T8.5, D306–D317)*:
  - **`items`:** every item the hold owns, each with an id, its base piece, tier, rarity (Common, Fine, Rare, Heroic), its bonus lines (kind, size, and the family for a bane line), what was paid into it (for Salvage), and where it is (a hunter's weapon or armor slot, or Stores).
  - **Each `HunterState`:** gains `rank` (apprentice, wright, masterWright), `stars` (0–5), `talents` (picked ids), `keepsake` (a Legendary id or null), and its `weapon` and `armor` as item ids.
  - **`legendaries`:** the ones found, with the cycle.
  - **Trophies spent this cycle** are recorded beside the cycle's trophies, so trophies on hand = earned − spent.
  - **The Long Night** keeps ranks, stars, talents, keepsakes and Legendaries, and drops every other item.
  - **`ActProgress.winsByFamily`** is now separate for each act (D318).
  - **The v7 → v8 step** (`save/migration-v8.ts`):
    - turns each hunter's gear tiers into equipped Common items with today's numbers;
    - gives each hunter the rank their highest level ever qualifies for (D311), with stars 0 and talents empty;
    - finds Legendaries whose milestone is already met;
    - keeps Act IV's family counts and clears Acts I–III's;
    - starts Act V on load when the current cycle has no act (D246, generalising `story.startActIV` to `story.startAct`).

**§5.3 Fight references, second bullet** — *replace with:* "**If the combat code ever changes in a way that alters an old replay,** the replay shows *"recorded with an older rules version"*. From v0.8 the note shows only when the replay actually differs from the record (D319); a replay that matches shows nothing. A `rulesVersion` constant bumps whenever combat math changes (5 from v0.8, D308)."

**§7.2 Streams** — *add rows:*

| Stream | Seed string |
|---|---|
| Contract loot (v0.8) | `${gameSeed}:loot:${contractId}` (fixed at launch, like the fight) |
| Delve guardian loot (v0.8) | `${runSeed}:loot` |

**§11.2 CI and deploy, the `sim.yml` row** — *replace the Steps cell with:* "The full 5-seed `sim:check`, **split into parallel jobs** (for example the Monday Standard and Delver runs, and everything else) plus a final job that combines their results and judges every row (D320). Same runs, seeds and rows; each job must finish in **5 minutes or less**."

**§11.2** — *add a bullet:* "- **Workflow actions** use versions that don't run on the deprecated Node 20 (D323)."

**§13.4 Performance, first bullet** — *replace "the full suite in **5 min or less** (GDD §6.5)" with:* "the full suite in **5 min or less per CI job** (GDD §6.5, D320)".
