# OUT-4 — Edits to `docs/implementation-plan.md`

Four edits: (1) replace the v0.7 section, (2) replace the v0.8 section, (3) one-line notes under v0.9 and v0.10, (4) small changes in §0.6, §0.7 and the plan's judgment calls.

---

## (1) Replace the `### v0.7 — Delves` section with:

### v0.7 — Delves

**Status:** not started *(fleshed out 2026-10-14, D244–D279)*

**Goal:** Delves arrive: short, optional runs into the rift under the Hearth Hall, with fights against groups of monsters played back with battle sprites, five patrons' blessings (the Unlit built but locked until Act V), the Deep family as guardians, the Riftglass allowance and shop, six Delve relics and Ember-echoes. Delves never speed up the idle path: everything they give has an idle source or is a sidegrade, a convenience, or works only in Delves (D20). And **Act IV, The Keeper**, written in full, reaches the owner's save on load.
**Reads:** GDD §4.1, §4.3, §5.0, §5.3, §5.5, §5.6.1, §5.9.3, §5.9.6, §5.10 (all), §5.14.1–5.14.3, §6.1–6.3 (v0.7 lines), §7.9, §8.3, §8.5 and §8.5a, §8.8, §8.10 and §8.10a, §9.6, §9.11, §9.12, §9.15; `lore-secrets.md` §8, §12.2, §13, §15, §20, §28, §29; technical design §5.2, §5.3, §7.2, §9, §12, §13.

**Before you start 👤**

| Owner task | Needed by | When |
|---|---|---|
| ~~Export your real v0.6 save~~ **Done:** the save code pasted in the flesh-out (2026-10-14, cycle 19) is in `OUT-8-v6-owner-save-code.txt`; it becomes `tests/saves/fixtures/v6-owner.json` | T7.5 | — |
| **Answer Q20 and Q21** (monsters shown by name in Delves; no XP from Delves) | T7.6, T7.9 | Before T7.6 |
| Decide any name collisions the search finds | T7.4 | When asked |
| Approve the drafted blurbs, relic lines and Pechko's result lines (`lore-secrets.md` §29, marked "Proposed") | T7.3 | With the sprite contact sheet |
| Review the battle-sprite contact sheet | T7.12 | One session before T7.13a |
| Review the new art (sprites, sigils, rarity frames, relic and Riftglass icons, cosmetics) | T7.12 | In the playtest |

#### A. Story, content and state
- [ ] **T7.1 Act IV** *(the first task, D245–D247)*. Act IV in `src/content/story/act4.ts`, word for word from `lore-secrets.md` §28: every document with its condition and text, the two arrival lines, the Accounts event "The light in the window" and the additions to "The apprentices" and "Yrsa's choice" with their excerpts. Two new condition kinds, typed and judged: **the act beginning** (D4-01) and **the nth contract won in an act against a family** (D4-02, D4-03). The last written act becomes 4. Tests: every Act IV document's condition, row by row against §28; the text word for word; the true-ending gate (40 names, exactly one source each; #21, #22, #24–#27 now from D4-02/D4-03). The on-load start and its re-based counters need saved state, so they are T7.5. Also the lore doc fixes of D263 (D1-08 → E-01).
- [ ] **T7.2 Check D244: Arvid's level on arrival.** The owner's save has Arvid at level 1 after arriving on load in cycle 18, against D211 ("the highest hunter's level, within the Rank's level cap"). Reproduce with the `v6-owner` save (or the v5 fixture through the Act III on-load path). If it's a bug, fix it as a documented drift (decisions row, Proposed) with a test; if it's correct by the rules (for example the Hamlet cap at that moment), write that down and ask the owner whether to change it. Don't change the D211 rule silently.
- [ ] **T7.3 Content and keys: mechanics.** The §7.9 keys into `balance.ts` (the six locked ones marked locked; `riftglass.bankWeeks` already is), and §7.9 written in the `key` = value form in the same commit; the plan §0.6 row (below) in that commit too. Content, outside the saved-state id lists until T7.5 (as D171): the 48 blessings (§8.8) with their exact effects, the 3 Deep guardians (§8.3, with bestiary lines and the drafted blurbs), the 6 Delve relics (§8.10a), the 11 alternate traits (§8.5a), the shop items (§5.10.8), the 18 Ember-echoes (`lore-secrets.md` §29) and the rift scene. Content tests: every patron has 4 / 3 / 1 by rarity; at most two ★ kinds per patron (the Unlit four); every relic has both sources; the **D20 content test** (D271): every Delve reward listed with its idle source or marked sidegrade / convenience / Delve-only.
- [ ] **T7.4 Names.** Collision search (GDD §2.3, D173 rule) for every name in `OUT-6-new-names.md`; add them to `tests/content/names.ts`. Any collision: stop and ask, with alternatives.
- [ ] **T7.5 Migration v6 → v7** (D267), using the **owner's real v0.6 save** (`v6-owner.json`, from the flesh-out's save code) as the fixture, with a round-trip test, and a `v7.json` fixture (that save played 72 h). New saved state: the active run (seed, depth, floor, party, each hunter's Health, blessings taken, the doors or offer on screen, rewards so far); Riftglass on hand; the allowance and its last accrual time; shop purchases (Late hours level, alternate traits unlocked and chosen, cosmetics, Chosen start, Re-roll); the Deep species in the bestiary; the six Delve relics; Ember-echoes found; the rift scene seen; Delve kills per family and guardians beaten (D278); **Act IV's start re-based (D246)**: in a story-less cycle, the act starts on load in the current cycle with fresh counters, and counts recorded for story-less cycles are ignored. **Test on the owner's save:** after migration and load, the save is in Act IV in cycle 19, D4-01 is found with `via` 'arrival', no other Act IV document is found (the save is in Hamlet), and the next Field & Forest win finds D4-02. Add the debug action "Start Act IV" (as "Start Act III", D229). Technical design §5.2 updated in the same commit.

#### B. Combat
- [ ] **T7.6 Group fights** `[?]` *(Q20)*. The fight engine takes a group of monsters (D251): targeting by role (front; lowest Health for Strikers; ties by group order), the same-tick order extended (hunters, party order, group order), same-name passives not stacking, every monster ability acting on the group's member that owns it, success when every monster is down. **Test-first. `rulesVersion` 4 (owner-approved, D251): the §5.5.1 fight, every seeded golden fight and every existing contract and stand fight replay line for line, in Node, WebKit and Chromium; if one changes, stop and ask.** Log lines name group targets ("the second Upyr"). One test per rule.
- [ ] **T7.7 The Deep guardians.** Chill, Drain, Nameless (with its breakdown from the bestiary), Settling (each hit resolved as a direct attack); guardian Health ×2; tier scaling past 5. One test per ability.
- [ ] **T7.8 Blessings in combat.** All 48: the bucket effects through the existing buckets; the ★ rules (the Smith's Mark sub-hit; Forge-Welded; One Thread; Mended Cloth; the Pack Grows; the Wolf's Share; A Price Paid; the Long Vigil; Toll and meter knock-back; Struck Bronze) and the Unlit's four switches. Each blessing has a test; each ★ rule's log line; breakdown lines (the Unlit's negative lines). Benchmarks unchanged in budget.

#### C. Delves
- [ ] **T7.9 The run** `[?]` *(Q21)*. Commands (`delve.start`, `delve.chooseDoor`, `delve.chooseBlessing`, `delve.reroll`, `delve.leave`) and the run's rules in `core/delves/`: access from the first Keep; depth from the Rank at the start (D249); groups by seed (D250); doors (two different patrons, never the same pair twice running, the family ahead); offers and the rarity roll (D255, floor 6's minimum); Health carried, 20% recovery, downing, the end (D253); rewards (Riftglass from the allowance, reagents, Deep kills, echoes, relics, D258–D263); the run saved at every floor; no progress in `advance()` except the allowance; the Last Stand ends a paused run (D267); hunters in a run can't be launched on contracts and vice versa. Test-first: a whole seeded run reproduced from its commands; a paused run resumed after reload equals an unpaused one.
- [ ] **T7.10 Riftglass and the shop.** The allowance in `advance()` (10 a day, continuous, banked to 140, offline included) with its breakdown; earning; the shop (Late hours within the 24 h ceiling, alternate traits and the switch command, cosmetics flags, Chosen start, Re-roll) with breakdowns. Tests: the allowance over a week and two weeks; the ceiling; a trait switch refused while on a contract or in a run.
- [ ] **T7.11 Relics, echoes and the Deep bestiary.** The six Delve relics from either source (the idle sources checked on the same events as other unlocks); their effects only inside Delves (a test that a contract fight and a stand are unchanged with all six owned); echoes on first Faint / Warm / Bright per patron; the Deep species' knowledge from guardian kills, excluded from the true-ending count (gate test).

#### D. Art
- [ ] **T7.12 Art** (the D59 method). Battle sprites (D265): 32 px part templates per family (Beasts & Wilds, Restless Dead, Water Spirits, Field & Forest Spirits, Cursed, Deep) for the 19 monsters, and the 11 hunters from their portrait parts; 2-frame idle, lunge, hit flash, downed pose. **The contact sheet goes to the owner one session before T7.13a** (`questions.md`). Also: 6 patron sigils (16 px), 3 rarity frames, the Riftglass icon, 6 Delve relic icons, the four cosmetics in the hold scene. Manifest entries; `credits.md` regenerated. 👤 Review.

#### E. UI
- [ ] **T7.13a The Rift and the floor.** The Rift card on the Hold screen and its badge; the rift scene; the entry sheet; the floor playback (sprites, Health bars, Skip, Log; reduce-motion respected); the guardian's line; the away-sheet lines.
- [ ] **T7.13b Choices, results and the rest.** The doors, blessing cards (rarity frames, the Unlit's red line), Your blessings with breakdowns, Re-roll, the result sheet with Pechko's line, Leave run; the shop on the Rank screen; the alternate-trait switch on the hunter sheet; the Echoes shelf in the Library; Act IV's scenes and the on-load card; the Last Stand confirmation's line. **Extend the Playwright smoke:** debug to Keep → the rift scene → a full Delve (pick doors and blessings) → the result; and debug "Start Act IV" → D4-01. Screenshot pass at phone size.

#### F. Simulator
- [ ] **T7.14 The Delver** (GDD §6.1, D269, D270). The `delver` policy: Standard plus the Delve sessions (weekends 15:00, Wednesday 19:00), up to 3 runs a session until the allowance is empty, the door and blessing rules, Riftglass on Chosen start and Re-roll then Late hours. `standard` is unchanged. Report: Riftglass per week, floors reached per run, Delve relics found; the "all content" milestones per player.
- [ ] **T7.15 Checks** (D271, D272). In **their own commit**: the `act-4` and `first-guardian` rows and the `idle-only` definition in `sim/targets.ts` (owner-approved); the milestone becomes v0.7. The Delver runs the Monday seeds only. Suite time measured; **if the full suite goes over 5 minutes in CI, stop and ask** (don't trim seeds or rows).
- [ ] **T7.16 Tuning** (tunables only) against every check. Likely levers: `delve.memberHealth`, `delve.memberMight`, `delve.guardianHealth`, `delve.recovery`, `delve.baseTier` (for first-guardian); `riftglass.perFloor` and the allowance's use (reported). The 35 earlier checks judge `standard`, so they should move only through shared rules (Act IV adds no economy). If no reasonable values pass, stop and ask.

### v0.7 acceptance criteria
1. A Delve runs from the Hold screen: 6 floors and a guardian, two patron doors and three blessing offers per floor, played back with battle sprites, saved at every floor, paused when closed, with honest breakdowns.
2. Group fights follow D251; every golden fight, every contract fight and every stand fight replays line for line (`rulesVersion` 4).
3. All 48 blessings work as §8.8 says (tests); the Unlit is locked until Act V and opens with the debug switch.
4. Riftglass accrues, banks and pays as §5.10.8 says; the shop works; Late hours never pass 24 h.
5. The six Delve relics come from either source and work only in Delves; echoes and the Deep bestiary work; the true-ending gate still passes (40 names, one source each; no Delve-only requirement).
6. Act IV runs in its cycle (row-by-row tests); the owner's real v0.6 save migrates, round-trips and starts Act IV on load in cycle 19 with fresh counters.
7. The D20 content test passes; every earlier check passes on `standard`; the new rows pass; the full suite stays ≤ 5 min.

### v0.7 simulator checks

| Check | Target |
|---|---|
| Act IV lands in its cycle | D4-01 to D4-06 and D4-08 by the end of cycle 4; D4-07 with the next warden (Standard) |
| First guardian beaten | By the end of cycle 2 (Delver) |
| Idle-only vs Delver | Standard reaches the last of "all content" (Acts I–IV judged documents; book 36/36; six Ribbonshade names; every skill ≥ 4) ≤ 1.3× later than the Delver |
| D20 content test | Every Delve reward has an idle source or is marked sidegrade / convenience / Delve-only (not a simulator check) |
| All earlier checks | Pass, on `standard` |
| Suite time | ≤ 5 min in CI |

Standard, Monday start, 5 seeds (median), as in §0.3; the Delver on the Monday seeds only (D272). Reported, not judged: Riftglass per week, floors reached per run, Delve relics found.

### v0.7 owner playtest checklist 👤 (on the preview build)
- [ ] The rift scene and the Rift card make Delves easy to find and clearly optional.
- [ ] A run takes about 5 minutes and you understand every fight (watch one, skip one, read one log).
- [ ] Doors and blessings feel like choices: at least one run where you built around a patron.
- [ ] Group fights read well: you can tell who hit whom.
- [ ] The allowance makes sense ("The rift is quiet tonight" when it's empty) and the shop has something you want.
- [ ] (Debug switch) The Unlit's cards show their drawbacks clearly.
- [ ] Your save meets Act IV on load: D4-01 plays; the margins and Pechko's scenes read well, one wrongness each (D4-06 and D4-07 deliberately say more).
- [ ] Battle sprites, sigils and the new art: keep, regenerate or placeholder.
- [ ] Screenshot pass.

**Out of scope:** Act V and the Unlit's door in normal play (Act V is written at the v0.8 flesh-out, D247); hunter XP, trophies or loot from Delves (v0.8, D278); relic slots; the Deep family in the Last Stand; items, ranks, stars, talents and use-skills (v0.8); trust rewards and Orders (v0.10).

---

## (2) Replace the `### v0.8 — Hunter depth` section with:

### v0.8 — Hunter depth

**Status:** not started *(outline; directions decided at the v0.7 flesh-out, D273–D278; needs its own flesh-out after the owner has played Delves)*

- **Scope:** items replacing in-place gear (the Smithy crafts today's pieces as Common items; loot adds Fine to Legendary; the Wright's Blade crafted only; items reset at the Long Night, D273); hunter ranks **Apprentice → Wright → Master-Wright** and stars, kept forever (D274); yard XP for the reserve (D275); one personal use-skill per hunter and passive talent trees (D276); Legendary items as "relics for hunters"; the slot picker and the Stores list with Salvage (D277); whether Delves give trophies or loot (D278); **Act V written at its flesh-out** (D247), with the Unlit's door opening after Act V's stand.
- **Task outline (to be expanded at the flesh-out):**
  - T8.1 Act V, The Hearthblade (story; written at the flesh-out).
  - T8.2 Content and keys: item bases, rarities and loot tables; ranks and stars; the 11 use-skills; talents; names.
  - T8.3 Migration v7 → v8 (gear slots become items; ranks, stars, talents, yard XP), with the owner's real v0.7 save.
  - T8.4 Items and the inventory (craft, loot, equip, salvage, reset at the Long Night); Smithing on crafting.
  - T8.5 Ranks and stars (thresholds, family trophies, kept through the Long Night); stat growth.
  - T8.6 Use-skills in the fight engine (deterministic rules; `rulesVersion` bump with the owner's OK; goldens unchanged).
  - T8.7 Talents.
  - T8.8 Yard XP for the reserve.
  - T8.9 Delve rewards for v0.8 systems, if the flesh-out says so (under D20).
  - T8.10 UI: slot picker, Stores, ranks and stars on the hunter sheet, talents, use-skill log lines.
  - T8.11 Art: item icons by rarity.
  - T8.12 Simulator: policy rules for items, ranks, talents; checks; tuning.
- **Open questions for its flesh-out:** rank and star thresholds; loot sources and drop rates; the use-skills; talent contents; the inventory cap and salvage values; how much yard XP; which checks; whether the Smithing skill also affects loot.

---

## (3) Notes under v0.9 and v0.10

- Under **v0.9 — Events**, add: "- **Note (D279):** reserve hunters take part, as planned; v0.8's yard XP (D275) doesn't change that."
- Under **v0.10 — Orders**, keep "**Open question:** when the final act ships (D24.10)" and add: "(still open after the v0.7 flesh-out, D279)."

---

## (4) Small changes elsewhere in the plan

**§0.6, the locked table** — *add a row:*
`| Delves | `delve.partySize`, `delve.floors`, `delve.doors`, `delve.offers`, `delve.unlitDoorsPerRun`, `riftglass.weeklyCap` (D268) |`
*(`riftglass.bankWeeks` stays in the Events row.)*

**§0.7, the size table** — *add rows:* `| v0.6 | 14 | 10–14 |` (if missing) and `| v0.7 | 17 (T7.1–T7.16, T7.13 in two parts) | 13–17 |`

**The plan's header line "Depth:"** — *replace with:* "v0.0–v0.7 are in full detail (v0.7 fleshed out 2026-10-14, D244–D279). v0.8 and later are outlines; each gets a flesh-out session before it starts (§0.4)."

**Judgment calls in the implementation plan** — *add:* "11. **v0.7 is 17 tasks (T7.1–T7.16, T7.13 in two parts) over 13–17 sessions;** Act IV is the first task; the battle-sprite contact sheet goes to the owner one session before the Delve screens."
