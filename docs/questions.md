# Open questions for the owner

Claude Code adds a question here when a task is blocked and the owner isn't available (CLAUDE.md, "Working with the owner"). The blocked task is marked `[?]` in the plan.

**Format:**

### Q<n> — <short title> (blocks T<x.y>) — open | answered
- **Question:**
- **Options:** (a) … (b) …
- **Recommendation:**
- **Answer (owner):** (a), 2026-10-12. The download steps are in `art-src/PACKS-NEEDED.md`, together with the art packs.

---

### Q1 — Where the CC0 pixel font comes from (blocks T1.20a) — answered
- **Question:** GDD §9.1 and technical design §10 call for a CC0 pixel font for headings and the resource bar. Claude Code's sessions can't reach Kenney, OpenGameArt or similar sites, and npm has no CC0 pixel font. How should we get one?
- **Options:**
  (a) You download **Kenney Fonts** (kenney.nl/assets/kenney-fonts, CC0) and put the zip in `art-src/fonts/`. I pick one face, add it with a manifest entry, and credit it. It can ride along with the art pack list (T1.30).
  (b) I draw an original pixel font in-repo (digits, A–Z, a few symbols): CC0 by authorship, no download, but plainer.
  (c) Keep the system monospace stand-in until the v1.0 art pass.
- **Recommendation:** (a). Kenney's fonts are made for exactly this and are CC0. I'd fold it into the T1.30 pack list so you download once.
- **Answer (owner):** option (a), 2026-10-13 (D84): provisions read food capacity. One reading of mine, logged as Proposed in D84: capacity is limited by the number of peasants, so a hold with empty farmer slots is not charged for farmers it doesn't have.

### Q2 — Which palette (blocks T1.28) — answered
- **Question:** every piece of art gets recolored to one 32-color palette (GDD §9.12). Which of the three candidates?
- **Where to look:** https://jtschick7-cyber.github.io/the-last-hold/preview/palettes.html shows each palette's 32 colors and a small Hold mock-up in it.
- **Options:** (a) DawnBringer 32: earthy and balanced, a classic for fantasy pixel art. (b) Endesga 32: brighter and more saturated, cooler darks. (c) Zughy 32: warm and muted, with plum-brown darks.
- **Recommendation:** (c) Zughy 32. Its warm, muted darks fit "heroic with dark edges" and the candlelit theme best, and its greens and browns suit fields, timber and stone. (a) is a close second.
- **Answer (owner):** Zughy 32, 2026-10-12 (D58).

### Q3 — Download the art packs and the font (blocks T1.31 and T1.20a) — answered
- **What's needed:** four CC0 zip files from Kenney, uploaded to the repository. The exact list and step-by-step instructions are in `art-src/PACKS-NEEDED.md`.
- **Answer (owner):** uploaded, 2026-10-12 (D58).

### Q4 — The simulated player and the v0.1 pacing targets (blocks T1.36a, T1.37) — answered
- **Where things stand:** the simulator plays the game through its real rules. With today's numbers (5 seeds, both start times; Monday / Saturday):

  | Target | Result |
  |---|---|
  | First Cottage ≤ 1 min (Opening) | 0 min ✓ |
  | First Mine ≤ 5 min (Opening) | 7.7 min ✗ |
  | Mill level 3 in 2–5 h | 5.5 h / 8 h ✗ |
  | 10 peasants in 3–6 h | 3.0 h / 4.0 h ✓ |
  | Keep 8–14 h (Standard) | 24 h / 24 h ✗ |
  | Keep ≤ 24 h (Light) | 38 h / 27.5 h ✗ |
  | Keep ≥ 6 h (Heavy) | 14 h / 14 h ✓ |
  | Something to do, no dry spells, no walls, no overflow | all ✓ |

- **Why the Keep takes 24 h:** silver. Seams need iron, so they can't start before the 12:30 check-in; two Seams then dig 255 of the 300 silver by 21:00, so the Keep waits for the next morning. Food is the next gap behind it.
- **The simulated player:** pure "best payback" (the ● hint's rule) can't reach the Keep. Every job is worth the same per worker under the locked weights, so it never builds a Mine early and gets stuck at 9 peasants. I gave it a few rules a sensible player follows (D60, Proposed): save for the first Mine, build Seams early, build what the Keep needs, work on whatever the Keep is shortest of, and turn auto-settle off while saving. Please review D60.

**Q4a — What does "from a fresh start under the Standard policy" mean?**
- (a) The Opening run: 15 minutes of active play, then Standard. GDD §6.1 says the Opening "then switches to Standard", and the Mill-level-3 target (by 5 h) can only be met if the first Mine comes in those opening minutes. On that run, Mill 3 is at 3 h ✓.
- (b) Standard alone: the first check-in buys a Cottage, then nothing until 10:00. Mill 3 can't come before 5.5 h, whatever the numbers.
- **Recommendation:** (a).

**Q4b — Which start times are judged?** GDD §6.1 starts runs on Monday at 07:00, plus a Saturday 09:00 run "to catch weekend-start problems".
- (a) Time targets on the Monday start; the Saturday start for the engagement checks (dry spells, walls) and reported for the times. Its first gap is 4 hours, so some early targets can't be met on it.
- (b) Judge everything on both starts.
- **Recommendation:** (a).

**Q4c — How to close the gaps (tunable values only; the targets stay):**
- (a) Starting wood 50 → 75 (the GDD names 70; 70 gives 5.2 min, 75 gives 4.5 min) and the Keep's silver cost 300 → 250. Tried: the Monday Standard Keep lands at exactly 14 h. Then I look at Light and the rest in the tuning pass, and come back if something needs a bigger change.
- (b) Raise silver per Seam worker from 0.25 to 0.3 a minute instead of lowering the Keep's cost. This raises the 720-silver-a-day ceiling on Seams that G1 set for v0.2's bounties.
- (c) Stop and rethink the targets or the economy in a planning chat.
- **Recommendation:** (a). It touches only the start and the Keep's price, and keeps G1's silver ceiling.
- **Answer (owner):** (a), (a), (a), and D60 approved, 2026-10-12 (D62).

### Q5 — Your real v0.1 save (blocks T2.4) — answered
- **Question:** the v1 → v2 save migration needs a fixture of a real old save (CLAUDE.md: never change the save schema without a migration, a fixture of a real old save, and a round-trip test). Can you export the save you played v0.1 with?
- **How:** in the live or preview app, More → Save & Data → copy the save code (or Copy diagnostics) and paste it into a session. It holds only game numbers, no personal data.
- **Options:** (a) you paste the save code; (b) you say "use a generated one", and I build the fixture from a fresh v0.1 game played by the simulator (not a real save, so it breaks the rule, and you would have to approve the exception).
- **Recommendation:** (a). Everything else in v0.2 goes ahead meanwhile; only T2.4 waits.
- **Answer (owner):** the owner pasted a save code (a Keep-rank game, 29 peasants), 2026-10-13. It is now the fixture `tests/saves/fixtures/v1-owner.json`.

### Q6 — Two small content problems found while writing v0.2 content (blocks nothing yet) — answered
- **6a. "Gloam Wolf" is an existing creature.** The name search (GDD §2.3 process rule) found a "Gloam Wolf" in *The Elder Scrolls Online* (shadowy dire wolves from Nocturnal's realm). Nothing else in the content collided.
  - **Options:** (a) **Gaunt Wolf** (the GDD describes them as "grey, gaunt, too quiet"); (b) Fell Wolf; (c) Pale Wolf; (d) keep "Gloam Wolf" and accept the overlap (not recommended: §2.3 forbids it).
  - **Recommendation:** (a). I searched "Gaunt Wolf" against the influences and found nothing. I've used it in the content for now as a Proposed name (D69); the internal id is just `wolf`, so renaming later touches no saves.
- **6b. Toma Kettle's Speed breaks the GDD's own rule.** §8.5 says hunters vary "by up to ±10%" from their role baseline, but Toma's row has Speed 10 on a Vanguard baseline of 8 (+25%), before his Quick trait adds 3 more (so 13 in a fight, faster than the Mender and Striker baselines).
  - **Options:** (a) keep the table as written (Toma is the fast Vanguard, on purpose); (b) change his Speed to 8 or 9 (and keep Quick); (c) drop the "±10%" sentence and let the table rule.
  - **Recommendation:** (b) Speed 8: Quick already makes him fast, and a 13-Speed Vanguard acts nearly twice as often as Halvar (7). The content follows the table as written until you answer; the test names Toma as the one exception.
- **Answer (owner):** 6a: **Gaunt Wolf** accepted, 2026-10-13 (D71). 6b: **option (b), Speed 8**, 2026-10-13 (D80); Toma's Speed is now 8 and the test no longer has an exception.

### Q7 — A log line shows the wrong Armor on one hit (blocks nothing; a small fix needs your OK) — answered
- **Question:** when a hit takes the Draugr under half Health, its Swell ability raises its Armor by 50% *after* that hit. The fight log shows the Armor *after* the hit, so on that one line it shows the swollen number even though the hit itself met the lower one. The damage is right; only the printed Armor on that single line is off.
- **Why it's a question:** the seeded golden fights recorded for v0.2 (`tests/golden/seeded-fights.test.ts`, locked) include that text for one fight (fight c). Fixing the line changes that fight's recorded text fingerprint (not its result, ticks or Health), and golden fixtures need your approval to change.
- **Options:** (a) fix the display and re-record fight c's fingerprint (recommended: "every visible number is honest"); (b) leave it and note it as a known quirk.
- **Recommendation:** (a). Nothing in play changes; only one printed number.
- **Answer (owner):** make the fix, approved, 2026-10-13 (D71). Done: the log prints the Armor the hit met, and fight c's fingerprint was re-recorded.

### Q8 — The Suggested-party speed budget can't be met as written (blocks T2.19) — answered
- **What I measured** (Node on a fast desktop CPU, unthrottled; a phone is several times slower, and the GDD's benchmark uses a 4× slowdown as the stand-in):
  - **Live odds panel** (500 fights): about 27 ms. Budget: ≤ 100 ms at 4× slowdown, which is about 25 ms unthrottled. **Right at the line.**
  - **Suggested party:** 3 free hunters about 145 ms; 5 free hunters about 250–450 ms; 8 free hunters about 850–1,200 ms. Budget: ≤ 300 ms at 4×, about 75 ms unthrottled. **Over, by 2× to 15×.**
- **Why:** each fight costs about 50 µs (about 3 µs per action; I profiled it and there's no easy 5× left). The GDD's stage 2 alone reruns 5 finalists at 500 fights = 2,500 fights, about 120 ms, which is more than the whole 75 ms budget before stage 1 even starts.
- **Options:** (a) **Stage 2 compares 3 finalists at 200 fights each, then only the winner gets the full 500-fight odds** (the panel needs that number anyway). Estimated: 3 free hunters about 70 ms and 5 free hunters about 115 ms unthrottled, so about 280 ms and 460 ms at 4×. Fits the budget for small rosters and stays under the 2× fail line for 5. (b) Keep the algorithm and raise the budget to ≤ 1 s at 4× slowdown, which means a slower-feeling button on phones with big rosters. (c) Run Suggest in two steps in the worker: show the stage 1 pick immediately, then upgrade it when stage 2 finishes. Same total work, but it feels instant.
- **Recommendation:** (a) and (c) together. They change `suggest.finalists` (locked, 5 → 3) and add a stage-2 sample count (new, 200). Both are locked-constant territory, so I haven't touched them; Suggest is implemented exactly as the GDD says until you answer.
- **Answer (owner):** yes, make it faster: 3 finalists at 200 fights each, then 500-fight odds for the winner only, 2026-10-13 (D73).

### Q9 — Provisions can't be 20–40% of food income (blocked the "provisions matter" check) — answered
- **What the GDD asks:** from the Keep on, contract provisions (30 food × party size × 2.2 per tier above the first) should take 20–40% of the food income, so food stays a real cost after the settling years (G3, §6.3 #8).
- **What the simulator measures** (Standard player, 5 seeds, both starts): provisions are about **0.2%** of food income (0.5% in the first hours after the Keep, 0.2–0.3% over the first days). Food income is already about a million a day at the Keep and keeps growing (Mills and settled peasants), while provisions top out at about 2,800 food for the biggest contract and the board only gives about 10 contracts a day.
- **Why tuning can't fix it:** to reach 20% provisions would have to be about 100 times bigger. The early game would break: the first contract would cost thousands of food when the hold makes 6 a minute.
- **Options:** (a) **Scale provisions with the hold's food income**, for example the cost is N minutes of the current food rate per hunter (with a floor so the first contract stays about 60 food). This makes food a real cost at every stage, and the 20–40% target becomes reachable by choosing N. It changes the provisions formula, which is design content. (b) **Keep the formula and drop or reword the check**: provisions are a small early gate (the first contracts need food you have to hold back) and nothing more. (c) **Measure it differently**: judge the share only in the first six hours after the Keep, with a lower band, still small. (d) Leave as it is for now and decide at the v0.4 flesh-out, when Citadel and Bastion bring their own costs.
- **Recommendation:** (a), because your reason for the sink ("food stays a real cost after settling") is true only if it grows with income. If you'd rather not touch the formula now, (d) with the check staying "pending Q9" is safe.
- **Answer (owner):** option (a), 2026-10-13 (D81): provisions scale with the hold's food income from the Keep on. Numbers in D82; the check is enforced.

### Q10 — "Firstblade" is already a Skyrim lore name (blocks one early-seed line; nothing else) — answered
- **What I found:** the name search for the v0.2 text found "Firstblade" in *The Elder Scrolls* lore (a UESP "Lore:Firstblade" entry). The GDD §2.5 and setting primer use it as a working name for the order's last champion, and primer §6.7 lets Kozly Hollow notices end with *"…and may the Firstblade's name be kept warm."* ("Emberwrights" and every other new name came up clear.)
- **What I did:** left that one seed line out of the v0.2 notices, so no collision ships. Everything else in the text is in. The villages' other seed (Mirograd's "my boy, who went onward with the order") is in, and Ravenfell never mentions her, as the primer says.
- **Options:** (a) rename her now to something clear (candidates: **the Hearthblade**, **the Last Wright**, **the First Hand**), and put the seed line back with the new name; (b) keep "Firstblade" for now and decide before v0.5 (the primer says lore names get their check before then), with the seed line staying out until you do; (c) keep the name and accept the overlap (§2.3 says not to).
- **Recommendation:** (b): nothing in v0.2 needs her name, and the title belongs to the story you're keeping for v0.5. When you choose, I'll rename it in the docs in one pass.
- **Answer (owner):** option (b), 2026-10-13 (D80): keep the name for now, decide before v0.5; the seed line stays out until then.
- **Final answer (owner):** **the Hearthblade**, 2026-10-14 (D142). Searched against the influences: clear. The Kozly Hollow seed line is back in the notices.

### Q11 — Provisions read the current food income, which a player can lower for free (blocks nothing in v0.2) — answered
- **What happens:** from the Keep, provisions use the hold's food income at the moment of launch. Moving peasants between jobs is free and instant, so a player can take every farmer off, launch at the 30-food minimum, and put them back. That rewards a fiddly chore (pillar 5, §6.4) and makes food a cost only for players who don't do it. The simulated player never does this, so no check sees it.
- **Options:** (a) base the income term on food capacity, what the food jobs would make with every food slot filled (no save change); (b) base it on the highest food income reached this cycle (needs a saved number and a migration); (c) accept it.
- **Recommendation:** (a), at the start of v0.3, then re-check the provisions share.
- **Answer (owner):** option (a), 2026-10-13 (D84): provisions read food capacity. One reading of mine, logged as Proposed in D84: capacity is limited by the number of peasants, so a hold with empty farmer slots is not charged for farmers it doesn't have.

### Q12 — The two new hunters (blocks T3.1, and the parts of T3.2, T3.3 and T3.6 that need them) — answered
- **Question:** the GDD (§8.5) reserves two hunters for v0.3: a **Wolf-friend Striker with Venom damage** and a **Tracker Mender**. Their definitions come from the owner's separate chat session. I have not invented them.
- **What each hunter needs** (the same fields as the eight we have, GDD §8.5):
  - name (I search it against the influences, GDD §2.3, and add it to `tests/content/names.ts`);
  - role, level-1 Health / Might / Armor / Speed (within ±10% of the role baseline);
  - damage type (the Striker is Venom; the Mender's is yours to say);
  - origin (Highland, Lowland or Wanderer) and the two traits (Wolf-friend and Tracker are reserved for them; the second trait of each is open);
  - how they unlock (a condition) and their silver price (G5 prices run 150–1,200);
  - a one-or-two-line sketch and public bio (setting primer style);
  - a portrait look (skin, face, hair, beard, headgear, collar, one mark), which I can draft for your review if you leave it out.
- **Options:** (a) you bring the full definitions from your chat session and I enter them as written; (b) you bring names and a line each, and I **propose** the numbers, unlocks and prices for you to approve one by one; (c) skip the two hunters for v0.3 and ship it with eight (the roster stays at 8, and the Barracks cap of 8 matters less).
- **Recommendation:** (a). It is what the plan expects, and it keeps the design in your hands.
- **What waits:** T3.1 is marked `[?]`. Everything else goes ahead: the Tracker trait's rule (T3.6) and the Wolf-friend trait's rule (T3.9) are built and tested with test hunters, and nothing ships to players until the hunters exist.
- **Answer (owner):** 2026-10-13: option (a). The owner defined the two hunters in a separate chat: **Stanko Sleepless** (Striker, Venom, Lowland; Wolf-friend, Quick; 95/21/3/12; unlocks when the Gaunt Wolf reaches Studied; 450 silver) and **Herdis Strayfinder** (Mender, Frost, Highland; Tracker, Hard to kill; 120/9/4/10; unlocks when the Hunter's Lodge is built; 300 silver). Neither is a story hunter. The Striker was first named "Ivo", which is a Bear School witcher in *The Witcher*; the owner chose Stanko. D101, D102.

### Q13 — "Ironbark Tonic" collides with a Warcraft name (blocks nothing; the content uses a stand-in) — answered
- **What I found:** the name search for the v0.3 consumables found **Ironbark** in *World of Warcraft* (a Restoration druid talent that reduces damage taken, which is what the tonic does) and as a *Hearthstone* druid spell. GDD §2.3 asks us to avoid influence names. Grave Oil, Drowned-Bane Oil, Thornbane Oil, Quickfoot Tincture and Saltburst came up clear.
- **Options:** (a) **Hardwood Tonic** (my stand-in, in the content now; D86); (b) **Stoutbark Tonic** or **Oakhide Tonic**; (c) keep "Ironbark Tonic" and accept the overlap (§2.3 says not to).
- **Recommendation:** (a). It keeps the wood theme and the recipe (thornwood + juniper), and nothing came up under that name.
- **Answer (owner):** 2026-10-13: option (a), **Hardwood Tonic**. The GDD now says Hardwood Tonic (D96).

### Q14 — How preparation works where the GDD is silent (blocks nothing; built as recommended, D92) — answered
- **What I decided for you (all logged in D92, all tested; please look at the three that change play most):**
  1. **Spoil only ever hurts the Mending Draught.** The Kikimora's Spoil ruins an *unused* potion; the Hardwood Tonic and the Quickfoot Tincture are drunk at the start of the fight, so they are already used. That makes Spoil a small "don't bring a Mending Draught to a Kikimora" lesson.
  2. **Saltburst** goes off on the first moment an ability would take effect, cancels it, and the monster's abilities then do nothing for its next 3 actions. It can cancel a Second Soul (the Strzyga stays dead) and the Nix's Riverhorse. Swell (passive) cannot be cancelled.
  3. **Items are spent when the party sets out, win or lose.**
- **Options for 1:** (a) as built; (b) Spoil also ruins a potion that has not *finished* working, so it can cut a tonic short (more bite, more rules); (c) Spoil ruins any one potion the hunter carries, even a start-of-fight one, by making all potions fire on the hunter's first action instead.
- **Recommendation:** (a) for 1, and the others as built.
- **Answer (owner):** 2026-10-13: (a) for Spoil, and Saltburst and spending as built. D92 is now Decided (D97).

### Q15 — A useless item can nudge the displayed odds by a few points (blocks nothing) — answered
- **What happens:** the odds preview seeds its 500 fights from the party **and the preparation** (technical design §7.2), so a preparation that does nothing (a Grave Oil against a Water Spirit) still draws different dice from "no preparation", and the panel can read, say, 61% against "unprepared would be 59%" for an item that changes nothing. It is inside the ±margin, but it looks like the item did something.
- **Options:** (a) keep it as the technical design says; (b) seed the odds preview from the party only, so the prepared and unprepared previews share their dice and an item with no effect shows exactly the same number (needs a one-line change to technical design §7.2; the real fight's seed still includes the preparation, so nothing about the real outcome changes).
- **Recommendation:** (b). It makes "unprepared would be X%" a clean comparison. I have built (a), as written, until you decide.
- **Answer (owner):** 2026-10-13: option (b). The odds preview is seeded from the party only; technical design §7.2 updated (D98).

### Q16 — The first Studied species comes before day 2 (blocks the "first Studied" check; it is marked pending) — answered
- **What I measured** (the simulated Standard player, Monday start, tier-1 contracts from the Hamlet's first Mine): the first species reaches **Studied (3 kills) at about 14.5 hours**. The target (GDD §6.2) is **days 2–3** (24–72 h). It is early because the Hamlet only ever posts two species (Gaunt Wolf and Kikimora), the player sends a party on most contracts, and any win counts.
- **Why I can't fix it by tuning:** the 3-kill threshold (`knowledge.studiedKills`) and the target row are both locked. For information only, I tried the threshold at 4, 5 and 6 on one seed: any of them lands inside days 2–3. I did not keep that change.
- **Options:** (a) change the threshold to 4 kills (one locked number and the GDD's wording; Mastered stays 10); (b) change the target to 12–72 h (a locked target row); (c) only wins from the Keep count as kills (a rules change: Hamlet fights teach nothing, which also makes the Keep's first days more meaningful); (d) leave both and accept that the first Studied species comes on day 1.
- **Recommendation:** (a). It is the smallest change and keeps "Studied is a few wins, Mastered is a lot" intact. (d) is also reasonable if you like a quick first taste of the bestiary.
- **Answer (owner):** 2026-10-13: option (a), Studied at **4 kills** (D99). First Studied now comes at 28 h (Monday median of 5) and 33 h (Saturday); the check is no longer pending.

### Q17 — Ruins don't come often enough for Act II's documents or the Ribbonshade names (blocks the last part of T5.16) — answered
- **What the full simulator suite shows** (Standard player, Monday, 5 seeds, after the tuning below): every check passes except two. **Act II lands in its cycle** fails: D2-03 to D2-06 are the 2nd to 5th ruin contract won after Act II begins, and the median player wins about **one** ruin contract per cycle, so they arrive in cycle 3 (D2-03, D2-04, D2-05) and cycle 4 (D2-06), not cycle 2. **All six Ribbonshade names by the end of cycle 3** fails: the median run never finds all six (one probe had defeated three Ribbonshades by cycle 5).
- **Why tuning can't fix it:** a cycle lasts about 3 days, and the board delivers about 20 contracts in one (a new one every 2 hours; the pace, the cap and the tier unlocks are locked, plan §0.6). A ruin is picked for about 1 contract in 5 from tier 2 up (a village's location tags, D157; there is no tunable for it), so a cycle sees only 3–4 ruins, and four creatures share them (a Ribbonshade is about one in three). Five ruin wins, or six Ribbonshade defeats in three cycles, would need roughly half of all contracts to be ruins. That would change what the board is.
- **Options:**
  - (a) **Loosen the two checks and leave the game alone.** Act II's ruin documents "by the end of cycle 4", the six names "by the end of cycle 6". Needs your approval of new `sim/targets.ts` rows. Honest, but at today's rate the six names would take about 6 cycles or more, and the simulator would have to run that long.
  - (b) **Make ruins much more common** (for example half of all tier 2+ contracts from the Keep). Fixes both, but the board becomes mostly ruins and every earlier check needs re-tuning.
  - (c) **A small, targeted change to ruin contracts:** until all six Ribbonshade names are found, a ruin contract's creature is a Ribbonshade about half the time (the other creatures still appear, and nothing changes once the names are found), **and** the check for D2-03 to D2-06 becomes "by the end of cycle 3", because they count ruin wins across the act. That is a small rules change to contract generation (not combat, so `rulesVersion` stays) plus one changed row in `sim/targets.ts`.
  - (d) **Change the content instead:** lower the ruin-win counts for D2-03 to D2-06 (for example 2nd, 2nd, 3rd, 3rd) and favour Ribbonshades as in (c). Touches the Act II documents you approved.
- **Recommendation:** (c). It keeps the board's feel and the documents' text, finds the Ribbonshade names about two a cycle (all six by the end of cycle 3), and lets Act II's later documents arrive over its cycle and the next, which suits a story told in pieces.
- **What I did meanwhile (tunables only):** `rate.silver` 0.24 → 0.22 and `provisions.incomeMinutes.citadel` 4.1 → 4.4 (D189), which put "contracts own the silver" (one Saturday seed was at 68.8%) and "provisions matter" back inside their bounds, and the first-ruin row joined the fast set. Every other check passes; the full suite takes about 2.3 minutes in parallel (was 4.5–6 minutes).
- **Answer (owner):** 2026-10-14: option (c) (D190). It helped but wasn't enough: the six names came by cycle 4 and D2-06 in cycle 4. See Q18.

### Q18 — Ruin supply: the two checks still miss by one cycle (follow-up to Q17) — answered
- **What happened:** after the Ribbonshade change, the full suite passes except Act II's last ruin document (D2-06, cycle 4, due by 3) and the six names (cycle 4, due by 3). Raising the Ribbonshade share to 70% and 90% gave the same results: the limit is how many ruin contracts the board posts.
- **Options:** (a) move both deadlines one cycle (rows in `sim/targets.ts`); (b) post more ruins (about 1 in 4 instead of 1 in 5), then re-tune; (c) lower two Act II document counts.
- **Recommendation:** (a).
- **Answer (owner):** (a), 2026-10-14 (D191). Both rows now read "by the end of cycle 4"; every check passes.

### Q19 — Two v0.6 simulator checks that tuning can't reach (blocks the end of T6.13) — answered
- **What the full suite shows now** (Standard, Monday, 5 seeds, after the tuning in D237): every earlier check passes, and so do five of the seven new ones (first new brew 5.8 h after the Hut, skills start, skills pace, Act III, Arvid's letter, trust arc). Two do not:
  1. **Recipe book complete by the end of cycle 3: the simulated player reaches 33 of 36 (median).** The missing three are all Noon Poppy's. Noon Poppy is only dropped by the Poludnitsa (a field monster, tiers 2–4); the player wins between 0 and 3 of them in 11 days, and each experiment spends one unit. Grave dust and river pearl (also drops) are short for the same reason. Nothing in `balance.ts` changes how often a Poludnitsa is posted or what it drops.
  2. **Later cycles: cycle 2 is 14% faster than cycle 1, the check wants 15%** (cycle 3 is 32% faster). At `skill.smithingCost` 0.0175 this passes, but then the two ruin rows (Act II's D2-06, and all six Ribbonshade names by cycle 4) fail instead. The suite is touchy: Smithing values from 0.024 to 0.026 pass both ruin rows and miss only later-cycles; 0.015–0.0225 and 0.0275 and above miss the ruin rows or the economy rows. I picked 0.025 (D237).
- **Options for 1:** (a) a second source for Noon Poppy, for example a gift from Kozly Hollow (a field village), a small content change that touches no combat; (b) move the row to the end of cycle 5 (the median plateaus at 33–35 from cycle 3 on, so this may not even pass); (c) lower the row to "at least 30 of 36 by the end of cycle 3"; (d) post Poludnitsas more often (contract generation, needs re-tuning of everything).
- **Recommendation for 1:** (a). It keeps the 36-property promise and the row as written, and gives the experiments a reliable path.
- **Options for 2:** (a) let me try a small change to an Embers value (`embers.perWave`, tunable) to speed up cycle 2, then re-run everything; (b) relax the row to 14%; (c) go back to Smithing 0.0175 and move the two ruin rows one cycle later (as Q18 did).
- **Recommendation for 2:** (a), with (b) as the fallback.
- **What I did meanwhile (tunables only, D237):** `skill.smithingCost` 0.0175 → 0.025, `skill.xp.command.contractPerTier` 1 → 2 (Command was level 3 at the end of cycle 3, the check wants 4–8), `trust.stepContracts` first step 10 → 8 (no village rose in cycle 1; one does now). T6.13 stays open.
- **Answer (owner):** 2026-10-14: as recommended: (1) a second source for Noon Poppy, a village gift; (2) try an Embers value for later-cycles. Built as D239 and D240 (the gift is at Velkvik, not Kozly Hollow, and the Embers values changed nothing; the suite passes with Smithing at 0.021).

### Q20 — Are monsters named in Delves? (blocks T7.6) — answered
- **Question:** contracts often post unknown monsters that the Lodge identifies (§5.6.3). A Delve has no investigation, so how does a floor's group appear?
- **Options:**
  (a) **Always shown by name**, with their resistances visible as for an Identified species. Seeing a species in a Delve doesn't change its bestiary state (Identified, Studied and Mastered come from contracts only, D262).
  (b) Shown by name only if the species is already Identified in the bestiary; otherwise "?" until the fight's playback reveals it.
  (c) Always "?" until the fight; the door shows only the family.
- **Recommendation:** (a). The door already names the family (D256), blessings are chosen against it, and the bestiary stays an idle-path pillar.
- **Answer (owner):** 2026-10-15: (a), as recommended: monsters are always shown by name, with resistances visible as for an Identified species; seeing one in a Delve does not change its bestiary state (D280).

### Q21 — Do Delves give hunter or warden-skill XP? (blocks T7.9) — answered
- **Question:** the flesh-out settled Delve rewards (Riftglass, reagents, echoes, relics, Deep bestiary) and ruled out trophies and folklore kills (D262), but never said whether hunters gain XP from Delve fights, or whether warden skills gain XP from Delves (Command counts contract wins and waves held; Lore counts clues and knowledge).
- **Options:**
  (a) **No XP of either kind in v0.7.** Delves stay off the idle path's pace. v0.8 decides along with trophies and loot (D278).
  (b) Hunter XP at half the contract rate per floor (20 × tier ÷ 2, shared), no skill XP. Delves would help late recruits level, but every earlier check judged on `standard` stays fair only because `standard` never Delves; the Delver would level faster, which the Idle-only row would show.
  (c) Command skill XP per floor cleared (like a wave held), no hunter XP.
- **Recommendation:** (a). It's the D20-safe reading of everything decided, and v0.8 is where XP, ranks and yard XP (D275) are designed together.
- **Answer (owner):** 2026-10-15: (a), as recommended: no hunter XP and no warden-skill XP from Delves in v0.7 (D281). v0.8 decides along with trophies, loot and yard XP.

### Q22 — Review the v0.7 art: battle sprites first (not blocking; one session before T7.13a)
- **What to look at:** the contact sheet on the preview (`/preview/contact-sheet.html`): the 11 hunter and 19 monster battle sprites with all five frames, the six patron sigils, Riftglass, the six Delve relics, the three rarity frames, and the four hold cosmetics on each Rank's scene.
- **Options per sprite:** (a) keep; (b) redraw, with what to change; (c) drop it, so the floor shows the 64 px portrait shrunk to 32 px (D265).
- **Recommendation:** (a) for the hunters and most species, with a close look at the Ribbonshade (its ribbon reads weakly), the Gloam-Moths and the Deep guardians, which are the least like their portraits.
- **Blocks:** nothing in T7.13a's build (it uses whatever is drawn); a rejected sprite is a redraw or the portrait fallback.
