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
- **Answer (owner):**

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

### Q9 — Provisions can't be 20–40% of food income (blocks the "provisions matter" check; the check is marked pending, not failing) — answered
- **What the GDD asks:** from the Keep on, contract provisions (30 food × party size × 2.2 per tier above the first) should take 20–40% of the food income, so food stays a real cost after the settling years (G3, §6.3 #8).
- **What the simulator measures** (Standard player, 5 seeds, both starts): provisions are about **0.2%** of food income (0.5% in the first hours after the Keep, 0.2–0.3% over the first days). Food income is already about a million a day at the Keep and keeps growing (Mills and settled peasants), while provisions top out at about 2,800 food for the biggest contract and the board only gives about 10 contracts a day.
- **Why tuning can't fix it:** to reach 20% provisions would have to be about 100 times bigger. The early game would break: the first contract would cost thousands of food when the hold makes 6 a minute.
- **Options:** (a) **Scale provisions with the hold's food income**, for example the cost is N minutes of the current food rate per hunter (with a floor so the first contract stays about 60 food). This makes food a real cost at every stage, and the 20–40% target becomes reachable by choosing N. It changes the provisions formula, which is design content. (b) **Keep the formula and drop or reword the check**: provisions are a small early gate (the first contracts need food you have to hold back) and nothing more. (c) **Measure it differently**: judge the share only in the first six hours after the Keep, with a lower band, still small. (d) Leave as it is for now and decide at the v0.4 flesh-out, when Citadel and Bastion bring their own costs.
- **Recommendation:** (a), because your reason for the sink ("food stays a real cost after settling") is true only if it grows with income. If you'd rather not touch the formula now, (d) with the check staying "pending Q9" is safe.
- **Answer (owner):** option (a), 2026-10-13 (D81): provisions scale with the hold's food income from the Keep on.

### Q10 — "Firstblade" is already a Skyrim lore name (blocks one early-seed line; nothing else) — answered
- **What I found:** the name search for the v0.2 text found "Firstblade" in *The Elder Scrolls* lore (a UESP "Lore:Firstblade" entry). The GDD §2.5 and setting primer use it as a working name for the order's last champion, and primer §6.7 lets Kozly Hollow notices end with *"…and may the Firstblade's name be kept warm."* ("Emberwrights" and every other new name came up clear.)
- **What I did:** left that one seed line out of the v0.2 notices, so no collision ships. Everything else in the text is in. The villages' other seed (Mirograd's "my boy, who went onward with the order") is in, and Ravenfell never mentions her, as the primer says.
- **Options:** (a) rename her now to something clear (candidates: **the Hearthblade**, **the Last Wright**, **the First Hand**), and put the seed line back with the new name; (b) keep "Firstblade" for now and decide before v0.5 (the primer says lore names get their check before then), with the seed line staying out until you do; (c) keep the name and accept the overlap (§2.3 says not to).
- **Recommendation:** (b): nothing in v0.2 needs her name, and the title belongs to the story you're keeping for v0.5. When you choose, I'll rename it in the docs in one pass.
- **Answer (owner):** option (b), 2026-10-13 (D80): keep the name for now, decide before v0.5; the seed line stays out until then.
