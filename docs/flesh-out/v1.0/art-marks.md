# Art marks (v1.0 Keep / Redraw)

Number → id, in id order. The owner marks each row **Keep** or **Redraw**; an empty mark means Keep.
At most about 40 Redraw in total, at most 12 per session (D475). A test checks that every Keep picture is byte-identical to its v0.11 PNG (`art-src/v0.11-hashes.json`).

**Marked 2026-10-22:** 40 numbers by the owner; 23 sibling pictures (the other frost looks, the other hunter sprites, the other rarity frames, the other brew icons) are marked Redraw too (owner chose (a): all 63, D492).

**App icon:** **keep the current tower** (owner, 2026-10-22). Candidates A, B and C are not used.

| n | id | mark | what to change |
|---|---|---|---|
| 1 | `icon.brew.drowned-bane-oil` | | Redraw | same change as 2 (sibling; owner chose option (a), 2026-10-22) |
| 2 | `icon.brew.fire-pot` | Redraw | Bombs (Fire Pot, also 3 and 8): a wider clay pot or grenade with a bright fuse spark; narrow the Oils (1, 4, 9) into vials, so potions, oils and bombs differ in silhouette. |
| 3 | `icon.brew.frost-pot` | | Redraw | same change as 2 (sibling; owner chose option (a), 2026-10-22) |
| 4 | `icon.brew.grave-oil` | | Redraw | same change as 2 (sibling; owner chose option (a), 2026-10-22) |
| 5 | `icon.brew.hardwood-tonic` | |
| 6 | `icon.brew.mending-draught` | |
| 7 | `icon.brew.quickfoot-tincture` | |
| 8 | `icon.brew.saltburst` | | Redraw | same change as 2 (sibling; owner chose option (a), 2026-10-22) |
| 9 | `icon.brew.thornbane-oil` | | Redraw | same change as 2 (sibling; owner chose option (a), 2026-10-22) |
| 10 | `icon.delve-relic.bell-clapper` | |
| 11 | `icon.delve-relic.cold-iron-nail` | |
| 12 | `icon.delve-relic.horn-spoon` | |
| 13 | `icon.delve-relic.rift-lantern` | |
| 14 | `icon.delve-relic.salt-ring` | |
| 15 | `icon.delve-relic.spindle-whorl` | |
| 16 | `icon.item-frame.common` | |
| 17 | `icon.item-frame.fine` | |
| 18 | `icon.item-frame.heroic` | |
| 19 | `icon.item-frame.rare` | |
| 20 | `icon.item.emberwright-plate` | |
| 21 | `icon.item.hide-armor` | |
| 22 | `icon.item.iron-blade` | |
| 23 | `icon.item.mail` | |
| 24 | `icon.item.silvered-blade` | |
| 25 | `icon.item.steel-blade` | |
| 26 | `icon.item.wrights-blade` | |
| 27 | `icon.keepsake.barley-knot` | |
| 28 | `icon.keepsake.coffin-silver` | Redraw | Coffin Silver: replace the cross with an old stamped coin motif (anvil, flame or skull) and a metallic rim. |
| 29 | `icon.keepsake.ferrymans-coin` | |
| 30 | `icon.keepsake.rune-nail` | |
| 31 | `icon.keepsake.wolf-tooth-string` | |
| 32 | `icon.keepsake.yrsas-thole` | Redraw | Yrsa's Thole: a single carved black-oak oarlock peg with a rope loop (not a two-post fence). |
| 33 | `icon.order.bellWatchers` | |
| 34 | `icon.order.greyWives` | |
| 35 | `icon.order.moot` | |
| 36 | `icon.order.quenchers` | |
| 37 | `icon.orders` | |
| 38 | `icon.rank.apprentice` | |
| 39 | `icon.rank.masterWright` | |
| 40 | `icon.rank.wright` | |
| 41 | `icon.rarity.bright` | | Redraw | same change as 42 (sibling; owner chose option (a), 2026-10-22) |
| 42 | `icon.rarity.faint` | Redraw | Faint rarity frame: notched corners or small corner diamonds so it differs from the Common frame (#16), as GDD §9.12 requires (also 41 and 43). |
| 43 | `icon.rarity.warm` | | Redraw | same change as 42 (sibling; owner chose option (a), 2026-10-22) |
| 44 | `icon.riftglass` | |
| 45 | `icon.rime` | |
| 46 | `icon.sigil.drowned-bell` | |
| 47 | `icon.sigil.hearth-crone` | |
| 48 | `icon.sigil.pale-smith` | |
| 49 | `icon.sigil.unlit` | |
| 50 | `icon.sigil.weaver` | |
| 51 | `icon.sigil.wolf` | |
| 52 | `icon.star` | Redraw | Star icon: taper the two bottom legs to points. |
| 53 | `icon.token` | |
| 54 | `portrait.creature.barrow-king` | Redraw | Barrow-King: tarnish the crown to aged bronze or rime-iron with irregular spikes; dark barrow-fur or chainmail shoulders under the skull. |
| 55 | `portrait.creature.likho-one-eyed` | Redraw | Likho: a gaunt asymmetric face, ragged hair, jagged teeth under the single eye (no piano-key teeth or bowl-cut). |
| 56 | `portrait.creature.lindworm-of-velk-fjord` | |
| 57 | `portrait.creature.mara-of-kettle-barrow` | Redraw | Mara portrait: a wider shroud; the vertical fork on the right becomes gnarled reaching fingers. |
| 58 | `portrait.creature.mother-of-the-river` | |
| 59 | `portrait.creature.stoneback-fell-troll` | Redraw | Stoneback: a heavy brow ridge, craggy rock silhouette, moss patches on the shoulders. |
| 60 | `portrait.hunter.arvid` | Redraw | Arvid: beard down over the chin, split into two grey braids (GDD §8.5); replace the round-topped staff with his runed axe. (The owner's text said Ostap's axe; confirmed 2026-10-22: it is Arvid's own axe.) |
| 61 | `portrait.hunter.bjarna` | Redraw | Bjarna: the yellow side-braid 2 px left, connected under the hood; the icicle becomes a barbed rime-spear. |
| 62 | `portrait.hunter.gest-tall-torch` | Redraw | Gest: brown beard down over the chin; the staff becomes a pine torch with a larger flickering flame. |
| 63 | `portrait.hunter.halvar` | Redraw | Halvar: grey beard down over the chin; replace the staff with a heavy charcoal-burner's axe. |
| 64 | `portrait.hunter.herdis` | Redraw | Herdis: clean up the disconnected hair and ear pixels, tone down the blue face-speckles, curve the staff top into a shepherd's crook. |
| 65 | `portrait.hunter.ostap` | Redraw | Ostap: grey beard down over the chin and jaw. |
| 66 | `portrait.hunter.radek` | Redraw | Radek: the white rectangle becomes a tapered, silver-shod gravedigger's shovel blade. |
| 67 | `portrait.hunter.radmila-of-the-reeds` | Redraw | Radmila: braid connected to the head; differ from Vesna (#72): marsh-wife shawl, stouter shoulders, silver spoon in the apron pocket. |
| 68 | `portrait.hunter.ragnhild-eye-taker` | Redraw | Restore the missing eye pixels; remove the floating white braid; add her pale bone needle pierced through her cap. |
| 69 | `portrait.hunter.sigrun` | Redraw | Sigrun: hair framing her face under the cap, a dark leather forge-apron collar (not Zora's red V-neck), bandaged half-hand near her chest. |
| 70 | `portrait.hunter.stanko` | |
| 71 | `portrait.hunter.toma` | Redraw | Toma: the half-beard connected across the chin; the grey blob behind the shoulder gets a copper-kettle rim and spout. |
| 72 | `portrait.hunter.vesna` | |
| 73 | `portrait.hunter.zora` | |
| 74 | `portrait.monster.anvil-wight` | |
| 75 | `portrait.monster.bies` | Redraw | Bies: deep woodland crimson or bark-brown, curved horns, pointed fangs. |
| 76 | `portrait.monster.draugr` | |
| 77 | `portrait.monster.gloam-moths` | |
| 78 | `portrait.monster.huldra` | Redraw | Huldra: a defined head, neck and shoulders, flowing golden hair, a leaf crown, the hollow bark split on one side. |
| 79 | `portrait.monster.kikimora` | Redraw | Kikimora: narrow crooked yellow eyes, a sharp beak-like nose, tattered swamp-shawl edges (no googly eyes or smile). |
| 80 | `portrait.monster.leshy` | |
| 81 | `portrait.monster.nix` | Redraw | Nix: a 3/4 or side-profile dark water-horse head, glowing cyan eyes, dripping mane, matching sprite 148. |
| 82 | `portrait.monster.poludnitsa` | Redraw | Poludnitsa: deep noon-heat shadow under the brow, hollow staring eyes, the curved blade of a harvesting sickle in front. |
| 83 | `portrait.monster.ribbonshade` | Redraw | Ribbonshade: complete rework, a hunched sorrowful ash-dark wraith matching sprite 150, singed ember hands, a blue stitched ribbon at the wrist. |
| 84 | `portrait.monster.rimewrought` | |
| 85 | `portrait.monster.rusalka` | Redraw | Rusalka: dark wet river-weed hair, pale drowned shoulders, hollow mournful eyes (no lime hood, no pink lips). |
| 86 | `portrait.monster.strzyga` | Redraw | Strzyga: gaunt undead cheekbones, dark matted hair, feral fangs (no round white halo, snout or piano-key teeth). |
| 87 | `portrait.monster.upyr` | Redraw | Upyr portrait: the blood drip moves to a corner fang; a wider cloak collar. |
| 88 | `portrait.monster.vodyanoy` | Redraw | Vodyanoy: complete rework, a bloated sinister old man of the river (drowned-green skin, sunken yellow eyes, water-weed beard, reed whiskers). |
| 89 | `portrait.monster.wolf` | |
| 90 | `scene.cosmetic.carved-hearth-hall-door.bastion` | |
| 91 | `scene.cosmetic.carved-hearth-hall-door.citadel` | |
| 92 | `scene.cosmetic.carved-hearth-hall-door.hamlet` | |
| 93 | `scene.cosmetic.carved-hearth-hall-door.keep` | |
| 94 | `scene.cosmetic.gatehouse-banners.bastion` | |
| 95 | `scene.cosmetic.gatehouse-banners.citadel` | |
| 96 | `scene.cosmetic.gatehouse-banners.hamlet` | |
| 97 | `scene.cosmetic.gatehouse-banners.keep` | |
| 98 | `scene.cosmetic.wall-lanterns.bastion` | |
| 99 | `scene.cosmetic.wall-lanterns.citadel` | |
| 100 | `scene.cosmetic.wall-lanterns.hamlet` | |
| 101 | `scene.cosmetic.wall-lanterns.keep` | |
| 102 | `scene.cosmetic.watchtower-bell.bastion` | |
| 103 | `scene.cosmetic.watchtower-bell.citadel` | |
| 104 | `scene.cosmetic.watchtower-bell.hamlet` | Redraw | Hamlet: add a wooden bell-post or frame for the bell to hang from (it floats in the sky now). |
| 105 | `scene.cosmetic.watchtower-bell.keep` | |
| 106 | `scene.look.frost.bastion` | | Redraw | same change as 108 (sibling; owner chose option (a), 2026-10-22) |
| 107 | `scene.look.frost.citadel` | | Redraw | same change as 108 (sibling; owner chose option (a), 2026-10-22) |
| 108 | `scene.look.frost.hamlet` | Redraw | Frost looks: replace the white/cyan static band with clean rime frost on eaves, sills and path edges (Hamlet; the same layer in 106, 107, 109). |
| 109 | `scene.look.frost.keep` | | Redraw | same change as 108 (sibling; owner chose option (a), 2026-10-22) |
| 110 | `scene.look.lamp.bastion` | |
| 111 | `scene.look.lamp.citadel` | |
| 112 | `scene.look.lamp.hamlet` | |
| 113 | `scene.look.lamp.keep` | |
| 114 | `scene.order.bellWatchers` | Redraw | Bell-Watchers scene: remove the stray vertical white line through the bell; hang the bronze bell from the stone gatehouse arch (lore §33 OR-B4). |
| 115 | `scene.order.greyWives` | |
| 116 | `scene.order.moot` | Redraw | Moot scene: the five chairs behind the table, not on top of it; add the empty sixth chair at the head (OR-M4). |
| 117 | `scene.order.quenchers` | Redraw | Quenchers scene: glowing coals in Pechko's stove, the crack in the flagstones, Bohdan's cold grey river stone on the hearthstone; remove the brown box with the cyan stripe. |
| 118 | `sprite.creature.barrow-king` | |
| 119 | `sprite.creature.likho-one-eyed` | |
| 120 | `sprite.creature.lindworm-of-velk-fjord` | |
| 121 | `sprite.creature.mara-of-kettle-barrow` | Redraw | Mara sprite: fix the downed (5th) frame, which collapses to a 4×4 dot; add a subtle pale rim to the dark cloak. |
| 122 | `sprite.creature.mother-of-the-river` | Redraw | Mother of the River sprite: a distinct head, reed-crown and flowing river-gown base (now it looks like cyan trousers). |
| 123 | `sprite.creature.stoneback-fell-troll` | |
| 124 | `sprite.guardian.dross-tide` | |
| 125 | `sprite.guardian.the-forgotten` | |
| 126 | `sprite.guardian.unlits-breath` | |
| 127 | `sprite.hunter.arvid` | Redraw | Hunter sprites (all 127–140): the downed pose generator, so the weapon rotates with the body and the 2–3 px head/torso gap closes. |
| 128 | `sprite.hunter.bjarna` | Redraw | same change as 127 (sibling; owner chose option (a), 2026-10-22) |
| 129 | `sprite.hunter.gest-tall-torch` | Redraw | same change as 127 (sibling; owner chose option (a), 2026-10-22) |
| 130 | `sprite.hunter.halvar` | Redraw | same change as 127 (sibling; owner chose option (a), 2026-10-22) |
| 131 | `sprite.hunter.herdis` | Redraw | same change as 127 (sibling; owner chose option (a), 2026-10-22) |
| 132 | `sprite.hunter.ostap` | Redraw | same change as 127 (sibling; owner chose option (a), 2026-10-22) |
| 133 | `sprite.hunter.radek` | Redraw | same change as 127 (sibling; owner chose option (a), 2026-10-22) |
| 134 | `sprite.hunter.radmila-of-the-reeds` | Redraw | same change as 127 (sibling; owner chose option (a), 2026-10-22) |
| 135 | `sprite.hunter.ragnhild-eye-taker` | Redraw | same change as 127 (sibling; owner chose option (a), 2026-10-22) |
| 136 | `sprite.hunter.sigrun` | Redraw | same change as 127 (sibling; owner chose option (a), 2026-10-22) |
| 137 | `sprite.hunter.stanko` | Redraw | same change as 127 (sibling; owner chose option (a), 2026-10-22) |
| 138 | `sprite.hunter.toma` | Redraw | same change as 127 (sibling; owner chose option (a), 2026-10-22) |
| 139 | `sprite.hunter.vesna` | Redraw | same change as 127 (sibling; owner chose option (a), 2026-10-22) |
| 140 | `sprite.hunter.zora` | Redraw | same change as 127 (sibling; owner chose option (a), 2026-10-22) |
| 141 | `sprite.monster.anvil-wight` | Redraw | Anvil-wight sprite: a hunched smith's head and shoulders hammering an anvil in front of it; fix the disintegrated downed frame. |
| 142 | `sprite.monster.bies` | |
| 143 | `sprite.monster.draugr` | |
| 144 | `sprite.monster.gloam-moths` | |
| 145 | `sprite.monster.huldra` | |
| 146 | `sprite.monster.kikimora` | |
| 147 | `sprite.monster.leshy` | |
| 148 | `sprite.monster.nix` | Redraw | match the redrawn portrait 81: a dark river horse (owner, 2026-10-22, TV.8a review) |
| 149 | `sprite.monster.poludnitsa` | |
| 150 | `sprite.monster.ribbonshade` | Redraw | match the redrawn portrait 83: a blue stitched ribbon, singed edges (owner, 2026-10-22, TV.8a review) |
| 151 | `sprite.monster.rimewrought` | |
| 152 | `sprite.monster.rusalka` | |
| 153 | `sprite.monster.strzyga` | |
| 154 | `sprite.monster.upyr` | Redraw | Upyr sprite: fix the downed (5th) frame, same fault; add a lighter rim to the cloak. |
| 155 | `sprite.monster.vodyanoy` | |
| 156 | `sprite.monster.wolf` | |
