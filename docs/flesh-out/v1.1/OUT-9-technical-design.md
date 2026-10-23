# OUT-9 — Additions to `docs/technical-design.md` (v1.1 "The Hold's Layout", revised after red-team review)

1. In `docs/technical-design.md` §5.2 and §9.4, update the current save schema version from `11` to `12` and add `layout: HoldLayoutState` to `GameState`.  
2. In `docs/technical-design.md` §18, update the settings key (`lasthold:settings`) field list to include `holdView: 'grid' | 'scene'` (S4).  
3. Append the section below as **§19** at the end of `docs/technical-design.md` (immediately after §18 from `v1.0`, before any closing judgment-call list).

---

## 19. The Hold's Layout (v1.1, schema 12, D500–D507; red-team M1–M5, S1, S6, S12, S13)

### 19.1 Save state (`state.layout`, schema 12)

`GameState` gains one persistent block, `layout: HoldLayoutState`:

```ts
export type HoldPieceId =
  | 'hearth-hall'
  | 'mill' | 'sawpit' | 'smithy' | 'bell-tower'
  | 'barracks' | 'trophy-hall' | 'lodge' | 'alchemist'
  | 'cottage-1' | 'cottage-2' | 'cottage-3'
  | 'farm-1' | 'farm-2' | 'farm-3'
  | 'woodcutter-1' | 'woodcutter-2' | 'woodcutter-3'
  | 'mine-1' | 'mine-2' | 'mine-3'
  | 'herb-garden-1' | 'herb-garden-2' | 'herb-garden-3'
  | 'silver-seam-1' | 'silver-seam-2'
  | 'watchtower-1' | 'watchtower-2' | 'watchtower-3'
  | 'wall-1' | 'wall-2' | 'wall-3' | 'wall-4' | 'wall-5' | 'wall-6'
  | 'wall-7' | 'wall-8' | 'wall-9' | 'wall-10' | 'wall-11';

export interface GridCoord {
  x: number; // integer 0..7 (2..4 for 2x2 hearth-hall anchor)
  y: number; // integer 0..7 (2..4 for 2x2 hearth-hall anchor)
}

export interface HoldLayoutState {
  /** Blueprint coordinates for placed pieces. Unplaced pieces are omitted. */
  placed: Partial<Record<HoldPieceId, GridCoord>>;
  /** Whether dormant blueprint pieces show as stone foundation outlines. */
  showGhosts: boolean;
}
```

- **Size (M5):** At most 39 keys in `placed`, each `{x, y}` with single-digit integers. Serialized JSON is ~1,050–1,100 bytes when full (≤ 1.5 KB, enforced by `tests/layout/save-size.test.ts`, D506).  
- **Long Night persistence:** `resetForLongNight` copies `state.layout` unchanged into the new cycle's state (D502). Starting buildings (Farm 1, Woodcutter 1, Young Families Cottages) wake up or auto-place at cycle start (M3).  
- **Zero combat/economy coupling in v1.1 (S11):** A static lint test verifies that no module in `core/systems/economy.ts`, `combat.ts`, `stand.ts`, `contracts.ts` or `advance.ts` imports or references `layout`. `rulesVersion` stays 5.

### 19.2 Layout Catalog & Canonical Auto-arrange (src/core/systems/layout-catalog.ts, S1)

`src/core/systems/layout-catalog.ts` defines piece footprints, `clearingBounds`, and `CANONICAL_LAYOUT: Record<HoldPieceId, GridCoord>`, ensuring defenses unlock cleanly in Citadel (M1):

- **Hearth Hall (2 × 2, M4):** `hearth-hall` at `(3, 3)` (covers `(3,3)`, `(4,3)`, `(3,4)`, `(4,4)`). Top-left anchor is restricted to `2..4 × 2..4` so it is always 100% inside Hamlet clearing (`2..5 × 2..5`) and never stranded by Long Night.  
- **Hamlet inner clearing (2..5 × 2..5, 12 remaining tiles, all Hamlet-unlocked):**  
  - Row 2: `silver-seam-2 (2,2)`, `smithy (3,2)`, `silver-seam-1 (4,2)`, `mine-1 (5,2)`.  
  - Row 3: `mill (2,3)`, [Hearth Hall (3,3), (4,3)], `sawpit (5,3)`.  
  - Row 4: `farm-1 (2,4)`, [Hearth Hall (3,4), (4,4)], `woodcutter-1 (5,4)`.  
  - Row 5: `cottage-1 (2,5)`, `cottage-2 (3,5)`, `farm-2 (4,5)`, `woodcutter-2 (5,5)`.  
- **Keep ring (1..6 × 1..6, 13 Keep-unlocked pieces):**  
  - West flank (`x = 1`): `alchemist (1,2)`, `herb-garden-1 (1,3)`, `herb-garden-2 (1,4)`, `herb-garden-3 (1,5)`.  
  - East flank (`x = 6`): `mine-2 (6,2)`, `mine-3 (6,3)`, `lodge (6,4)`, `barracks (6,5)`.  
  - South wing (`y = 6`): `trophy-hall (1,6)`, `bell-tower (2,6)`, `cottage-3 (3,6)`, `farm-3 (4,6)`, `woodcutter-3 (5,6)`.  
  *(Leaves row 1 free for Citadel defenses; leaving courtyard breather at (6,6)).*  
- **Citadel defense front (open from Citadel, 10 pieces):**  
  - Row 1 curtain wall (`y = 1`, 8 tiles): `wall-1 (0,1)`, `wall-2 (1,1)`, `watchtower-1 (2,1)`, `wall-3 (3,1)`, `wall-4 (4,1)`, `watchtower-2 (5,1)`, `wall-5 (6,1)`, `wall-6 (7,1)`.  
  - Row 2 wings (`y = 2`, 2 tiles): `wall-7 (0,2)`, `wall-8 (7,2)`.  
  *(Every Citadel defense piece sits inside Citadel clearing 0..7 × 1..6; none is locked out or dormant at Citadel!)*  
- **Bastion forward breach line (open from Bastion, y = 0, 4 pieces):**  
  - Row 0 breach defense: `wall-9 (2,0)`, `watchtower-3 (3,0)`, `wall-10 (4,0)`, `wall-11 (5,0)`.

**Migration v11 → v12 (`save/migration-v12.ts`):**  
- Migrated saves set `schemaVersion = 12` and `layout = { placed: structuredClone(CANONICAL_LAYOUT), showGhosts: true }`.  
- Brand new games (M3) initialize `placed` with only `{ 'hearth-hall': { x: 3, y: 3 } }` (no ghosts for undiscovered buildings).  
- **Validation order on load (`validateLayout`, S13):**  
  1. Bounds check: any coordinate outside `0..7 × 0..7` is dropped.  
  2. Hearth Hall anchor validation: must be within `2..4 × 2..4`; if missing or outside `2..4 × 2..4`, it is restored to `(3, 3)`.  
  3. Overlap check in catalog order (Hearth Hall first): any piece whose footprint overlaps an earlier piece's footprint is removed from `placed` (moved to `tray`) with a warning.  
  4. Unknown keys dropped with warnings.

### 19.3 Clearing bounds, piece states, and commands (src/core/systems/layout.ts)

- **Clearing bounds by Rank (`clearingBounds(age)`):**  
  - `hamlet`: `{ minX: 2, maxX: 5, minY: 2, maxY: 5 }` (16 tiles)  
  - `keep`: `{ minX: 1, maxX: 6, minY: 1, maxY: 6 }` (36 tiles)  
  - `citadel`: `{ minX: 0, maxX: 7, minY: 1, maxY: 6 }` (48 tiles)  
  - `bastion`: `{ minX: 0, maxX: 7, minY: 0, maxY: 7 }` (64 tiles)  
- **Mutually exclusive piece states (`getPieceStatus(state, pieceId)`, M2):**  
  - `locked`: not yet unlocked this cycle (`isPieceUnlocked(state, pieceId) === false`). If it has a coordinate in `state.layout.placed`, it renders as a faint stone foundation outline when `showGhosts` is true. It never occupies a tile and cannot be selected.  
  - `active`: unlocked in the current cycle and its saved footprint in `state.layout.placed` lies entirely inside `clearingBounds(state.hold.age)`. Occupies its tile footprint.  
  - `dormant-ring`: unlocked in the current cycle, and has a saved coordinate in `state.layout.placed`, but that coordinate lies outside `clearingBounds(state.hold.age)`. It waits peacefully at its saved coordinate (ghost rendered if On) and does **not** trigger the `[Layout ▸]` badge. Its blueprint is **never overwritten automatically**.  
  - `tray`: unlocked in the current cycle, but has no coordinate in `state.layout.placed` (unplaced, cleared to tray, or overflow). Only pieces in `tray` appear in the Tray UI and count toward the `[Layout (n) ▸]` badge.  
- **Commands (handled in `apply()`):**  
  - `layout.place({ pieceId, x, y })`: requires `isPieceUnlocked(state, pieceId)` and the target footprint to lie inside `clearingBounds(state.hold.age)`.  
    - For 1 × 1 pieces: if `(x, y)` is occupied by another active 1 × 1 piece `otherId`, the two pieces swap places (if `pieceId` came from Tray, `otherId` moves to Tray). If `(x, y)` overlaps `hearth-hall`, the command is refused.  
    - For `hearth-hall` (`x = 2..4, y = 2..4`, M4): any 1 × 1 pieces inside the target 2 × 2 that are not part of the old 2 × 2 are moved into vacated tiles of the old 2 × 2 (or to Tray if needed).  
  - `layout.unplace({ pieceId })`: refused for `hearth-hall`; otherwise deletes `state.layout.placed[pieceId]`.  
  - `layout.autoArrange()`: sets `state.layout.placed` to a fresh copy of `CANONICAL_LAYOUT` (adjusted so any currently unlocked piece whose canonical spot is outside the current Rank's clearing is placed in the first free open tile).  
  - `layout.clear()`: deletes all keys in `state.layout.placed` except `hearth-hall`, clearing dormant blueprints and sending active 1 × 1 pieces to Tray.  
  - `layout.setShowGhosts({ showGhosts })`: sets `state.layout.showGhosts`.  
- **Auto-placement hook (`autoPlaceUnlocked(state)`, M2, S6):**  
  - Blueprint protection: a saved blueprint coordinate is **never overwritten automatically**.  
  - When a piece unlocks: if it already has a coordinate in `state.layout.placed`: if inside clearing and free, it becomes `active`; if in outer ring, it becomes `dormant-ring`; if occupied, it waits in `tray`.  
  - If a piece has no coordinate in `state.layout.placed`: auto-placement assigns the first free tile in clearing order.  
  - Order: defenses prioritize row 1 (`x = 0..7`), then row 2 wings (`(0,2)`, `(7,2)`), then row 0. Other buildings prioritize tiles ordered by Manhattan distance from center `(3.5, 3.5)`, then `y` asc, then `x` asc.  
  - On `hold.rankUp`: `dormant-ring` pieces whose tiles opened wake up to `active`. Any items in `tray` auto-place onto free tiles.  
  - On cycle start after Long Night: starting buildings wake up or auto-place in Hamlet.

### 19.4 External setting (holdView, S4)

`AppSettings` in `src/platform/app-settings.ts` (key `lasthold:settings` / `lasthold-preview:settings`, D486) gains:
- `holdView: 'grid' | 'scene'` (default `'grid'`).  
- `resetAppSettingsTimestamps` (called on Reset everything…) keeps `holdView`, `textSize` and `backupReminder` and clears only export timestamps.

### 19.5 Forward-compatibility with v1.5 — The Breach (S12)

The 8 × 8 coordinate layout format and piece IDs are designed for direct reuse by v1.5. In v1.5, Last Stand records will store an optional layout snapshot without migrating `HoldLayoutState`.
