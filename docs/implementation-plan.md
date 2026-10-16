# The Last Hold — Implementation Plan

**Status:** Revised after the plan review (D34–D36). Awaiting owner approval.
**Reads with:** `CLAUDE.md` (the workflow, definition of done, and owner gates live there, not here), `gdd.md` (what), `technical-design.md` (how), `decisions.md` (why).
**Depth:** v0.0–v0.8 are in full detail (v0.8 fleshed out 2026-10-15, D300–D328). v0.9 and later are outlines; each gets a **flesh-out session** before it starts (§0.4).
**Markers:** **[JC]** = judgment call. **👤** = owner task. **[?]** = task blocked on an owner question (see `docs/questions.md`).

---

## 0. How milestones run

The per-session workflow, definition of done, and owner gates are in **`CLAUDE.md`**. This section covers only what's specific to milestones.

### 0.1 Milestone status

Every milestone heading is followed by a **`Status:`** line: `not started`, `in progress`, or `complete`.
- The **current milestone** is the first one that isn't `complete`.
- Claude Code sets a milestone to `in progress` when it starts the milestone's first task.
- **Only the owner's go-ahead sets `complete`** (§0.3).

### 0.2 Testing approach

- **Test-first** for formulas, rules, and saved data. Tests take their numbers from the GDD.
- **UI** is covered by the Playwright smoke (from v0.1) and the owner's playtest, not by component unit tests.
- **`npm run check`** (90 s or less; technical design §11.2) before every commit. The full simulator suite and the benchmarks run in their own CI jobs (technical design §11.2).

### 0.3 Ending a milestone

1. Every task is ticked (no `[?]` left). Every acceptance criterion is met. **All simulator checks pass on 5 seeds** (`sim.yml`).
2. **The preview build** (technical design §11.3) holds the finished milestone. 👤 **The owner installs it and runs the playtest checklist.**
3. Claude Code opens the pull request using the plain-language template: what changed, what to playtest, known issues, deferred or skipped.
4. 👤 **The owner says the playtest passed.** Only then does Claude Code merge, tag `vX.Y.0`, set `Status: complete`, run `sim:accept`, and add a decisions row (owner gates, CLAUDE.md).

### 0.4 Flesh-out sessions (before v0.4 and every later milestone)

A planning session in chat (not in Claude Code), with the owner, before the milestone starts:
1. Review what playtesting taught.
2. Bring the milestone's GDD section to full detail, with owner approval.
3. Expand this plan's section into tasks, a "Before you start" box, acceptance criteria, and simulator checks.
4. Log the decisions.
5. Sweep the decisions log: every `Proposed` row gets an owner yes/no. No row stays `Proposed` across two milestones. *(Claude lists the open `Proposed` rows for the owner at each flesh-out; the yes/no is the owner's.)*

Claude Code doesn't start an outline-level milestone until its flesh-out is done.

### 0.5 Story pace (P4)

- **Acts I and II** are written in the **v0.5 flesh-out**.
- After that, writing stays **at least one act ahead** of the owner's current cycle. Each later flesh-out checks this.
- **An unwritten act** closes the cycle with *"The story continues in a later version."* When it ships, it unlocks in the current cycle (`lore-secrets.md`, D34).

### 0.6 Balance tuning: locked and tunable constants (A15)

- **Tuning changes only `tunable` constants in `balance.ts`, never formulas.** Commit with `balance:` and include the before-and-after report diff.
- A tunable constant moved by more than 2× gets a "Proposed" decisions row.
- If no reasonable tunable value passes a check, **stop and write it to `docs/questions.md`.** That's a design problem.

**`locked` constants** (design decisions; changed only through a decisions row the owner approves) **[JC]**:

| Area | Locked keys |
|---|---|
| Offline | `offline.baseCap`, `offline.ceiling` |
| Contracts | `contract.recklessBelow`, `injury.deathChance`, `board.interval`, `board.cap`, `contract.partySize`, `contract.hamletPartyMax`, `contract.unlockSuccesses`, `contract.ageTierCap`, `prep.wellPreparedBounty` |
| Economy | `silverSeam.max` |
| Combat | `combat.meterThreshold`, `combat.maxTicks`, `combat.takenCap`, `odds.samples`, `suggest.*` |
| Roster | `roster.hamletCap`, `roster.ageBonus`, `barracks.maxLevel` |
| Knowledge | `knowledge.studiedKills`, `knowledge.masteredKills` |
| Death and Long Night | `death.returnDaysBeforeLongNight`, `longNightArrival.emberCapShare`, `laststand.partyMax` (D107) |
| Simulated player | `value.weights` (they define the simulated player, so tuning them would game the checks) |
| Events | `boss.*`, `riftglass.bankWeeks` |
| Delves | `delve.partySize`, `delve.floors`, `delve.doors`, `delve.offers`, `delve.unlitDoorsPerRun`, `riftglass.weeklyCap` (D268) |
| Skills | `skill.maxLevel` (D217) |
| Hunter depth | `stores.cap`, `star.max`, `keepsake.slots`, `talent.points`, `talent.tierStars`, `rank.wrightLevel`, `rank.masterLevel`, `yard.capRank` (D325) |

Also locked: **`sim/targets.ts`**, the **golden fixtures**, and the **coverage rules**. Everything else in `balance.ts` is tunable.

### 0.7 Size (A16)

**A task must fit in one session; most sessions finish 2–4 tasks.**

| Milestone | Tasks | Estimated sessions **[JC]** |
|---|---|---|
| v0.0 | 8 | 1–2 |
| v0.1 | 38 | 12–16 |
| v0.2 | 26 | 12–16 |
| v0.3 | 12 | 8–12 |
| v0.4 | 16 | 10–14 |
| v0.5 | 17 | 12–16 |
| v0.6 | 14 | 10–14 |
| v0.7 | 17 (T7.1–T7.16, T7.13 in two parts) | 13–17 |
| v0.8 | 19 (T8.1–T8.18, T8.13 in two parts) | 15–19 |

Estimates, not commitments. If a task proves bigger than a session, split it here first.

**Actuals [JC].** Counted from `docs/progress.md` (one entry ≈ one session; flesh-out and planning entries excluded). Entries overcount real sessions, because several early milestones were written up task by task within one day, so read these as upper bounds: v0.0 2, v0.1 17, v0.2 6, v0.3 6, v0.4 15, v0.5 7, v0.6 5 (3 numbered build sessions), v0.7 8 (4 numbered build sessions). Every milestone from v0.2 on came in under its estimate except v0.4 (15 entries against 10–14), and v0.4's entries were mostly one per task. The v0.8 flesh-out sets the estimates for v0.8 and later from these actuals.

### 0.8 Optional extras

G9 (Records screen, CSV/JSON export) was **not taken** (D31). Nothing is scheduled for it.

---

## v0.0 – v0.4 — complete (archived)

Task lists, acceptance criteria, simulator checks and playtest checklists for v0.0 to v0.4 are in [`docs/archive/implementation-plan-v0.0-v0.8.md`](archive/implementation-plan-v0.0-v0.8.md). Each ended `Status: complete`.

---

## v0.5 and later (outline: each needs a flesh-out session first, §0.4)

Order revised by P2 and P3 (D35): **the Long Night comes before alchemy discovery**, and it's split into mechanics and story.

### v0.5 – v0.8 — complete (archived)

Moved to [`docs/archive/implementation-plan-v0.0-v0.8.md`](archive/implementation-plan-v0.0-v0.8.md): v0.5 (Long Night: Act I), v0.6 (alchemy discovery), v0.7 (Delves), v0.8 (hunter depth). Each ended `Status: complete`. Their tasks, acceptance criteria and playtest checklists are there.

### v0.9 — Events

**Status:** not started *(needs a flesh-out)*

- **Scope:** world bosses (banked tokens, 24 h rest) and Legendary Hunts (self-started, with carry-over); reserve hunters take part.
- **Note (D279):** reserve hunters take part, as planned; v0.8's yard XP (D275) doesn't change that.
- **Act VI, The Unlit, is written at this flesh-out** (D303), from the outline in `lore-secrets.md` §31. Decide there whether the Dross-Tide joins the Last Stand's waves, and any closing scenes.
- **Note (D315):** yard XP comes from contracts only; decide at the flesh-out whether event attempts give yard XP or items.

### v0.10 — Orders

**Status:** not started *(needs a flesh-out)*

- **Scope:** the Thanes' Moot, Grey Wives, Bell-Watchers, and Quenchers; reputation and questlines.
- **Open question:** when the final act ships (D24.10) (still open after the v0.7 flesh-out, D279; still open after the v0.8 flesh-out). Act V's D5-08 seeds the Quenchers from Kozly Hollow.

### v1.0 — Polish

**Status:** not started *(needs a flesh-out)*

- **Scope:** an art and UX pass; a full balance pass; achievements (a candidate); endings, if the final act lands here.

---

## Judgment calls in the implementation plan (revised)

1. **One branch per milestone, played on the preview build;** merge and tag only after the owner's go-ahead.
2. **The locked constants list** in §0.6, including the valuation weights.
3. **Sizing:** a task fits one session, and most sessions finish 2–4 tasks. Estimates: v0.1 12–16, v0.2 12–16, v0.3 8–12 sessions.
4. **The pack list** is delivered as `art-src/PACKS-NEEDED.md`, one session ahead.
5. **The seeded golden fights** recorded in T2.9 become locked fixtures.
6. **Only one preview exists at a time:** the most recently pushed milestone branch.
7. **Citadel and Bastion ship in v0.4 with neutral text;** their inscriptions arrive in v0.5.
8. **v0.5 is 17 tasks over 12–16 sessions;** T5.1 may split into mechanics and story content.
9. **Arvid ships in v0.5 but can't arrive until Act III is written;** a debug action tests him.
10. **v0.6 is 14 tasks (T6.1–T6.13, with T6.9 in two parts) over 10–14 sessions;** T6.1 may split into mechanics and story content.
11. **v0.7 is 17 tasks (T7.1–T7.16, T7.13 in two parts) over 13–17 sessions;** Act IV is the first task; the battle-sprite contact sheet goes to the owner one session before the Delve screens.
12. **v0.8 is 19 tasks (T8.1–T8.18, T8.13 in two parts) over 15–19 sessions;** Act V is the first task; the simulator splits into parallel CI jobs with a 5-minute limit per job (D320).
