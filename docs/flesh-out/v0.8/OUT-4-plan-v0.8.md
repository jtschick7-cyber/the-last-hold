# OUT-4 — Edits to `docs/implementation-plan.md`

Four edits:
1. Replace the v0.8 section.
2. Notes under v0.9 and v0.10.
3. Small changes in the header, §0.6, §0.7 and the plan's judgment calls.
4. Mark v0.7's leftovers as handled.

---

## (1) Replace the `### v0.8 — Hunter depth` section with:

### v0.8 — Hunter depth

**Status:** not started *(fleshed out 2026-10-15, D300–D328)*

**Goal:** hunters grow in ways that last.
- **Items:** gear becomes items. Today's pieces become Common items, the Smithy crafts and reworks them, and contract loot adds Fine, Rare and Heroic pieces, with Stores and Salvage.
- **Legendaries:** six of them, kept forever in a new keepsake slot.
- **Ranks, stars and talents:** hunter ranks (Apprentice → Wright → Master-Wright) and stars, both kept forever, with stars bought with Embers. A personal use-skill for every hunter. Talent trees.
- **The yard:** benched hunters catch up.
- **Delves:** XP, Command XP and a guardian item, only while a run pays Riftglass.
- **Act V, The Hearthblade,** written in full, opening the Unlit's door after its stand.
- **The simulator** splits into parallel CI jobs so every job stays under 5 minutes.

**Reads:**
- GDD §4.1, §4.3, §5.0, §5.3.1–5.3.2, §5.3.6, §5.4.3, §5.5, §5.9.5–5.9.7, §5.10.6–5.10.7, §5.11 (all), §5.14.1–5.14.3, §5.14.9, §6.1–6.2, §6.5, §7.10, §8.5b, §8.11, §8.12, §9.11, §9.12, §9.16;
- `lore-secrets.md` §7, §8, §20, §30, §31, §32;
- technical design §5.2, §5.3, §7.2, §11.2, §13.

**Before you start 👤**

| Owner task | Needed by | When |
|---|---|---|
| ~~Export your real v0.7 save~~ **Done:** the save code pasted in the flesh-out (2026-10-15, cycle 19, Bastion) is in `OUT-8-v7-owner-save-code.txt`; it becomes `tests/saves/fixtures/v7-owner.json` | T8.5 | — |
| ~~Answer Q25~~ **Done:** (a), all ten write-up details accepted (D329) | T8.3, T8.6 | — |
| Decide any name collisions the search finds | T8.4 | When asked |
| Review the new art (item icons, rarity frames, keepsakes, star, rank badges, brew icons) | T8.14 | In the playtest |

#### A. Story, fixes and content
- [ ] **T8.1 Act V** *(the first task, D301–D302)*.
  - Act V in `src/content/story/act5.ts`, word for word from `lore-secrets.md` §30: every document with its condition and text, the two arrival lines, the delivery line ("Pechko found a letter at the crack: '…'."), the new Accounts event "What the hearth leaves" and the additions to three earlier events with their excerpts.
  - Opening **the Unlit's door after Act V's stand** (D257), with the Rift card line, and Yrsa's Thole's result-sheet line after D5-06. The Legendary itself is built in T8.9; until then the line shows alone.
  - The last written act becomes 5. No new condition kinds.
  - Tests: every Act V document's condition, row by row against §30; the text word for word; the true-ending gate (40 names, exactly one source each; #4–7 now from D5-03).
  - The on-load start for a story-less cycle needs saved state, so it is T8.5.
- [ ] **T8.2 Per-act family counters** (D318).
  - Reproduce on `v7-owner.json`: every act's `winsByFamily` shows Act IV's numbers.
  - Fix the code so each act begun gets its own counter, with a test that two acts' counters move independently.
  - The migration step (keep Act IV's counts, clear Acts I–III's) is part of T8.5.
  - Log the fix as a documented drift (Proposed row).
- [ ] **T8.3 Content and keys: mechanics.**
  - The §7.10 keys into `balance.ts` (the eight locked ones marked locked), with GDD §7.10 added in the `key` = value form and the plan §0.6 row (below), all in the same commit.
  - Content, outside the saved-state id lists until T8.5 (as D171):
    - the Common item bases (today's 7 pieces with today's numbers);
    - the loot table and the line pool (§5.11.2);
    - the 11 use-skills (§8.5b);
    - the 27 talents (§8.11);
    - the 6 Legendaries (§8.12);
    - the rank and star rules (§5.11.3).
  - Content tests:
    - every hunter has one use-skill;
    - every role has 3 branches × 3 tiers;
    - every Legendary has exactly one milestone and none is Delve-only;
    - the Common items equal today's gear table number for number;
    - the **D20 content test** updated: Delve XP, Command XP and guardian items each have their idle source (contract XP, contract loot).
- [ ] **T8.4 Names.** Collision search (GDD §2.3, D173 rule) for every name in `OUT-6-new-names.md`; add them to `tests/content/names.ts`. Any collision: stop and ask, with alternatives.
- [ ] **T8.5 Migration v7 → v8** (D317), using the **owner's real v0.7 save** (`v7-owner.json`) as the fixture, with a round-trip test, and a `v8.json` fixture (that save played 72 h).
  - **New saved state:**
    - items (each with base, tier, rarity, lines; equipped or in Stores);
    - each hunter's rank, stars, talent picks and keepsake;
    - Legendaries found (id, cycle);
    - trophies spent this cycle.
  - **What the migration does:**
    - gear slots become equipped Common items with the same numbers;
    - ranks from each hunter's highest level ever, free (D311);
    - stars 0; talent points given but unspent;
    - Legendaries whose milestone is already met are found on load;
    - Acts I–III's `winsByFamily` cleared and Act IV's kept (D318);
    - the paused Delve run kept.
  - **Act V's start:** in a story-less cycle it starts on load with fresh counters (D246). Generalise v0.7's `story.startActIV` to any newly written act, with the on-load line, and D5-01 found `via` 'arrival'. A save still in Act IV's cycle reaches Act V with the next warden.
  - **Tests on the owner's save:**
    - after migration and load, Halvar, Zora, Ostap, Vesna, Herdis, Bjarna and Radek are Wrights, and the others are Apprentices;
    - every hunter's weapon and armor numbers are unchanged;
    - the Legendaries found match the bestiary (Wolf-Tooth String expected; confirm);
    - the save's cycle-19 stand, played through, reaches Act V with the next warden;
    - the same save made story-less starts Act V on load.
  - Add the debug action "Start Act V" (as "Start Act IV").
  - Technical design §5.2 and §7.2 are already updated by the docs commit (OUT-9). Check they match.

#### B. Systems
- [ ] **T8.6 Items, loot, Stores and Salvage** (D304, D305, D307).
  - **Commands:** craft, rework, equip, unequip and salvage, all refused while the hunter is on a contract or in a Delve.
  - **Rules:** loot on every contract won (seeded); auto-salvage when Stores is full; the reset at the Long Night (Legendaries kept); the Smithing cut on crafting and rework.
  - **Breakdowns:** every item line in the stat breakdowns.
  - **Test-first. Golden check:** with Common items, the §5.5.1 fight, every seeded golden fight and every recorded fight in the fixtures replay **line for line**. If one changes, stop and ask.
- [ ] **T8.7 Ranks, stars and the trophies on hand** (D309, D310).
  - Commands `hunter.rankUp` and `hunter.addStar`, with their refusals.
  - The growth formula with the star line in every breakdown; trophies on hand (earned minus spent).
  - Kept through the Long Night (in the reset's row-by-row test).
  - Tests: a rank never lost to halving; a star raising stats at once; spending never changing the Trophy Hall bonus or the Embers conversion.
- [ ] **T8.8 Use-skills in the fight engine** (D312, D314).
  - All 11, each on its trigger, with no new dice, a log line each, and the general meter knock-back.
  - **`rulesVersion` 5** (owner-approved, D308): every golden fight and every recorded fight replays line for line in Node, WebKit and Chromium. **If one changes, stop and ask.**
  - The odds and Suggest include use-skills. Benchmarks stay in budget.
  - One test per use-skill.
- [ ] **T8.9 Talents and Legendaries** (D313, D306).
  - The talent pick and free respec commands; the 27 effects (Herbs off in Delves, shown).
  - Keepsakes: equip and swap.
  - The six Legendary effects in fights; the milestone checks, on the same events as the Delve relics' idle sources.
  - One test per talent and per Legendary.
- [ ] **T8.10 The yard** (D315).
  - Yard XP when a contract finishes, for every hunter at the hold not on it (not the dead, not in a Delve), at 25% of each party member's XP, capped at the third-highest hunter's level.
  - The away-sheet line.
  - Tests: the cap; an injured hunter earning; a Delving hunter not earning.
- [ ] **T8.11 Delve rewards** (D316).
  - Hunter XP per floor and guardian, Command +1 per floor, the guardian item, all only while the run pays Riftglass.
  - Tests: a quiet-night run pays none of them; a paying run pays exactly the table.
- [ ] **T8.12 The older-rules note** (D319): show "recorded with an older rules version" only when a replay comes out different from the record. Applies to contract fights, stand waves and Delve floors. Tests both ways.

#### C. UI
- [ ] **T8.13a The hunter sheet and the picker** (§9.16).
  - Rank badge, stars, use-skill, three slots, talents with tier locks and respec, Rank up and Add a star with costs and breakdowns.
  - The slot picker (best first, differences, Craft, Rework).
  - The Hearth's pointer line.
- [ ] **T8.13b Stores, lines, Act V and the smoke.**
  - Stores with Salvage under Hunters.
  - The away-sheet and results lines (loot, auto-salvage, Legendary found, rank-up, yard).
  - Act V's scenes and on-load card, and the Rift card's sixth-door line.
  - **Extend the Playwright smoke:**
    - debug a won contract → loot in Stores → equip → rework;
    - debug to Wright → Rank up → pick a talent;
    - debug "Start Act V" → D5-01.
  - **The on-load card helper:** one shared helper drives both the Act V on-load card and the Arvid on-load card (D323), each with a test.
  - Screenshot pass at phone size.

#### D. Art
- [ ] **T8.14 Art** (the D59 method, D324).
  - 16 px icons for the 7 base pieces; 4 item rarity frames (Common, Fine, Rare, Heroic), distinct from the Delve frames; 6 keepsake icons; a star icon; 3 rank badges; icons for the nine older brews (D323).
  - Manifest entries; `credits.md` regenerated; the contact sheet updated. 👤 Review in the playtest.

#### E. CI and simulator
- [ ] **T8.15 CI: split the simulator job, and move off Node 20** (D320, D323).
  - `sim.yml` runs the full suite as parallel jobs (for example, the Monday Standard and Delver runs in one, everything else in another) plus a final job that combines their results and judges every row.
  - Same runs, seeds and rows; the combined report equals a single-machine run (a test, like `sim/parallel.test.ts`).
  - Workflow actions on versions that don't use the deprecated Node 20.
  - Measure each job. **If any job goes over 5 minutes, stop and ask** (never trim seeds or rows).
  - Optional: a short profiling look at the simulator.
- [ ] **T8.16 Policy rules** (GDD §6.1, D321).
  - Items (rework the weakest slot first; equip loot by a fixed item score; salvage the lowest scorers once Stores passes 30).
  - Rank up when qualified; Embers on the Hearth first, then the cheapest star; talents in a fixed order per role; Legendaries by a fixed table.
  - The Delver's Re-roll rule.
  - Report: stars per cycle, items by rarity per cycle, Legendaries found, Delve XP.
- [ ] **T8.17 Checks** (D322).
  - In **their own commit**: the `act-5`, `late-letters` and `first-wright` rows and the new `idle-only` definition in `sim/targets.ts` (owner-approved). The milestone becomes v0.8.
  - The Monday Standard and Delver runs play on until all content (up to 42 days), as in v0.7.
  - Suite time per CI job measured; **over 5 minutes in any job: stop and ask.**
- [ ] **T8.18 Tuning** (tunables only) against every check.
  - Likely levers: `yard.share`, `star.growthPerStar`, `star.embersPerStar`, `loot.chanceBase`, `loot.lines`, `delve.xpPerTier`, `rank.wrightTrophies`.
  - The 38 earlier checks judge `standard`. Items, yard XP and stars move them through shared rules (watch "later cycles", "contracts own silver" and "provisions matter").
  - If no reasonable values pass, stop and ask.

### v0.8 acceptance criteria
1. Act V runs in its cycle (row-by-row tests). The owner's real v0.7 save migrates, round-trips, keeps every number of its gear, gets its ranks, and reaches Act V both ways (next warden, or on load in a story-less cycle). The Unlit's door opens after Act V's stand.
2. Items: craft, rework (bonus lines kept), loot, equip, Stores (40), Salvage and auto-salvage work, with breakdowns. Everything except Legendaries resets at the Long Night.
3. Ranks, stars and talents work, show their costs and breakdowns, and survive the Long Night. A rank is never lost to halving. Stars cost Embers and trophies.
4. All 11 use-skills, 27 talents and 6 Legendaries work as §8.5b, §8.11 and §8.12 say (a test each). Every golden fight and every recorded fight replays line for line (`rulesVersion` 5). The older-rules note shows only when a replay differs.
5. Yard XP catches benched hunters up to the third-highest level and no further.
6. Delve XP, Command XP and the guardian item come only while a run pays Riftglass. The D20 content test passes. The true-ending gate still passes (40 names, one source each; no Delve-only requirement).
7. Every earlier check passes on `standard`; the new rows pass; **every simulator CI job stays ≤ 5 min**; `npm run check` stays ≤ 90 s.

### v0.8 simulator checks

| Check | Target |
|---|---|
| Act V lands in its cycle | D5-01 to D5-06 and D5-08 by the end of cycle 5; D5-07 with the next warden (Standard) |
| Late recruits catch up | All five name letters (Ostap at levels 5 and 8; Toma, Sigrun and Arvid at 5) by the end of cycle 5 (Standard) |
| First Wright | By the end of cycle 1 (Standard) |
| Idle-only vs Delver | Standard reaches the last of "all content" (Acts I–V judged documents; book 36/36; six Ribbonshade names; every skill ≥ 4; the five letter names; every hunter at Wright) ≤ 1.3× later than the Delver |
| D20 content test | Every Delve reward has an idle source or is marked sidegrade / convenience / Delve-only (not a simulator check) |
| All earlier checks | Pass, on `standard` |
| Suite time | Every simulator CI job ≤ 5 min (D320) |

Standard, Monday start, 5 seeds (median), as in §0.3; the Delver on the Monday seeds only (D272).

Reported, not judged: stars per cycle, items by rarity per cycle, Legendaries found, Delve XP, and v0.7's Riftglass per week, floors per run and Delve relics.

### v0.8 owner playtest checklist 👤 (on the preview build)
- [ ] Your save arrived cleanly: same gear numbers, the seven Wrights, any Legendary found on load (Wolf-Tooth String?).
- [ ] Loot feels like a nice surprise, not a chore: the picker makes "is this better?" obvious, and Stores and Salvage stay tidy.
- [ ] Reworking a lucky early drop into a better tier feels good.
- [ ] Rank up and Add a star are easy to find and clearly priced, and stars give your 481 Embers a real use.
- [ ] Use-skills show in fight logs, and you can tell when one fired. At least one changed a fight you watched.
- [ ] Talents are a real choice; respec feels free.
- [ ] Arvid, Sigrun and Toma catch up in the yard and their name letters arrive.
- [ ] Delves feel worth a run again (XP and a guardian item), and a quiet night still feels fair.
- [ ] Act V reads well, one wrongness each (D5-06 deliberately says more); the letters arriving at the crack land; the Unlit's door opening after the stand feels earned.
- [ ] New art: keep, regenerate or placeholder. Screenshot pass.

**Out of scope:** Act VI's texts (written at the v0.9 flesh-out, D303); the Dross-Tide in the Last Stand; trophies from Delves; Delve-only rewards of any new kind; random Legendaries; more keepsake or relic slots; use-skill upgrades at Master-Wright; events (v0.9); trust rewards and Orders (v0.10).

---

## (2) Notes under v0.9 and v0.10

- Under **v0.9 — Events**, add:
  - "- **Act VI, The Unlit, is written at this flesh-out** (D303), from the outline in `lore-secrets.md` §31. Decide there whether the Dross-Tide joins the Last Stand's waves, and any closing scenes."
  - "- **Note (D315):** yard XP comes from contracts only; decide at the flesh-out whether event attempts give yard XP or items."
- Under **v0.10 — Orders**, keep the D24.10 open question and add: "(still open after the v0.8 flesh-out.) Act V's D5-08 seeds the Quenchers from Kozly Hollow."

---

## (3) Small changes elsewhere in the plan

**The plan's header line "Depth:"** — *replace with:* "v0.0–v0.8 are in full detail (v0.8 fleshed out 2026-10-15, D300–D328). v0.9 and later are outlines; each gets a flesh-out session before it starts (§0.4)."

**§0.6, the locked table** — *add a row (apply with T8.3, together with GDD §7.10):*
`| Hunter depth | `stores.cap`, `star.max`, `keepsake.slots`, `talent.points`, `talent.tierStars`, `rank.wrightLevel`, `rank.masterLevel`, `yard.capRank` (D325) |`

**§0.7, the size table** — *add a row:* `| v0.8 | 19 (T8.1–T8.18, T8.13 in two parts) | 15–19 |`

**Judgment calls in the implementation plan** — *add:* "12. **v0.8 is 19 tasks (T8.1–T8.18, T8.13 in two parts) over 15–19 sessions;** Act V is the first task; the simulator splits into parallel CI jobs with a 5-minute limit per job (D320)."

---

## (4) v0.7's leftovers (record in the v0.7 section's notes, or in progress.md at the docs commit)

- The Delver's Re-roll → T8.16.
- The on-load Arvid card test → T8.13b.
- The nine brew icons → T8.14.
- Node 20 → T8.15.
- WebKit-only-in-CI → closed (D323).
- Pixel UI Pack frames → still v1.0.
