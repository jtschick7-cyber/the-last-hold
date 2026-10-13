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

### Q5 — Your real v0.1 save (blocks T2.4) — open
- **Question:** the v1 → v2 save migration needs a fixture of a real old save (CLAUDE.md: never change the save schema without a migration, a fixture of a real old save, and a round-trip test). Can you export the save you played v0.1 with?
- **How:** in the live or preview app, More → Save & Data → copy the save code (or Copy diagnostics) and paste it into a session. It holds only game numbers, no personal data.
- **Options:** (a) you paste the save code; (b) you say "use a generated one", and I build the fixture from a fresh v0.1 game played by the simulator (not a real save, so it breaks the rule, and you would have to approve the exception).
- **Recommendation:** (a). Everything else in v0.2 goes ahead meanwhile; only T2.4 waits.
- **Answer (owner):**

### Q6 — Two small content problems found while writing v0.2 content (blocks nothing yet) — open
- **6a. "Gloam Wolf" is an existing creature.** The name search (GDD §2.3 process rule) found a "Gloam Wolf" in *The Elder Scrolls Online* (shadowy dire wolves from Nocturnal's realm). Nothing else in the content collided.
  - **Options:** (a) **Gaunt Wolf** (the GDD describes them as "grey, gaunt, too quiet"); (b) Fell Wolf; (c) Pale Wolf; (d) keep "Gloam Wolf" and accept the overlap (not recommended: §2.3 forbids it).
  - **Recommendation:** (a). I searched "Gaunt Wolf" against the influences and found nothing. I've used it in the content for now as a Proposed name (D69); the internal id is just `wolf`, so renaming later touches no saves.
- **6b. Toma Kettle's Speed breaks the GDD's own rule.** §8.5 says hunters vary "by up to ±10%" from their role baseline, but Toma's row has Speed 10 on a Vanguard baseline of 8 (+25%), before his Quick trait adds 3 more (so 13 in a fight, faster than the Mender and Striker baselines).
  - **Options:** (a) keep the table as written (Toma is the fast Vanguard, on purpose); (b) change his Speed to 8 or 9 (and keep Quick); (c) drop the "±10%" sentence and let the table rule.
  - **Recommendation:** (b) Speed 8: Quick already makes him fast, and a 13-Speed Vanguard acts nearly twice as often as Halvar (7). The content follows the table as written until you answer; the test names Toma as the one exception.
- **Answer (owner):**

### Q7 — A log line shows the wrong Armor on one hit (blocks nothing; a small fix needs your OK) — open
- **Question:** when a hit takes the Draugr under half Health, its Swell ability raises its Armor by 50% *after* that hit. The fight log shows the Armor *after* the hit, so on that one line it shows the swollen number even though the hit itself met the lower one. The damage is right; only the printed Armor on that single line is off.
- **Why it's a question:** the seeded golden fights recorded for v0.2 (`tests/golden/seeded-fights.test.ts`, locked) include that text for one fight (fight c). Fixing the line changes that fight's recorded text fingerprint (not its result, ticks or Health), and golden fixtures need your approval to change.
- **Options:** (a) fix the display and re-record fight c's fingerprint (recommended: "every visible number is honest"); (b) leave it and note it as a known quirk.
- **Recommendation:** (a). Nothing in play changes; only one printed number.
- **Answer (owner):**
