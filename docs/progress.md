# Progress log

Newest entry at the bottom. One entry per Claude Code session (CLAUDE.md, "Session end").

## Current state (update every session)

- **Branch:** `milestone/v1.7` (branched from `main` at `7b06a92`, post-`v1.6.0`).
- **Milestone:** v1.7 "Steel & Hearth" (`D604`–`D613`), **in progress**.
- **Last task:** `VB.1` — Docs commit, preconditions, branch, GDD §2.3 name check (*Steel & Hearth*), and v1.5/v1.6 plan & progress archive housekeeping.
- **Next:** `VB.2` — Sprite Batch 1 (10 hunters: Arvid, Bjarna, Gest Tall-Torch, Halvar, Ostap, Radek, Ragnhild Eye-Taker, Sigrun, Stanko, Zora) with Contact Sheet 1 for owner review.
- **Open questions:** None.

Earlier entries are in [`docs/archive/progress-2026-10-28-to-31.md`](archive/progress-2026-10-28-to-31.md) (v1.4 TD.11 to v1.6 portraits), [`docs/archive/progress-2026-10-24-to-28.md`](archive/progress-2026-10-24-to-28.md) (v1.3 KV.11 to v1.4 TD.10), [`docs/archive/progress-2026-10-11-to-15.md`](archive/progress-2026-10-11-to-15.md) (to T8.15), [`docs/archive/progress-2026-10-15-to-21.md`](archive/progress-2026-10-15-to-21.md) (T8.16 to T11.15) and [`docs/archive/progress-2026-10-21-to-24.md`](archive/progress-2026-10-21-to-24.md) (v0.11 session 17 to v1.3 KV.10). Read only the last entry at session start.

## 2026-10-31 — v1.6: Atmosphere & Game Feel Polish (Option 1)
- **Hold ground harmony:** Remapped the 4 hold scenes (`scenes/hold-{hamlet,keep,citadel,bastion}.png`) from Kenney's bright lime `#b6d53c` (2,400+ pixels per scene) and bright yellow-orange sand `#eea160` (500+ pixels) to weathered moss green `#397b44`, pine shadow `#3c5956`, forest grass `#71aa34`, and loam path `#bf7958`, harmonizing directly with `HoldGrid` (`ground-grass.png`). Previous scenes backed up to `art-src/previous-v1.6/scenes/`. Pre-authorised update in `tools/contact-sheet-data.ts` (`isV16Asset` includes `scene.hold.*`).
- **Threat sky mood:** Added `.holdSky` container in `HoldScreen.tsx` with dynamic sky backdrop driven by `threatTier(threat)` (calm, warning, elevated, dire). Unit tests in `tests/threat/threat.test.ts` verify all 4 tiers across all thresholds.
- **CSS micro-feedback juice:** Added crisp 180 ms active ember press (`.btnPrimary:active`), candlelight breathe animation on Hold lamps and wall lanterns (`candleBreathe`), and reward tally pop on contract results (`.rewardTally`). All motion strictly gated behind `@media (prefers-reduced-motion: no-preference)` with `:root:not([data-motion='on'])` (verified by `tests/lint/motion.test.ts`).
- **Watch Stand confrontation:** Added facing battle sprites (defenders vs oncoming wave beast) to `WaveLogView` in `LongNightSheets.tsx`.
- **Verification:** `npm run check` passes 100% in ~22 s (typecheck, lint, format, 254 test files / 3,956 tests, sim:check fast set). D601 recorded.

## 2026-10-31 — v1.6: Scene Banners Implementation (4 Orders & 3 Descent Stages)
- **Owner approval:** The owner officially approved the redrawn 5:2 (`160 × 64 px`) scene banners for all 4 Orders (`moot`, `greyWives`, `bellWatchers`, `quenchers`) and all 3 Descent stages (`descent-stage-1`, `descent-stage-2`, `descent-stage-3`).
- **Art committed:** All 7 banners deployed to `public/assets/scenes/orders/` and `public/assets/scenes/`. Total file size across all 7 banners is 9.1 KB. Previous procedural banners backed up to `art-src/previous-v1.6/scenes/orders/` and `art-src/previous-v1.6/scenes/descent/`.
- **Hashes frozen:** All 7 SHA-256 hashes recorded and frozen in `art-src/v1.6-banner-hashes.json`. Descent hashes updated in `art-src/v1.4-hashes.json`. Extended `isV16Asset` in `tools/contact-sheet-data.ts` to include `scene.order.*` and `scene.descent.*`.
- **Tests:** `tests/tools/orders-art.test.ts` and `tests/tools/descent-art.test.ts` verify 160 × 64 dimensions, 100% Zughy-32 palette compliance, non-blank pixel count, and exact SHA-256 hash freezing.
- **Verification:** `npm run check` passes 100% in ~22 s (typecheck, lint, format, 254 test files / 3,963 tests, sim:check fast set). D602 recorded.

## 2026-11-04 — Post-v1.6 housekeeping & Q65 resolution (D603)
- **Milestone v1.6 merged and tagged:** PR #28 merged into `main` (`9743f84`) and tagged `v1.6.0`. Updated the "Current state" header at the top of `docs/progress.md` to reflect `main` clean at `v1.6.0` with v1.6 complete.
- **Q65 resolved (D603, option b):** Increased CI Playwright e2e shards in `.github/workflows/ci.yml` from 5 to 6 (`matrix.shard: [1, 2, 3, 4, 5, 6]`, `--shard=${{ matrix.shard }}/6`), which separates `polish-contrast.spec.ts` (shard 3 of 6, 35 tests) from `polish-motion.spec.ts` and `polish-tap-targets.spec.ts` (shard 4 of 6, 33 tests) and splits `polish-text-size.spec.ts` across shards 4 and 5 (34 tests in shard 5), preventing a single shard from carrying both the contrast and tap-target sweeps.
- **No test edits or limit changes:** Zero test files touched; the 8-minute job ceiling (`timeout-minutes: 8`, D552), 7 min 30 s whole-job warning line, and `npm run check` thresholds (90 s warn, 120 s fail, D512) are unchanged. Closed Q65 in `docs/questions.md`.
- **Verification:** `npm run check` is 100% green (~26 s locally: typecheck, lint, format:check, 254 test files / 3,963 tests, and `sim:check --fast`).
- **Next:** Milestone v1.7 flesh-out session (`docs/implementation-plan.md` §0.4).

## 2026-11-04 — v1.7 VB.1: docs commit (Steel & Hearth flesh-out applied)
- **Preconditions & branch:** `v1.6.0` (`9743f84`) merged and tagged on `main`; `sim/baseline.json` at v1.5 / `rulesVersion` 6 (63 rows, 192 moments); zero open questions; sweep of `decisions.md` from D519 up found zero unratified `Proposed` rows (`D596` ratified by `D597`). Created `milestone/v1.7` from `main` (`7b06a92`).
- **Owner gate & name check (D610, D613):** Owner approved `D604`–`D613` (`Decided`, no old row edited) and pushing `milestone/v1.7`. Web search against GDD §2.3 flagged draft plan subtitle *"Blades & Hearthfire"* against Skyrim's *Hearthfire* DLC and *Blades* faction; owner selected ***Steel & Hearth*** (clear in all influences). Plain UI words (`Ambience`, `Watch fight`, `MISS`) and `Steel & Hearth` dated in `tests/content/names.ts`.
- **Docs applied:** Added `docs/flesh-out/v1.7/v1.7-summary.md`, `D604`–`D613` in `docs/decisions.md`, GDD §6.5 (45 KB sound cap, Arena step row, v1.5/v1.6 sizes), §9.4 (`Watch fight ▸`), §9.12 (v1.6/v1.7 art, closes D490), §9.15 (Arena callouts/glows & wave-log facing), §9.22 (10 sounds / 19 moments + procedural `Ambience`), technical design §24, and `implementation-plan.md` (`VB.1`–`VB.11`, v1.5 `complete`, v1.6 completed block, §0.7 sizing).
- **`CLAUDE.md` lines updated:** Replaced `"- Sound is UI-only: nothing in \`src/core/\` imports or reads the sound module or the \`sound\` setting."` and `"- Write no player-facing strings for sound beyond the table in GDD §9.22; if a screen needs one, ask."` to cover both `sound` and `ambience`, GDD §9.4/§9.15 strings, and Remembering/Descent silence (D609, D610).
- **Archive & verification:** Moved older progress entries (`v1.4 TD.11` to `v1.6 portraits`) to `docs/archive/progress-2026-10-28-to-31.md` (reducing `progress.md` from 44 KB to ~6 KB). `npm run check` green (~22 s).
- **Next:** `VB.2` — Sprite Batch 1 (10 hunters, incl. Gest & Ragnhild) and Contact Sheet 1.
