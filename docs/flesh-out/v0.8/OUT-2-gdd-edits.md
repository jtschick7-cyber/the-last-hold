# OUT-2 — Edits to `docs/gdd.md` (v0.8 flesh-out, D300–D328)

**How each block is marked:** **replace section** (the whole section, heading included), **add after** (a new block after the named one), or **replace row / sentence** for small fixes.

**Numbers** are starting values, tunable unless §7.10 marks them locked. Every new proper noun is a working name until the T8.4 search (OUT-6).

**Apply everything in the docs commit except section L (§7.10).** Apply §7.10 with T8.3, together with the plan's §0.6 row, because `tests/content/balance.test.ts` compares the GDD §7 keys and the plan's locked list with `balance.ts`. This is the same order v0.7 used.

---

## A. Small fixes elsewhere

**§1.1, last paragraph** — *no change.*

**§3.4, the table** — *add a row after v0.7:*
`| v0.8 | Check-ins gain loot and the Stores list; the meta loop gains hunter ranks, stars, talents, use-skills and Legendaries; Act V |`
*and change the "v0.8–v0.10" row's first cell to* `v0.9–v0.10` *and its text to* "Meta loop deepens: events (v0.9), Orders (v0.10)".

**§4.1, the Hunters row** — *replace the "Survives" cell with:* "**Yes**: the roster (active and reserve) persists; levels partly reset: half the levels above 1 are kept (§5.9.7); **items reset except Legendaries** *(⚑ D306)*; **ranks, stars and talents are kept** *(v0.8)*"

**§4.1, the Trophies row** — *replace the Consumed cell with:* "Hunter rank-ups and stars (v0.8; spending never lowers the Trophy Hall count or the Embers conversion, A7); trophy-hall bonuses (v0.2)" *and the Source cell with:* "Contract kills (Delves give none, D262, D316)"

**§4.1, the Gear row** — *replace the row with:*
`| **Items** *(v0.8; were Gear)* | Items | Smithy (craft and rework, §5.11.1); contract loot; Delve guardians (§5.10.7) | Equipped by hunters (weapon, armor) | No, except **Legendaries** (keepsakes, kept forever, D306) | v0.2 / v0.8 |`

**§4.1, the Embers row** — *replace the Consumed cell with:* "Permanent warden upgrades; **hunter stars** (v0.8, D310)"

**§4.1, the Relics row** — *replace "hunters (v0.8)" with:* "hunters (v0.8: as **Legendaries** in a keepsake slot, §5.11.6)"

**§4.3, the Delve-optional paragraph** — *add at the end:* "From v0.8, Delves also give hunter XP, Command skill XP and one guardian item, but only while a run pays Riftglass (D316). Each has an idle source (contract XP and contract loot), and the Idle-only row's "all content" grows with v0.8 (§6.2)."

**§5.3.1, the Reserve bullet** — *replace "Reserve hunters can't take contracts or Delves and don't earn contract XP." with:* "Reserve hunters can't take contracts or Delves; from v0.8 they earn **yard XP** like every hunter not on a contract (§5.11.5)."

**§5.3.2, the level bullet** — *replace with:* "**Level 1–10 in Keep** (later Ranks raise the cap). **Health and Might** scale as `base × (1 + g × (level − 1))`, where g = 0.10 plus 0.01 per **star** (v0.8, §5.11.3). **Armor and Speed don't scale with level** *(⚑ revision [JC])*."

**§5.3.6 Gear, first sentence** — *replace "Gear is **upgraded in place** **[JC]**. Each hunter has a weapon slot and an armor slot, and the Smithy upgrades the slot directly. There is no item inventory until loot arrives in v0.8." with:* "Until v0.8, gear is **upgraded in place**: each hunter has a weapon slot and an armor slot, and the Smithy upgrades the slot directly. **From v0.8 every piece below is an item** (§5.11.1): the Smithy crafts the first tier and reworks an item one tier up for the same step cost shown here."

**§5.4.3, the Success row** — *add to the Rewards cell:* "; from v0.8, a chance of **loot** (§5.11.2)"

**§5.5.1** — *no change* (the golden fight is unaffected, D308).

**§5.9.5 The Hearth** — *add a bullet:* "- **From v0.8, Embers also buy hunter stars** (§5.11.3), bought on each hunter's sheet. The Hearth shows one line pointing there."

**§5.9.6, second bullet** — *replace "Relics for hunters arrive with hunter depth (v0.8)." with:* "Relics for hunters arrive in v0.8 as **Legendaries** (§5.11.6)."

**§5.9.7, the resets / kept table** — *in the Resets column, replace "Gear (A4)" with* "Items, except Legendaries (A4, D306)" *and in the Kept column add a row:* "Hunter ranks, stars and talents; Legendaries (v0.8)"

**§5.9.7, Hunter levels bullet** — *add:* "Ranks, stars and talents are kept (v0.8)."

**§5.10.6, last bullet** — *replace "**No hunter or warden-skill XP from Delves in v0.7** (Q21, D281); v0.8 decides." with:* "**From v0.8, while the run pays Riftglass,** each hunter of the three (downed ones too) earns hunter XP, and Command earns skill XP (§5.10.7, D316)."

**§5.10.7, the rewards table** — *add rows before the "—" row, and replace the "—" row:*

| Reward | When | Notes |
|---|---|---|
| Hunter XP *(v0.8)* | `delve.xpPerTier` 10 × tier per floor cleared; `delve.guardianXpPerTier` 20 × tier for the guardian; to each of the three | Only while the run pays Riftglass; rank level caps apply; no yard XP from Delves |
| Command skill XP *(v0.8)* | `skill.xp.command.delveFloor` 1 per floor cleared | Only while the run pays Riftglass |
| An item *(v0.8)* | The guardian beaten: one item at the guardian's tier (Silvered Blade or Emberwright Plate) | Rarity by `delve.guardianLootWeights` (Fine 50, Rare 35, Heroic 15); only while the run pays Riftglass; same items as contract loot (idle source) |
| — | No trophies; folklore and Cursed kills don't count toward the bestiary; no Legendaries | D262, D306, D316 |

*and replace the last bullet with:* "- The run records Delve kills per family and guardians beaten (D278). The result sheet shows the guardian's item, if any (v0.8)."

**§5.14.1** — *add after the "From Act IV on" bullet:*
- **Act V (v0.8, D301):** a save in a story-less cycle starts Act V on load with fresh counters (D246); the on-load line is *"Pechko calls you over to the crack behind the stove before you've got your coat off."* and D5-01 plays. A save in Act IV's cycle reaches Act V with the next warden. **After Act V's Last Stand the Unlit's door opens** (D257), with one line on the Rift card the first time: *"There's a sixth door in the rift now. It's colder than the others."*

**§5.14.2, Delivery** — *add:* "Act V's letters come up through the crack behind Pechko's stove: the away sheet and results say *"Pechko found a letter at the crack: 'The first night'."* (D302)."

**§5.14.3, Later cycles bullet** — *add:* "When Act V begins, the line reads *"Ilse is back from Velkvik with the archive. Pechko is kneeling at the crack behind the stove, and he isn't sweeping."*"

**§5.14.3, Accounts** — *replace "Act IV adds **The light in the window**)" with:* "Act IV adds **The light in the window**; Act V adds **What the hearth leaves**)"

**§5.14.9, item 2** — *replace "(Act I: D1-06; Act II: D2-09; Act III: D3-06)" with* "(Act I: D1-06; Act II: D2-09; Act III: D3-06; Act IV: D4-06; Act V: D5-06, followed by Yrsa's Thole's line)" *and in item 4 replace "(Act I: D1-07 …; Act III: D3-07)" with* "(Act I: D1-07 *"Welcome back"*; Act II: D2-10; Act III: D3-07; Act IV: D4-07; Act V: D5-07)".

---

## B. §5.11 Hunter depth — **replace section**

### 5.11 Hunter depth *(v0.8; ⚑ v0.8 flesh-out, D300–D328)*

Hunters grow in four ways that last: **ranks**, **stars**, **talents** and a personal **use-skill**. Gear becomes **items** with loot, and six **Legendaries** are kept forever. Benched hunters catch up in **the yard**.

#### 5.11.1 Items and the Smithy *(D304)*
- Every weapon and armor piece of §5.3.6 is an **item**. Today's pieces are **Common** items with exactly today's numbers (D308).
- The Smithy **crafts** a Common Iron Blade (60 iron) or Hide Armor (40 wood, 30 food) from scratch.
- The Smithy **reworks** any item one tier up (Iron → Steel → Silvered → Wright's Blade; Hide → Mail → Emberwright Plate) for that tier's cost and Smithy level in §5.3.6. The Wright's Blade still needs the Citadel. The Smithing skill cuts every crafting and rework cost (§5.8.6).
- **A reworked item keeps its bonus lines**, so a lucky early drop can grow with the hunter.
- The Wright's Blade is reached only by rework; it never drops.
- **Equipping** is free whenever the hunter isn't on a contract or in a Delve. Unequipped items wait in **Stores**.

#### 5.11.2 Loot *(D305)*
- **Each contract won** rolls once for an item: chance `loot.chanceBase` 10% + `loot.chancePerTier` 5% × tier (15% at tier 1, 35% at tier 5). Failures never drop items.
- **The base piece:** weapon or armor (half each), then by the contract's tier: tiers 1–2 Iron Blade or Hide Armor; tier 3 Steel Blade or Mail; tier 4 Silvered Blade or Mail; tier 5 Silvered Blade or Emberwright Plate.
- **Rarity** sets the number of **bonus lines**: **Fine** 1, **Rare** 2, **Heroic** 3, weighted 65 / 27 / 8 (`loot.rarityWeights`).
- **The line pool** (each line goes into an existing combat bucket, §5.0; no line twice on one item):

| Line | Bucket | Size |
|---|---|---|
| Might | stat% | +6% |
| Health | stat% | +8% max Health |
| Armor | flat | +2 |
| Speed | flat | +1 |
| Crit | crit chance | +4 points |
| Bane of a family | outgoing% vs one contract family (rolled) | +12% |

- Loot is seeded (`${gameSeed}:loot:${contractId}`), so it is fixed at launch like the fight.
- **Delves:** a beaten guardian drops one item (§5.10.7).

#### 5.11.3 Hunter ranks and stars *(D309, D310)*
- **Ranks:** **Apprentice → Wright → Master-Wright** (the order's titles; the hold's Ranks keep their name).

| Rank | Needs | Gives |
|---|---|---|
| Apprentice | — | 1 talent point |
| **Wright** | Highest level ever ≥ `rank.wrightLevel` 5, and `rank.wrightTrophies` 20 trophies | The use-skill (§5.11.4); 3 talent points in all |
| **Master-Wright** | Highest level ever ≥ `rank.masterLevel` 10, and `rank.masterTrophies` 60 trophies | 5 talent points in all |

- Trophies of **any family** pay for ranks, from the trophies **on hand** this cycle (earned minus spent). Spending never lowers the Trophy Hall bonus or the Embers conversion, which count trophies earned (A7).
- **Stars** (0–`star.max` 5): star *n* costs `star.embersPerStar` 20 × *n* Embers and `star.trophiesPerStar` 10 × *n* trophies.
  - Each star adds `star.growthPerStar` 1 percentage point to the hunter's Health and Might growth per level (§5.3.2), recomputed at once.
  - Stars open **talent tiers**: tier 1 always, tier 2 at 2 stars, tier 3 at 4 stars (`talent.tierStars`).
- **Ranks, stars and talents are kept forever.** Levels still halve at the Long Night (§5.9.7). Ranks read the highest level ever, so a rank is never lost.
- **Breakdowns:** every stat breakdown shows the star line ("2 stars: +2% growth per level"); Rank up and Add a star show their costs.

#### 5.11.4 Use-skills *(D312, D314)*
- Every hunter has **one personal use-skill**, unlocked at Wright. It **fires on its own**, on a fixed trigger:
  - every *N*th of the hunter's own actions;
  - the hunter's first action;
  - once per fight when something happens.
- **No new dice:** an effect that replaces a roll still draws it.
- Use-skills work in contracts, the Last Stand and Delves. The odds and Suggest include them, and each firing gets its own log line.
- The eleven are in §8.5b.
- **The meter knock-back** of the Delves (Toll, §8.8) becomes a general fight rule from v0.8.

#### 5.11.5 Talents and the yard *(D313, D315)*
- **Talents:** each role has 3 branches × 3 tiers (§8.11). Each talent costs 1 point (points from rank, §5.11.3), and a tier is open only with enough stars.
  - **Respec is free** whenever the hunter isn't on a contract or in a Delve.
  - Talents are small bonuses in existing buckets.
- **The yard:** every hunter at the hold who isn't on a given contract earns yard XP when that contract finishes. That means active or reserve, injured or not, but not the dead and not hunters in a Delve.
  - **Amount:** `yard.share` 25% of the XP each hunter on that contract earned (after Drill Yard, the Tally Stick and Command).
  - **Cap:** yard XP never takes a hunter past the level of the hold's **third-highest** hunter (`yard.capRank` 3). It only catches people up.
  - The away sheet gets one line, for example: *"The yard: Arvid reached level 4."*

#### 5.11.6 Legendaries *(D306, D314)*
- **Six Legendaries**, each found once at a fixed milestone and **kept forever**, each with one named effect (§8.12). They are never random and never from Delves.
- They go in a third slot, the **keepsake** (`keepsake.slots` 1), which holds only the named effect, no base stats.
  - Swapping keepsakes is free whenever the hunter isn't on a contract or in a Delve.
  - A keepsake stays with its hunter through the Long Night.
- **In-world**, like the hold's relics (`lore-secrets.md` §7), they are objects that held a warden's warmth.

#### 5.11.7 Stores and Salvage *(D307)*
- **Stores** holds every unequipped item, up to `stores.cap` 40. It is a list under the Hunters tab (§9.16).
- **Salvage** returns `salvage.share` 25% of the iron and silver that went into the item (crafting and reworks; loot counts its base tier's crafting costs), plus `salvage.perLine` 20 silver per bonus line. Salvaging a Legendary isn't allowed.
- Loot that arrives when Stores is full is **salvaged automatically**, and the away sheet says so.
- **At the Long Night**, every item except Legendaries is gone.

#### 5.11.8 What's still for later
- Delve trophies stay off; events (v0.9) decide whether bosses drop items.
- Hunter relic slots beyond the keepsake are not planned.
- Use-skill upgrades at Master-Wright are not planned.

---

## C. §6.1 Player model — **add to "What the policy does at each check-in"**

- **Items** *(v0.8, D321)*: rework the weakest slot first, as gear upgrades worked (same affordability rule and Rank-up reserve). Equip loot that scores higher on a fixed **item score** (Might, Armor and bonus lines with fixed policy weights). Salvage the lowest-scoring items once Stores holds more than 30.
- **Ranks** *(v0.8)*: rank up as soon as a hunter qualifies and the trophies are on hand.
- **Embers** *(v0.8)*: Hearth upgrades first, cheapest first (as v0.4); then the cheapest star, ties going to the highest-level hunter.
- **Talents** *(v0.8)*: a fixed pick order per role. **Legendaries:** a fixed table of who wears which.
- **Yard XP and Delve rewards** need no decisions.
- **The Delver's Re-roll** *(v0.8, D321)*: used once a run, on the first offer where every card is Faint.

---

## D. §6.2 Targets — **add after the v0.7 rows, and replace the Idle-only row**

| Moment | Target | Enforced from |
|---|---|---|
| Act V lands in its cycle *(D322)* | D5-01 to D5-06 and D5-08 by the end of cycle 5; D5-07 with the next warden (Standard) | v0.8 |
| Late recruits catch up *(D322)* | All five name letters (Ostap at levels 5 and 8; Toma, Sigrun and Arvid at 5) by the end of cycle 5 (Standard) | v0.8 |
| First Wright *(D322)* | By the end of cycle 1 (Standard) | v0.8 |
| Idle-only vs Delver *(D20, D271, D322)* | Standard reaches the last of "all content" no more than 1.3× later than the Delver (median of the Monday seeds). "All content" for v0.8: every judged document of Acts I–V, the recipe book at 36 of 36, all six Ribbonshade names, every warden skill at level 4, the five letter names, and every hunter at Wright | v0.7 / v0.8 |

*Add to "Reported only":* "stars per cycle, items by rarity per cycle, Legendaries found, Delve XP (v0.8)."

---

## E. §6.5 Performance budgets — **replace the "Simulator: full suite" row**

| **Simulator: full suite** | **≤ 5 min per CI job** *(D320)* | All policies and checks; the runs play in parallel, one per core (D169), split across parallel CI jobs whose results a final job combines and judges. Never trimmed: same runs, seeds and rows |

---

## F. §8.5 Hunters — **add after §8.5a**

#### 8.5b Use-skills *(v0.8, D312, D314)*

Unlocked at Wright. "Every 3rd action" counts the hunter's own actions in that fight (3rd, 6th, 9th…). "Knocks the meter back N" lowers a monster's turn meter by N. Where an effect replaces a roll, the roll is still drawn. Numbers are tunable, in content.

| Hunter | Use-skill | Trigger | Effect |
|---|---|---|---|
| Halvar Two-Smokes | **Banked Smoke** | Every 3rd action, instead of attacking | Until his next action, every hunter takes −20% damage (taken%, inside the 75% cap) |
| Zora Sedlak | **Boathook** | Every 3rd action | If the hit lands, it knocks the target's meter back 30 |
| Old Ostap | **Bonesetter's Hands** | Every 4th action | If he heals on that action, the heal is doubled |
| Bjarna Ice-Hand | **Rime-Dipped** | Every 3rd action | If the hit lands, the target is −25% Speed for its next 2 actions (status%) |
| Vesna of the Weir | **Stopping Root** | Her first attack in a fight | The target takes Venom damage equal to her Might at the start of each of its next 3 actions (ignores Armor; uses its Venom resistance) |
| Radek the Gravedigger | **Shovelful** | Every 3rd action | That attack ignores Armor |
| Sigrun Halfhand | **The Other Hand** | Her first hit in a fight | It is a crit |
| Toma Kettle | **Rattle the Pots** | His first action, instead of attacking | Every monster's meter is knocked back 40 |
| Stanko Sleepless | **Up Before the Wolves** | Start of each fight | His meter starts full, so he acts at tick 1 |
| Herdis Strayfinder | **Shepherd's Crook** | Every 3rd action | If she heals on that action, she also clears the healed hunter's ability effects: slowed (Hamstring), held, charmed, Chill |
| Arvid Netmender | **Hold the Stair** | Once per fight, when another hunter would be downed while Arvid stands | Arvid takes that hit instead, after his own Armor and taken% (it can down him) |

---

## G. §8.11 Talents — **add after §8.10a**

### 8.11 Talents *(v0.8, D313, D314)*

1 point each. Tier 2 opens at 2 stars, tier 3 at 4 stars. Respec is free while the hunter isn't on a contract or in a Delve. Numbers are tunable, in content.

**Vanguard**
| Tier | Wall | Retort | Warden |
|---|---|---|---|
| 1 | +1 Armor | +5% Might | While he stands, the other hunters take −3% damage |
| 2 | +8% max Health | +3 points crit chance | Monsters target him with weight 4 instead of 3 |
| 3 | −8% damage taken | +10% damage dealt | While he stands, the other hunters take −5% more damage (−8% in all with tier 1) |

**Striker**
| Tier | Edge | Hunt | Pace |
|---|---|---|---|
| 1 | +3 points crit chance | +3% damage vs a Studied or Mastered species (knowledge bucket) | +1 Speed |
| 2 | Crits deal ×1.6 instead of ×1.5 (a higher multiplier from a trait or blessing wins) | +5% Might | +1 Speed |
| 3 | +5 points crit chance | +10% damage dealt | +4 points hit chance |

**Mender**
| Tier | Herbs | Hands | Watch |
|---|---|---|---|
| 1 | Potions she carries are 10% stronger | +8% healing done | +1 Armor |
| 2 | Potions she carries are 10% stronger more (+20% in all) | +8% healing done more (+16%) | +8% max Health |
| 3 | Her Mending Draught fires below 40% Health instead of 30% | She heals anyone below 80% Health (instead of 70%) | Her attacks deal 75% of her Might instead of 50% |

The Herbs branch does nothing in Delves (no potions there, D254); the talent sheet says so.

---

## H. §8.12 Legendaries — **add after §8.11**

### 8.12 Legendaries *(v0.8, D306, D314)*

Kept forever, worn in the keepsake slot, one of a kind. Numbers are tunable, in content.

| Legendary | Found when… | Effect |
|---|---|---|
| **The Barley Knot** | Every Field & Forest species Mastered | Once per fight, the first time a monster's ability would cost the holder an action, it doesn't (Steadfast's rule) |
| **Wolf-Tooth String** | Every Beasts & Wilds species Mastered | +3% Might (status%, stacking) for each monster downed this fight, up to +15% |
| **Coffin Silver** | Every Restless Dead species Mastered | Each of the holder's direct hits adds a Silver sub-hit of 0.15 × Might (no Armor, its own log line; stacks with the blade's) |
| **Ferryman's Coin** | Every Water Spirit species Mastered | Once per fight, the first time the holder drops below 25% Health and is still standing, they recover 30% of max Health |
| **Rune Nail** | Every Cursed species Mastered | The holder's direct attacks ignore 25% of the target's Armor |
| **Yrsa's Thole** | Act V's Last Stand (with D5-06) | The holder's meter starts each fight at 50, and +2 Speed |

On the Act V stand's result sheet, after D5-06: *"Wrapped in the same oilcloth: a thole pin of black oak, worn smooth by a rower's hand."*

---

## I. §9.11 What exists when — **add a row**

`| v0.8 | + rank, stars, talents, use-skill and three slots on the hunter sheet; the slot picker; Stores with Salvage; Rank up and Add a star; loot, Legendary, rank-up and yard lines on the away sheet and results; Act V's documents and scenes; the Rift card's sixth-door line (§9.16) |`

---

## J. §9.12 Art direction — **add a bullet**

- **v0.8 (D324):** 16 px icons for the 7 base pieces; 4 item rarity frames (Common, Fine, Rare, Heroic), distinct from the Delve frames; 6 keepsake icons; a star icon; 3 rank badges; icons for the nine older brews. A contact sheet for the owner's review in the playtest.

---

## K. §9.16 Hunter depth screens — **add after §9.15**

### 9.16 Hunter depth screens *(v0.8, D326)*

- **Hunter sheet:**
  - The rank badge and title ("Wright"), the stars, and the use-skill (name, trigger, effect, "unlocks at Wright" while locked).
  - **Three slots:** weapon, armor and keepsake.
  - **Talents:** three branch columns, locked tiers showing "needs 2 stars", free respec, a badge while points are unspent.
  - **Rank up** and **Add a star**, each with its cost and a breakdown; disabled with the reason when not possible ("needs highest level 5", "needs 40 Embers").
  - Every stat breakdown shows the star and talent lines.
- **Slot picker:** opens from a slot.
  - Items that fit, best first, each with its rarity frame, bonus lines and the difference against what's worn ("+3 Might, −1 Armor").
  - **Craft** (Iron Blade or Hide Armor) and **Rework** (the worn item one tier up) with costs, disabled with the reason.
- **Stores** (Hunters tab): every unequipped item ("23 of 40"), sortable by slot and rarity, with **Salvage** showing exactly what it returns.
- **Away sheet and results:** one line each for loot (*"Loot: a Rare Steel Blade."*), auto-salvage, a Legendary found, a rank-up, and yard catch-up.
- **The Hearth:** one line, *"Stars are bought on each hunter's sheet."*
- **Rift card:** the sixth-door line once Act V's stand has opened the Unlit's door.

---

## L. §7.10 Hunter depth — **add after §7.9** *(apply with T8.3, not in the docs commit)*

### 7.10 Hunter depth *(v0.8, D300–D328)*

Every constant here is tunable unless marked **locked** (D325).

| Formula | Expression | Constants (key = starting value) | § |
|---|---|---|---|
| Loot chance | per contract won | `loot.chanceBase` = 0.10, `loot.chancePerTier` = 0.05 | 5.11.2 |
| Loot rarity | weights per item | `loot.rarityWeights` = { fine: 65, rare: 27, heroic: 8 } | 5.11.2 |
| Bonus lines | sizes | `loot.lines` = { might: 0.06, health: 0.08, armor: 2, speed: 1, crit: 0.04, bane: 0.12 } | 5.11.2 |
| Stores | cap | `stores.cap` = 40 **(locked)** | 5.11.7 |
| Salvage | share of iron and silver put in; silver per line | `salvage.share` = 0.25, `salvage.perLine` = 20 | 5.11.7 |
| Ranks | highest level ever needed; trophies | `rank.wrightLevel` = 5 **(locked)**, `rank.masterLevel` = 10 **(locked)**, `rank.wrightTrophies` = 20, `rank.masterTrophies` = 60 | 5.11.3 |
| Talent points | by rank | `talent.points` = { apprentice: 1, wright: 3, masterWright: 5 } **(locked)** | 5.11.3 |
| Talent tiers | stars to open tiers 1–3 | `talent.tierStars` = [0, 2, 4] **(locked)** | 5.11.3 |
| Stars | star n costs n × these; growth per star | `star.max` = 5 **(locked)**, `star.embersPerStar` = 20, `star.trophiesPerStar` = 10, `star.growthPerStar` = 0.01 | 5.11.3 |
| Keepsake | slots per hunter | `keepsake.slots` = 1 **(locked)** | 5.11.6 |
| Yard XP | share of a contract's XP; cap at the nth-highest level | `yard.share` = 0.25, `yard.capRank` = 3 **(locked)** | 5.11.5 |
| Delve XP | per floor cleared × tier; guardian × tier | `delve.xpPerTier` = 10, `delve.guardianXpPerTier` = 20 | 5.10.7 |
| Delve Command XP | per floor cleared | `skill.xp.command.delveFloor` = 1 | 5.10.7 |
| Guardian loot | rarity weights | `delve.guardianLootWeights` = { fine: 50, rare: 35, heroic: 15 } | 5.10.7 |

Use-skill, talent and Legendary numbers live with their content (§8.5b, §8.11, §8.12), as every earlier trait, ability and blessing does.

---

## M. Judgment calls — **add after the v0.7 list**

## Judgment calls added in the v0.8 flesh-out (D300–D328)

1. **Gear climbs by rework,** keeping bonus lines and today's costs (D304).
2. **Legendaries are milestone rewards, kept forever, in a keepsake slot;** never random, never from Delves (D306).
3. **Stars cost Embers and trophies,** which gives Embers a use again (D310).
4. **Ranks read the highest level ever,** so a Long Night never takes one away (D309).
5. **Yard XP goes to every hunter not on the contract,** capped at the third-highest level (D315).
6. **Delve XP and loot only while a run pays Riftglass,** so nothing can be farmed (D316).
7. **Act V's letters come up through the crack,** on ordinary conditions; Delves still carry no plot (D302).
8. **The simulator splits into parallel CI jobs,** each under 5 minutes (D320).
