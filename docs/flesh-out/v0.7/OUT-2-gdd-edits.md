# OUT-2 — Edits to `docs/gdd.md` (v0.7 flesh-out, D244–D279)

Each block says **replace section** (the whole section, heading included) or **add after** (a new block after the named one), or **replace row / sentence** for small fixes. Numbers are starting values (tunable unless §7.9 marks them locked). Every new proper noun is a working name until the T7.4 search (OUT-6).

---

## A. Small fixes elsewhere

**§3.1 (Session row)** — *replace "Relics, rift currency, recipes, lore" with:* "Riftglass, reagents, Ember-echoes, Delve relics; recipes"

**§4.1, the Trophies row** — *replace the Source cell "Contract and Delve kills" with:* "Contract kills (Delves give no trophies in v0.7, D262; v0.8 decides, D278)"

**§4.1, the Relics row** — *replace "Delves (v0.7)" with:* "Delves (v0.7: six Delve relics, each also with an idle source; their effects work only in Delves, D261)"

**§4.1, the Riftglass row** — *replace the Spent-on cell with:* "The Riftglass shop: Late hours (offline cap), alternate traits, hold cosmetics, Delve upgrades (§5.10.8)"

**§4.3, the Delve-optional paragraph** — *add at the end:* "From v0.7 this is checked two ways: a content test lists every Delve reward with its idle source or its sidegrade / convenience / Delve-only mark, and the Idle-only row (§6.2) compares the `standard` and `delver` players (D269, D271)."

**§5.3.1, Reserve bullet** — *unchanged in v0.7.* (v0.8 adds yard XP, D275.)

**§5.5, first paragraph** — *replace "The party fights one monster *(groups of monsters come in v0.7+ with Delves)*." with:* "The party fights one monster on contracts and in the Last Stand. In Delves it fights groups of 2–3 (§5.10.4); the group rules reduce to these rules exactly when there is one monster."

**§5.6.1, the Deep row** — *replace with:* `| Deep *(Delve guardians from v0.7, D252)* | Unlit's Breath, the Forgotten, the Dross-Tide (§8.3) | — (never investigated) |`

**§5.9.6, second bullet** — *replace "there are no slots until there are more relics (v0.7)" with:* "there are no relic slots: the six Delve relics of v0.7 work only inside Delves (§5.10.7, D261)"

**§5.14.1, the "unwritten act" bullet** — *add after the Act III bullet:*
- **From Act IV on (D246):** an act that ships while a save is in a story-less cycle starts **on load in the current cycle**, with fresh counters: "the 1st Field & Forest Spirits contract won in Act IV" counts from that moment. A Rank document is found on load only if that Rank is already behind the save in this cycle. Counts recorded during story-less cycles are ignored. The on-load line is *"Pechko comes out from behind the stove before you've got your coat off, with something wrapped in oilcloth."* and D4-01 plays. A new game reaches Act IV the cycle after Act III's stand.

**§5.14.2, Types bullet** — *replace with:* "**Types** (`lore-secrets.md` §15.1): letter, journal page, ledger page, testament, field note, resident scene, and (v0.7) **Ember-echo**, which belongs to no act (§5.10.7)."

**§5.14.2, Fixed conditions bullet** — *add to the list of conditions:* "the act beginning (D4-01), and the nth contract won in an act against a family (D4-02, D4-03)."

**§5.14.3, Accounts** — *replace "(Act I: … Act III adds **Yrsa's choice**)" with:* "(Act I: the Night of the Fall, the apprentices; Act II adds the bell; Act III adds **Yrsa's choice**; Act IV adds **The light in the window**)". *And add to Library:* "From v0.7 the Library has an **Echoes** shelf (Ember-echoes from Delves)."

**§5.14.3, Later cycles bullet** — *add:* "When Act IV begins, the line reads *"Ilse is back from Velkvik with the archive. Pechko is waiting at the stove with something wrapped in oilcloth."*"

**§10 Out of Scope** — *no change.*

---

## B. §5.10 Delves — **replace section**

### 5.10 Delves *(v0.7; ⚑ v0.7 flesh-out, D244–D272)*

Delves are short, active, optional runs into the rift under the Hearth Hall (`lore-secrets.md` §29). They never touch the idle path's pace: everything they give has an idle source, or is a sidegrade, a convenience, or works only inside Delves (D20, §4.3).

#### 5.10.1 Access *(D249, D266)*
- Delves open **for good** the first time any warden reaches the Keep, with the rift scene (Pechko and the crack behind the stove).
- Entry is a **Rift card** on the Hold screen (§9.15). Entering costs nothing (D254).
- **Party:** `delve.partySize` 3 hunters (locked) from the active roster. Hunters on a contract or recovering can't enter; hunters in a run can't be launched on contracts until it ends (D253).

#### 5.10.2 A run *(D248)*
- `delve.floors` 6 floors (locked), then the **guardian**.
- Each floor's fight is worked out **at once** by the contract fight rules (§5.5, with the group rules below), from a seed (`${gameSeed}:delve:${runNumber}`, sub-seeded per floor), and **played back** as a short animation with Skip and Log (§9.15). Every fight replays from its seed.
- Between floors: the doors, then a blessing (§5.10.5).
- The run is **saved at every floor** and **pauses when the app closes**; no progress while away.
- **Leave run** is available between floors: it ends the run and keeps what it earned.
- **Starting the Last Stand ends a paused run** and keeps what it earned (the stand's confirmation says so) (D267).

#### 5.10.3 Depth *(D249)*
- Fixed when the run starts, from the hold's Rank: floors 1–3 at `delve.baseTier` (Keep 2, Citadel 3, Bastion 4); floors 4–6 at that +`delve.upperTierStep` (1); the guardian at +`delve.guardianTierStep` (2).
- Past tier 5, the Last Stand's scaling continues (Health and Might ×1.35, Armor ×1.15 per step, §5.9.3).
- A Rank-up during a run doesn't change it.

#### 5.10.4 Groups and group combat *(D250, D251)*
- **Group size:** `delve.groupSize` 2 on floors 1–3, 3 on floors 4–6.
- **Members:** contract monsters of the floor's tier at `delve.memberHealth` 0.5 × Health and `delve.memberMight` 0.6 × Might (Armor and Speed unchanged).
- **One family per floor**, picked by the run's seed; species drawn from that family's species whose tier range includes the floor's tier (above tier 5: those that reach tier 5), repeats allowed. The Deep family never appears on floors. The family shows on the doors before the floor (§5.10.5).
- **[?] Q20 — monsters in Delves are shown by name** (recommended; no investigation in Delves, and showing them doesn't change the bestiary's Identified state). Pending the owner's answer. Delve kills of folklore and Cursed species **don't** count toward the bestiary (D262).
- A **Ribbonshade in a Delve never carries a name** (`lore-secrets.md` §8); Seal-burn works as usual.
- **Targeting (no new dice):**
  - The Vanguard, and the Mender when she attacks, hit the **front** monster: the first standing in group order.
  - The Striker hits the standing monster with the **lowest Health** (ties: group order).
  - The Mender's heal rule (§5.3.3) and every monster's targeting (weight 3 on Vanguards, §5.5) are unchanged.
- **Same-tick order:** higher meter, then higher Speed, then hunters before monsters, then party slot order, then group order.
- **Passives:** two passives with the same name don't stack (the same-name rule, §5.0). Two Gloam-moth swarms lower hit chance by 10 points, not 20.
- **The fight ends** in success when every monster is at 0 Health, in failure when every hunter is down, and in failure at tick 400.
- **`rulesVersion` 4** *(owner-approved, D251)*: the §5.5.1 fight and every golden fight replay **line for line**; if one changes, the build stops and asks.

#### 5.10.5 Doors and blessings *(D255, D256, D257)*
- **Doors:** each of floors 1–6 is entered through one of `delve.doors` 2 doors (locked). The two show **two different patrons** picked by the run's seed, never the same pair as the floor before, and **the family of the floor ahead** ("Ahead: Restless Dead"). The guardian's room has no doors.
- **Offers:** behind a door, `delve.offers` 3 blessings (locked) from that patron's pool **not yet taken this run**.
  - Each card rolls its rarity by `delve.rarityWeights` (Faint 70, Warm 25, Bright 5). If that rarity has nothing left in the pool, the next lower rarity is used, then the next higher.
  - On floor 6, if no card is Warm or Bright, the last card is raised to Warm (`delve.lastFloorMinRarity`).
- **Blessings** last for the run only, apply to **the whole party** unless they name a role, and go into the existing combat buckets (§5.0; the 75% cap on damage taken holds). No duplicates in a run. The 48 blessings are in §8.8.
- **New rules** (marked ★ in §8.8) work only inside Delves. At most two kinds per patron; the Unlit may use four drawback switches.
- **The Unlit** (after Act V's Last Stand; a debug switch for testing): once unlocked, its door replaces one of the two on `delve.unlitDoorChance` 25% of floors, at most `delve.unlitDoorsPerRun` 1 per run (locked). Its drawbacks show as a red "but…" line on the card and as negative lines in breakdowns.
- **Delve upgrades** (bought with Riftglass, §5.10.8): **Chosen start** (at a run's start, pick a patron and take 1 of 3 Faint blessings from it) and **Re-roll** (once per run, replace an offer's three cards with three new ones).

#### 5.10.6 Health, downing and the end *(D253)*
- Health carries from floor to floor. Before each new floor (and before the guardian), every standing hunter recovers `delve.recovery` 20% of max Health.
- A downed hunter is **out for the rest of the run**.
- If all three are down, the run ends and keeps what it earned so far.
- **Nothing follows hunters home:** no injuries, deaths or recovery timers. **[?] Q21 — no hunter or warden-skill XP from Delves in v0.7** (recommended), pending the owner's answer.

#### 5.10.7 Rewards *(D258, D261, D262, D263)*

| Reward | When | Notes |
|---|---|---|
| Riftglass | `riftglass.perFloor` 2 per floor cleared; `riftglass.guardian` 4 for the guardian | Drawn from the allowance (§5.10.8). When the allowance is empty, a run pays none ("The rift is quiet tonight") |
| Reagents | `delve.reagentsPerFloor` 1 unit of a drop of the floor's family per floor cleared (the family's drops in §8.3, picked by seed); `delve.guardianReagents` 2 units of the guardian's drop | Same reagents as contracts (idle source exists) |
| Ember-echoes | The first time ever a Faint, a Warm and a Bright blessing is taken from a patron | `lore-secrets.md` §29; the Library's Echoes shelf; never required |
| Delve relics | Their Delve source (§8.10a) | Each also has an idle source; effects only in Delves |
| Deep bestiary | Each guardian defeated counts as a kill of that Deep species | Knowledge levels as §5.6.2; Delve-only, so excluded from the true-ending count |
| — | No trophies; folklore and Cursed kills don't count toward the bestiary | D262 |

- The run records, for v0.8: Delve kills per family and guardians beaten (D278). The result sheet leaves room for an item line (v0.8).

#### 5.10.8 Riftglass *(D258, D259)*
- **The allowance:** it grows by `riftglass.weeklyCap` ÷ 7 (10) per day, continuously, inside `advance()` (including offline time), and banks up to `riftglass.bankWeeks` × `riftglass.weeklyCap` (140). Riftglass earned in a run is taken from it. Earned Riftglass has no cap and is kept forever (it survives the Long Night).
- **The shop** (Rank screen, beside The Hearth). Every cost is tunable (`riftglass.shop.*`).

| Item | Effect | Cost |
|---|---|---|
| **Late hours** (5 levels) | +1 h offline cap per level, inside the 24 h ceiling (§5.2) | 30 / 45 / 60 / 75 / 90 |
| **Alternate trait** (one per hunter) | Unlocks that hunter's alternate second trait (§8.5a); switch freely while the hunter isn't on a contract or in a run | 40 each |
| **Gatehouse banners**, **Wall lanterns**, **Carved Hearth Hall door**, **Watchtower bell** | Cosmetic only (the hold scene) | 25 each |
| **Chosen start** | §5.10.5 | 60 |
| **Re-roll** | §5.10.5 | 60 |

#### 5.10.9 What the simulator's Delver does *(D270)*
See §6.1.

---

## C. §5.11 Hunter depth — **replace section**

### 5.11 Hunter depth *(v0.8, outline; directions decided at the v0.7 flesh-out, D273–D278)*

- **Items (D273):** the Smithy crafts every weapon and armor that exists today (same names, same numbers) as **Common** items into an inventory. Loot (contracts; later, events) adds **Fine → Rare → Heroic → Legendary** items with extra bonuses. The Smithing skill keeps cutting crafting costs. The **Wright's Blade** is crafted only, never a drop. **Every item resets at the Long Night**, as gear does (A4).
- **Hunter ranks (D274):** the order's titles **Apprentice → Wright → Master-Wright** (the hold's Ranks keep their name), from XP plus family trophies.
- **Stars (D274):** from trophies plus rare drops; they raise stat growth per level and open talent tiers. **Ranks and stars are kept forever;** levels still halve at the Long Night.
- **Use-skills and talents (D276):** each hunter has one **personal use-skill**, unlocked at Wright, firing automatically on a fixed rule (deterministic, golden-testable). **Talent trees** are passive: 3 branches per role; points from ranks; tiers opened by stars.
- **Relics (D277):** the 12 relics stay as they are; "relics for hunters" is met by **Legendary items**, each with one fixed, named effect.
- **Inventory on a phone (D277):** no grid. A slot on the hunter sheet opens a picker (best first, with the difference against what's worn); a **Stores** list under Hunters (cap about 40) with **Salvage** for iron and silver.
- **The reserve (D275):** reserve hunters earn 25% of the contract XP the active roster earns ("drilling in the yard"), never past the active roster's lowest level.
- **From Delves (D278):** v0.7 records Delve kills per family and guardians beaten; v0.8 decides whether Delves give trophies or loot, under D20.
- **Open at the v0.8 flesh-out:** rank and star thresholds; loot sources and drop rates; the 11 use-skills; talent contents; the inventory cap and salvage values; how much yard XP; the checks.

---

## D. §6.1 Player model — **replace the table and add the Delve rules**

| Policy | Check-ins (local time) | Sessions | Used for |
|---|---|---|---|
| **Standard** (`standard`, D16) | Weekdays: 07:00, 10:00, 12:30, 16:00, 21:00. Weekends: 09:00, 13:00, 17:00, 21:00 | **None: never Delves** (D269) | All main targets; the Idle-only row's baseline |
| **Delver** (`delver`, *from v0.7*, D269) | Same as Standard | One 20-min session at 15:00 on weekends, plus Wednesday at 19:00: Delves | The v0.7 Delve rows only; the Idle-only row's comparison |
| **Light** | 07:00, 12:30, 21:00 every day | None | "Still works for a busy week" checks |
| **Heavy** | Every 2 h from 07:00 to 23:00 | One per day *(no Delves)* | "Can't be rushed too fast" checks |
| **Opening** *(⚑ revision A10)* | Acts every 10 s for the first 15 min of a fresh game, using the default job priority and greedy best-payback buys; then switches to Standard | — | Opening targets (first Cottage, first Mine) |

- **Start time:** runs start Monday at 07:00. A second run starts Saturday at 09:00 to catch weekend-start problems **[JC]**. **The Delver runs the Monday seeds only** (D272).

*Add to "What the policy does at each check-in", after the v0.6 bullets:*
- **Delves** *(Delver only, v0.7, D270)*: in each session, it runs Delves until the allowance is empty, up to 3 runs, with the suggested three (Vanguard, Striker, Mender if it has them, highest levels). **Door:** the patron it has taken most this run (ties: Hearth-Crone, Pale Smith, Wolf Beneath the Hill, Weaver, Drowned Bell). **Blessing:** highest rarity, then list order. It never leaves a run early. **Riftglass:** Chosen start and Re-roll first, then Late hours; never traits or cosmetics. Outside sessions it plays exactly like Standard.

---

## E. §6.2 Targets — **add after the last v0.6 row** (replace the existing Idle-only row)

| Moment | Target | Enforced from |
|---|---|---|
| Act IV lands in its cycle *(D271)* | D4-01 to D4-06 and D4-08 by the end of cycle 4; D4-07 with the next warden (Standard) | v0.7 |
| First guardian beaten *(D271)* | By the end of cycle 2 (Delver) | v0.7 |
| Idle-only vs Delver *(D20, D271)* | Standard reaches the last of "all content" no more than 1.3× later than the Delver (median of the Monday seeds). "All content" for v0.7: every judged document of Acts I–IV, the recipe book at 36 of 36, all six Ribbonshade names, every warden skill at level 4 | v0.7 |

*Replace "Reported only (v0.6): …" with:* "Reported only: the stand band per cycle (with waves), skill levels per cycle, properties found per cycle (v0.6); Riftglass per week, floors reached per run, Delve relics found (v0.7, Delver)."

*Add under the table:* "**Content test (v0.7, D271):** every Delve reward is listed with its idle source or marked sidegrade, convenience or Delve-only; a reward with neither fails the test."

---

## F. §7.9 — **add after §7.8**

### 7.9 Delves *(v0.7, D244–D272)*

Every constant here is tunable unless marked **locked** (D268).

| Formula | Expression | Constants | § |
|---|---|---|---|
| Party, floors, doors, offers | fixed shape of a run | `delve.partySize` = 3 **(locked)**, `delve.floors` = 6 **(locked)**, `delve.doors` = 2 **(locked)**, `delve.offers` = 3 **(locked)** | 5.10.2, 5.10.5 |
| Depth | floors 1–3 at base; 4–6 at base + step; guardian at base + guardian step | `delve.baseTier` = { keep: 2, citadel: 3, bastion: 4 }, `delve.upperTierStep` = 1, `delve.guardianTierStep` = 2 | 5.10.3 |
| Group | members per floor; each a contract monster of the tier × these | `delve.groupSize` = { floors1to3: 2, floors4to6: 3 }, `delve.memberHealth` = 0.5, `delve.memberMight` = 0.6 | 5.10.4 |
| Guardian | Deep species of the tier × this Health | `delve.guardianHealth` = 2 | 5.10.4, 8.3 |
| Recovery | standing hunters recover this share of max Health before each floor | `delve.recovery` = 0.2 | 5.10.6 |
| Rarity | weights per offered card; floor 6's minimum | `delve.rarityWeights` = { faint: 70, warm: 25, bright: 5 }, `delve.lastFloorMinRarity` = 'warm' | 5.10.5 |
| The Unlit's door | chance per floor once unlocked; at most per run | `delve.unlitDoorChance` = 0.25, `delve.unlitDoorsPerRun` = 1 **(locked)** | 5.10.5 |
| Reagents | per floor cleared; from the guardian | `delve.reagentsPerFloor` = 1, `delve.guardianReagents` = 2 | 5.10.7 |
| Riftglass pay | per floor cleared; for the guardian | `riftglass.perFloor` = 2, `riftglass.guardian` = 4 | 5.10.7 |
| Allowance | grows `weeklyCap ÷ 7` a day; banks up to `bankWeeks × weeklyCap` | `riftglass.weeklyCap` = 70 **(locked)**, `riftglass.bankWeeks` = 2 **(locked, existing)** | 5.10.8 |
| Shop | costs | `riftglass.shop.lateHours` = [30, 45, 60, 75, 90], `riftglass.shop.trait` = 40, `riftglass.shop.cosmetic` = 25, `riftglass.shop.chosenStart` = 60, `riftglass.shop.reroll` = 60 | 5.10.8 |

Blessing numbers live with their content (§8.8), the guardians' with the monsters (§8.3), the Delve relics' with the relics (§8.10a), the alternate traits' with the traits (§8.5a), as every earlier ability, trait and brew does. *Remove the `riftglass.bankWeeks` row from its old place (the "Riftglass allowance (v0.7)" row) and point it here.*

---

## G. §8.3 Monsters — **add after the Cursed rows of each table**

**Stats** (Deep guardians; base tier 2; Delve-only; ×`delve.guardianHealth` Health on top of tier scaling):

| Monster | Family | Locations | Tiers | Health | Might | Armor | Speed | Atk |
|---|---|---|---|---|---|---|---|---|
| Unlit's Breath *(v0.7)* | Deep | Delve guardian | 2+ (any) | 260 | 14 | 2 | 12 | 1 |
| The Forgotten *(v0.7)* | Deep | Delve guardian | 2+ (any) | 240 | 18 | 5 | 10 | 1 |
| The Dross-Tide *(v0.7)* | Deep | Delve guardian | 2+ (any) | 320 | 16 | 10 | 6 | 1 |

**Resistances:**

| Monster | Steel | Silver | Fire | Frost | Rune | Venom |
|---|---|---|---|---|---|---|
| Unlit's Breath | 1.0 | 1.0 | **1.5** | 0 | **1.25** | 0 |
| The Forgotten | 1.0 | **1.25** | 1.0 | 1.0 | **1.5** | 0 |
| The Dross-Tide | 0.75 | 1.0 | 0.5 | **1.25** | **1.5** | 0 |

**Abilities and drops:**

| Monster | Ability (exact effect) | Clue tags | Drop (2 units) | Basis |
|---|---|---|---|---|
| Unlit's Breath | *Chill:* a hunter it hits receives 50% less healing for their next 3 actions (status%, refreshes). *Drain:* on each of its actions, every standing hunter loses 2% of max Health as Frost damage, ignoring Armor | — | rime salt | Original: a drifting cold (lore §12.2) |
| The Forgotten | *Nameless* (passive): +3% Might and +3% Health (stat%) for each of the 16 contract species not yet Studied (up to +48%); its breakdown lists them | — | noon poppy | Original: shapes no one remembers |
| The Dross-Tide | *Settling:* every 3rd action, its attack hits every standing hunter (each hit rolled and resolved as a direct attack; Armor applies) | — | river pearl | Original: dross given a shape |

*Coverage (§8.3.1) is unchanged: the Deep family never appears on contracts or in the Last Stand in v0.7.*

---

## H. §8.5a Alternate traits — **add after §8.5's Traits table** *(v0.7, D260)*

Bought once per hunter with Riftglass (§5.10.8); the hunter then switches freely between the two second traits while not on a contract or in a run. The first trait never changes. Simulated players never switch.

| Hunter | Second trait | Alternative | Exact effect |
|---|---|---|---|
| Halvar | Steady | **Smoke-Lunged** | Damage he takes from monster abilities (not direct attacks) is halved, after resistances, rounded half up (min 1) |
| Zora | Quick | **Long Hook** | +10 points crit chance |
| Ostap | Hard to kill | **Splint and Sling** | Recovery times −15% for the other hunters of any contract he joins |
| Bjarna | Fell-born | **Fjord-born** | +15% Might on river contracts |
| Vesna | Fen-born | **Field-born** | +15% Might on field contracts |
| Radek | Hard to kill | **Broad Back** | +10% max Health (stat%) |
| Sigrun | Lantern-bearer | **Forge-Eyed** | Party hit chance +5 points on ruin contracts |
| Toma | Quick | **Thrifty** | Provisions for contracts he joins −15% |
| Stanko | Quick | **Dipped Knife** | +15% Venom damage dealt (outgoing%) |
| Herdis | Hard to kill | **Rock-Footed** | +2 Armor (flat) |
| Arvid | Old Wright | **Fjord Axe** | +20% Might vs Water Spirits |

---

## I. §8.8 Patrons — **replace section**

### 8.8 Patrons and blessings *(v0.7; ⚑ v0.7 flesh-out, D255–D257)*

Who the patrons are is in `lore-secrets.md` §13 and §29: this world's dead, never gods; they give **blessings**, never "boons". Each has 8 blessings: 4 **Faint**, 3 **Warm**, 1 **Bright**. Effects apply to the whole party unless a role is named; they last for the run. ★ marks a new rule (Delves only). Numbers live in content and are tunable.

**Reading the effects:** "Might %" is stat%; "damage dealt" is outgoing%; "damage taken" is taken% (capped at 75% together); "Speed" and "Armor" with no % are flat; weapon tiers are Iron 1, Steel 2, Silvered 3, Wright's 4; armor tiers Hide 1, Mail 2, Plate 3. "Knocks the meter back N" lowers a monster's turn meter by N; it may go below 0.

**The Pale Smith** *(Askel Vel; craft, the old forge)*

| Rarity | Blessing | Exact effect |
|---|---|---|
| Faint | True Hammer | +2 Might per weapon tier |
| Faint | Rivet and Ring | +1 Armor per armor tier |
| Faint | Good Steel | +8% Might |
| Faint | Cooled Iron | −10% Fire and Frost damage taken |
| Warm | The Smith's Mark ★ | Every direct hit adds a Rune sub-hit: 0.15 × Might_eff × variance × crit × resist[Rune], no Armor, its own log line. Stacks with the Wright's Blade's sub-hits |
| Warm | Proud Plate | +3 Armor and −5% damage taken |
| Warm | Well-Hafted | +10% damage dealt by hunters with a weapon of tier 2 or more |
| Bright | Forge-Welded ★ | A hunter's Armor_eff also reduces damage from monster abilities and burns (Noon Heat, Seal-burn, Drain …), to a minimum of 1 |

**The Weaver** *(Zlata Vel; kinship, weaving)*

| Rarity | Blessing | Exact effect |
|---|---|---|
| Faint | Close Weave | +4% Might per different role in the party |
| Faint | Many Colours | +4% damage dealt per different damage type in the party |
| Faint | Shared Bread | The Mender's heals +15% |
| Faint | Shoulder to Shoulder | −4% damage taken per different role in the party |
| Warm | One Thread ★ | When the Mender heals, every other standing hunter also recovers 25% of the amount healed (rounded half up) |
| Warm | The Pattern Holds | +1 Speed per different role in the party |
| Warm | Warp and Weft | While a Vanguard stands, the other hunters take −8% damage |
| Bright | Mended Cloth ★ | Once per floor, the first hunter downed on that floor gets up at 30% of max Health on the Mender's next action, if she is standing (that action is spent on it) |

**The Wolf Beneath the Hill** *(Yrsa Varn; hunger, fury)*

| Rarity | Blessing | Exact effect |
|---|---|---|
| Faint | Long Teeth | +5 points crit chance |
| Faint | Lean and Grey | +8% Might |
| Faint | Hungry | +10% damage dealt, −1 Armor |
| Faint | Heavy Jaw | Crits deal ×1.75 instead of ×1.5 (with Cold-blooded, the higher applies) |
| Warm | The Pack Grows ★ | +3% Might (status%, stacking) for every monster the party has killed this run, up to +45% |
| Warm | Blood in the Snow | Hunters below 50% Health get +20% Might |
| Warm | Bare Throat | +15% damage dealt, −2 Armor |
| Bright | The Wolf's Share ★ | When a hunter's crit brings a monster to 0 Health and it stays down, that hunter takes one extra action at once (at most one extra action per action) |

**The Hearth-Crone** *(Dobrava Halsten; warmth, mending)*

| Rarity | Blessing | Exact effect |
|---|---|---|
| Faint | Broth on the Hob | Recovery between floors rises from 20% to 35% of max Health |
| Faint | Goose-Grease | The Mender's heals +20% |
| Faint | Wool Against the Skin | +10% max Health |
| Faint | Close the Door | −6% damage taken |
| Warm | A Price Paid ★ | At the start of each floor, every standing hunter loses 10% of their current Health (rounded down; never below 1) and gains +20% Might for that floor |
| Warm | Up Again | Hunters standing at the end of a floor recover to at least 50% of max Health (applied after the floor's recovery) |
| Warm | Sit Up With Them | The Mender heals anyone below 85% Health (instead of 70%) |
| Bright | The Long Vigil ★ | Once per run, when the last standing hunter is downed, every downed hunter gets up at once at 25% of max Health |

**The Drowned Bell** *(the Sent; stillness, depth)*

| Rarity | Blessing | Exact effect |
|---|---|---|
| Faint | Toll ★ | Each hunter's first hit on each monster in a fight knocks that monster's meter back 20 |
| Faint | Cold Water | Monsters −8% Speed |
| Faint | Muffled | Monsters −8% Might |
| Faint | Low Tide | Monsters' hit chance −5 points |
| Warm | Struck Bronze ★ | A crit makes its target lose its next action |
| Warm | Undertow | Every monster starts each floor with its meter at −30 |
| Warm | Slack Water | Monsters −15% Speed |
| Bright | Rung for the Sent | Every 4th action taken by the party in a fight knocks every standing monster's meter back 50 |

**The Unlit** *(the thing beneath; cold, forgetting — locked until Act V's Last Stand; debug switch)*

| Rarity | Blessing | Exact effect |
|---|---|---|
| Faint | Cold Hands | +20% Might, **but** −20% max Health |
| Faint | Unremembering | +25% damage dealt, **but** Studied and Mastered bonuses don't apply ★ |
| Faint | Still Blood | −15% damage taken, **but** no recovery between floors |
| Faint | Grey Eyes | +10 points crit chance, **but** −10 points hit chance |
| Warm | No Name | +35% Might, **but** the Mender never heals; she only attacks ★ |
| Warm | Drawn Thin | +4 Speed, **but** each hunter loses 3% of max Health on each of their own actions ★ |
| Warm | Cold Comfort | −30% damage taken, **but** this run pays no Riftglass (the allowance isn't drawn) ★ |
| Bright | What Was Burned | +50% damage dealt, **but** nothing restores Health this run: no healing, no recovery between floors, no getting up again |

---

## J. §8.10a Delve relics — **add after §8.10** *(v0.7, D261)*

Kept forever; shown on the Roll of Wardens. **Their effects work only inside Delves**, so they never touch contracts, the Last Stand or the hold. Each is found by **whichever of its two sources comes first**. No relic slots.

| Relic | Effect (in Delves) | Delve source | Idle source |
|---|---|---|---|
| **Spindle Whorl** | +5% Might | First guardian beaten in the Keep | Every Field & Forest species Studied |
| **Cold Iron Nail** | −5% damage taken | First guardian beaten in the Citadel | Every Restless Dead species Studied |
| **Rift Lantern** | +10 points of recovery between floors | First guardian beaten in Bastion | Every Water Spirit species Studied |
| **Bell Clapper** | The first offer of each run shows 4 blessings instead of 3 | First Unlit's Breath defeated | Every Beasts & Wilds species Studied |
| **Salt Ring** | Guardians have 10% less Health | First Forgotten defeated | Every Cursed species Studied |
| **Horn Spoon** | Guardians drop 1 more unit | First Dross-Tide defeated | The recipe book complete (36 of 36) |

---

## K. §9.11 What exists when — **add row**

| v0.7 | + the Rift card on the Hold screen; the Delve sheets (entry, floor playback and log, doors, blessings, Your blessings, guardian, result); the Riftglass shop on the Rank screen; alternate traits on the hunter sheet; battle sprites; the Echoes shelf; Act IV's documents and scenes (§9.15) |

## L. §9.12 Art direction — **add after the source table**

- **Battle sprites (v0.7, D265):** 32 px, code-generated from part templates per family, for the 16 contract species, the 3 Deep guardians and the 11 hunters (from their portrait parts). Animation: a 2-frame idle, a lunge when attacking, a white flash when hit, a downed pose; reduce-motion shows still frames. A contact sheet goes to the owner one session before the Delve screens; a rejected sprite falls back to the 64 px portrait shrunk to 32 px.
- Also v0.7: patron sigils (6, 16 px), rarity frames (Faint, Warm, Bright), icons for Riftglass and the six Delve relics, and the four hold cosmetics in the hold scene.

## M. §9.15 Delve screens — **add after §9.14** *(v0.7, D264)*

- **Rift card** (Hold screen, under the hold header, from the first Keep): *"Riftglass: 40 waiting, banks up to 140"* (long-press: the allowance's breakdown), and **Delve** or **Continue (floor 3)**. The Hold tab shows a badge when a run is paused or the allowance is full. No new tab.
- **Entry sheet:** three slots with a suggested three (Vanguard, Striker, Mender if available, highest levels); unavailable hunters greyed with the reason ("on a contract", "recovering"); the depth ("Keep: floors tier 2–3, guardian tier 4"); the allowance; Chosen start, if bought; **Start**.
- **Floor:** the group and the party as battle sprites; the fight plays back in about 10–20 s; **Skip** and **Log** (the fight log of §9.6, with group targets named: "Zora hits the second Upyr"). Health bars carry over.
- **Doors:** two large cards, each with the patron's name and sigil and *"Ahead: Restless Dead"*.
- **Blessing:** three cards: rarity frame, name, one-line effect; the Unlit's red *"but…"* line; Re-roll, if bought. **Your blessings** (always available between floors): every blessing taken, with breakdowns.
- **Guardian:** one line, then the fight.
- **Result:** floors cleared; Riftglass earned and the allowance left (or *"The rift is quiet tonight"*); reagents; any Ember-echo (opens in the reader) or relic; a Pechko line. **Leave run** between floors, with a confirmation.
- **Away sheet:** *"A Delve is waiting on floor 3."* and *"Riftglass waiting: 40 of 140."*
- **Rank screen:** **The Riftglass shop** beside The Hearth (§5.10.8). **Hunter sheet:** the alternate trait switch, once bought.
- **The Last Stand's confirmation** adds, when a run is paused: *"Your Delve ends here; you keep what it earned."*

---

## N. Judgment calls — **add a new section at the end of the GDD**

## Judgment calls added in the v0.7 flesh-out (D244–D279)

1. **The existing checks judge the player who never Delves;** the Delver is judged only on the new rows (D269).
2. **No relic slots;** the Delve relics work only in Delves (D261).
3. **No trophies, bestiary kills or XP from Delves in v0.7;** v0.8 decides (D262, D278, Q21).
4. **Group targeting by role, no new dice** (D251).
5. **The Deep family debuts as Delve guardians** (D252).
6. **The Rift lives on the Hold screen, not a sixth tab** (D264).
7. **Rarities are Faint, Warm and Bright,** to stay clear of v0.8's loot rarities.
8. **Acts from Act IV on start on load with fresh counters** (D246).
