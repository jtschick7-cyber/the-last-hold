# v1.1 grid art inventory (plan TL.5a, S2)

Every picture the Hold's 8 × 8 grid needs, with its id, size and what state it shows. All are drawn in code, in the 32-colour palette, by `tools/draw-layout-grid.ts` (and its later siblings), written by `tools/gen-layout-grid.ts`, registered in `src/content/assets.ts` with ids starting `grid.`, and numbered on their own contact sheet at TL.5c (the v1.0 numbers 1–156 do not move; D507 (4)). `art-src/v1.0-hashes.json` holds the hash of every picture shipped in v1.0; a test proves none changed.

**Total: 83 pictures** (the plan said about 75). 11 were drawn at TL.5a; 49 at TL.5b; 23 at TL.5c, which ends with the owner's contact-sheet stop.

## TL.5a — ground, border and blueprint tiles (drawn, 11)

| Id | Size | State it shows | Used for |
|---|---|---|---|
| `grid.ground.grass` | 32 | Cleared ground, grass with tufts | Free tile inside the clearing |
| `grid.ground.earth` | 32 | Cleared ground, trodden earth | Free tile inside the clearing |
| `grid.ground.flags` | 32 | Cleared ground, flagstones | Free tile inside the clearing |
| `grid.forest.1`, `grid.forest.2` | 32 | Dark pine forest | Tile outside the current Rank's clearing |
| `grid.ruin.1`, `grid.ruin.2` | 32 | Ruined foundation stones | Tile outside the clearing |
| `grid.ghost.locked` | 32 | Faint dotted foundation outline, transparent | Blueprint ghost of a piece not yet built |
| `grid.ghost.dormant` | 32 | Dotted outline with solid corner stones, transparent | Blueprint ghost of a built piece waiting for its ground to clear |
| `grid.strip.north` | 256 × 16 | The Fell Breach: fells, mist, pines | Strip above row 0 |
| `grid.strip.south` | 256 × 16 | The Lowland Gate: low wall, gate gap, road | Strip below row 7 |

Proposal for TL.7 (the UI decides): the ground and forest/ruin looks are chosen by a fixed function of the tile's coordinates, so the grid never flickers or changes between visits.

## TL.5b — defenses, level buildings and the Hearth Hall (49, drawn)

| Id | Size | State it shows |
|---|---|---|
| `grid.wall.0` … `grid.wall.15` | 32 | Wall segment, one picture per connection mask (bits N=1, E=2, S=4, W=8; 0 is a lone post, 5 straight north–south, 10 straight east–west, 3, 6, 12, 9 corners, 7, 11, 13, 14 T-junctions, 15 cross, 1, 2, 4, 8 ends) (16) |
| `grid.watchtower` | 32 | Watchtower (one look; it counts as a wall neighbour but needs no connection pictures) (1) |
| `grid.mill.1` … `.3`, `grid.sawpit.1` … `.3`, `grid.smithy.1` … `.3` | 32 | Tier I, II, III by level (levels 1–4, 5–10, 11+) (9) |
| `grid.bell-tower.1` … `.3`, `grid.lodge.1` … `.3` | 32 | Tier I, II, III, one per level (3-level cap) (6) |
| `grid.barracks.1` … `.3`, `grid.alchemist.1` … `.3` | 32 | Tier I, II, III (levels 1–2, 3–4, 5; 5-level cap) (6) |
| `grid.trophy-hall` | 32 | Trophy Hall (a unique building, one look) (1) |
| `grid.hearth-hall.hamlet`, `.keep`, `.citadel`, `.bastion` | 64 | The 2 × 2 Hearth Hall at each Rank (4) |
| `grid.hearth-hall.door` | 64 | Overlay: Carved Hearth Hall door (cosmetic) (1) |
| `grid.hearth-hall.frost.hamlet`, `.keep`, `.citadel`, `.bastion` | 64 | Overlay: Act VI frost, one per Rank because it follows each Rank's roofline (4; the plan had one) |
| `grid.hearth-hall.lamp` | 64 | Overlay: window lamp after Remember Them; the window is in the same place at every Rank, so one overlay (1) |

## TL.5c — plots, cosmetics and the contact sheet (23)

| Id | Size | State it shows |
|---|---|---|
| `grid.cottage.1` … `.3`, `grid.farm.1` … `.3`, `grid.woodcutter.1` … `.3`, `grid.mine.1` … `.3`, `grid.herb-garden.1` … `.3` | 32 | Plot density: 1 single structure (1–4 owned), 2 pair (5–14), 3 cluster (15+) (15) |
| `grid.silver-seam.1`, `.2` | 32 | Single seam, twin seams (2) |
| `grid.cosmetic.banners` | 256 × 16 | Overlay on the Lowland Gate strip: Gatehouse banners (1) |
| `grid.cosmetic.bell-tower` | 32 | Overlay on Watchtower 1: the Watchtower bell (1) |
| `grid.cosmetic.bell-border` | 32 | The bell on the border header, before Watchtower 1 stands (1) |
| `grid.cosmetic.lanterns-wall` | 32 | Overlay on a wall segment: Wall lanterns (1) |
| `grid.cosmetic.lanterns-border` | 256 × 16 | Lanterns on the border pillars, before any wall stands (1) |
| `grid.frost.wall` | 32 | Overlay on a wall segment: Act VI frost at its foot (1) |

## Notes

- Nothing here has a player-facing name; the labels in the manifest are for alt text only.
- Ghost tiles are mostly transparent (over 80%), so the ground shows through.
- `kind` in the manifest is `building` for 32 px tiles and `scene` for the strips and the 64 px Hall pictures (the manifest's size rule gives `building` 32 px only, and a scene may be any size).
- The Hall's door sits in the same place at every Rank, so the Carved Door is one overlay.
