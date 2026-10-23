# Art marks (v1.1 grid art: Keep / Redraw)

Number → id, in id order, on their own numbers (the v1.0 sheet numbers 1–156 are unchanged). The owner marks each row **Keep** or **Redraw**; an empty mark means Keep.
Redraws ship in batches of at most 12 per session after before/after sheets are approved (D475, D504). A test checks that every v1.1 picture not marked Redraw is byte-identical to the recorded hash.

| n | id | mark | what to change |
|---|---|---|---|
| 1 | `grid.alchemist.1` | Keep | |
| 2 | `grid.alchemist.2` | Keep | |
| 3 | `grid.alchemist.3` | Redraw | Replace the unattached cyan oval sitting on the left roof slope with a framed rooftop dormer/lantern housing or a copper alembic/condenser pipe connected to the building so it doesn't look like a floating blue egg on the shingles. |
| 4 | `grid.barracks.1` | Redraw | Distinguish from Cottage: give it a martial longhouse look with heavier timber framing and a small weapon rack (spears/wooden shield) beside the door. |
| 5 | `grid.barracks.2` | Redraw | Build on the martial barracks look: stone lower course, weapon rack + target/shield by the door, and a reinforced gable/parapet so it reads as a hunter barracks rather than a blue-roofed house. |
| 6 | `grid.barracks.3` | Redraw | Top-tier hunter barracks: stone-and-timber hall with crenellated/reinforced eaves, weapon rack + shield emblem on the facade, and the red-and-gold banner. |
| 7 | `grid.bell-tower.1` | Keep | |
| 8 | `grid.bell-tower.2` | Keep | |
| 9 | `grid.bell-tower.3` | Keep | |
| 10 | `grid.cosmetic.banners` | Keep | |
| 11 | `grid.cosmetic.bell-border` | Keep | |
| 12 | `grid.cosmetic.bell-tower` | Redraw | Match the updated `grid.watchtower` (80) base with short stone wall-wings/buttresses on the left and right edges (y=10..21) so horizontal walls connect cleanly without a gap, keeping the hanging bronze bell on the right. |
| 13 | `grid.cosmetic.lanterns-border` | Keep | |
| 14 | `grid.cosmetic.lanterns-wall` | Keep | |
| 15 | `grid.cottage.1` | Keep | |
| 16 | `grid.cottage.2` | Keep | |
| 17 | `grid.cottage.3` | Keep | |
| 18 | `grid.farm.1` | Keep | |
| 19 | `grid.farm.2` | Keep | |
| 20 | `grid.farm.3` | Redraw | Avoid the rigid 2x2 four-brown-box waffle grid (which looks identical to herb-garden.3): draw a single unified fenced field plot with thicker golden barley stalks/sheaves and a small haystack or scarecrow so it reads clearly as a rich farm at 32px. |
| 21 | `grid.forest.1` | Keep | |
| 22 | `grid.forest.2` | Keep | |
| 23 | `grid.frost.wall` | Keep | |
| 24 | `grid.ghost.dormant` | Keep | |
| 25 | `grid.ghost.locked` | Keep | |
| 26 | `grid.ground.earth` | Redraw | Tone down the bright salmon/terracotta orange to a deeper, warmer trodden earth brown with subtle pebble/soil texture so the clearing doesn't look like a high-contrast checkerboard alongside grass and flags. |
| 27 | `grid.ground.flags` | Redraw | Currently uses the same grey brick wall pattern and shade as stone buildings/walls, causing stone buildings and silver seams to blend into the floor. Redraw as flatter, darker-toned worn courtyard cobblestones/flagstones with softer mortar lines that stay visually behind stone buildings. |
| 28 | `grid.ground.grass` | Redraw | Shift from bright neon/lime green to a slightly deeper, calmer frontier meadow green (closer to `strip.south` and harmonizing with the dark pine border) so the clearing transitions naturally from the outer forest ring. |
| 29 | `grid.hearth-hall.bastion` | Keep | |
| 30 | `grid.hearth-hall.citadel` | Keep | |
| 31 | `grid.hearth-hall.door` | Redraw | Replace the flat bright-yellow outline (which looks like hazard tape) with a richly carved dark-oak and bronze/gold door with horizontal iron/bronze hinge straps and a central ring/anvil motif at the exact same door coordinates. |
| 32 | `grid.hearth-hall.frost.bastion` | Keep | |
| 33 | `grid.hearth-hall.frost.citadel` | Keep | |
| 34 | `grid.hearth-hall.frost.hamlet` | Keep | |
| 35 | `grid.hearth-hall.frost.keep` | Keep | |
| 36 | `grid.hearth-hall.hamlet` | Keep | |
| 37 | `grid.hearth-hall.keep` | Keep | |
| 38 | `grid.hearth-hall.lamp` | Redraw | Instead of filling the entire left window with a solid yellow-orange rectangle (which erases the window frame and looks like a banner under Keep's eaves), preserve the dark window border/mullions and draw a bright warm lantern/flame sitting on the sill inside the window with warm lit panes around it. |
| 39 | `grid.herb-garden.1` | Keep | |
| 40 | `grid.herb-garden.2` | Keep | |
| 41 | `grid.herb-garden.3` | Redraw | Differentiate from `farm.3`'s brown boxes: show lush raised wooden planter beds filled with dense leafy green herbs and distinct clusters of white (yarrow), purple (mugwort), and blue (juniper) blossoms. |
| 42 | `grid.lodge.1` | Keep | |
| 43 | `grid.lodge.2` | Keep | |
| 44 | `grid.lodge.3` | Keep | |
| 45 | `grid.mill.1` | Redraw | Lengthen the 4 diagonal windmill sails so they extend clearly past the tower body (like `mill.2` but simple wooden blades); right now the 3px stubs make `mill.1` look like a figure with tiny arms rather than a windmill. |
| 46 | `grid.mill.2` | Keep | |
| 47 | `grid.mill.3` | Keep | |
| 48 | `grid.mine.1` | Redraw | Add a dark craggy rock mound around the timber-framed tunnel mouth and short minecart rails/ore at the entrance so it reads as a mine shaft in rock rather than a flat square box. |
| 49 | `grid.mine.2` | Redraw | Show two timber-framed mine adits set into a rocky hillside/outcrop with a lantern glow and ore pile/rails, rather than two flat floating rectangles. |
| 50 | `grid.mine.3` | Redraw | Fix the 2x2 vertically stacked rectangles (which look like a 2-story apartment window or bookshelf on the Bastion map): draw a large rocky mine face with main timbered shaft openings at ground level, a wooden mine headframe/hoist above, and ore carts/rails below. |
| 51 | `grid.ruin.1` | Keep | |
| 52 | `grid.ruin.2` | Keep | |
| 53 | `grid.sawpit.1` | Redraw | Make the sawpit recognizable: show a log resting on wooden trestles/pit-frame with a visible saw blade and a small stack of cut planks. |
| 54 | `grid.sawpit.2` | Redraw | Build on `sawpit.1`: an open-sided timber canopy/shed over a log-cutting frame with a visible circular/pit saw blade and a larger stack of sawn lumber. |
| 55 | `grid.sawpit.3` | Redraw | Remove the unattached floating grey rectangle in the upper-left sky! Show a full timber saw-shed with a clear saw blade cutting a log, a roofed lumber rack, and tall stacks of freshly cut planks. |
| 56 | `grid.silver-seam.1` | Redraw | Replace the smooth oval with parallel diagonal cyan lines (which reads as a glass mirror or pond): draw an irregular dark craggy rock outcrop split by a jagged, branching vein of bright silver/ice-blue ore. |
| 57 | `grid.silver-seam.2` | Redraw | Match `silver-seam.1`: two jagged dark rock outcrops with branching veins of bright silver ore glinting inside the rock fissures, instead of two round mirror-like ovals. |
| 58 | `grid.smithy.1` | Keep | |
| 59 | `grid.smithy.2` | Keep | |
| 60 | `grid.smithy.3` | Keep | |
| 61 | `grid.strip.north` | Keep | |
| 62 | `grid.strip.south` | Keep | |
| 63 | `grid.trophy-hall` | Keep | |
| 64 | `grid.wall.0` | Keep | |
| 65 | `grid.wall.1` | Keep | |
| 66 | `grid.wall.10` | Keep | |
| 67 | `grid.wall.11` | Keep | |
| 68 | `grid.wall.12` | Keep | |
| 69 | `grid.wall.13` | Keep | |
| 70 | `grid.wall.14` | Keep | |
| 71 | `grid.wall.15` | Keep | |
| 72 | `grid.wall.2` | Keep | |
| 73 | `grid.wall.3` | Keep | |
| 74 | `grid.wall.4` | Keep | |
| 75 | `grid.wall.5` | Keep | |
| 76 | `grid.wall.6` | Keep | |
| 77 | `grid.wall.7` | Keep | |
| 78 | `grid.wall.8` | Keep | |
| 79 | `grid.wall.9` | Keep | |
| 80 | `grid.watchtower` | Redraw | Add short horizontal stone wall-wings/buttresses on the left (x=0..8) and right (x=23..31) at wall height (y=10..21) behind the tower shaft so adjacent East/West wall segments connect flush into the Watchtower instead of stopping 9px away. |
| 81 | `grid.woodcutter.1` | Redraw | Fix the vertical grey bar (which makes it look like a boot or chimney): draw a round tree stump with a lighter tan top, an angled axe (diagonal handle, flared steel blade wedged in the stump), and 1–2 cut logs lying beside it. |
| 82 | `grid.woodcutter.2` | Redraw | Two chopping/log stations: a stump with an angled axe and a stacked pyramid of round-ended logs (showing light tan wood rings on the ends). |
| 83 | `grid.woodcutter.3` | Redraw | Replace the four hat-like shapes: show a busy woodcutter's yard with stacked cordwood piles (round log ends visible), a chopping stump with an angled axe, and a timber shelter/sawbuck. |