# The Last Hold — Deliverables Outline (draft 1, for review)

Markers: **[JC]** = judgment call you can override. *(v0.4+)* = outline-level only; fleshed out just before that milestone.

---

## 0. Repo document map

| File | Purpose |
|---|---|
| `CLAUDE.md` | Rules and context Claude Code reads every session |
| `docs/gdd.md` | Game design document |
| `docs/lore-bible.md` | World, central mystery (full truth), document catalog **[JC: split out of the GDD because the full mystery is long and spoiler-heavy]** |
| `docs/technical-design.md` | Stack, architecture, save schema, simulator, art pipeline |
| `docs/implementation-plan.md` | Milestone task lists, acceptance criteria, tests, simulator checks |
| `docs/decisions.md` | Decisions log (seeded now) |
| `docs/credits.md` | CC0 asset sources (created in v0.1) |

---

## 1. Game Design Document — `docs/gdd.md`

1. **Vision & pillars**: the four pillars (layers interlock, numbers visible, knowledge is progression, respect my time) plus "heroic with dark edges".
2. **Setting & naming rules**: originality checklist, approved folklore creatures, naming style (Slavic + Nordic blend).
3. **Core loops**:
   - Check-in (2–3 min): collect, spend, queue contracts.
   - Session (15–30 min): a Delve and some planning.
   - Daily: world-boss attempts.
   - Cycle (3–5 days): Ages, rising threat, Last Stand.
4. **Resource-flow diagram** (Mermaid): Hold ↔ Contracts ↔ Alchemy ↔ Delves ↔ Long Night.
5. **Systems**
   - **Full detail (v0.1–v0.3)**
     1. Hold economy:
        - Food, wood, iron, silver.
        - Peasant assignment.
        - Buildings.
        - Hamlet → Keep Age-up.
        - Cost scaling `base × r^n`.
        - **[JC]** No storage caps in v0.1; the 12 h offline cap is the only check-in pressure.
     2. Offline progress: 12 h cap, cap-extending upgrades, "While you were away" summary.
     3. Hunters: recruitment, roster, roles, stats, traits, damage types.
        - **[JC]** Role names are Vanguard (tank), Mender (healer), and Striker (damage).
        - **[JC]** Damage types are Steel, Silver, Fire, Frost, Rune, and Venom.
     4. Contracts: posting cadence, duration, party size, success model, rewards that feed the Hold.
        - Injuries come with recovery times.
        - Death happens only when you launch below a shown "reckless" threshold, and the game warns you first.
     5. Combat resolution: round-based auto-battle, every roll logged, formulas inspectable.
     6. Bestiary & investigation: clues, identification, knowledge levels that speed up later contracts.
     7. Preparation: oils, potions, and bombs, and their exact effect on the odds.
   - **Outline level**
     8. Alchemy discovery and skills through use *(v0.4)*
     9. Long Night: threat meter, Last Stand, relic payout curve, remaining Ages *(v0.5)*
     10. Delves and patron blessings *(v0.6)*
     11. Ranks, star tiers, talents, loot rarity *(v0.7)*
     12. World bosses and Legendary Hunts *(v0.8)*
     13. Orders: reputation and questlines *(v0.9)*
6. **Pacing targets** (assumes 4–6 workday check-ins plus a few 15–30 min sessions a week) **[JC]**:
   - Keep: end of day 1.
   - Citadel: day 2.
   - Bastion: day 3.
   - Last Stand first available: day 3.
   - Best Last Stand: days 4–5.
7. **Economy & balance formulas**: a master table, plus the targets the simulator enforces.
8. **Starter content**:
   - About 8 buildings.
   - About 8 monsters, folklore-based.
   - About 8 hunters: archetypes plus named hunters.
   - About 12 ingredients.
   - 3 oils, 3 potions, 3 bombs.
   - 4 patrons (outline only).
9. **UI, phone-first**:
   - Bottom tab bar: Hold · Hunters · Contracts · Bestiary · More.
   - A text wireframe for each screen.
   - Desktop gets a two-column layout.
10. **Out of scope**: multiplayer, leaderboards, monetization, gacha, audio.

## 2. Lore Bible — `docs/lore-bible.md`

1. **World**:
   - The frontier (working name: *the Gloamreach*).
   - The hold (*Stanholm*).
   - The villages.
   - The three layers of darkness: monsters, cursed ruins, and the thing beneath.
2. **The Emberwrights**: an order of forge-smiths who fight with fire and silvered, runed steel, sworn to protect common folk. They are the smithy's in-world reason to exist.
3. **Central mystery: the full truth (spoilers)**, mapped to cycles, with a different point of view each cycle.
4. **Residents** and how each reacts after each Long Night.
5. **Document catalog**: every letter and book, where it drops, and which cycle unlocks it.
6. **Originality checklist and folklore creature list.**

**Premise pitch, for direction check only:**

The Emberwrights built the *Hearthseal*, a forge-ward under Stanholm, over something older (*the Unlit*). Every account says their beloved Firstblade broke the seal, and the hold fell.

Each cycle brings documents from a new witness: a village headwoman, a forge apprentice, a hunter, the Forge-Mother, the Firstblade herself, and finally the Unlit. Together they reveal a darker truth:
- The seal was fed by a tithe the order kept secret.
- The Firstblade broke faith to stop it.
- The Forge-Mother let the hold fall to bury the secret.
- The wardens' cycle is the seal's last working part: each fallen warden's memory is tempered into the next. That is the in-world reason prestige exists.

**[JC]** The final act lets you choose how to end or remake the cycle. Its timing (v1.0 or post-1.0) is open. All names are working names, to be checked for collisions with existing games.

## 3. Technical Design — `docs/technical-design.md`

1. **Stack & rationale**: TypeScript (strict), Vite, Vitest, Preact, and a Vite PWA plugin; nothing else at runtime.
2. **Folder structure**:
   - `src/core`: pure TypeScript, no UI or browser code.
   - `src/content`: data files.
   - `src/ui`.
   - `src/platform`: storage, clock, PWA.
   - `sim/`, `tests/`, `public/assets/`, `docs/`.
3. **Content files**:
   - **[JC]** Typed TypeScript data modules rather than JSON. They are type-checked for free and need no validation library.
   - IDs are stable strings.
4. **State & save schema**:
   - Versioned save file, with a list of migrations each covered by a test.
   - Browser storage with a backup slot.
   - Export code: compressed with the browser's built-in compression, then base64.
   - Downloadable `.json` save file.
5. **Game loop**:
   - Fixed 1-second logical tick.
   - The UI redraws separately.
   - Handles tabs being hidden or reopened.
6. **Offline progress math**:
   - Closed-form where possible, otherwise coarse chunks.
   - Capped at 12 h.
   - A clock set backward is ignored.
7. **Number formatting**:
   - Standard JS numbers, up to about 1e308.
   - Suffixes K/M/B/T, then scientific notation.
   - **[JC]** Switch to a big-number library only if the simulator shows overflow.
8. **RNG**:
   - A seeded generator with a separate stream per system.
   - Core code never calls `Math.random` or `Date.now` directly.
9. **Balance simulator**:
   - Runs from the command line (Node), with scripted player strategies.
   - Accepts a time skip.
   - Reports time to each Age.
   - Fails the build when pacing targets are missed.
10. **Art pipeline**:
    - Asset manifest, with placeholders as the fallback.
    - CC0 packs for tiles, items, and UI.
    - Code-generated layered sprites for hunters and monsters (body, armor, and weapon layers, with palette swaps).
    - Every CC0 source recorded in `credits.md`.
    - **Honest note:** Claude Code is weak at pixel art beyond simple tiles and icons. Generated hunters and monsters will be consistent but plain, and they can be swapped through the manifest later.
11. **Testing**:
    - Unit tests for the core.
    - Fixed-seed snapshot tests for combat logs.
    - Round-trip tests for saves and migrations.
    - Simulator checks.
    - **[JC]** One browser smoke test, starting in v0.2.
12. **Deploy**:
    - GitHub Actions: tests, then build, then Pages.
    - PWA manifest and service worker.
13. **Debug panel**: time skip, add resources, choose the RNG seed, reset the save. It appears only in dev builds or behind a `?debug` URL flag.

## 4. Implementation Plan — `docs/implementation-plan.md`

1. **How a milestone runs**:
   - One branch per milestone.
   - Read `docs/` first.
   - Work through the task checklist.
   - Meet the acceptance criteria.
   - Pass the simulator checks.
   - Update the decisions log.
   - Tag a release.
2. **v0.0: Bootstrap** **[JC: a new milestone before v0.1]**. Done when a "hello hold" page deploys to Pages and installs as a PWA. It includes:
   - Project scaffold.
   - Lint and formatting.
   - Tests running in CI.
   - Deploy to Pages.
   - Empty PWA shell.
3. **v0.1 The Hold, v0.2 Hunters & Contracts, v0.3 Bestiary & Preparation**, in full detail. Each one gets:
   - Scope.
   - Task list.
   - Acceptance criteria.
   - Tests.
   - Simulator checks.
   - Explicitly out of scope.
4. **v0.4–v1.0**: scope, dependencies, and open questions only.

## 5. `CLAUDE.md`

1. Project context in one paragraph, and the reading order for `docs/`.
2. Rules:
   - Stay inside the current milestone's scope.
   - Content goes in data files, not code.
   - Never change the save schema without a migration and a test.
   - No `Math.random` or `Date.now` in the core.
   - Run the tests and the simulator before committing.
   - Record decisions in the decisions log.
   - Original content only.
   - CC0 assets only, each recorded in `credits.md`.
3. Commands: dev, test, sim, build.
4. Definition of done for a task.

---

## Judgment calls in this outline (override any)

1. Lore gets its own file.
2. Role and damage-type names.
3. No storage caps in v0.1.
4. Pacing targets.
5. Typed TypeScript content files instead of JSON.
6. Standard JS numbers.
7. A browser smoke test starting in v0.2.
8. A v0.0 bootstrap milestone.
9. Premise direction and working names.
10. Timing of the final act.
