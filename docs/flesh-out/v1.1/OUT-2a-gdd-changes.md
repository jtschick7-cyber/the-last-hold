# OUT-2a — Exact changes to `docs/gdd.md` (v1.1 "The Hold's Layout", revised after the red-team review)

Every edit below is an exact `Find` and `Replace` on `docs/gdd.md`. Each `Find` block occurs exactly once in `docs/gdd.md`. If any `Find` block does not match once, stop and tell the owner before editing.

---

## E0 — Header status line

**Find:**
```markdown
**Status (v1.0 flesh-out 2026-10-21):** Approved through §10 (D26–D29). Revised after the GDD review (D30–D31); edits to approved sections are marked ⚑.
```

**Replace with:**
```markdown
**Status (v1.1 flesh-out 2026-10-22):** Approved through §10 (D26–D29). Revised after the GDD review (D30–D31); edits to approved sections are marked ⚑. v1.1 adds the Hold layout grid (§5.1.5, §9.21), the post-v1.0 roadmap (D498–D508), and accessibility/settings updates (§9.20).
```

## E1 — §3.4 What exists when

**Find:**
```markdown
| v0.11 | The Remembering: the end of the story, from the Hold screen's card after Act VI (§5.15) |
```

**Replace with:**
```markdown
| v0.11 | The Remembering: the end of the story, from the Hold screen's card after Act VI (§5.15) |
| v1.0 | Polish: accessibility, Text size, reduced motion, contrast, tap targets, backup reminder, redrawn art (§9.20) |
| v1.1 | The Hold's Layout: decorative 8 × 8 building placement grid and persistent blueprint (§5.1.5, §9.21) |
```

## E2 — §5.1.5 The Hold's layout (v1.1)

**Find:**
```markdown
**Opening goal** (measured by the **Opening** policy, §6.1): a Cottage within 1 minute and a Mine within 5 minutes. A hand calculation gives about 4.4 minutes for the Mine (after the first Cottage's 30 wood, wood reaches 80 at about 4.4 min). **If the simulator misses, raise starting wood; don't move the target.** *(⚑ v0.1 tuning, D62: 70 wood gave 5.2 min in the simulator, so the start is 75 wood; the simulator measures 4.5 min.)*
```

**Replace with:**
````markdown
**Opening goal** (measured by the **Opening** policy, §6.1): a Cottage within 1 minute and a Mine within 5 minutes. A hand calculation gives about 4.4 minutes for the Mine (after the first Cottage's 30 wood, wood reaches 80 at about 4.4 min). **If the simulator misses, raise starting wood; don't move the target.** *(⚑ v0.1 tuning, D62: 70 wood gave 5.2 min in the simulator, so the start is 75 wood; the simulator measures 4.5 min.)*

#### 5.1.5 The Hold's layout *(v1.1, D500–D504; red-team M1–M4, S6, S7)*

The Hold sits on an **8 × 8 grid** (`x = 0..7` west to east, `y = 0..7` north to south). Along the north edge (above row `0`) lies **the Fell Breach**, where the dark comes down from the fells in the Last Stand. Along the south edge (below row `7`) lies **the Lowland Gate**, where the road comes up from the villages.

- **Decorative in v1.1, ready for v1.5.** In v1.1, where buildings sit on the grid is purely visual: it changes no production rate, cost, Threat rate or fight calculation (`rulesVersion` stays 5). The 8 × 8 coordinate layout format and piece IDs are saved in a fixed schema (`state.layout`, schema 12) so that **v1.5 ("The Breach")** can give wall, watchtower and building positions a tactical role in the Last Stand without migrating `HoldLayoutState` (stand records will store an optional layout snapshot) (D499, D500).
- **Rank clearings (D500, M1).** Ranking up clears more of old Stanholm's ground inside the 8 × 8 grid; tiles outside the current Rank's clearing show dark pine forest and ruined foundation stones and cannot hold active pieces:
  - **Hamlet (`4 × 4`, 16 tiles):** columns `2–5`, rows `2–5`.
  - **Keep (`6 × 6`, 36 tiles):** columns `1–6`, rows `1–6`.
  - **Citadel (`8 × 6`, 48 tiles):** columns `0–7`, rows `1–6` (uncovers the full 8-tile north curtain line along row `1`, facing row `0`).
  - **Bastion (`8 × 8`, 64 tiles):** columns `0–7`, rows `0–7` (opens row `0` right along the Fell Breach and row `7` along the Lowland Gate).
- **Pieces on the grid (D501).** Exactly **39 pieces (42 tiles)** exist at full Bastion, leaving exactly 22 open tiles of courtyard and roads:

| Category | Piece ids | Size | When each piece unlocks | Visual tiers on the grid |
|---|---|---|---|---|
| **Hearth Hall** (1) | `hearth-hall` | **2 × 2** (4 tiles) | Start (always owned; top-left anchor restricted to `x = 2..4, y = 2..4`, default `(3, 3)` covering `(3,3)–(4,4)`) | Always 100% inside the clearing at all Ranks; never stranded by the Long Night (M4). Shows Rank look, Carved Hearth Hall door cosmetic if bought, and post-Remembering window lamp (§5.15.6). Cannot be moved to the tray, only moved within `2..4 × 2..4`. |
| **Unique & level buildings** (8) | `mill`, `sawpit`, `smithy`, `bell-tower`, `barracks`, `trophy-hall`, `lodge`, `alchemist` | **1 × 1** | When built (count or level ≥ 1) | Level buildings show 3 visual tiers by level: Tier I (Lv 1–4; Lv 1 for 3-cap; Lv 1–2 for 5-cap), Tier II (Lv 5–10; Lv 2 for 3-cap; Lv 3–4 for 5-cap), Tier III (Lv 11+; Lv 3 for 3-cap; Lv 5 for 5-cap). Unique Trophy Hall has 1 tier. |
| **Count-building plots** (17) | `cottage-1..3`, `farm-1..3`, `woodcutter-1..3`, `mine-1..3`, `herb-garden-1..3`; `silver-seam-1..2` | **1 × 1** | **Plot 1** at `1` owned, **Plot 2** at `5` owned, **Plot 3** at `15` owned (`silver-seam`: Plot 1 at `1`, Plot 2 at `2`) | Each placed plot shows 3 density tiers from total owned: `1–4` single structure, `5–14` pair, `15+` cluster (`silver-seam`: `1` single seam, `2` twin seams). |
| **Watchtowers** (3) | `watchtower-1..3` | **1 × 1** | Tower 1 at Watchtower Lv `1`, Tower 2 at Lv `8`, Tower 3 at Lv `15` | Towers 1 and 2 sit in row `1` (`(2,1)`, `(5,1)`); Tower 3 sits in row `0` (`(3,0)`). Shows Watchtower bell cosmetic if bought (on border header at Hamlet/Keep, on Tower 1 once built). Counts as a wall neighbour for connections. |
| **Wall segments** (11) | `wall-1..11` | **1 × 1** | `4` segments at Walls Lv `1`, then `+1` segment at Lv `3, 5, 7, 9, 11, 13, 15` (11 in all) | Segments 1–6 sit in row `1` (`y = 1`), segments 7–8 in row `2` wings (`(0,2)`, `(7,2)`), segments 9–11 in row `0` (`(2,0)`, `(4,0)`, `(5,0)`). Auto-connects to adjacent Wall or Watchtower tiles (N/E/S/W). Shows Wall lanterns cosmetic if bought. |

- **Piece states and blueprint protection (D502, M2):**
  - `locked`: Not yet unlocked this cycle. If it has a coordinate in `state.layout.placed`, it renders as a faint stone foundation outline when **Blueprint ghosts** is On. It never occupies a tile and cannot be moved or selected.
  - `active`: Unlocked and placed inside the current clearing. Occupies its tile footprint.
  - `dormant-ring`: Unlocked, but its saved blueprint coordinate is in a locked outer ring. It waits peacefully at its saved coordinate (ghost rendered if On) and does **not** trigger the `[Layout ▸]` badge. Its blueprint is **never overwritten automatically**.
  - `tray`: Unlocked, but has no coordinate in `state.layout.placed` (unplaced, cleared to tray, or overflow). Only pieces in `tray` appear in the Tray UI and count toward the `[Layout (n) ▸]` badge.
- **Auto-placement rules (D502, M2, S6):**
  1. A saved blueprint coordinate in `state.layout.placed` is **never overwritten automatically**.
  2. When a piece unlocks, if it already has a saved coordinate in `state.layout.placed`: if that tile is inside the current clearing and free, it becomes `active`; if the coordinate is in a locked outer ring, it becomes `dormant-ring`; if the tile is inside the clearing but occupied by another active piece, it waits in `tray`.
  3. Only if a newly unlocked piece has **no coordinate** in `state.layout.placed` does auto-placement assign it the first free tile in the current clearing (saving that coordinate). If the clearing is full, it waits in `tray`.
  4. Auto-placement ordering (S6): defenses (`wall-*`, `watchtower-*`) prioritize row `1` west to east, then row `2` wings, then row `0`. Other buildings prioritize tiles ordered by Manhattan distance from the center `(3.5, 3.5)`, then `y` ascending, then `x` ascending.
  5. On `hold.rankUp`, any `dormant-ring` piece whose tile opened becomes `active`. Any pieces in `tray` auto-place onto newly opened free tiles.
  6. On new game creation (M3), `placed` initializes with only `hearth-hall: { x: 3, y: 3 }` (no ghosts for unbuilt buildings). At the start of a new cycle after the Long Night, starting buildings wake up or auto-place in Hamlet.
- **Canonical Auto-arrange layout (D503, M1):**
  - `hearth-hall` at `(3, 3)–(4, 4)`.
  - Hamlet inner ring (`2..5 × 2..5`): `silver-seam-2 (2,2)`, `smithy (3,2)`, `silver-seam-1 (4,2)`, `mine-1 (5,2)`, `mill (2,3)`, `sawpit (5,3)`, `farm-1 (2,4)`, `woodcutter-1 (5,4)`, `cottage-1 (2,5)`, `cottage-2 (3,5)`, `farm-2 (4,5)`, `woodcutter-2 (5,5)`.
  - Keep ring (`1..6 × 1..6`): `alchemist (1,2)`, `herb-garden-1 (1,3)`, `herb-garden-2 (1,4)`, `herb-garden-3 (1,5)`, `mine-2 (6,2)`, `mine-3 (6,3)`, `lodge (6,4)`, `barracks (6,5)`, `trophy-hall (1,6)`, `bell-tower (2,6)`, `cottage-3 (3,6)`, `farm-3 (4,6)`, `woodcutter-3 (5,6)`.
  - Citadel defense front (`y = 1` and `y = 2`): `wall-1 (0,1)`, `wall-2 (1,1)`, `watchtower-1 (2,1)`, `wall-3 (3,1)`, `wall-4 (4,1)`, `watchtower-2 (5,1)`, `wall-5 (6,1)`, `wall-6 (7,1)`, `wall-7 (0,2)`, `wall-8 (7,2)`.
  - Bastion forward breach defenses (`y = 0`): `wall-9 (2,0)`, `watchtower-3 (3,0)`, `wall-10 (4,0)`, `wall-11 (5,0)`.
````

## E3 — §5.9.7 The Long Night: what resets and what's kept

**Find:**
```markdown
| | Orders: standing, which Orders have opened, the third seat, chapters read and the seats they were read with (v0.10) |
```

**Replace with:**
```markdown
| | Orders: standing, which Orders have opened, the third seat, chapters read and the seats they were read with (v0.10) |
| | The Hold's layout blueprint: placed coordinates for every building, plot and defense piece, and the blueprint-ghost setting (v1.1, §5.1.5) |
```

## E4 — §6.5 Performance budgets

**Find:**
```markdown
| **Live odds panel** | ≤ 100 ms per update | 500 samples, in the same worker |
```

**Replace with:**
```markdown
| **Live odds panel (identified monster)** | ≤ 120 ms per update | 500 samples in the odds worker (warn > 120 ms, fail at 240 ms; D505, M6) |
| **Live odds panel (unidentified monster, 3 candidates)** *(v1.1, D505)* | ≤ 150 ms per update | 500 samples per candidate in the odds worker (warn > 150 ms, fail at 300 ms; D505, M6) |
```

**And find:**
```markdown
| **Remembering save growth** *(v0.11, D469)* | ≤ 0.5 KB | The whole `remembering` block, everything recorded (checked by a unit test, not the throttled benchmark) |
```

**Replace with:**
```markdown
| **Remembering save growth** *(v0.11, D469)* | ≤ 0.5 KB | The whole `remembering` block, everything recorded (checked by a unit test, not the throttled benchmark) |
| **Hold grid render** *(v1.1, D506)* | ≤ 16 ms (one frame) | The Hold screen's 8 × 8 grid header, from the view built in `core` (memoized) |
| **Arrange Hold sheet open** *(v1.1, D506)* | ≤ 50 ms | Opening the 8 × 8 placement sheet with its tray |
| **v11 → v12 migration** *(v1.1, D506)* | ≤ 100 ms | A played v11 save, on the load path (the throttled benchmark) |
| **Hold layout save growth** *(v1.1, D506, M5)* | ≤ 1.5 KB | The whole `layout` block with all 39 pieces placed (checked by a unit test, not the throttled benchmark; measured ~1.1 KB) |
```

## E5 — §9.2 Hold (v0.1)

**Find:**
```markdown
- **Events card** (from the first Citadel, D366): sits under the Rift card; see §9.17.
```

**Replace with:**
```markdown
- **Events card** (from the first Citadel, D366): sits under the Rift card; see §9.17.
- **Hold grid header** (v1.1, D503): replaces the static Hold scene by default (Settings switches between **Grid** and **Classic scene**), with a **Layout ▸** button that opens the Arrange Hold sheet (§9.21).
```

## E6 — §9.10 More menu

**Find:**
```markdown
| Settings *(v1.0, D480, D481)* | + Text size (Match phone, Large, Largest); Backup reminder (On, Off). These two live in a settings key outside the save (§9.20) | v1.0 |
```

**Replace with:**
```markdown
| Settings *(v1.0, D480, D481; v1.1, D503)* | + Text size (Match phone, Large, Largest); Backup reminder (On, Off); Hold view (Grid, Classic scene, v1.1). These live in a settings key outside the save (§9.20, §9.21) | v1.0 / v1.1 |
```

## E7 — §9.11 What exists when

**Find:**
```markdown
| v1.0 | Polish: no new game screen. The Archive tabs fit (two rows when needed); Text size and Backup reminder in Settings; the backup line on the away sheet; reduced motion, contrast and tap-size fixes everywhere; redrawn art and the app icon (§9.12, §9.20) |
```

**Replace with:**
```markdown
| v1.0 | Polish: no new game screen. The Archive tabs fit (two rows when needed); Text size and Backup reminder in Settings; the backup line on the away sheet; reduced motion, contrast and tap-size fixes everywhere; redrawn art and the app icon (§9.12, §9.20) |
| v1.1 | The Hold's Layout: the live 8 × 8 grid header on the Hold screen, the Arrange Hold sheet (44 px tile buttons, tray, Auto-arrange, Clear, Blueprint ghosts toggle), and the Hold view setting (Grid / Classic scene) (§5.1.5, §9.12, §9.20, §9.21) |
```

## E8 — §9.12 Art direction

**Find:**
```markdown
**Honest note:** the generated monsters (especially the poludnitsa, vodyanoy, huldra and nix) will be the weakest art in the game. CC0 packs almost never include folklore creatures like these. The asset manifest lets you swap in better art later without touching code.
```

**Replace with:**
```markdown
- **v1.1 (D504):** 32 px grid tiles and sprites (and 64 px for the 2 × 2 Hearth Hall), code-generated in the 32-colour palette and registered in the manifest: clearing ground tiles, locked forest and ruined-wall border tiles, the Fell Breach (north) and Lowland Gate (south) border strips, connected Wall segments (straight, corner, T, cross, end), Watchtower, 3 visual level tiers for level buildings, 3 visual density tiers for count-building plots, dormant blueprint foundation ghosts, and grid versions of the four Riftglass cosmetics and the Act VI frost / post-Remembering lamp. A numbered contact sheet goes to the owner first; any redraws ship in batches of at most 12 after the owner approves before/after sheets (the v1.0 rule, D475).

**Honest note:** the generated monsters (especially the poludnitsa, vodyanoy, huldra and nix) will be the weakest art in the game. CC0 packs almost never include folklore creatures like these. The asset manifest lets you swap in better art later without touching code.
```

## E9 — §9.20 Settings key and screen list updates (v1.1, S4)

**Find:**
```markdown
v1.0 adds one **settings key outside the save**, namespaced by channel, holding only: `textSize`, `backupReminder`, `lastExportAt`, `snoozeUntil`, `firstSeenAt` (set once, on the first run of v1.0). **Reset everything…** clears the three timestamps and keeps `textSize` and `backupReminder`. **Paste code, Load file and Restore do not touch it.** No schema change (D486).
```

**Replace with:**
```markdown
v1.0 adds one **settings key outside the save**, namespaced by channel, holding only: `textSize`, `backupReminder`, `holdView` (added in v1.1, D503), `lastExportAt`, `snoozeUntil`, `firstSeenAt` (set once, on the first run of v1.0). **Reset everything…** clears the three timestamps and keeps `textSize`, `backupReminder` and `holdView`. **Paste code, Load file and Restore do not touch it.** No schema change (D486, D503).
```

**And find:**
```markdown
The debug panel is excluded. Claude Code records in the progress entry which fixture or debug command reaches each screen.
```

**Replace with:**
```markdown
The debug panel is excluded. In v1.1, Hold in Grid view and the Arrange Hold sheet (with a piece selected and with items in the Tray) are added to this list (D507). Claude Code records in the progress entry which fixture or debug command reaches each screen.
```

## E10 — §9.21 The Hold's Layout screens (v1.1, M8, S5, S7, S8)

**Find:**
```markdown
- **Layout checks (Playwright, 320, 360, 900, 1300 px):** each of the above, at Match phone and at Largest, in both themes.
```

**Replace with:**
````markdown
- **Layout checks (Playwright, 320, 360, 900, 1300 px):** each of the above, at Match phone and at Largest, in both themes.

### 9.21 The Hold's Layout screens *(v1.1, D500–D504; red-team M8, S5, S7, S8)*

- **Hold screen header (Grid view, default):**
  - Shows the **8 × 8 grid** (`256 × 256 px` native = `32 px` per tile, scaled smoothly to the card width, shrinking on a `320 px` screen just like the Classic scene in §9.20; D503, S5).
  - Top border strip reads **▲ The Fell Breach**; bottom border strip reads **▼ Lowland Gate** (with the Gatehouse banners cosmetic if bought).
  - The grid header is **purely visual and non-interactive** (no sub-44 px tap targets on header tiles). Only **[Layout ▸]** and **[Rank ▸]** are tappable buttons (both ≥ 44 × 44 px).
  - Tiles outside the current Rank's clearing (§5.1.5) show dark pines and ruined wall stones.
  - Active unlocked pieces render their current visual tier or density (§5.1.5), with the `2 × 2` Hearth Hall covering four tiles (showing the Carved Hearth Hall door cosmetic if bought, and the Act VI frost or post-Remembering window lamp). Dormant saved pieces render as faint stone foundation outlines when **Blueprint ghosts** is On.
  - Cosmetic rendering across Ranks (S7): Carved Hearth Hall door and Gatehouse banners show at all Ranks; Watchtower bell and Wall lanterns show on border pillars at Hamlet/Keep, and on placed tower/wall segments once built.
  - Below the grid: `Stanholm — [Rank]`, **[Layout ▸]** (at least `44 × 44 px`; shows badge `Layout (2) ▸` only if unlocked pieces are unplaced in the Tray; dormant-ring pieces never trigger badge), and **[Rank ▸]**.
  - **Settings (`More ▸ Settings`):** **Hold view** (`Grid` / `Classic scene`, default `Grid`), stored in the external settings key (`lasthold:settings`, §9.20). Switching to `Classic scene` shows the v1.0 pixel hold scene with `[Layout ▸]` still available beside `[Rank ▸]`.
- **Arrange Hold sheet** (opens from **[Layout ▸]**):

```
┌──────────────────────────────────┐
│ Arrange Hold                 [✕] │
│ Bastion · 8×8 open · 24/39 placed│
│ ▲ The Fell Breach                │
│ ┌───┬───┬───┬───┬───┬───┬───┬───┐│
│ │   │   │🧱 │🗼 │🧱 │   │   │   ││
│ ├───┼───┼───┼───┼───┼───┼───┼───┤│
│ │🧱 │🧱 │🗼 │🧱 │🧱 │🗼 │🧱 │🧱 ││
│ ├───┼───┼───┼───┼───┼───┼───┼───┤│
│ │🧱 │   │⚒️ │🏰 │🏰 │   │   │🧱 ││
│ ├───┼───┼───┼───┼───┼───┼───┼───┤│
│ │   │   │⚗️ │🏰 │🏰 │   │🏹 │   ││
│ └───┴───┴───┴───┴───┴───┴───┴───┘│
│ ▼ Lowland Gate                   │
├──────────────────────────────────┤
│ Selected: Smithy Lv9 (Tier II)   │
│ Tap an open tile to move or swap │
│ [Move to tray]                   │
├──────────────────────────────────┤
│ TRAY (unplaced: 2)               │
│ [🏡 Cottage Plot 2 (Pair)] [🌿]  │
├──────────────────────────────────┤
│ [Auto-arrange] [Clear to tray…]  │
│ Blueprint ghosts: [On] [Off]     │
└──────────────────────────────────┘
```

- **Player-facing strings table (S8):**
  | String | Where it shows | Purpose |
  |---|---|---|
  | `Arrange Hold` | Sheet title | Header |
  | `{Rank} · {w}×{h} open · {placed}/{total} placed` | Subtitle | Grid summary (`total` = 39, `placed` counts active pieces only) |
  | `▲ The Fell Breach` / `▼ Lowland Gate` | Border strips | Spatial orientation |
  | `Tap an open tile to move or swap` | Info bar | Instruction when piece selected |
  | `Tap an active piece or tray item to select` | Info bar | Default instruction when nothing selected |
  | `Clears at {Rank}` | Info bar | Tapping a locked outer-ring tile |
  | `Selected: {Name} (Tier {N})` | Info bar | Selected building details |
  | `[Move to tray]` | Info bar button | Moves selected 1 × 1 piece to tray |
  | `TRAY (unplaced: {n})` | Tray header | Tray count (`n` = pieces in tray only) |
  | `[Auto-arrange]` | Footer button | Applies canonical fortress layout |
  | `[Clear to tray…]` | Footer button | Opens confirmation dialog |
  | `Move all placed buildings except the Hearth Hall to the tray? Dormant blueprint outlines will be cleared.` | Confirmation dialog | Warning before clearing grid |
  | `Blueprint ghosts: [On] [Off]` | Footer toggle | Toggles foundation ghost outlines |

- **Interaction rules (tap-only, no drag required):**
  - Every grid cell in the Arrange Hold sheet and every item in the Tray is a button of **at least `44 × 44 px` at every Text size**.
  - Selected tiles show a high-contrast highlight border (N9).
  - **Tap an active piece** on the grid (or an item in the **Tray**) to select it. The info bar shows its name, level or count, visual tier, and (for `1 × 1` pieces on the grid) **[Move to tray]**.
  - **Tap any tile inside the current Rank's clearing** while a piece is selected:
    - If the target tile is empty, the piece moves there.
    - If the target tile holds another `1 × 1` piece, the two pieces **swap** places (if the selected piece came from the Tray, the displaced piece goes to the Tray).
    - If the `2 × 2` **Hearth Hall** is selected (`x = 2..4, y = 2..4`, M4), tapping the new top-left tile moves the Hearth Hall there and moves any `1 × 1` pieces in that `2 × 2` footprint into the vacated Hearth Hall tiles (or to the Tray if they overlapped).
  - Tapping a **locked outer-ring tile** shows *"Clears at Keep / Citadel / Bastion"* in the info bar and does not place the piece.
  - **Auto-arrange** applies the canonical fortress layout (§5.1.5) in one tap.
  - **Clear to tray…** asks for confirmation, then clears all `1 × 1` pieces to the Tray and clears dormant coordinates so the warden can lay out the hold from scratch.
  - **Blueprint ghosts (On / Off)** toggles `state.layout.showGhosts` (§5.1.5).
- **320 px and Text size fit:**
  - In the Arrange Hold sheet, when container width is `< 352 px` (such as the `320 px` check width, N3), the tile grid sits inside a self-contained horizontal scroll container (`data-internal-scroll="true"`, M7), so the page itself never scrolls horizontally (`scrollWidth ≤ innerWidth`) and every tile stays a full `44 × 44 px` tap target. On `≥ 352 px` containers, all 8 columns fit without scrolling.
  - Under reduced motion (§9.20), the grid header and the Arrange Hold sheet show still frames with no transitions or bobbing.
````

## E11 — §10 Out of Scope

**Find:**
```markdown
- Audio: music and sound effects. **[Decided D476: after v1.0, as its own small milestone: CC0 sounds only, muted by default with a toggle, no new runtime dependency. The asset manifest reserves an `audio` section so sound can be added without restructuring.]**
```

**Replace with:**
```markdown
- Audio: music and sound effects. **[Decided D476, D499: scheduled as milestone v1.2 "Sounds of the Frontier": CC0 sounds only, muted by default with a toggle, no new runtime dependency. The asset manifest reserves an `audio` section so sound can be added without restructuring.]**
```

**And find:**
```markdown
| The Descent (a third ending) | Deferred (D448); after v1.0 (D477) | Its own milestone after v1.0, with its own flesh-out |
| Rising difficulty for Keep the Vigil (an endless mode) | Deferred (D453); after v1.0 (D477) | Keep the Vigil changes nothing for now; its own milestone after v1.0, with its own flesh-out |
```

**Replace with:**
```markdown
| The Descent (a third ending) | Deferred (D448, D477); scheduled as v1.4 (D499) | Milestone v1.4 "The Descent", with its own flesh-out |
| Rising difficulty for Keep the Vigil (an endless mode) | Deferred (D453, D477); scheduled as v1.3 (D499) | Milestone v1.3 "Keep the Vigil", with its own flesh-out |
| Tactical building placement in the Last Stand ("The Breach") | Split from decorative placement (D499, D500) | Milestone v1.5 "The Breach", reusing v1.1's saved 8 × 8 layout format without another save migration, with its own flesh-out |
```

## E12 — Judgment calls at the end of docs/gdd.md

**Find:**
```markdown
14. Readings in D459 (Keep the Vigil only when open; once, ever; the reading starts by tap; "Act VI has ended" = its stand result applied).
```

**Replace with:**
```markdown
14. Readings in D459 (Keep the Vigil only when open; once, ever; the reading starts by tap; "Act VI has ended" = its stand result applied).

## Judgment calls added in the v1.1 flesh-out (D498–D508; revised after red-team review)

1. **Post-v1.0 roadmap order:** v1.1 The Hold's Layout (decorative grid), v1.2 Sounds of the Frontier (audio), v1.3 Keep the Vigil (endless mode), v1.4 The Descent (third ending), v1.5 The Breach (tactical layout in the Last Stand) (D499).
2. **An 8 × 8 coordinate grid with the Fell Breach on the north edge and Rank clearings (4×4 → 6×6 → 8×6 → 8×8),** with Citadel defenses along row 1 and wings, and Bastion defenses along row 0, so coordinates never shift and defenses are never locked out in Citadel (D500, M1).
3. **The Hearth Hall is a 2 × 2 centerpiece anchored inside 2..4 × 2..4 at all Ranks,** guaranteeing it is never stranded outside the clearing across the Long Night (D501, M4). Count buildings unlock up to 3 plots (`1, 5, 15`; `1, 2` for Silver Seams); Watchtower unlocks 3 towers (`Lv 1, 8, 15`); Walls unlock 11 auto-connecting segments (`4` at Lv 1, `+1` every 2 levels) (D501).
4. **The layout is a saved blueprint ("The stones remember") with four mutually exclusive piece states (locked, active, dormant-ring, tray)** that persists through the Long Night, never overwrites saved coordinates automatically, and repopulates as Ranks and buildings return (D502, M2, M3).
5. **The Hold screen shows the live grid by default** (with a Settings switch to the Classic scene, stored outside the save) and opens the tap-only Arrange Hold sheet from `[Layout ▸]`. The grid header scales smoothly and is non-interactive; player-facing strings are strictly gated (D503, S5, S8).
6. **Live odds benchmark budgets are set to 120 ms (identified) and 150 ms (3 candidates, 500 samples/candidate)** to provide clean headroom on throttled CI runners without failing on CPU noise (D505, M6).
```
