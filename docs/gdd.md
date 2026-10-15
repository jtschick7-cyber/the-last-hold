# The Last Hold — Game Design Document

**Status:** Approved through §10 (D26–D29). Revised after the GDD review (D30–D31); edits to approved sections are marked ⚑.
**Markers:** **[JC]** = judgment call; the owner can override any of them. *(vX.Y)* = the milestone that introduces something. The judgment-call lists at the end of each section are a historical record of when each call was added; where a list and a section body disagree, the body (with its revision trail and `decisions.md`) is authoritative.
**Related docs:** `setting-primer.md` (spoiler-free; readable from v0.1), `lore-secrets.md` (the full truth; **kept outside the repo until v0.5**, D36), `technical-design.md`, `implementation-plan.md`, `decisions.md`.

---

## 1. Vision & Pillars

### 1.1 Elevator pitch

You are the warden of Stanholm, a ruined fortress on the edge of the Gloamreach, a frontier swallowed by monsters, cursed ruins, and something older beneath the ground.

You rebuild the hold, recruit monster hunters, and send them on contracts for frightened villages. You learn what the dark is made of, and you push it back.

The dark always returns. Each cycle ends in a Last Stand that you choose when to make. **Then a new warden, whom you name, arrives carrying the ember of the one who fell, and with it what they knew** *(⚑ revision, lore L4)*. Each cycle also uncovers another piece of the betrayal that broke the hold in the first place.

### 1.2 Experience goals

| Moment | The player should feel… |
|---|---|
| Opening the game | "My fortress kept working while I was gone." The game opens on a report, not a chore list. |
| Choosing a contract | Like a hunter studying a case. The decision is *what* to bring and *who* to send, not how fast to tap. |
| Reading a fight log | That the outcome was fair and explainable, and that better preparation would have changed it. |
| Late in a cycle | Rising pressure, plus a real choice: make the stand now, or hold one more day? |
| After the Long Night | Stronger, a little wiser, and hungry for the next piece of the story. |

### 1.3 Pillars

Every feature must serve at least one pillar and must not break any.

1. **Heroic with dark edges.** The dark is real and sometimes cruel, but the hold is a light. Hunters are brave, villagers are grateful, and victories feel earned. Horror is seasoning, not the meal.
   - *Test:* Does this make the player feel like a protector rather than a victim?
2. **Layers interlock.** Every layer produces something another layer needs. No system is a dead end.
   - *Test:* Can you name where this resource comes from and where it goes? (See §4.)
3. **Numbers are visible.** Every formula, chance, and modifier can be inspected in-game, and every fight leaves a readable log. Full transparency is the default (D10).
   - *Test:* Could the player predict this outcome from what the screen shows?
4. **Knowledge is progression.** The bestiary, the recipe book, and the lore make later play faster and better, not just more complete.
   - *Test:* Does learning this make the next contract or brew measurably easier?
5. **Respect my time.** Single-player, no monetization patterns, and no timers designed to frustrate. Offline progress is fair. Nothing important expires while you're away.
   - *Test:* Would missing a day feel like a punishment? If so, redesign it.

Determinism (seeded RNG, reproducible fights) is a technical requirement in support of pillar 3. It is specified in `technical-design.md`.

### 1.4 Non-goals

- Twitch skill, reflex timing, or tap-speed rewards.
- Daily login streaks, limited-time FOMO rewards, or anything that punishes absence.
- Gacha or randomized hunter pulls. Hunters come from recruitment, contracts, and events.
- Multiplayer, leaderboards, monetization, audio (out of scope for now).
- A tutorial or onboarding flow (D12: audience is just the owner). In-game help text and inspectable formulas stand in for it.

---

## 2. Setting & Naming Rules

### 2.1 Tone guide (D01: heroic fantasy with dark edges)

- **Light:** Villagers bring gifts after good contracts. Hunters banter in logs. The hold visibly grows from ruin into a fortress.
- **Dark:** Monsters were often people, or were made by people. Cursed ruins carry real tragedies. The central mystery is a betrayal with no clean villain.
- **Humor:** Dry and occasional, mostly in hunter traits and log flavor lines. Never parody.
- **Violence:** Shown through outcomes and logs ("Bjarna is wounded: 3 days to recover"), not gore. Pixel art keeps it stylized.

### 2.2 Folklore blend (D05: Slavic + Nordic)

The Gloamreach sits between forested river country with Slavic flavor (the lowland villages) and cold fells and fjord-cut highlands with Nordic flavor (the northern ruins). Monsters, names, and material culture shift along that gradient. Lowland contracts feel Slavic; highland contracts feel Nordic; the deep places belong to neither.

### 2.3 Originality rules

All content is original. The influences supply *feel*, never names, characters, terminology, designs, or plots.

**Folklore creatures** may be used under their real-world folklore names and standard folklore spellings. Their designs and behavior must come from folklore sources, not from any game's version.

**Avoid list.** These terms and signature elements are off-limits:

| Source | Avoid |
|---|---|
| The Witcher | "witcher"; Signs; mutagens; decoctions; schools of monster hunters; game-specific monster spellings and coinages (leshen, kikimore, striga, noonwraith, nekker, drowner, bruxa); signature plots (e.g., a cursed princess cured by a night in a crypt); named potions or oils from the games |
| Elder Scrolls / Skyrim | Dragonborn; shouts / Thu'um; Daedra; Dwemer; standing stones as skill signs; "jarl" **[JC: a real Norse title, but too strongly Skyrim-coded; use "thane" or "headman"]** |
| Warcraft / WoW | Scourge; Lich King; Horde / Alliance; named classes (paladin, death knight) as hunter classes; WoW faction names |
| Age of Empires | Named civilizations; age names beyond the generic Hamlet → Keep → Citadel → Bastion |
| Warhammer 40K / Tacticus | Primarch; Astartes; Chapter; Heresy; Emperor; Salamanders / Vulkan or any named chapter, legion, or character; "promethium"; **Forgefather; "tithe" for the taking of people; Black Ships** *(⚑ lore L7)* |
| Hades | Boons; Mirror of Night; named gods' roles; "Darkness" as the reset currency |
| **Dark Souls** *(not an influence; ⚑ lore L6)* | Souls feeding a fire that holds back the dark (as named imagery); kindle and kindled; ash, ashen, cinder; hollow and hollowing; a "keep the fire or let it go out" ending pair; bonfires as checkpoints. **Kept on purpose:** "Embers" (the prestige currency). |

**Process rule:** Before any proper noun goes into a content file, it gets a quick web search against those games. Collisions are logged in `decisions.md`. Real historical or generic words (thane, warden, hold, contract, oil, bomb) are allowed.

### 2.4 Approved folklore creature pool (starter)

| Creature | Origin | Folklore basis to design from |
|---|---|---|
| Leshy | Slavic | Forest lord; leads travelers astray; changes size with the trees |
| Kikimora | Slavic | Household or swamp spirit; nighttime mischief that turns malicious |
| Rusalka | Slavic | Drowned maiden; river and field spirit; lures and drowns |
| Vodyanoy | Slavic | Old man of the water; drowns the careless; bound to mills and weirs |
| Poludnitsa (Lady Midday) | Slavic | Field spirit at noon; strikes down workers with heatstroke and madness |
| Upyr | Slavic | Restless dead; drinks blood; risen from improper burial |
| Strzyga | Slavic (Polish) | Person with two souls; after death, one soul hunts the living |
| Bies | Slavic | Malevolent spirit of the wilds |
| Likho | Slavic | One-eyed embodiment of misfortune |
| Mara / Mora | Slavic + Nordic | Nightmare spirit that sits on sleepers' chests |
| Draugr | Nordic | Barrow-dead; swollen, heavy, guarding treasure; can change size |
| Nix / Nøkk | Nordic | Water spirit; shapeshifts (often a horse); music lures victims |
| Huldra | Nordic | Forest woman with a hidden tail; seduces and punishes |
| Troll | Nordic | Stone-hided, sun-averse giants of the fells |
| Lindworm | Nordic | Wingless serpent-dragon |
| Domovoi | Slavic | Friendly household spirit; **not a monster**. A resident of the hold. |

**Original creatures** are encouraged for the cursed ruins and the deep (the Unlit and its spawn). Those live in `lore-secrets.md`.

### 2.5 Naming style

- **Places:** Compounds that mix the two roots: Slavic *-grad, -ov, -no, stan-, vel-* with Nordic *-holm, -fell, -mark, -vik*. Examples: Stanholm, Velkvik, Dubno Ford, Ravenfell.
- **People:** Lowlanders use Slavic-style given names (Dobrava, Milosz, Vesna). Highlanders use Nordic-style names (Yrsa, Halvar, Bjarna). Many hunters carry an epithet earned in the field ("Halvar Two-Smokes").
- **The Emberwrights:** Ranks and titles in plain English: Keeper of the Forge, Hearthblade, Wright, Apprentice *(⚑ lore L7: "Keeper" replaces Forge-Mother)*.
- **Lore names in the outline are working names** (Gloamreach, Stanholm, Emberwrights, Hearthseal, the Unlit, Hearthblade). They get collision-checked before v0.5 *("Firstblade" became "Hearthblade": the old title is an Elder Scrolls lore name; Q10, D142)*. **[JC: the Hearthblade's name changes from the outline's placeholder to "Yrsa Varn" to fit the Nordic naming style; the Keeper is "Dobrava Halsten".]**

---

## 3. Core Loops

### 3.1 Loops by timescale

| Loop | Length | What you do | Key decisions | What you get | From |
|---|---|---|---|---|---|
| **Check-in** | 2–3 min | Read "While you were away"; build and upgrade; reassign peasants; collect contract results; launch new contracts | What to build next; which contract, which party, which preparation | Resources, trophies, reagents, bestiary progress | v0.1 (hold), v0.2 (contracts) |
| **Session** | 15–30 min | Delve runs; alchemy experiments; roster and gear planning; read lore | Blessing picks; ingredient combinations; long-term roster shape | Riftglass, reagents, Ember-echoes, Delve relics; recipes | v0.6 (alchemy), v0.7 (delves) |
| **Events** | Whenever tokens are banked *(⚑ revision G7: was daily)* | World-boss attempts and Legendary Hunt runs, with different hunters each time | Who to spend on which attempt | Boss rewards, event points | v0.9 |
| **Cycle** | 3–5 days | Rank up the hold; keep Threat in check; pick the moment for the Last Stand | When to make the Last Stand | Embers (permanent currency), relics, the next act of the mystery | v0.4 |
| **Meta** | Weeks | Fill the bestiary and recipe book; raise hunter stars; finish Legendary Hunts; advance Orders | Long-term investment | Permanent power and knowledge; the full story | v0.3–v0.10 |

### 3.2 The check-in, step by step

This is the heart of the game and must stay fast. **Target: a routine check-in in 15 taps or fewer.**

1. **Open.** The "While you were away" sheet summarizes elapsed time (capped at 12 h; D08), resources gained, contracts resolved (success or failure, injuries, loot), and anything new in the bestiary. Tap once to dismiss. Every line can be expanded into its full log.
2. **Spend.** The Hold screen highlights affordable builds and upgrades with a badge. Buy in one tap; long-press for the formula and cost breakdown.
3. **Contracts.** The board shows open contracts. For each one: pick a party (with a suggested party pre-filled), pick preparation, then see the success odds with a full breakdown before launching.
4. **Leave.** Nothing demands attention until the next visit.

### 3.3 Anti-frustration rules for loops

- **The contract board fills up and waits.** New contracts arrive over time, up to a cap. They never expire. **[JC: one new contract every 2 h, board cap of 6 in v0.2.]**
- **Finished contracts apply at completion** *(⚑ revision B9)*. Rewards and returning hunters count the moment the timer ends, even offline. The results wait in a list for you to read (§5.4.3).
- **Unwanted contracts can be declined for free** *(⚑ revision A2)*. A full board never costs anything (G2).
- **Injuries heal on real time,** including while you're offline.
- **No resource is lost to an overflow cap in v0.1** (D24.3, no storage caps). If caps arrive later, the UI warns well before you hit them.
- **Events** (v0.9) never punish absence *(⚑ revision G7)*. Attempts are banked tokens, Legendary Hunts start when you start them, and absence can delay an event reward but never forfeit it.

### 3.4 What exists when

| Milestone | Playable loops |
|---|---|
| v0.1 | Check-in (hold only): build, assign peasants, Rank up to Keep |
| v0.2 | Check-in with contracts (tier 1 from Hamlet, G6), hunters, combat logs |
| v0.3 | Contracts gain investigation, the bestiary, and preparation |
| v0.4 | Cycle loop: Threat, Last Stand, Long Night, Embers, relics, Citadel and Bastion *(⚑ P3: moved ahead of alchemy discovery)* |
| v0.5 | Act I and the story systems: documents, the Archivist, warden naming, the Roll of Wardens, letters, village trust; ruin contracts, Rune damage and the Wright's Blade *(⚑ P2: split from the Long Night; detail §5.14)* |
| v0.6 | Session loop begins (alchemy experiments) |
| v0.7 | Session loop gains Delves |
| v0.8 | Check-ins gain loot and the Stores list; the meta loop gains hunter ranks, stars, talents, use-skills and Legendaries; Act V |
| v0.9–v0.10 | Meta loop deepens: events (v0.9), Orders (v0.10) |

---

## 4. Resource Flow

### 4.1 Resource catalog

"Survives the Long Night" means the item persists through the prestige reset.

| Resource | Kind | Produced by | Consumed by | Survives the Long Night? | From |
|---|---|---|---|---|---|
| **Food** | Basic | Farms, fishery; peasants | Settling peasants; **contract provisions** *(⚑ revision G3)* | No | v0.1 |
| **Wood** | Basic | Woodcutter's camp; peasants | Buildings; bomb casings; arrow shafts | No | v0.1 |
| **Iron** | Basic | Mine; peasants | Buildings; smithy gear | No | v0.1 |
| **Silver** | Basic + currency **[JC: silver is both a material and the bounty currency]** | Silver Seams (capped: at most 2, 0.22/min each, no bonuses; G1, D138, D189); **contract bounties (main source)** | Silvered gear; recruitment; Rank-ups | No | v0.1 |
| **Peasants** | Population | Houses + food surplus | Assigned to gathering jobs | No | v0.1 |
| **Hunters** | Roster | Recruitment (silver); later contracts and events | Contracts, Delves, bosses | **Yes**: the roster (active and reserve) persists; levels partly reset: half the levels above 1 are kept (§5.9.7); **items reset except Legendaries** *(⚑ D306)*; **ranks, stars and talents are kept** *(v0.8)* | v0.2 |
| **Trophies** | Per monster family | Contract kills (Delves give none, D262, D316) | Hunter rank-ups and stars (v0.8; spending never lowers the Trophy Hall count or the Embers conversion, A7); trophy-hall bonuses (v0.2) | Partly: converted into Embers at the Long Night (capped at the v0.4 arrival, G8) | v0.2 |
| **Reagents** | Ingredients | Contracts; herb garden; Delves | Alchemy: oils, potions, bombs | No | v0.3 |
| **Items** *(v0.8; were Gear)* | Items | Smithy (craft and rework, §5.11.1); contract loot; Delve guardians (§5.10.7) | Equipped by hunters (weapon, armor) | No, except **Legendaries** (keepsakes, kept forever, D306) | v0.2 / v0.8 |
| **Oils / Potions / Bombs** | Consumables | Alchemist's hut, from reagents | Contract preparation | No | v0.3 |
| **Knowledge** | Unlocks | Investigating and killing monsters; alchemy experiments **(the recipe book, v0.6, §5.8)** | Never spent; reduces investigation time and raises odds | **Yes** | v0.3 |
| **Warden skills** | Progress | Doing their activity: brewing and experiments, gear work, investigation and reading, winning contracts and holding waves (§5.8.6) | Never spent; small permanent bonuses | **Yes** ("carried in the ember") | v0.6 |
| **Threat** | Pressure meter | Rises with the Rank's base rate and with failed contracts. A full board, old contracts and declined contracts add nothing *(⚑ revision G2)* | Lowered by completed contracts and defenses; sets Last Stand difficulty | Resets to 0 | v0.4 |
| **Embers** | Prestige currency | The Last Stand (payout curve) plus trophy conversion | Permanent warden upgrades; **hunter stars** (v0.8, D310) | **Yes** | v0.4 |
| **Relics** | Persistent items | Last Stand wave milestones (§5.9.6); Delves (v0.7: six Delve relics, each also with an idle source; their effects work only in Delves, D261) | The hold (v0.4: every relic owned works); hunters (v0.8: as **Legendaries** in a keepsake slot, §5.11.6) | **Yes** | v0.4 / v0.8 *(⚑ v0.4 flesh-out, D111)* |
| **Riftglass** | Delve currency with a **banked allowance**: 1/7 of the weekly cap accrues per day, banking up to 2 weeks *(⚑ revision G7)* | Delve floors | The Riftglass shop: Late hours (offline cap), alternate traits, hold cosmetics, Delve upgrades (§5.10.8) | **Yes** | v0.7 |
| **Lore documents** | Collectibles | Contracts, Delves, Long Night | Mystery progression; some give small hints or bonuses | **Yes** | v0.5 |
| **Boss marks / Hunt points** | Event currencies | World bosses; Legendary Hunts | Event rewards; unlocking a legendary hunter | **Yes** | v0.9 |
| **Reputation** | Per Order | Order questlines and aligned contracts | Order rewards and unlocks | **Yes** | v0.10 |

### 4.2 Flow diagram

```mermaid
flowchart LR
  subgraph HOLD["The Hold (idle) · v0.1"]
    P[Peasants] --> B((Food · Wood · Iron · Silver))
    B --> BLD[Buildings & Ranks]
    BLD --> P
    B --> SM[Smithy]
    B --> AL[Alchemist · v0.3]
  end

  subgraph CON["Contracts (semi-idle) · v0.2"]
    INV[Investigation · v0.3] --> FIGHT[Combat resolution]
  end

  SM -- gear --> FIGHT
  AL -- oils · potions · bombs --> FIGHT
  B -- silver: recruit --> H[Hunter roster]
  H --> FIGHT
  FIGHT -- silver bounties --> B
  FIGHT -- trophies --> BLD
  FIGHT -- reagents --> AL
  FIGHT -- knowledge --> BEST[Bestiary · v0.3]
  BEST -- faster ID, better odds --> INV
  AL -- recipes --> RB[Recipe book · v0.6]
  RB -- known effects --> AL

  subgraph DEL["Delves (active, optional) · v0.7"]
    RIFT[Rift floors + patron blessings]
  end
  H --> RIFT
  RIFT -- riftglass, banked allowance --> SIDE[Sidegrades & convenience]
  RIFT -- relics · lore · reagents --> AL
  SIDE --> HOLD

  subgraph NIGHT["The Long Night (prestige) · v0.4"]
    THR[Threat] --> LS[Last Stand]
    LS --> EMB[Embers & relics]
  end
  FIGHT -- lowers --> THR
  BLD -- defenses --> LS
  H --> LS
  EMB -- permanent upgrades --> HOLD
  LS -- next act --> LORE[Mystery & lore]
  RIFT -- lore pages --> LORE

  EV["Events · v0.9: world bosses, Legendary Hunts"] --> H
  H --> EV
```

### 4.3 Interlock check

Every layer has at least one input from another layer and one output to another layer:

| Layer | Needs from others | Gives to others |
|---|---|---|
| Hold | Silver and trophies (Contracts); Embers (Long Night); sidegrades (Delves) | Gear, consumables, recruits (Contracts); defenses (Last Stand) |
| Contracts | Gear, consumables, recruits (Hold); knowledge (Bestiary) | Silver, trophies, reagents (Hold); Threat reduction (Long Night) |
| Delves | Hunters (roster) | Relics, lore, reagents, riftglass |
| Long Night | Defenses (Hold); hunters; Threat state | Embers, relics, story progression |
| Events | Roster depth | Legendary hunters, event rewards |

**Delve-optional check (D20):** Every resource Delves give either has an idle-path source (reagents, lore, and relics also come from contracts and Last Stands) or is a sidegrade or convenience. Idle-only play reaches all content about 20–30% slower. The balance simulator will verify this from v0.7 on. From v0.7 this is checked two ways: a content test lists every Delve reward with its idle source or its sidegrade / convenience / Delve-only mark, and the Idle-only row (§6.2) compares the `standard` and `delver` players (D269, D271). From v0.8, Delves also give hunter XP, Command skill XP and one guardian item, but only while a run pays Riftglass (D316). Each has an idle source (contract XP and contract loot), and the Idle-only row's "all content" grows with v0.8 (§6.2).

---

## Judgment calls in sections 1–4

1. **Silver is both a material and the bounty currency.** One fewer resource to track; contracts become the main source of silver.
2. **The hunter roster persists through the Long Night,** with rank and gear partly resetting. Details come with v0.4.
3. **Contract board:** one new contract every 2 h, up to 6, never expiring.
4. **Event participation:** event milestones are reachable with about 70% participation. *(Superseded by G7: absence can delay an event reward but never forfeit it.)*
5. **Routine check-in target:** 15 taps or fewer.
6. **Avoid "jarl"** as too Skyrim-coded; use "thane" or "headman" instead.
7. **Character names:** Hearthblade "Yrsa Varn" *(the title was Firstblade until D142)*, Keeper "Dobrava Halsten" *(title renamed in lore L7)*.
8. **Strzyga and Lady Midday are in the creature pool,** with designs drawn from folklore only and no reuse of the games' signature contract plots.
9. **The domovoi is a friendly resident of the hold,** not a monster.
10. **Prestige currency is named Embers; Delve currency is named Riftglass.**

---

## 5. Systems

> **About the numbers in this section.** Every number is a *starting value*. The structure (formulas, rules, what affects what) is the design. The constants are tuned by the balance simulator against the pacing targets in §6. When Claude Code changes a constant, the change goes in the content or config files, never into code. When a constant changes by more than 2×, it gets a line in `decisions.md`.

### 5.0 Cross-cutting rules

These apply to every system.

**Modifier buckets.** Every percentage bonus belongs to one named bucket. Bonuses add within a bucket and multiply across buckets:

```
final = base × (1 + Σ building) × (1 + Σ age) × (1 + Σ trophy) × (1 + Σ knowledge) × (1 + Σ ember) × (1 + Σ relic) × (1 + Σ event)
```

Buckets that don't exist yet in a milestone count as 0. The in-game breakdown shows each bucket and every contributor in it.

**Combat modifiers** *(⚑ revision B1 [JC])*. Combat uses its own buckets, applied in this fixed order:

```
stat_eff   = (base × levelScale + Σ flat) × (1 + Σ stat%) × (1 + Σ status%)
raw        = Might_eff × variance
typed      = raw × resist[target][damageType]
dealt      = typed × (1 + Σ outgoing%) × (1 + knowledge%) × (crit ? critMult : 1)
afterArmor = max(0, dealt − Armor_eff)                         (direct attacks only)
final      = 0                                                 if resist = 0 (immune)
           = max(1, round(afterArmor × (1 − min(0.75, Σ taken%))))   otherwise
```

| Bucket | What goes in it | Examples |
|---|---|---|
| **flat** | Fixed additions to a stat, applied before any multiplier | Gear (+9 Might), Quick (+3 Speed) |
| **stat%** | Percentage changes to a stat that last the whole fight | Quickfoot Tincture (+20% Speed), Swell (+50% Armor) |
| **status%** | Temporary effects whose duration counts actions | Hamstring (−30% Speed), the Frost Pot slow, Hardwood Tonic, Malice (+5% Might per action) |
| **outgoing%** | Bonuses to damage dealt | Traits vs a family or location (Grave-warden, Fen-born, Fire-touched), oils |
| **knowledge%** | Studied / Mastered bonus vs a species | +5% / +10% |
| **taken%** | Reductions to damage taken. They **add together**, are **capped at 75%**, and apply **after Armor** *(B2)* | Shieldwall −10%, Fire-touched −20% Fire, Emberwright Plate −10% Fire |

- Every bucket is additive inside and multiplicative across buckets.
- `round` rounds half up. Health is always a whole number.
- A status with the same name refreshes rather than stacks, unless the ability says "stacking" (Malice).

**Breakdown everywhere (D10).** Every derived number (a rate, a stat, an odds figure, a cost) can be long-pressed (or hovered, on desktop) to open a breakdown tree: base value, each contributor, and the formula. The breakdown is generated from the same data the engine uses, so it can never disagree with the actual result.

**Time.** The engine runs in seconds. The UI shows rates per minute by default, with a per-hour toggle.

**Randomness.** Every random roll comes from a seeded stream (see `technical-design.md`). Logs show the roll whenever a roll mattered ("rolled 0.83 vs 0.90 to hit").

---

### 5.1 The Hold economy (v0.1)

#### 5.1.1 Resources and peasants

The four basic resources are **food, wood, iron, and silver**. There are no storage caps (D24.3).

**Peasants** are the workforce.
- **Housing** sets the maximum number of peasants. The Hearth Hall provides 3, and each Cottage adds 2.
- **Settling** a new peasant costs food: `settleCost(P) = 20 × 1.15^P`, where P is the current number of peasants.
- **Auto-settle** is on by default. While housing is free and food covers the cost, a new peasant settles automatically, at most one every 30 s. The player can turn auto-settle off to save food for something else. With auto-settle off, a **Settle one** button settles a peasant by hand: the same food cost and housing limit, no 30 s wait, and it doesn't delay the next automatic settle (D63).
- **No food upkeep in v0.1** **[JC]**. Peasants cost food to settle, not to keep. This avoids starvation spirals, which play badly with offline time. From v0.2, food also pays **contract provisions** (§5.4.2, G3), which is the food sink after Keep.

**Jobs.** Each peasant is either idle or assigned to a job. Job slots come from buildings.

| Job | Produces | Base rate per worker | Slots from |
|---|---|---|---|
| Farmer | Food | 6 / min | Farm (3 each) |
| Woodcutter | Wood | 4 / min | Woodcutter's Camp (3 each) |
| Miner | Iron | 2 / min | Mine (2 each) |
| Silver-digger | Silver | 0.25 / min | Silver Seam (1 each; **at most 2 Seams**) |

- **Idle peasants produce nothing.** The Hold screen shows an "idle hands" warning whenever any peasant is idle.
- **New peasants** take the first open slot in a **job priority list** that the player sets. The default order is Farmer → Woodcutter → Miner → Silver-digger.
- **Reassigning** is free and instant, using +/− buttons per job plus a "fill" button.

**Production rate per resource:**

```
rate_R = workers_R × baseRate_R × (bucket multipliers, §5.0)
```

**Silver is capped at the source (G1, D30).** Silver-digger output gets **no building, age, trophy, knowledge or ember bonuses**; only relic and event bonuses apply (none exist before v0.4). With at most 2 Seams, seam income can never exceed 2 × 0.22/min = **about 630 silver per day** (720 at 0.25/min before D138, 690 at 0.24/min before D189). Contract bounties are the main silver source from v0.2 on. *⚑ Revision of approved §5.1.1.*

#### 5.1.2 Buildings

There are two kinds of building:

- **Count buildings** can be bought many times. The next copy costs `base × r^n` with **r = 1.15**, where **n is the number already owned, including free starting buildings** *(⚑ revision A8)*. For example, the first Farm you buy is your 2nd, so it costs 40 × 1.15 = 46 wood.
- **Level buildings** are unique and are upgraded. Level L (starting from 1) costs `base × r^(L−1)` with **r = 1.75**. Each Rank sets a maximum level.

**Bulk buy.** Count buildings support ×1, ×10, and Max.
- Buying k copies costs `base × r^n × (r^k − 1)/(r − 1)` of each resource.
- For Max, the engine computes the affordable k for each resource as `k = floor(log(1 + funds·(r−1)/(base·r^n)) / log r)`, and takes the smallest k across resources.

**All construction is instant** **[JC]**. Pacing comes from costs, not build timers. Waiting on a timer you can't affect is the kind of friction pillar 5 rules out.

**Best payback: one valuation, used everywhere** *(⚑ revision B7 [JC])*. The ● best-buy hint (§9.2) and the simulator's greedy policy (§6.1) call the same function:

```
value(bundle) = Σ_r  w_r × amount_r     w = value.weights: food 1, wood 1.5, iron 3, silver 12
payback(item) = value(cost) ÷ value(Δrate per min)        (lower is better)
```

- The weights are the inverse of each resource's base rate, normalized to food. They live in `balance.ts` so they can be retuned.
- **Δrate** is the change in production the purchase causes right now:
  - Production buildings and levels: the direct rate change.
  - Housing (Cottage): extra peasants × the marginal rate of the best open job slot, or 0 if no slot is free.
  - Slot buildings: 0 unless idle peasants are waiting to fill the new slots.
- Items with Δrate = 0 (for example, the Bell Tower) never get the ●. The simulator buys them only through explicit policy rules.
- Rank-ups are excluded; the policy's saving rule handles them.

**v0.1 buildings** (costs are base values):

| Building | Type | Base cost | Effect | Available |
|---|---|---|---|---|
| Hearth Hall | Unique | — (start) | Houses 3 peasants. The Rank-up happens here. | Start |
| Cottage | Count | 30 wood, 10 food | +2 housing | Hamlet |
| Farm | Count | 40 wood | +3 Farmer slots | Hamlet (start with 1) |
| Woodcutter's Camp | Count | 25 wood, 15 food | +3 Woodcutter slots | Hamlet (start with 1) |
| Mine | Count | 80 wood, 40 food | +2 Miner slots | Hamlet |
| Silver Seam | Count (**max 2**) | 150 wood, 120 iron | +1 Silver-digger slot; never boosted (G1) | Hamlet |
| Mill | Level (max 5 in Hamlet, 10 in Keep, 15 in Citadel, 20 in Bastion) | 120 wood, 40 iron | +25% food per level (building bucket) | Hamlet |
| Sawpit | Level (max 5 / 10 / 15 / 20) | 100 wood, 60 iron | +25% wood per level | Hamlet |
| Smithy | Level (max 3 / 10 / 15 / 20) | 200 wood, 150 iron | +20% iron per level. Unlocks gear tiers (v0.2) | Hamlet |
| Bell Tower | Level (max 3) | 1,500 wood, 800 iron, 150 silver | +1 h offline cap per level | Keep |

#### 5.1.3 Ranks

The Rank-up **Hamlet → Keep** requires:
- **Prerequisites:** 10 peasants, Mill level 3, and a Smithy.
- **Cost:** 12,000 food, 9,000 wood, 4,000 iron, and **250 silver** *(⚑ revision: was 600; lowered to fit capped Seams, G1; then 300 → 250 in the v0.1 tuning pass, D62)*.

**Keep grants:**
- Higher maximum levels (see the table).
- +50% to all production (age bucket).
- The Bell Tower.

From v0.2 onward, Keep also unlocks contract tiers above 1, the Barracks, and the Trophy Hall. The contract board itself opens in Hamlet, when the first Mine is built *(⚑ revision G6)*.

**Each Rank-up restores part of old Stanholm**, with a short inscription *(⚑ revision, lore C7)*. Keep restores the gatehouse and the Roll of Honor (`setting-primer.md` §6.5); Citadel and Bastion are in `lore-secrets.md` §11.

In v0.1–v0.3, the Keep is the end of content. The Rank screen shows the next Rank (Citadel) as "Coming in a later milestone," with no fake progress bar.

**Pacing target:** Keep is reached after **8–14 hours of game time**, under the simulator's **Standard** policy (§6.1). The simulator enforces this band (§6.2). *(⚑ revision A9: the policy is defined only in §6.1.)*

**Citadel and Bastion** *(v0.4; ⚑ v0.4 flesh-out, D106)*. Contract tiers stay 1–5: the new Ranks make contracts pay more instead.

| | Citadel | Bastion |
|---|---|---|
| Requires | 50 peasants, Mill 10, Smithy 8, Barracks 1 | 60 peasants, Mill 12, Smithy 9, Barracks 3, Walls 1 *(T4.15, D138)* |
| Cost | 300,000 food, 150,000 wood, 60,000 iron, 600 silver *(D138)* | 500,000 food, 300,000 wood, 110,000 iron, 1,600 silver *(D138)* |
| All production (age bucket, not silver) | +50% (adds to the Keep's) | +50% more |
| Mill, Sawpit, Smithy level cap | 15 | 20 |
| Hunter level cap | 15 | 20 |
| Bounty multiplier | ×3.5 *(D138)* | ×3 *(D138)* |
| Provisions (`provisions.incomeMinutes`) | 4.4 *(D189)* | 2.5 *(D138)* |
| Active roster | +2 | +2 |
| Highest contract tier | 5 | 5 |
| Unlocks | Walls and Watchtower (§5.9.2) | the Last Stand (§5.9.3) |
| Restores | **the old Forge Hall**: *"The roof is back on the old Forge Hall. Its forges are cold."* From v0.5 (D160): *"Over the great anvil, cut deep: 'The fire for the folk; the folk —'. The rest has been chiseled out."* | **a sealed stair going down**: *"Under the Bastion floor, a stair goes down to a sealed door."* From v0.5 (D160): *"Thirty-nine faded ribbons are tied to its handle."* |

- Every number is a tunable starting value (requirements and costs live with the Ranks in the content, D44), except the roster bonus and the tier cap, which are locked. The simulator tunes the costs to the targets: Citadel on day 2, Bastion on days 3–4 (§6.2, D137).
- The restorations showed no inscription in v0.4. From v0.5 each carries its inscription (D160, `lore-secrets.md` §11), every cycle; a save already past the Rank sees it on arrival.
- A hunter who carries a level above the current Rank's cap (§5.9.7) keeps it; the cap only stops new levels.

#### 5.1.4 Starting state

- The Hearth Hall.
- 1 Farm and 1 Woodcutter's Camp.
- 3 peasants: **1 Farmer and 2 Woodcutters** *(⚑ revision A10 [JC]: was 2 Farmers and 1 Woodcutter)*.
- 80 food and 75 wood *(⚑ v0.1 tuning: wood was 50, D62; v0.2 tuning: food was 50, so the first contract's provisions are affordable soon after the first Mine, D76)*.
- Auto-settle on.

**Opening goal** (measured by the **Opening** policy, §6.1): a Cottage within 1 minute and a Mine within 5 minutes. A hand calculation gives about 4.4 minutes for the Mine (after the first Cottage's 30 wood, wood reaches 80 at about 4.4 min). **If the simulator misses, raise starting wood; don't move the target.** *(⚑ v0.1 tuning, D62: 70 wood gave 5.2 min in the simulator, so the start is 75 wood; the simulator measures 4.5 min.)*

---

### 5.2 Offline progress (v0.1)

**Elapsed time on load:**

```
elapsed = clamp(now − lastSeen, 0, offlineCap)
```

- **Offline cap:** a base of 12 h (D08), plus the Bell Tower (up to +3 h), plus later sources (Embers in v0.4: Late Lantern, §8.9; Riftglass in v0.7). **Hard ceiling: 24 h** **[JC]**.
- **Clock moved backward:** if `now < lastSeen`, then `elapsed = 0` and `lastSeen` is reset to `now` (D21). No penalty, no warning.

**Simulation.** Offline time runs through **the same `advance(state, dt)` function** as live play. **`advance` is event-driven** *(⚑ revision A11 [JC])*:
- Inside any `dt`, it finds the next scheduled event (a peasant settle becoming due, a contract finishing, a recovery or brew ending, a board refill), moves resources forward linearly to that moment, applies the event, and repeats until `dt` is used up.
- Rates are constant between events, so every event time is exact. For example, a settle becomes due at `(cost − food) ÷ foodRate`, but no sooner than 30 s after the previous settle.
- **Chunk size therefore never changes the result.** Offline catch-up still runs in 60 s chunks, but only to drive the progress bar.
- **Acceptance test:** 12 h of live play in 1 s ticks and a single 12 h offline catch-up, from the same starting state, must end in the same state (within floating-point tolerance).
- **Offline efficiency is 100%** **[JC]**. Many idle games pay out offline time at a reduced rate. Here the cap is the only limit, because pillar 5 says offline progress should feel fair.

**"While you were away" sheet:**
- Time counted, plus a note if time beyond the cap was not counted: *"14 h 20 m away · 12 h counted (cap)."*
- Resources gained.
- Peasants settled.
- Contracts resolved, each with its outcome and a tap-through to the full log *(v0.2)*.
- Injuries that started or healed *(v0.2)*.
- New bestiary entries *(v0.3)*.

The sheet is dismissed with one tap. The last three sheets are kept under More → Reports.

---

### 5.3 Hunters (v0.2)

#### 5.3.1 Collection model

Every hunter is a **hand-authored named character** **[JC]**. There are no procedurally generated recruits.
- v0.2 ships with 8 hunters; v1.0 targets about 30.
- Each hunter has unlock conditions (Rank, bestiary progress, specific contracts, and later events or Orders). When the conditions are met, the hunter arrives at the hold as a **candidate**. Paying their recruitment silver adds them to the roster.
- This keeps the Tacticus collection feel (every hunter matters) without any gacha.

**Active roster and reserve** *(⚑ revision G5)*:
- **Active roster cap:** 3 in Hamlet (bunks in the Hearth Hall [JC]). In Keep, 3 + Barracks level, up to 8. Citadel adds 2 and Bastion adds 2, for 12 at most [JC].
- **Reserve:** unlimited. Every hunter you own but haven't made active waits in the reserve. Reserve hunters can't take contracts or Delves; from v0.8 they earn **yard XP** like every hunter not on a contract (§5.11.5). They **can** join world bosses and Legendary Hunts (v0.9).
- **Swapping** between active and reserve is free and instant, except for hunters who are on a contract or recovering.
- **Letting a hunter go** means moving them to the reserve. Hunters are never deleted [JC].
- **Barracks** (Keep, level building, max 5, base cost 600 wood, 300 iron, 100 silver) raises the active cap.

**Recruitment cost** is a **fixed silver price per hunter**, set in the hunter's content file (§8.5) *(⚑ revision G5 [JC])*. The old `100 × 1.5^rosterSize` formula would reach absurd prices with a ~30-hunter collection, and moving hunters to the reserve would dodge it. The two starting hunters are free.

#### 5.3.2 Stats and levels

| Stat | Effect |
|---|---|
| Health | Hit points. At 0 the hunter is downed. |
| Might | Damage per hit. For a Mender, Might also sets healing. |
| Armor | Flat reduction to each incoming hit (minimum damage is 1). |
| Speed | How often the combatant acts (turn meter, §5.5). |

- **Level 1–10 in Keep** (later Ranks raise the cap). **Health and Might** scale as `base × (1 + g × (level − 1))`, where g = 0.10 plus 0.01 per **star** (v0.8, §5.11.3). **Armor and Speed don't scale with level** *(⚑ revision [JC]: under the turn meter, Speed growth would compound into extra actions)*.
- **Displayed stats include gear and traits** *(⚑ revision A14)*. The breakdown separates base, level, gear and traits.
- **XP per contract:** 20 × tier on a success, half that on a failure.
- **XP to go from level L to L+1:** `50 × 1.3^(L−1)` *(v0.8 tuning, D354: was 1.5)*.

#### 5.3.3 Roles (D24.2 names)

| Role | Identity | Combat rule |
|---|---|---|
| **Vanguard** | Tank | Monsters target Vanguards with weight 3 (others weight 1). High Health and Armor. |
| **Mender** | Healer | On her action, if any standing hunter (herself included) is below 70% Health, she heals the one with the **lowest % Health** for `1.5 × Might` (ties: party slot order). Downed hunters can't be healed. Otherwise she attacks at 50% Might. *(⚑ revision B6)* |
| **Striker** | Damage | 20% crit chance (others 10%). Crits deal ×1.5. |

#### 5.3.4 Damage types (D24.2 names)

There are six types: **Steel, Silver, Fire, Frost, Rune, Venom**.
- Each hunter has one innate damage type, from their weapon style.
- Each monster has a resistance multiplier per type. 1.0 is neutral; below 1 resists; above 1 is weak. The values are shown once the monster is Identified (§5.6).
- **Rune** damage belongs to the Emberwright lore. From v0.5 it comes from the Wright's Blade's sub-hit (§5.3.6) and from Arvid Netmender (§8.5); it's the Cursed family's common weakness (§8.3).

#### 5.3.5 Traits

Each hunter has **2 traits**, each with an exact numeric effect.

| Trait type | Example |
|---|---|
| Location | *Fen-born:* +15% Might on river and marsh contracts |
| Monster family | *Grave-warden:* +20% Might vs Restless Dead |
| Role | *Shieldwall:* while this Vanguard stands, allies take −10% damage |
| Recovery | *Hard to kill:* recovery times −30% |
| Flavor and economy | *Haggler:* +10% bounty silver on contracts this hunter joins |

The full list goes in §8.

#### 5.3.6 Gear (v0.2)

Until v0.8, gear is **upgraded in place**: each hunter has a weapon slot and an armor slot, and the Smithy upgrades the slot directly. **From v0.8 every piece below is an item** (§5.11.1): the Smithy crafts the first tier and reworks an item one tier up for the same step cost shown here.

| Slot tier | Effect | Cost | Requires |
|---|---|---|---|
| Iron Blade | +4 Might | 60 iron | Smithy 1 |
| Steel Blade | +9 Might | 250 iron, 50 wood | Smithy 3 |
| Silvered Blade | +9 Might. Each hit also deals a separate **Silver sub-hit**: `0.25 × Might_eff × variance × crit` × the target's Silver resistance. Armor doesn't apply, and it's logged as its own line *(⚑ revision B3 [JC])* | 250 iron, 120 silver | Smithy 5 |
| **Wright's Blade** *(v0.5, D159; was "Runed Blade", D170)* | +12 Might. Keeps the Silver sub-hit and adds a **Rune sub-hit** of the same size: `0.25 × Might_eff × variance × crit` × the target's Rune resistance, no Armor, its own log line | 600 iron, 300 silver | Smithy 8 and the Citadel (the Forge Hall) |
| Hide Armor | +2 Armor | 40 wood, 30 food | Smithy 1 |
| Mail | +5 Armor | 300 iron | Smithy 3 |
| Emberwright Plate | +8 Armor, −10% Fire damage taken | 600 iron, 150 silver | Smithy 6 |

The Wright's Blade (v0.5) is the fourth weapon tier, strictly better than the Silvered Blade, so upgrading in place still works. Like all gear it resets at the Long Night (A4).

#### 5.3.7 Injury and death (D07)

| Outcome at the end of a fight | Result |
|---|---|
| Survived with at least 30% Health | Fine |
| Survived with less than 30% Health | **Bruised:** 30 min recovery |
| Downed | **Wounded:** recovery of 2 h × contract tier |
| Downed on a **Reckless** contract | Death roll: **30% chance of death**. Survivors are **Grievously Wounded** (3× the Wounded time). |

- A contract is **Reckless** when its displayed success odds are **below 35%** **[JC]**. The odds already include preparation, so "reckless" and "badly prepared" are the same rule: poor preparation lowers the odds until the contract crosses the line.
- Launching a Reckless contract requires a confirmation dialog that names each hunter and their exact death chance.
- Recovering hunters can't take contracts. Recovery runs on real time, including offline.
- **Story hunters never die** *(⚑ revision, lore C4)*: Sigrun, Ostap, Toma and Arvid can be wounded, but on a Reckless contract their death roll becomes Grievously Wounded instead. They persist through every Long Night and are always available before their act needs them (`lore-secrets.md` §10).
- Dead hunters are gone for the cycle. Their memorial stays in the Hall of the Fallen (More menu). **[JC: a dead named hunter returns as a candidate after the next Long Night, with their lore tracked. Permanently losing a hand-authored character felt too punishing for a collection game.]** Before v0.4, when no Long Night exists yet, a dead hunter returns as a candidate **3 days** after their death *(⚑ revision A12 [JC])*. **From v0.4,** a dead hunter returns as a candidate at the next Long Night, at their usual price, with their levels halved like everyone's (§5.9.7, D110).

---

### 5.4 Contracts (v0.2)

#### 5.4.1 The board

- One new contract arrives every 2 h, up to a cap of 6. Contracts never expire.
- **Decline** *(⚑ revision A2)*: any open contract can be declined for free. It's removed with no penalty and no Threat, and the slot refills on the normal 2 h schedule.
- **The board opens in Hamlet, when the first Mine is built** *(⚑ revision G6 [JC]: was Keep)*. Hamlet contracts are tier 1 only, with a party of at most 2. Keep unlocks higher tiers (below), the Barracks, the Trophy Hall, the Hunter's Lodge and the Alchemist's Hut.
- Each contract is generated from a seed when it arrives, and its content is fixed from then on.

Each contract has:

| Field | Notes |
|---|---|
| Village | The giver. Flavor in v0.2; ties into Reputation in v0.10. |
| Monster | In v0.2, always a known species (identified for free). Unknown monsters arrive in v0.3. |
| Tier | 1–5 from the Keep on; Citadel and Bastion add no tiers (D106). Each tier above the monster's base tier multiplies Health and Might by 1.35 and Armor by 1.15 (§7). |
| Location tag | Forest, river, field or barrow; **ruin from v0.5** *(⚑ revision D-2; D157)*: old Emberwright sites, posted by Kozly Hollow, Velkvik and Ravenfell from the Keep. **Barrow and ruin contracts start at tier 2** *(⚑ revision A3 [JC])*. Interacts with traits. |
| Party size | Up to 3 hunters at tiers 1–3, up to 4 at tiers 4–5; at most 2 in Hamlet (G6) |
| Duration | 30 min / 1 h / 2 h / 4 h / 8 h by tier |
| Bounty | `91 × 1.6^(tier − 1)` silver × `bounty.ageMult` (Hamlet 1.0, Keep 1.1, Citadel 3.5, Bastion 3; D106, D138). The age production bucket does **not** apply to bounties *(⚑ revisions: base was 40, raised with G1; ageMult defined in A6; 72 → 78 in the Q9 tuning (D82): provisions now grow with food income, so fewer contracts go out and each pays a little more; 78 → 91 in the v0.4 tuning, D138)* |
| Trophies | Equal to the tier, of that monster's family |
| Reagents | *(v0.3)* monster-specific drops |

**Tier unlocks** *(⚑ revision B8 [JC])*: tier t+1 unlocks after **3 successes at tier t**, up to the Rank's cap (Hamlet T1, Keep T5). **Tier mix:** 60% of new contracts at the highest unlocked tier, 40% spread evenly across the lower unlocked tiers (all at the highest while only one is unlocked). **No rubber-banding** **[JC]**: difficulty never scales with roster strength, because hidden scaling would make the numbers lie.

#### 5.4.2 Launching

1. Choose a party. A **Suggested party** button fills it with the highest-odds available combination, found by the two-stage search in §6.5 (it runs in a background worker).
2. *(v0.3)* Choose preparation.
3. Read the odds panel:
   - **Win chance** from 500 simulated fights, shown with a ±margin.
   - **Expected injuries** per hunter.
   - **Death chance** per hunter (Reckless contracts only).
   - **Expected rewards.**
   - **"Why?"** opens the summary math: party damage per 100 ticks vs monster Health, and monster damage per 100 ticks vs the party's effective Health.
4. **Pay provisions** *(⚑ revisions G3; Q9, D81–D82)*: per hunter, the larger of **30 food** or **N minutes of the hold's food capacity** (what its food jobs would make with every farmer slot filled, limited by the number of peasants; Q11, D84, so moving peasants between jobs cannot lower it), × party size × 2.2^(tier − 1), paid at launch. N is `provisions.incomeMinutes`: 0 in the Hamlet, 1 in the Keep (D85), **4.4** in the Citadel (D189) and 2.5 in Bastion (D106, D138; tuned to keep §6.3 #8 in its band). Hamlet contracts therefore stay flat (tier 1 with 2 hunters: 60 food). From the Keep on, provisions grow with the hold, so food stays a real cost (§6.3 #8): a tier-3 party of 3 costs about 15 minutes of food capacity, and a tier-5 party of 4 about 1 h 34 min. The launch sheet's breakdown shows the food capacity used. Failures don't refund provisions; declining is free. If food is short, the launch button shows how long until it's affordable. Nothing launches while you're offline, so food can never go negative.
5. Launch. The hunters are busy for the contract's duration.

The **actual outcome** uses `seed = hash(contractSeed, party IDs, preparation IDs)`. It is fixed and reproducible, and it's the same fight the log replays. The 500 preview simulations use different derived seeds, so the preview never reveals the real roll.

#### 5.4.3 Results

| Result | Rewards |
|---|---|
| **Success** | Full bounty, trophies, XP, reagents (v0.3); from v0.5, a document when its condition is met, and a Ribbonshade's name (§5.14); from v0.8, a chance of **loot** (§5.11.2) |
| **Failure** (the party is downed, or 400 ticks pass) | Half XP. In v0.3, any clues gathered are kept as bestiary progress. **No bounty.** |
| **Well-prepared success** *(v0.3)* | Bounty × 1.5 and +1 trophy **[JC]** |

**Rewards apply at completion** *(⚑ revision B9 [JC])*. When a contract's timer ends, including in simulated offline time, its rewards, injuries and XP apply and its hunters return to the hold at once. **Collect** only acknowledges results and shows the logs. Offline trophies therefore count toward the Trophy Hall from the moment they're earned.

#### 5.4.4 How contracts feed the Hold

- **Silver bounties** are the main silver source from v0.2 on. Silver Seams are capped at about 690 silver per day for the whole game (G1; 720 before D138), so bounties overtake them as higher tiers unlock.
- **Trophy Hall** (Keep, one level, cost 500 wood, 200 iron): gives **+0.5% to all Hold production per trophy earned this cycle**, in the trophy bucket. The count is the **cumulative trophies earned this cycle; spending trophies (v0.8) never reduces it** *(⚑ revision A7)*. Silver is excluded (G1).
- **Reagents** go to the Alchemist *(v0.3)*.

---

### 5.5 Combat resolution (v0.2)

*⚑ Revised: turn meter (G4), damage rules (B1–B5), exact worked example (A14).*

Combat is an auto-battle on a **turn meter**. The party fights one monster on contracts and in the Last Stand. In Delves it fights groups of 2–3 (§5.10.4); the group rules reduce to these rules exactly when there is one monster.

**Turn meter:**
1. Every combatant starts the fight with an empty meter (0).
2. Each **tick**, every standing combatant's meter rises by its current Speed (`Speed_eff`, §5.0).
3. Every combatant whose meter is now **100 or more** takes **one action**, then loses 100 from its meter. Leftover meter carries over.
4. When several act on the same tick, they go in this order: higher meter first, then higher Speed, then **hunters before the monster**, then party slot order. *[JC] A fixed rule rather than a seeded roll, so ties never consume randomness.*
5. The fight ends at once when the monster reaches 0 Health (**success**) or every hunter is downed (**failure**). If neither has happened by **tick 400**, the party retreats (**failure**).

**Actions:**
- **Hunter:** attack the monster. A Mender heals instead when anyone is below her threshold (§5.3.3).
- **Monster:** make its number of attacks (Atk). Each attack picks a target by weight (Vanguard 3, others 1; downed hunters excluded).
- **Abilities** trigger as written in §8.3. Effects that once said "per round" now happen **on the monster's action**, and durations count **the affected combatant's own actions**. For example, the Frost Pot slows the monster's next 3 actions.

**Attack resolution.** Each direct attack draws rolls from the fight's seeded stream **in this order**:
1. **Target roll** (monster attacks only, when more than one hunter is standing): `roll × total weight`, walking the standing hunters in party slot order.
2. **Hit roll:** hit if `roll < 0.90` (abilities can modify the chance). **On a miss, no further rolls are drawn for that attack.**
3. **Variance roll:** `variance = 0.85 + 0.30 × roll` (Steady: `0.95 + 0.10 × roll`).
4. **Crit roll:** crit if `roll < critChance`.
5. **Ability rolls** (such as Hamstring's 25%), only if the attack hit.

Damage then follows the combat formula in §5.0.

**General damage rules:**
- **Armor applies only to direct attacks** (hunter and monster weapon attacks). Bombs, damage over time, ability damage and Silver sub-hits ignore Armor. Resistances still apply to any typed damage *(⚑ revision B4 [JC])*.
- **Immunity:** a resistance of 0 means **0 damage**, and the log says "immune". The 1-damage floor applies only when the resistance is above 0 *(⚑ revision B5 [JC])*.
- **Hunters have no type resistances.** Their protection is Armor plus the taken% bucket.

**Log format.** One line per action, stamped with its tick. Each line expands to show its rolls. *Illustrative example, not a test case:*

```
t31 · Bjarna (Striker) hits the Draugr — Frost 21 ×0.25 resist −9 armor = 1 (floor) · Draugr 259/260
t33 · Draugr's Barrow-Grip on Halvar — Steel 22 −8 armor = 14 · Halvar 156/170 · Halvar is held (loses his next action)
```

Logs are kept for the last 50 contracts. Any listed contract's log can be regenerated from its seed at any time.

#### 5.5.1 Worked fight: required test case

**This example is exact.** Claude Code must build a test that reproduces it **line for line** *(⚑ revision A14)*. It doesn't depend on the random-number generator: the test feeds in this **roll sequence** directly. A second, seed-based golden test gets recorded once the generator is chosen in v0.2.

**Setup:**
- **Zora Sedlak**, level 1, no gear: Health 100, Might 20, Armor 3, Speed 13 + 3 (Quick) = **16**, crit chance 0.20, Steel damage. A field contract, so Fen-born doesn't apply.
- **Kikimora**, tier 1: Health 110, Might 12, Armor 3, Speed 13, 1 attack per action, crit chance 0.10, Steel resistance 1.0. Spoil has no effect (no potions carried).
- One hunter, so no target rolls are drawn.

**Roll sequence (34 rolls; the bars only separate attacks for reading):**

`0.40 0.50 0.70 | 0.20 0.60 0.95 | 0.95 | 0.10 0.30 0.50 | 0.30 0.90 0.10 | 0.50 0.20 0.80 | 0.60 0.50 0.40 | 0.70 0.80 0.30 | 0.20 0.40 0.60 | 0.10 0.50 0.15 | 0.80 0.60 0.30 | 0.30 0.70 0.90`

| Tick | Actor | Rolls (hit · variance · crit) | Dealt before Armor | Damage | Target Health after |
|---|---|---|---|---|---|
| 7 | Zora | 0.40 · 0.50 → 1.000 · 0.70 | 20.00 | 17 | Kikimora 93 |
| 8 | Kikimora | 0.20 · 0.60 → 1.030 · 0.95 | 12.36 | 9 | Zora 91 |
| 13 | Zora | 0.95 (miss) | — | 0 | Kikimora 93 |
| 16 | Kikimora | 0.10 · 0.30 → 0.940 · 0.50 | 11.28 | 8 | Zora 83 |
| 19 | Zora | 0.30 · 0.90 → 1.120 · 0.10 (**crit**) | 33.60 | 31 | Kikimora 62 |
| 24 | Kikimora | 0.50 · 0.20 → 0.910 · 0.80 | 10.92 | 8 | Zora 75 |
| 25 | Zora | 0.60 · 0.50 → 1.000 · 0.40 | 20.00 | 17 | Kikimora 45 |
| 31 | Kikimora | 0.70 · 0.80 → 1.090 · 0.30 | 13.08 | 10 | Zora 65 |
| 32 | Zora | 0.20 · 0.40 → 0.970 · 0.60 | 19.40 | 16 | Kikimora 29 |
| 38 | Zora | 0.10 · 0.50 → 1.000 · 0.15 (**crit**) | 30.00 | 27 | Kikimora 2 |
| 39 | Kikimora | 0.80 · 0.60 → 1.030 · 0.30 | 12.36 | 9 | Zora 56 |
| 44 | Zora | 0.30 · 0.70 → 1.060 · 0.90 | 21.20 | 18 | Kikimora 0 |

**Result:** success at tick 44. Zora ends at 56/100 Health, above 30%, so no injury.


---

### 5.6 Bestiary & investigation (v0.3)

#### 5.6.1 Monster families

| Family | Example members | Common clue themes |
|---|---|---|
| Beasts & Wilds | wolves, bies, lindworm | tracks, carcasses, broken trees |
| Restless Dead | upyr, draugr, strzyga | disturbed graves, bloodless victims, cold spots |
| Water Spirits | rusalka, vodyanoy, nix | drownings, music at night, wet footprints |
| Field & Forest Spirits | leshy, poludnitsa, huldra, kikimora | lost travelers, heatstroke at noon, livestock trouble |
| Cursed *(ruins, v0.5)* | Gloam-moths, Ribbonshade, Anvil-wight, Rimewrought (originals, §8.3) | ruin sites, old Emberwright marks |
| Deep *(Delve guardians from v0.7, D252)* | Unlit's Breath, the Forgotten, the Dross-Tide (§8.3) | — (never investigated) |

#### 5.6.2 Knowledge levels (per species)

| Level | How you reach it | Effect |
|---|---|---|
| 0 Unknown | — | The species doesn't appear in candidate lists. Its entry is hidden. |
| 1 Sighted | It appears as a possibility on any contract | Shows as "?" in candidate lists. A silhouette entry in the bestiary. |
| 2 Identified | Identify it through investigation, or fight it | Resistances, abilities, and stats become visible. Preparation can target it. |
| 3 Studied | 4 kills | Clues on its contracts take half the time. +5% damage against it (knowledge bucket). |
| 4 Mastered | 10 kills | Its contracts arrive already identified. +10% damage against it. A counter-tip for each of its abilities. |

#### 5.6.3 Investigation

From v0.3, a contract can post an **unknown monster**. The player sees:

- **Symptoms:** a flavor description.
- **Candidate list:** every species from the region pool that fits the location tag, each marked with its knowledge level.
- **3 clue slots**, hidden at first.

**Investigating.** The **Hunter's Lodge** (Keep, level building, max 3) gives one investigation slot per level. Assigning a contract to a slot reveals its clues one at a time, taking **30 min each** (halved if the true species is Studied).

**What a clue does.** Each clue carries tags such as *drowned*, *night*, or *grave*. Each species has tags too. A revealed clue rules out every candidate that lacks its tags.

**What generation guarantees.** All three clues together always narrow the list to exactly one species. One or two clues might, or might not.

**Launching early is allowed.** The odds panel then averages over the remaining candidates, weighted equally, and labels the result: *"Odds assume an unidentified monster: 3 candidates."*

**Investigation takes no hunters** **[JC]**. A clue mechanic that ties up roster slots would compete with contracts for the same scarce resource and make the early game feel slow. The Lodge's slots are the limit instead.

#### 5.6.4 Bestiary screen

- A grid by family. Each entry shows its sprite (silhouette until Identified), a folklore blurb written in-world, revealed stats and resistances, the kill count, the knowledge-level progress bar, and its last 5 encounter logs.
- **The bestiary is never reset by the Long Night** (§4).

---

### 5.7 Preparation (v0.3)

The **Alchemist's Hut** (Keep, level building, max 5) brews consumables from reagents.
- The nine v0.3 recipes are known from the start; from v0.6 they are the recipe book's starting recipes, and discovery adds the rest (§5.8).
- Each brew takes 10 min, one at a time per Hut level. Several can be queued.
- Finished consumables go into the hold's stores.

**Preparation slots per contract:**

| Slot | Count | Applies |
|---|---|---|
| Oil | 1 per hunter | Coats the weapon for the whole fight |
| Potion | 1 per hunter | Triggers automatically on its condition |
| Bomb | Up to 2 per party | Thrown at tick 1, or on its trigger |

**v0.3 consumables** *(⚑ durations restated in actions for the turn meter, G4)*:

| Item | Type | Effect | Recipe (category) |
|---|---|---|---|
| Grave Oil | Oil | +35% damage vs Restless Dead | 2 grave dust + 1 juniper |
| Drowned-Bane Oil | Oil | +35% damage vs Water Spirits | 2 river pearl + 1 yarrow |
| Thornbane Oil | Oil | +35% damage vs Field & Forest Spirits | 2 thornwood + 1 mugwort |
| Mending Draught | Potion | Once, below 30% Health: heal 40% of max Health | 2 yarrow + 1 honeycomb |
| Hardwood Tonic | Potion | +30% Armor until the holder's 5th action | 1 thornwood + 2 juniper |
| Quickfoot Tincture | Potion | +20% Speed for the whole fight | 2 mugwort + 1 hare's foot |
| Fire Pot | Bomb | At tick 1: 40 Fire damage, then 10 Fire on each of the monster's next 3 actions | 1 pitch + 1 wood (resource) |
| Frost Pot | Bomb | At tick 1: 30 Frost damage, then −30% Speed for the monster's next 3 actions | 1 rime salt + 1 wood |
| Saltburst | Bomb | Triggers on the monster's first ability: cancels it and blocks abilities for the monster's next 3 actions | 2 rime salt + 1 silver (resource) |

*v0.6 adds six brews (§5.8.5); 15 in all.*

- **Mismatched oils do nothing.** The odds panel shows "Grave Oil: no effect (target is a Water Spirit)." Against an unidentified monster, it shows the oil's effect for each remaining candidate.
- **Well prepared** means the contract succeeded with a matching oil on at least one hunter (any family oil, including the v0.6 oils, §5.8.5), plus at least one bomb whose damage type the monster is weak to *or* a Saltburst that cancelled an ability. A well-prepared success pays bounty × 1.5 and +1 trophy (§5.4.3).
- **Herb Garden** (Keep, count building, cost 300 wood, 100 food): grows common herbs (yarrow, mugwort, juniper) at 1 per 10 min each. Monster reagents come only from contracts.
- The full ingredient list is in §8.

---

### 5.8 Alchemy discovery & skills through use *(v0.6; ⚑ v0.6 flesh-out, D193–D220)*

#### 5.8.1 Properties *(D197)*
- Every ingredient carries **3 hidden properties**. Each property belongs to exactly one brew and is shown under that brew's name ("Grave Oil"). The table is §8.6. It is **the same in every game** (content, not seeded), so every brew can be guaranteed makeable.
- 12 ingredients × 3 = **36 properties**. The book opens with the **15** that the nine v0.3 recipes prove (D200); **21** are hidden at the start, including all three of wolf fang's and noon poppy's.
- *Kept distinct from Skyrim's alchemy on purpose (GDD §2.3):* three properties, not four; pairs only; experiments are kettle tests, never eating an ingredient; property names are our brews, never "Fortify / Restore / Resist / Damage X".

#### 5.8.2 Recipes *(D198)*
- **A recipe is known** when the book shows enough carriers of a brew's property:
  - **Oils and potions:** two different ingredients known to carry it.
  - **Bombs:** one ingredient known to carry it.
- **Recipe shapes** (the v0.3 shapes, kept):

| Brew kind | Shape |
|---|---|
| Oil, potion | 3 units from two different carriers: **2 of one and 1 of the other**, either way round (the player picks the split at Brew) |
| Fire Pot, Frost Pot, Poppy Smoke | 1 unit of a carrier + 1 wood |
| Saltburst | 2 units of carriers (any mix) + 1 silver |

- The nine v0.3 recipes are exactly these shapes, so they are simply the first recipes the book knows. Every other known pair is an **alternate recipe** (e.g. a Fire Pot from thornwood, a Frost Pot from river pearl).
- Brewing is unchanged from v0.3 (§5.7, D91): one brew per kettle (kettles = Hut level), `brew.time` each, paid when queued, cancel refunds in full, queue unlimited.

#### 5.8.3 Experiments *(D199)*
- An **experiment** puts **1 unit each of two different ingredients** in a kettle for `experiment.time` (10 min), queued like a brew (paid when queued, cancel refunds). The Copper Still shortens it like a brew.
- **Result, when it finishes:**
  - If the two share any properties, **every shared property** is revealed on both.
  - If they share none, **the first hidden property of each** (in the §8.6 order) is revealed. An ingredient with nothing hidden reveals nothing.
  - An experiment teaches only: **no brew comes out.**
- A pair already tried, or a pair with nothing left to learn on either side, can't be queued (the picker says why).
- When a reveal makes a brand-new brew's recipe known, the result says so: *"Discovered: Hidebane Oil."* (away sheet, Hut, results).

#### 5.8.4 The recipe book *(D204)*
- Lives in the **Alchemist's Hut** (§9.9): a grid of the 12 ingredients × 3 property slots ("?" while hidden), the pairs already tried, and every brew with its known recipes.
- **Kept forever** (in the story, Ilse keeps a copy in the archive, `lore-secrets.md` §7). Count shown: *"Properties found: 23 of 36."*

#### 5.8.5 The v0.6 brews *(D201; names D203, subject to the T6.2 search)*

| Brew | Kind | Effect (numbers tunable, in content) | Answers |
|---|---|---|---|
| **Hidebane Oil** | Oil | +35% damage vs Beasts & Wilds (`oil.familyBonus`) | Gaunt Wolf, Bies; makes well-prepared possible vs the family |
| **Wright's Oil** | Oil | +35% damage vs the Cursed | All four Cursed; makes well-prepared possible vs the family |
| **Coldwater Draught** | Potion | The holder takes −40% Fire damage for the whole fight (taken%, inside the 75% cap) | Noon Heat, Seal-burn |
| **Owl-Eye Drops** | Potion | The holder's hit chance +10 points for the whole fight | Lightless |
| **Steadfast Draught** | Potion | The first time a monster's ability would cost the holder an action, it doesn't; the ability's other effects still apply | Barrow-Grip, Drowning Song, Enthrall, Lead Astray, Drag Under's grab |
| **Poppy Smoke** | Bomb (1 carrier + 1 wood) | At tick 1, the monster loses its next action | Fast monsters; a breather |

- **Well prepared:** the two new oils are matching oils like the v0.3 ones. Poppy Smoke has no damage type, so it never counts as a bomb the monster is weak to.
- **Herbwise** multiplies Coldwater (−50%) and Owl-Eye (+12.5 points); Steadfast has no number, so Herbwise does nothing for it (shown).
- **Spoil** can ruin a Steadfast Draught that hasn't fired (D92's rule); Coldwater and Owl-Eye are drunk at the start.
- **Saltburst** doesn't cancel the new brews' effects (they are the party's, not the monster's).
- **In the Last Stand:** potions fire once in the whole stand (Coldwater and Owl-Eye last wave 1 only, like Quickfoot, D120); Steadfast fires once in the stand; automatic bombs per wave are: those the wave is weak to, then one Saltburst, then one Poppy Smoke (up to `prep.bombSlots`).
- **Fights:** Steadfast and Poppy Smoke are new fight rules; the other four reuse the oil, taken% and hit-chance rules. Old fights and every golden fight replay unchanged, so `rulesVersion` stays 3; if a golden changes, stop and ask (D218).

#### 5.8.6 Warden skills *(D205–D208)*
- **Four skills: Alchemy, Smithing, Lore, Command.** Each runs **0–10** (`skill.maxLevel`, locked), rises by doing its activity, and is **kept forever** ("carried in the ember", `lore-secrets.md` §7). Level L → L+1 costs `skill.xpBase × skill.xpGrowth^L` XP.

| Skill | XP from (tunable) | Gives, per level |
|---|---|---|
| **Alchemy** | brew finished 1 · experiment 3 · property revealed 10 | Brews **+3% stronger** (to +30%): every number in a brew's effect (oil bonus, heal, Armor, Speed, Coldwater, Owl-Eye, bomb damage and burn). Counts of actions (Saltburst's block, Steadfast, Poppy Smoke, durations) don't change. Multiplies with Herbwise. |
| **Smithing** | gear upgrade: its tier × 2 · Smithy level built 2 | Gear upgrades cost **2.1% less** per level (to −21%; D240), every resource including silver |
| **Lore** | clue revealed 1 · species reaching a knowledge level 5 · document or letter found 5 | Clues take **4% less time** (to −40%), after Studied, Tracker and the Bone Whistle |
| **Command** | contract won: its tier · wave held in the Last Stand 1 | Hunters earn **+4% contract XP** (to +40%), adding with Drill Yard and the Tally Stick |

- **Only Alchemy changes fight numbers** (D206). Its level is **frozen at launch** on the running contract, on the fight record and on the stand record, as knowledge is (D90), so a later level never changes a replay. The odds panel uses the current level.
- **No skill touches silver income** (G1). Smithing lowers silver *costs* of gear only.
- **Breakdowns:** each skill is its own named line ("Lore 4: −16%"). No new bonus bucket in §5.0.
- **Shown** on the Rank screen in the Hearth Hall, beside The Hearth and the Roll of Wardens, under *"What the ember remembers"*: level, progress to the next, the bonus, long-press for the breakdown. A level-up gets one line on the away sheet or results: *"The ember remembers more: Lore 3."* The new-warden sheet lists them: *"The ember remembers: Alchemy 4 · Smithing 2 · Lore 3 · Command 5."*
- **Saves from before v0.6 start every skill at 0** (the save doesn't keep enough history to credit them fairly).
- **Pacing target:** level 10 around cycles 5–6, alongside Acts V–VI (§6.2 rows).
- **Names:** plain English (D208). "Alchemy" and "Smithing" are also Skyrim skill names; they are generic words (§2.3), and the system's shape differs (one set for the hold, kept through the reset).

#### 5.8.7 Hunters don't get use-skills *(D207)*
Hunters grow by level now and by ranks, stars and talents in v0.8 (§5.11). Per-hunter use-skills (e.g. per damage type) are not in v0.6; the idea goes to the v0.8 flesh-out.

### 5.9 The Long Night *(v0.4 mechanics, v0.5 story)*

*⚑ Milestones renumbered (P2, P3): the Long Night's mechanics ship in v0.4, ahead of alchemy discovery (now v0.6), and Act I with its story systems ships in v0.5. Mapping in `decisions.md` D35.*

*⚑ Brought to full detail in the v0.4 flesh-out (D106–D115). Every number is a tunable starting value unless marked locked; §7.6 lists the keys.*

**The cycle in one line:** rank the hold up to Bastion, keep Threat in check, and choose when to make the Last Stand. The Long Night then resets the hold and keeps what you learned, recruited and earned.

#### 5.9.1 Threat *(D108)*

- Threat starts each cycle at **0** and rises every hour by the rate for the hold's Rank: **Hamlet 0, Keep 0.5, Citadel 1, Bastion 1** *(D138)*. Time away counts exactly as it does for production, so the offline cap applies to Threat too.
- **Each failed contract adds 3 × its tier. Each completed contract takes off 0.76 × its tier** *(D138)*. A full board, old contracts and declined contracts add nothing *(G2)*.
- **Defenses slow the hourly rate:** each level of Walls or Watchtower takes off 2%, so at most 60% at the Bastion caps.
- Threat never goes below 0, and it resets to 0 at the Long Night.
- **What Threat does, and nothing else:** every point makes each wave of the Last Stand +0.61% Health and Might, and adds +0.7% to the waves part *(D138)* of the Embers payout (§5.9.4). No forced stand, no damage to buildings, no harder contracts (pillar 5; no rubber-banding, §5.4.1).
- **Shown** as a meter on the Hold screen from the Keep on, with a breakdown: the Rank's rate, what defenses take off, contracts completed and failed (§9.13).

#### 5.9.2 Defenses *(D107)*

From Citadel, two level buildings guard the walls (§8.1). Both also slow Threat (§5.9.1). Bastion requires Walls level 1.

| Building | Level cap | In the Last Stand |
|---|---|---|
| **Walls** | 10 in Citadel, 15 in Bastion | The party takes 2% less damage per level (taken%, so the 75% cap applies) |
| **Watchtower** | 10 / 15 | At tick 1 of each wave, a volley of 20 × level Steel damage that ignores Armor, like a bomb (no oil, trait or knowledge bonus) |

#### 5.9.3 The Last Stand *(D107)*

- **When:** available from Bastion, once per cycle, always voluntary. Starting it is final: the confirmation says the Long Night follows.
- **The waves are monsters you know.** When the hold reaches Bastion, the stand's seed (`${gameSeed}:stand:${cycle}`) fixes the cycle's wave list, and the stand screen shows it. A species not yet Identified shows as "?".
  - Wave 1 is tier 2, and every 2 waves add a tier. Past tier 5, the contract tier scaling keeps going (Health and Might ×1.35, Armor ×1.15 per step).
  - Each wave's species is picked from those whose tier range includes the wave's tier (above tier 5: those that reach tier 5).
  - Threat makes every wave stronger (§5.9.1).
- **The party:** up to **6** active hunters *(locked)*. A suggested six fills the slots: the highest levels, with at least one Vanguard and one Mender; any can be swapped. Injured hunters can join (recovery timers are ignored). Contracts still running finish on the spot with their real result before the stand begins (§5.9.7).
- **Preparation:** one oil and one potion per hunter for the whole stand, chosen with the contract pickers. Bombs are thrown automatically from the stores, up to 2 per wave (`prep.bombSlots`): bombs the wave's species is weak to first, then one Saltburst, then one Poppy Smoke (v0.6). The stores reset after the Long Night anyway.
- **The fight:** one wave at a time, using the contract fight rules (§5.5), with these differences:
  - Hunters keep their Health between waves. Before each new wave, every standing hunter recovers 20% of max Health. Downed hunters stay down for the rest of the stand.
  - The Watchtower's volley and the bombs land at tick 1; Walls (and the Iron Shutter relic) reduce damage taken.
  - Location traits (Fen-born, Fell-born, Lantern-bearer) don't apply: the hold isn't a contract location. Family traits, oils and Studied or Mastered bonuses do.
  - A potion fires once in the whole stand, on its usual condition.
- **The end:** when every hunter is down, or a wave isn't won within the 400-tick limit, the walls fall. **Waves held** is the number of waves won, and from v0.5 it gives the stand its **band** (Broken, Held or Triumphant, §5.14.8). The stand causes **no injuries and no deaths**.
- **The preview** (in the odds worker): 100 practice stands with their own seeds. It shows expected waves (the median, with a 10th–90th percentile range), the Embers the stand would pay now with their breakdown and per day of the cycle, how much Threat rises by tomorrow, and an estimate of tomorrow's Embers, labeled as an estimate (it assumes today's Threat rate and today's average trophies per day). Budget in §6.5.
- **Logs:** every wave has a fight log, rebuilt on demand from the stand's saved inputs (technical design §5.3).

#### 5.9.4 Embers *(D109)*

```
wavesPart = Σ (n = 1 … waves held)  4 × 1.15^(n − 1)
Embers    = floor( rankMult × wavesPart × (1 + 0.007 × Threat)  +  1 × trophies earned this cycle )
rankMult  = Hamlet 0.25, Keep 0.5, Citadel 0.75, Bastion 1
```

- In normal play the stand is only open in Bastion, so `rankMult` is 1. The lower values matter only for the arrival (§5.9.8).
- The trophies counted are the cycle's cumulative count (A7). At the arrival the trophies part is capped (§5.9.8).
- **The sweet spot.** Early in Bastion, defenses, hunter levels and gear grow faster than Threat, so each day holds more waves. Later, level costs climb (×1.75 per level) while Threat keeps rising, and the waves win. Trophies add a steady amount throughout. Total Embers keeps creeping up if you wait, but **Embers per day of the cycle** rises, peaks and falls. The target is a peak on **days 4–5** (§6.2).
- **How the simulator measures it:** from Bastion on, at every check-in up to day 7, it runs a practice stand on a throwaway copy of the game and records Embers ÷ days so far. The median time of the peak over the 5 seeds must fall on days 4–5.
- Embers are kept forever. The game calls them "what the last warden left in the hearth" (`setting-primer.md` §6.8).

#### 5.9.5 Warden upgrades: The Hearth *(D111)*

- Embers buy **permanent warden upgrades** on **The Hearth**, in the Hearth Hall, open at any time. Unspent Embers carry over.
- A **flat list**: eight upgrades, each with levels and a rising cost (§8.9). No branches, and no re-spending in v0.4.
- Production bonuses go in the **ember** bucket (§5.0); none applies to Silver Seams (G1).
- **Risk, noted at planning:** a cycle's speed is limited mostly by silver and by how many contracts the hunters can run, and the board's pace is locked. That's why the list includes bounty, level, XP and duration upgrades. If the "later cycles" check (§6.2) still fails after tuning, the build stops and asks rather than touching anything locked.
- **From v0.8, Embers also buy hunter stars** (§5.11.3), bought on each hunter's sheet. The Hearth shows one line pointing there.

#### 5.9.6 Relics *(D111)*

- **Found at Last Stand milestones:** the first time any stand holds wave **6, 9, 12, 15, 18 and 21**, you find one relic you don't have yet, picked by the stand's seed. A first stand of about 10 waves finds two.
- **v0.4 relics belong to the hold.** Every relic you own works; there are no relic slots: the six Delve relics of v0.7 work only inside Delves (§5.10.7, D261). Relics for hunters arrive in v0.8 as **Legendaries** (§5.11.6).
- Bonuses go in the **relic** bucket (§5.0). No v0.4 relic touches silver. The six are in §8.10.
- Relics are kept forever.

#### 5.9.7 The Long Night: what resets and what's kept *(D110)*

| Resets (to the §5.1.4 start, plus warden upgrades) | Kept |
|---|---|
| Rank (back to Hamlet), every building, resources, peasants | Every hunter you've hired, and part of their levels |
| The contract board, tier unlocks, unread results | The bestiary: knowledge, kills, Mastered auto-identify; **the recipe book (v0.6)** |
| Stores (consumables and reagents), the brewing queue, Lodge slots | Embers, relics, warden upgrades, **warden skills (v0.6)** |
| Items, except Legendaries (A4, D306), injuries, Threat, trophies this cycle (after conversion) | Candidates you haven't hired yet (unlocks are lifetime) |
| | The Hall of the Fallen, Reports and fight replays, scenes already seen, settings, lifetime stats, the cycle number (+1), the cycle history |
| | Hunter ranks, stars and talents; Legendaries (v0.8) |

- **Hunter levels:** each hunter keeps half the levels above 1, rounded down (6 → 3, 5 → 3, 4 → 2); Old Hands raises the share. XP toward the next level goes to 0. A kept level above the current Rank's cap stays; the cap only stops new levels. Ranks, stars and talents are kept (v0.8).
- **Contracts still running** when the stand starts finish on the spot with their real result (the dice were fixed at launch); their rewards apply and their trophies count.
- **Injured hunters** can join the stand; all injuries clear at the Long Night.
- **Dead hunters** return as candidates at the Long Night, at their usual price, with their levels halved like everyone's. Story hunters never die (§5.3.7).
- **The active roster** goes back to the Hamlet cap of 3. You choose which 3 on the new-warden sheet (the three highest levels are pre-chosen); everyone else waits in the reserve.
- **Contract tier unlocks** reset with the hold.
- **The new cycle** starts in Hamlet from the §5.1.4 starting state, plus any warden upgrades (Full Larder, Young Families).
- **What you see, in order:**
  1. The stand's result: waves held, the Embers breakdown, any relic. Pechko: *"The walls fell. The hearth didn't. Someone will come."*
  2. *"The story continues in a later version."* (P4) From v0.5: the act's testament instead, while its act is written (§5.14.9).
  3. The Hearth: spend now or later.
  4. The new-warden sheet: *"Seasons pass. Someone new walks up the road, hands warm in the cold."* You choose your 3 active hunters.

#### 5.9.8 Arriving at v0.4 *(⚑ revision G8; details D112)*

- When a save from before v0.4 first loads in v0.4 (preview or live, including one imported later from a save code), it faces **the first Long Night**. New games never do.
- **When:** on first load, after the away catch-up. The arrival sheet explains, then the normal stand screen opens: you choose the six and their preparation, see the preview, and start. It can't be put off. Running contracts finish on the spot.
- **The arrival sheet:** title *"The Long Night"*; *"The dark is at the walls tonight. Everyone who can hold a spear goes up."*; and a plain note: *"New in this version: each cycle ends in a Last Stand. Your save faces its first one now. Afterwards the hold starts over; your hunters, your bestiary and anything your Embers buy are kept."*
- **The conditions:** Threat is 0 (it starts counting after the arrival); no defenses (they need the Citadel); the Rank multiplier is the save's Rank (a Keep save pays ×0.5 on the waves part); relic milestones as normal.
- **The cap:** only the trophies part is capped, at **1.2 ×** the median Embers a simulated Standard player earns in cycle 1 (Monday start, 5 seeds). The share is locked; the median is a tunable constant set from the tuned simulator and recorded in a decisions row. The waves part is added on top. Before v0.4 the Trophy Hall bonus is uncapped [JC].
- Then the normal Long Night (§5.9.7).
- **Testing:** a debug action runs the arrival; the owner's real v0.3 save is the fixture.

#### 5.9.9 A new warden each cycle

- **A new warden each cycle** *(⚑ lore L4)*: after each Long Night a new warden arrives; **from v0.5** you name them. The **Roll of Wardens** (L9) carves each warden's name, Ranks reached, Last Stand band and relics into the Hearth Hall. From v0.4 the save keeps one short history entry per cycle for it (technical design §5.2, D113).
- **Story (v0.5):** Acts I and II, documents, names, letters and trust (§5.14). Residents react to how the stand went. **Until an act is written, a finished cycle closes with "The story continues in a later version"; when the act ships, its documents unlock in your current cycle** *(⚑ P4 [JC])*.

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
- Fixed when the run starts, from the hold's Rank: floors 1–3 at `delve.baseTier` (Keep 3, Citadel 4, Bastion 5); floors 4–6 at that +`delve.upperTierStep` (1); the guardian at +`delve.guardianTierStep` (2).
- Past tier 5, the Last Stand's scaling continues (Health and Might ×1.35, Armor ×1.15 per step, §5.9.3).
- A Rank-up during a run doesn't change it.

#### 5.10.4 Groups and group combat *(D250, D251)*
- **Group size:** `delve.groupSize` 2 on floors 1–3, 3 on floors 4–6.
- **Members:** contract monsters of the floor's tier at `delve.memberHealth` 0.5 × Health and `delve.memberMight` 0.6 × Might (Armor and Speed unchanged).
- **One family per floor**, picked by the run's seed; species drawn from that family's species whose tier range includes the floor's tier (above tier 5: those that reach tier 5), repeats allowed. The Deep family never appears on floors. The family shows on the doors before the floor (§5.10.5).
- **Monsters in Delves are always shown by name** (Q20, D280), with their resistances visible as for an Identified species; there is no investigation in Delves, and seeing a species there doesn't change its bestiary state. Delve kills of folklore and Cursed species **don't** count toward the bestiary (D262).
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
- **Nothing follows hunters home:** no injuries, deaths or recovery timers. **From v0.8, while the run pays Riftglass,** each hunter of the three (downed ones too) earns hunter XP, and Command earns skill XP (§5.10.7, D316).

#### 5.10.7 Rewards *(D258, D261, D262, D263)*

| Reward | When | Notes |
|---|---|---|
| Riftglass | `riftglass.perFloor` 2 per floor cleared; `riftglass.guardian` 4 for the guardian | Drawn from the allowance (§5.10.8). When the allowance is empty, a run pays none ("The rift is quiet tonight") |
| Reagents | `delve.reagentsPerFloor` 1 unit of a drop of the floor's family per floor cleared (the family's drops in §8.3, picked by seed); `delve.guardianReagents` 2 units of the guardian's drop | Same reagents as contracts (idle source exists) |
| Ember-echoes | The first time ever a Faint, a Warm and a Bright blessing is taken from a patron | `lore-secrets.md` §29; the Library's Echoes shelf; never required |
| Delve relics | Their Delve source (§8.10a) | Each also has an idle source; effects only in Delves |
| Deep bestiary | Each guardian defeated counts as a kill of that Deep species | Knowledge levels as §5.6.2; Delve-only, so excluded from the true-ending count |
| Hunter XP *(v0.8)* | `delve.xpPerTier` 10 × tier per floor cleared; `delve.guardianXpPerTier` 20 × tier for the guardian; to each of the three | Only while the run pays Riftglass; rank level caps apply; no yard XP from Delves |
| Command skill XP *(v0.8)* | `skill.xp.command.delveFloor` 1 per floor cleared (the `delveFloor` field of `skill.xp.command`, §7.8) | Only while the run pays Riftglass |
| An item *(v0.8)* | The guardian beaten: one item at the guardian's tier (Silvered Blade or Emberwright Plate) | Rarity by `delve.guardianLootWeights` (Fine 50, Rare 35, Heroic 15); only while the run pays Riftglass; same items as contract loot (idle source) |
| — | No trophies; folklore and Cursed kills don't count toward the bestiary; no Legendaries | D262, D306, D316 |

- The run records Delve kills per family and guardians beaten (D278). The result sheet shows the guardian's item, if any (v0.8).

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
| **Wright** | Highest level ever ≥ `rank.wrightLevel` 5, and `rank.wrightTrophies` 10 trophies | The use-skill (§5.11.4); 3 talent points in all |
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

### 5.12 Events *(v0.9, outline)*

*⚑ Revised (G7): events wait for you.*

- **World bosses:**
  - Persistent Health pool across attempts.
  - **Attempt tokens:** 1 every 8 h, banking up to 6.
  - A hunter who joins an attempt **rests for 24 h** before joining another [JC]. Reserve hunters can join (G5).
  - Rewards at damage milestones.
- **Legendary Hunts:**
  - **You start each hunt yourself** from the available list. Attempt tokens regenerate the same way. No run timers.
  - 3 tracks, each restricting which hunters you can bring (by role, family trait, or damage type). Reserve hunters can join.
  - Points unlock a legendary hunter, and **points carry over to reruns** until it's unlocked.
- **Absence can delay an event reward but never forfeit it.**

### 5.13 Orders *(v0.10, outline)*

*⚑ Revised to match the lore (lore C6, L2).*

- Four factions with reputation tiers and questlines, merging the Skyrim guild and WoW faction influences:
  - **Thanes' Moot:** the village heads. Trust and safety.
  - **Grey Wives:** herbwives and midwives. Alchemy and old recipes.
  - **Bell-Watchers:** families who ring bells for the ones who went away. Their role in the story is in `lore-secrets.md` (v0.5).
  - **The Quenchers:** a present-day faction that **wants the hold's fire put out**. Their story role is in `lore-secrets.md` (v0.5).
- **Your hunters are the refounded Emberwrights** (L2). Surviving Wrights from the old outposts join you rather than forming a separate Order.
- **Open questions:** whether Orders are mutually exclusive; whether reputation persists through the Long Night (leaning yes, per §4).

### 5.14 The story *(v0.5: Act I and the story systems; ⚑ v0.5 flesh-out, D144–D166)*

*The story's text and every name live in `lore-secrets.md` (§15 and §20–§24). This section is the machinery. Story numbers are tunable starting values (§7.7) unless marked locked.*

#### 5.14.1 Acts

- **One act per cycle.** An act starts when its cycle starts and closes with that cycle's Last Stand. Its documents stay obtainable forever after: a condition met in any later cycle still delivers the document.
- **New games:** Act I starts with cycle 1.
- **Saves from before v0.5** (D149): Act I starts at once, in the current cycle, after any v0.4 arrival. Every document whose condition is already behind the save (a Rank already reached, a species already Mastered) is found on load, in Ilse's arrival scene (§5.14.3). The rest wait for their conditions. This cycle's stand closes Act I.
- **An act that isn't written yet** (from Act IV): its cycle has no act documents, and its Long Night shows *"The story continues in a later version."* Ruins, Ribbonshade names and hunter letters carry on, because they aren't tied to an act. When the act ships, it starts in the current cycle (P4), and the next ones follow one per cycle.
- **Act III (v0.6, D214):** a save already in Act I or II reaches Act III normally, the cycle after Act II's stand. A save whose current cycle has no act starts Act III **on load**: Arvid arrives (*"Ilse comes up the road early, with an old man carrying a net-needle and an axe."*), D3-01 plays, and Act III's Rank documents already behind the save this cycle (D3-04, D3-05) are found then.
- **From Act IV on (D246):** an act that ships while a save is in a story-less cycle starts **on load in the current cycle**, with fresh counters: "the 1st Field & Forest Spirits contract won in Act IV" counts from that moment. A Rank document is found on load only if that Rank is already behind the save in this cycle. Counts recorded during story-less cycles are ignored. The on-load line is *"Pechko comes out from behind the stove before you've got your coat off, with something wrapped in oilcloth."* and D4-01 plays. A new game reaches Act IV the cycle after Act III's stand.
- **Act V (v0.8, D301):** a save in a story-less cycle starts Act V on load with fresh counters (D246); the on-load line is *"Pechko calls you over to the crack behind the stove before you've got your coat off."* and D5-01 plays. A save in Act IV's cycle reaches Act V with the next warden. **After Act V's Last Stand the Unlit's door opens** (D257), with one line on the Rift card the first time: *"There's a sixth door in the rift now. It's colder than the others."*
- **Act counters** start fresh with each act: "the 2nd Mirograd contract won after Act I begins" counts from that act's start, and counts in any later cycle until it's met.

#### 5.14.2 Documents

- **Types** (`lore-secrets.md` §15.1): letter, journal page, ledger page, testament, field note, resident scene, and (v0.7) **Ember-echo**, which belongs to no act (§5.10.7).
- **Fixed conditions, no chance** (D148). Each document has one condition: a contract won (by village, by location, or the nth after its act begins), a Rank reached, a species reaching a knowledge level, a village reaching a trust level, a hunter on the roster at a moment, the act beginning (D4-01), the nth contract won in an act against a family (D4-02, D4-03), the act's Last Stand, or the next warden's arrival. The full list is `lore-secrets.md` §21–§22.
- **Delivery.**
  - A document found during a contract arrives with that contract's result: one line on the away sheet and in the results list, *"A letter came with the bounty: 'My boy writes no letters'."*
  - A Rank document arrives on the Rank-up sheet.
  - A testament arrives on the stand's result sheet, after the waves and Embers.
  - Act V's letters come up through the crack behind Pechko's stove: the away sheet and results say *"Pechko found a letter at the crack: 'The first night'."* (D302).
  - A resident scene plays as a scene sheet, like the Rank-up scenes.
  - The Archive tab shows a badge until each new item is opened.
- **Contract results:** a success can bring a document (§5.4.3). Failures never do.
- **Nothing required can be missed** (`lore-secrets.md` §8): every condition can still be met in every later cycle.

#### 5.14.3 Ilse and the Archive

- **Ilse Marrow arrives with the first document** (D151): the first contract won after Act I begins brings D1-01, Marta's letter, and Ilse walks up with it. Then the **Bestiary tab becomes the Archive** (D150). Before that, the tab is the Bestiary as in v0.3.
- **Saves from before v0.5** meet her on load (§5.14.1). Her scene hands over everything already found.
- **Later cycles:** she's back with the new warden. The new-warden sheet says *"Ilse is back from Velkvik with the archive."* When Act III begins, the line reads *"Ilse is back from Velkvik with the archive, and an old man with a net-needle and an axe."* (Arvid, §8.5, D211). When Act IV begins, the line reads *"Ilse is back from Velkvik with the archive. Pechko is waiting at the stove with something wrapped in oilcloth."* When Act V begins, the line reads *"Ilse is back from Velkvik with the archive. Pechko is kneeling at the crack behind the stove, and he isn't sweeping."*
- **The Archive tab** has four sections:
  - **Bestiary:** the v0.3 screen, unchanged.
  - **Library:** every document found, grouped by act, then by type, newest first. Each opens in a reader, with any note of Ilse's under it. Letters from hunters (§5.14.7) have their own shelf. From v0.7 the Library has an **Echoes** shelf (Ember-echoes from Delves).
  - **Accounts:** for each key event (Act I: the Night of the Fall, the apprentices; Act II adds the bell; Act III adds **Yrsa's choice**; Act IV adds **The light in the window**; Act V adds **What the hearth leaves**), every account found, side by side, each labeled with its witness. Nothing is marked true.
  - **Names:** *"Names found: 12 of 40."* A row for each of the 40, in order. A found name shows its village and year (*"Eirik Varn — Velkvik — onward, year 272 of the order."*); a missing one shows *"— a name not yet found —"* and its hint (`lore-secrets.md` §20).

#### 5.14.4 Names

- **40 names, each from exactly one source** (`lore-secrets.md` §8, §20): act documents 28, Ribbonshades 6, hunter letters 5, Sigrun's confession 1.
- **A name is found** when the document, defeat or letter that carries it is found. Found names are kept forever.
- **Ribbonshades** (§8.3): each Ribbonshade defeated carries the next of the six Ribbonshade names in a fixed order, the first being Jaro's (roll #39), until all six are found. After that, a Ribbonshade carries a ribbon with no name. The scene line comes with the contract result. **Until all six names are found, three in four of the ruin contracts that can hold a Ribbonshade (tiers 2–4) are one** (`ruin.ribbonshadeShare`, Q17, D190; 0.5 until the v0.8 tuning, D354); the other ruin creatures still appear, and once the six are found the ordinary mix returns.

#### 5.14.5 Wardens

- **Naming** (D152): the new-warden sheet asks for a name: free text up to 24 characters, with **Suggest**, which offers a name from a short list of Slavic and Nordic given names (collision-checked, `src/content/`). A new game names its first warden in the opening scene. A save from before v0.5 names its earlier wardens once, on arrival; a blank one is carved as *"the warden before"*. Names can be changed later from the Roll.
- **The Roll of Wardens** (D153) is in the Hearth Hall, on the Rank screen beside The Hearth. Each warden has one line: the name; the years they kept the hearth (cycle n covers years `300 + 3(n − 1)` to `300 + 3n` of the order); the Ranks they reached; the stand's band and waves held; and the relics found. The current warden's line reads *"…keeping the hearth"*.
- **Above the first warden** is a worn line: *"A first line, worn smooth. Pechko dusts it every morning."* It becomes legible in Act IV.

#### 5.14.6 Village trust

- **Levels:** Cold → Wary → Hopeful → Trusting → Sworn. Each village keeps its v0.2 starting level (`setting-primer.md` §3).
- **Rising** (D146): each contract won for a village counts toward its next step: 8 to leave Cold, then 15, 20 and 25 (`trust.stepContracts`; the first was 10 until D237). **Each Triumphant stand counts as `trust.triumphantContracts` (10) contracts toward every village's next step** (D195; was a whole step, D146). Progress carries over; a Sworn village stops counting. Trust **never drops**, and a Long Night keeps it.
- **What it does** (D147): words only. It sets the tone of that village's notices (from v0.2; from v0.5, once a village trusts the hold more than it did at the start, its notices close with that level's line, D180) and of resident lines, and some documents wait for a village's trust (Act I: D1-02, Kozly Hollow at Wary). Trust changes no number in v0.5; rewards wait for the Thanes' Moot (v0.10).
- **Shown** on the Contracts board's **Villages** panel (§9.14): each village's level, its one-line description, and its progress, with a breakdown on long-press (contracts won toward each step, Triumphant stands). A step up gets one line on the away sheet or the result sheet: *"Mirograd trusts the hold a little more: Hopeful."*

#### 5.14.7 Hunter letters

- **Every hunter has two letters** (D156), at **levels 5 and 8** (D155; `letters.levels`), counting the **highest level the hunter has ever reached**, so the Long Night's halving never takes one away.
- Letters are written to the warden, at Ilse's asking. They appear on the hunter's detail sheet and on the Library's letters shelf.
- **Five carry names** (`lore-secrets.md` §20, §23): Ostap at levels 5 and 8, and Toma, Sigrun and Arvid at level 5. All are story hunters, who can't die.

#### 5.14.8 The stand's band and the residents

- **Every stand gets a band** from the waves it held (D145): **Broken** at 11 or fewer, **Held** at 12–14, **Triumphant** at 15 or more (`band.heldFrom` 12, `band.triumphantFrom` 15; D194, were 9 and 12; both still relic milestones). **A stand keeps the band it earned:** stands made before v0.6 keep the band they were given then (the v6 migration records it). The arrival stand uses the same thresholds.
- **The stand screen** shows the thresholds next to the preview: *"Held from 12 waves · Triumphant from 15"*.
- **The result sheet** shows the band, then one line each from Pechko and Brana for that band (`lore-secrets.md` §24), picked by the stand seed. Any trust steps follow, then the act's testament. Pechko's closing line (*"The walls fell. The hearth didn't. Someone will come."*) stays.
- The band is carved on the Roll of Wardens.

#### 5.14.9 What the Long Night shows, from v0.5

1. The stand's result: waves held, the band, the Embers breakdown, any relic, the residents' lines, any trust steps.
2. The act's testament (Act I: D1-06; Act II: D2-09; Act III: D3-06; Act IV: D4-06; Act V: D5-06, followed by Yrsa's Thole's line), or *"The story continues in a later version."* if the act isn't written.
3. The Hearth.
4. The new-warden sheet: the warden's name, any resident scene of the act's close (Act I: D1-07 *"Welcome back"*; Act II: D2-10; Act III: D3-07; Act IV: D4-07; Act V: D5-07), Ilse's return (with Arvid when Act III begins, then D3-01), and the choice of 3 active hunters.

---

## Judgment calls in §5

1. **No food upkeep in v0.1.** Peasants cost food to settle, not to maintain, which avoids starvation spirals during offline time. Revisit at v0.4.
2. **All construction is instant.** Pacing comes from costs, not build timers.
3. **Offline progress runs at 100% efficiency** up to the cap, with a hard ceiling of 24 h on cap extensions.
4. **Hunters are all hand-authored named characters,** unlocked by conditions and recruited with silver. No random recruits.
5. **Gear is upgraded in place** (weapon and armor slots) until loot arrives in v0.8.
6. **Reckless means displayed odds below 35%.** That line covers "badly prepared" too, and death has a 30% chance per downed hunter.
7. **A dead named hunter returns as a candidate after the next Long Night,** instead of being lost forever.
8. **No difficulty rubber-banding.** Contract tiers are fixed per Rank and unlocked by progress.
9. **Investigation uses Hunter's Lodge slots, not hunters.**
10. **A well-prepared success pays bounty × 1.5 and +1 trophy.**
11. **The Trophy Hall bonus counts cumulative trophies earned this cycle,** unaffected by spending. *(Reworded in revision A7.)*
12. **Odds come from 500 simulated fights.** The real outcome uses a separate seed derived from the party and preparation, so it's reproducible but can't be read in advance.
13. **Warden skills (v0.6) survive the Long Night.**
14. **Rune damage and runed gear are held back until v0.5,** when the Emberwright lore arrives.

---

## 6. Progression & Pacing Targets

### 6.1 Player model

The balance simulator plays the game with scripted **policies**. Pacing targets are defined against these policies, not against real players.

| Policy | Check-ins (local time) | Sessions | Used for |
|---|---|---|---|
| **Standard** (`standard`, D16) | Weekdays: 07:00, 10:00, 12:30, 16:00, 21:00. Weekends: 09:00, 13:00, 17:00, 21:00 | **None: never Delves** (D269) | All main targets; the Idle-only row's baseline |
| **Delver** (`delver`, *from v0.7*, D269) | Same as Standard | One 20-min session at 15:00 on weekends, plus Wednesday at 19:00: Delves | The v0.7 Delve rows only; the Idle-only row's comparison |
| **Light** | 07:00, 12:30, 21:00 every day | None | "Still works for a busy week" checks |
| **Heavy** | Every 2 h from 07:00 to 23:00 | One per day *(no Delves)* | "Can't be rushed too fast" checks |
| **Opening** *(⚑ revision A10)* | Acts every 10 s for the first 15 min of a fresh game, using the default job priority and greedy best-payback buys; then switches to Standard | — | Opening targets (first Cottage, first Mine) |

- **Start time:** runs start Monday at 07:00. A second run starts Saturday at 09:00 to catch weekend-start problems **[JC]**. **The Delver runs the Monday seeds only** (D272).
- **The overnight gap** (21:00 → 07:00) is 10 h, inside the 12 h cap. Standard play never loses time to the cap.

**What the policy does at each check-in:**
- **Spending:** greedy by **payback time**, using the valuation in §5.1.2 (the same function as the ● hint). It saves for the next Rank-up once it's affordable within 2 check-ins.
- **Contracts:** launches the highest expected-value contract with the suggested party.
- **Preparation:** brews and equips matching consumables for identified monsters.
- **Investigation:** keeps every Lodge slot busy.
- **Never** launches Reckless contracts.
- **Rank-ups** *(v0.4, D114)*: works toward Citadel and Bastion as it does toward the Keep: requirements first, then saving once the Rank-up is affordable within 2 check-ins.
- **v0.3 buildings first** *(v0.4)*: in the Keep, the Hunter's Lodge, the Alchemist's Hut and one Herb Garden come before any recruit or gear upgrade, as soon as each is affordable with the Rank-up reserve kept.
- **Tracker** *(v0.4)*: leaves a Tracker out of a party when a party without her is within 5 points of the best odds and a Lodge slot is busy.
- **Defenses** *(v0.4)*: from Citadel, raises Walls and the Watchtower in turn (lower one first) whenever a level is affordable with the Rank-up reserve kept.
- **The stand** *(v0.4)*: from Bastion, runs a quick preview (20 practice stands) at every check-in and stands at the first check-in where Embers per day of the cycle is lower than at the one before. It takes the suggested six; each hunter carries the oil for the family most common in the first 12 waves; Mending Draughts for as many hunters as it has; bombs are automatic. Light and Heavy use the same rule.
- **Embers** *(v0.4)*: buys the cheapest affordable warden upgrade (ties by list order), and keeps the default three active hunters in each new cycle.
- **The roster** *(v0.5, D167)*: whenever the active roster has room, it fills it from the reserve, highest levels first.
- **The Wright's Blade** *(v0.5, D167)*: bought like any gear upgrade. Ruin contracts are ordinary contracts to it; story items are never a goal.
- **Experiments** *(v0.6)*: each kettle runs one experiment behind its usual brews (D235): the untried pair with the most hidden properties left, herbs and gifts before monster drops, from what its brews leave in the stores (D239).
- **The v0.6 brews** *(v0.6)*: Hidebane Oil vs Beasts & Wilds and Wright's Oil vs the Cursed, like the other oils; Coldwater vs the Poludnitsa and the Ribbonshade, Owl-Eye vs Gloam-moths, Steadfast vs any species with an ability that costs an action: the counter-potion on the Vanguard, the Mending Draught on the next hunter. Bombs: weak-to first, then a Saltburst, then Poppy Smoke.
- **Skills** need no decisions. **Arvid** joins at the start of Act III; the roster rule (D167) uses him.
- **Delves** *(Delver only, v0.7, D270)*: in each session, it runs Delves until the allowance is empty, up to 3 runs, with the suggested three (Vanguard, Striker, Mender if it has them, highest levels). **Door:** the patron it has taken most this run (ties: Hearth-Crone, Pale Smith, Wolf Beneath the Hill, Weaver, Drowned Bell). **Blessing:** highest rarity, then list order. It never leaves a run early. **Riftglass:** Chosen start and Re-roll first, then Late hours; never traits or cosmetics. Outside sessions it plays exactly like Standard.
- **Items** *(v0.8, D321)*: rework the weakest slot first, as gear upgrades worked (same affordability rule and Rank-up reserve). Equip loot that scores higher on a fixed **item score** (Might, Armor and bonus lines with fixed policy weights). Salvage the lowest-scoring items once Stores holds more than 30.
- **Ranks** *(v0.8)*: rank up as soon as a hunter qualifies and the trophies are on hand.
- **Embers** *(v0.8)*: Hearth upgrades first, cheapest first (as v0.4); then the cheapest star, ties going to the highest-level hunter.
- **Talents** *(v0.8)*: a fixed pick order per role. **Legendaries:** a fixed table of who wears which.
- **Yard XP and Delve rewards** need no decisions.
- **The Delver's Re-roll** *(v0.8, D321)*: used once a run, on the first offer where every card is Faint.

### 6.2 Targets

Times are elapsed real time from a fresh start under the Standard policy unless noted.

| Moment | Target | Enforced from |
|---|---|---|
| First Cottage bought | ≤ 1 min (Opening policy) | v0.1 |
| First Mine bought | ≤ 5 min (Opening policy) | v0.1 |
| Mill reaches level 3 | 2–5 h | v0.1 |
| 10 peasants | 3–6 h | v0.1 |
| **Keep reached** | **8–14 h** (Standard); ≤ 24 h (Light); ≥ 6 h (Heavy) | v0.1 |
| First contract launched | Within 15 min of the first Mine (Hamlet; ⚑ revision G6) | v0.2 |
| Roster of 4 hunters | By the end of day 2 | v0.2 |
| First tier-3 success | Day 2 | v0.2 |
| First species Identified through investigation | ≤ 2 h after the Hunter's Lodge is built | v0.3 |
| First species Studied (4 kills) | Days 2–3 | v0.3 |
| Citadel reached | Day 2 | v0.4 |
| Bastion reached; Last Stand available | Days 3–4 *(D137: was day 3)* | v0.4 |
| Best Last Stand timing (peak Embers per day of cycle) | Days 4–5 | v0.4 |
| **First Long Night** | **Days 3–5** (Standard); ≤ 7 days (Light); ≥ 2.5 days (Heavy) | v0.4 |
| Later cycles | Each ≥ 15% faster than the first, with a floor of 2 days **[JC]** *(D134: was "than the one before"; after cycle 2, cycles settle at about 3 days)*. Acts I–VI therefore take about **2–3 weeks** of play (14–21 days) and about 15 in-world years *(⚑ revisions A15, lore L5)* | v0.4 |
| Act I lands in its cycle *(D168)* | Every Act I document with a contract, Rank or stand condition found by the end of cycle 1; D1-07 at the next warden (D1-02 and D1-05 reported only) | v0.5 |
| Act II lands in its cycle *(D168, Q17)* | D2-01, D2-02, D2-07 and D2-09 found in cycle 2; the 2nd to 5th ruin documents (D2-03 to D2-06) by the end of cycle 4; D2-10 with the next warden (D2-08 reported only) | v0.5 |
| First ruin contract won *(D168)* | ≤ 24 h after the Keep | v0.5 |
| All six Ribbonshade names *(D168, Q18)* | By the end of cycle 4 | v0.5 |
| A village's trust rises *(D168)* | In cycle 1 | v0.5 |
| First new brew discovered | ≤ 24 h after the Alchemist's Hut is built | v0.6 |
| Recipe book complete (36 of 36 properties) | By the end of cycle 3 | v0.6 |
| Skills start moving | Every warden skill at level ≥ 1 by the end of cycle 1 | v0.6 |
| Skills pace | At the end of cycle 3, every warden skill is between level 4 and 8 | v0.6 |
| Act III lands in its cycle | D3-01 to D3-06 by the end of cycle 3; D3-07 with the next warden; D3-08 reported only | v0.6 |
| Arvid's level-5 letter (Leif, #34) | By the end of cycle 4 | v0.6 |
| Trust keeps an arc | No village reaches Sworn before the end of cycle 4 | v0.6 |
| Act IV lands in its cycle *(D271)* | D4-01 to D4-06 and D4-08 by the end of cycle 4; D4-07 with the next warden (Standard) | v0.7 |
| First guardian beaten *(D271)* | By the end of cycle 2 (Delver) | v0.7 |
| Act V lands in its cycle *(D322)* | D5-01 to D5-06 and D5-08 by the end of cycle 5; D5-07 with the next warden (Standard) | v0.8 |
| Late recruits catch up *(D322)* | All five name letters (Ostap at levels 5 and 8; Toma, Sigrun and Arvid at 5) by the end of cycle 5 (Standard) | v0.8 |
| First Wright *(D322)* | By the end of cycle 1 (Standard) | v0.8 |
| Idle-only vs Delver *(D20, D271, D322)* | Standard reaches the last of "all content" no more than 1.3× later than the Delver (median of the Monday seeds). "All content" for v0.8: every judged document of Acts I–V, the recipe book at 36 of 36, all six Ribbonshade names, every warden skill at level 4, the five letter names, and every hunter at Wright | v0.7 / v0.8 |

Reported only: the stand band per cycle (with waves), skill levels per cycle, properties found per cycle (v0.6); Riftglass per week, floors reached per run, Delve relics found (v0.7, Delver); stars per cycle, items by rarity per cycle, Legendaries found, Delve XP (v0.8).

**Content test (v0.7, D271):** every Delve reward is listed with its idle source or marked sidegrade, convenience or Delve-only; a reward with neither fails the test.

*Trust rises in cycle 1* (v0.5) and *no Sworn before the end of cycle 4* pull in opposite directions; both are met by tunables (`band.*`, `trust.stepContracts`, `trust.triumphantContracts`). If no reasonable values pass, stop and ask.

### 6.3 Engagement checks (simulator)

These catch dead zones and walls that pure time targets miss.

1. **Something to do:** at least 90% of Standard check-ins include a meaningful action (a purchase, a contract launch, or collecting a result).
2. **No dry spells:** never 2 consecutive check-ins with nothing to do.
3. **No walls:** no single purchase takes more than 3 check-ins of saving, except Rank-ups, which may take up to 5.
4. **Preparation matters** *(v0.3)*: on identified contracts at equal tier, matched preparation raises the odds by at least 15 percentage points over no preparation.
5. **Odds are honest** *(v0.2)*: across 2,000 simulated contracts, the actual success rate in each 10-point odds bucket lands within ±5 points of the displayed odds.
6. **Contracts own silver** *(v0.2)*: **cumulatively over the Keep phase** of each simulated run (at least 14 days; from v0.4, cycle 1's stretches from the Keep onward, D114, D135; later cycles restart at tier 1 and are reported only), at least 70% of silver earned comes from bounties. *⚑ Revision (G1): measured cumulatively, not per day. Early Keep is seam-heavy by design (about 40% from seams on day 2), and a per-day check would fail without making the game better.*
7. **No overflow:** every number stays below 1e300 through 3 simulated cycles *(from v0.4)*. Through v0.3, the same check runs over 14 simulated days.
8. **Provisions matter** *(v0.2; ⚑ revisions G3, Q9)*: cumulatively over the Keep phase of each simulated Standard run (at least 14 days; from v0.4, cycle 1's stretches from the Keep onward, D114, D135; later cycles are reported only), contract provisions take 20–40% of food income. Because provisions scale with food capacity from the Keep on (§5.4.2), the share is set mainly by `provisions.incomeMinutes`; the check keeps it honest as later milestones add contracts and costs.

**Which check-ins checks 1–3 watch** *(v0.4, D114)*: every check-in of cycle 1 up to the Last Stand (through v0.3: up to the Keep). Rank-ups, Citadel and Bastion included, may take up to 5 check-ins of saving.

**The stand preview is honest** *(v0.4, D114)*: checked by a test, not a simulator check. The preview runs the same stand code with other seeds; across many real stands, the waves held must land inside the preview's range about as often as the range says.

### 6.4 Playtest-only checks

The simulator can't measure these. The owner checks them at the end of each milestone, using a short checklist in the implementation plan:
- A routine check-in takes 15 taps or fewer (§3.2).
- Fight logs are readable at a glance, and the "Why?" panel makes sense.
- Nothing feels like a chore or a punishment for being away.
- Overall: is it fun? Does the next goal always feel visible?

### 6.5 Performance budgets *(⚑ revision C6 [JC])*

| What | Budget | How |
|---|---|---|
| **Suggested party** | ≤ 300 ms on a mid-range phone | Runs in a Web Worker. Stage 1 ranks every legal party with **50 samples**, using the **same seeds for every party** so comparisons are fair. Stage 2 compares the **top 3 at 200 samples each**, and only the winner is rerun at the full 500 samples for the odds panel *(D73: was the top 5 at 500, too slow for a phone)*. Against an unidentified monster, stage 1 uses **20 samples per candidate**. |
| **Live odds panel** | ≤ 100 ms per update | 500 samples, in the same worker |
| **Last Stand preview** *(v0.4, D114)* | ≤ 1 s on a mid-range phone | 100 practice stands (`laststand.previewSamples`), in the same worker |
| **Simulator: one 3-cycle run** | ≤ 60 s in CI | Headless, in Node |
| **Simulator: full suite** | **≤ 5 min per CI job** *(D320)* | All policies and checks; the runs play in parallel, one per core (D169), split across parallel CI jobs whose results a final job combines and judges. Never trimmed: same runs, seeds and rows |

A benchmark test checks the first three on a CPU-throttled profile (4× slowdown), as a stand-in for a mid-range phone: it warns at the budget and fails only at 2× (plan review A10, technical design §11.2).

---

## 7. Economy & Balance Formula Reference

Every constant lives in **one data file**, `src/content/balance.ts`, under the key shown. The engine reads from it, and the in-game breakdown shows the key names. This is the master list. §5 explains the intent behind each formula.

### 7.1 Hold

| Formula | Expression | Constants (key = starting value) | § |
|---|---|---|---|
| Modifier buckets | `base × Π_b (1 + Σ bonuses in b)` | Bucket order: building, age, trophy, knowledge, ember, relic, event | 5.0 |
| Count-building cost | `base × r^n` | `costGrowth.count` = 1.15 | 5.1.2 |
| Level-building cost | `base × r^(L−1)` | `costGrowth.level` = 1.75 | 5.1.2 |
| Bulk cost (k copies) | `base × r^n × (r^k − 1)/(r − 1)` | — | 5.1.2 |
| Max affordable | `min over resources of floor(log(1 + f(r−1)/(base·r^n)) / log r)` | — | 5.1.2 |
| Settle cost | `a × g^P` | `peasant.settleBase` = 20, `peasant.settleGrowth` = 1.15, `peasant.settleMinInterval` = 30 s | 5.1.1 |
| Production | `workers × baseRate × buckets` | `rate.food` = 6/min, `rate.wood` = 4/min, `rate.iron` = 2/min, `rate.silver` = 0.22/min *(D138, D189)* | 5.1.1 |
| Silver cap | Silver Seams limited; silver-digger output takes only relic and event buckets | `silverSeam.max` = 2 | 5.1.1 |
| Building bonuses | per level | `mill.perLevel` = 0.25, `sawpit.perLevel` = 0.25, `smithy.ironPerLevel` = 0.20 | 5.1.2 |
| Rank multiplier | Each Rank from the Keep adds to the age bucket (not silver, G1) | `age.keep.allProduction` = 0.50, `age.citadel.allProduction` = 0.50, `age.bastion.allProduction` = 0.50 *(D106)* | 5.1.3 |
| Best payback | `value(cost) ÷ value(Δrate)`, `value = Σ w_r × amount_r` | `value.weights` = { food 1, wood 1.5, iron 3, silver 12 } | 5.1.2 |
| Trophy Hall | `+x per trophy earned this cycle` | `trophyHall.perTrophy` = 0.005 | 5.4.4 |
| Herb Garden | per garden | `herbGarden.interval` = 10 min per herb type | 5.7 |

### 7.2 Offline

| Formula | Expression | Constants | § |
|---|---|---|---|
| Elapsed | `clamp(now − lastSeen, 0, cap)`; if `now < lastSeen`, then 0 | — | 5.2 |
| Cap | `base + Σ extensions`, capped at the ceiling | `offline.baseCap` = 12 h, `offline.ceiling` = 24 h, `bellTower.perLevel` = 1 h | 5.2 |
| Simulation chunk | Drives the progress bar only; results don't depend on it (event-driven `advance`) | `offline.chunk` = 60 s | 5.2 |

### 7.3 Hunters

| Formula | Expression | Constants | § |
|---|---|---|---|
| Level scaling | Health and Might: `stat × (1 + s × (L − 1))`; Armor and Speed don't scale | `hunter.levelStatGrowth` = 0.10, `hunter.levelCap` = { keep 10, citadel 15, bastion 20 } (Hamlet uses the Keep's cap, D72; D106) | 5.3.2 |
| XP to next level | `x × g^(L−1)` | `xp.base` = 50, `xp.growth` = 1.3 | 5.3.2 |
| XP per contract | `per × tier` (half on failure) | `xp.perTier` = 20 | 5.3.2 |
| Recruitment cost | Fixed price per hunter (G5) | `hunter.recruitPrice`, in each hunter's content entry (§8.5) | 5.3.1 |
| Active roster cap | Hamlet 3; Keep `3 + barracksLevel`; +2 at Citadel, +2 at Bastion; reserve unlimited (G5) | `barracks.maxLevel` = 5, `roster.hamletCap` = 3, `roster.ageBonus` = { citadel 2, bastion 2 } | 5.3.1 |
| Recovery | Bruised: fixed; Wounded: `per × tier`; Grievous: ×3 | `injury.bruised` = 30 min, `injury.woundedPerTier` = 2 h, `injury.grievousMult` = 3, `injury.bruisedBelow` = 0.30 | 5.3.7 |
| Reckless line | odds < threshold | `contract.recklessBelow` = 0.35 | 5.3.7 |
| Death roll | per downed hunter on a Reckless contract | `injury.deathChance` = 0.30 | 5.3.7 |
| Dead hunter returns | Before v0.4: after N days; from v0.4: at the next Long Night, at their usual price, levels halved (D110) | `death.returnDaysBeforeLongNight` = 3 | 5.3.7 |

### 7.4 Contracts & combat

| Formula | Expression | Constants | § |
|---|---|---|---|
| Board refill | 1 per interval, up to the cap; declining is free | `board.interval` = 2 h, `board.cap` = 6 | 3.3 |
| Board opens | when the first Mine is built (G6) | — | 5.4.1 |
| Tier unlocks | tier t+1 after k successes at tier t, up to the Rank cap | `contract.unlockSuccesses` = 3, `contract.ageTierCap` = { hamlet 1, keep 5, citadel 5, bastion 5 } *(locked; new entries D106)* | 5.4.1 |
| Provisions | `max(p, m × food capacity/min) × partySize × g^(tier−1)` food at launch (Q9, D81, Q11, D84; m is `provisions.incomeMinutes` for the hold's Rank) | `provisions.base` = 30, `provisions.growth` = 2.2, `provisions.incomeMinutes` = { hamlet 0, keep 1, citadel 4.4, bastion 2.5 } *(D82, D85, D106, D138, D189)* | 5.4.2 |
| Monster tier scaling | Health and Might `× 1.35^(t − t₀)`; Armor `× 1.15^(t − t₀)`, where t₀ is the base tier | `monster.statGrowth` = 1.35, `monster.armorGrowth` = 1.15 | 5.4.1 |
| Bounty | `b × g^(tier−1) × ageMult` (age bucket doesn't apply) | `bounty.base` = 91 *(⚑ v0.2 tuning: 60 → 72, D76; 72 → 78, D82; v0.4: 78 → 91, D138)*, `bounty.growth` = 1.6, `bounty.ageMult` = { hamlet 1.0, keep 1.1, citadel 3.5, bastion 3 } *(D106, D138)* | 5.4.1 |
| Trophies | `tier` (+1 if well prepared) | — | 5.4.1 |
| Duration | by tier | `contract.duration` = [30 min, 1 h, 2 h, 4 h, 8 h] | 5.4.1 |
| Party size | by tier | `contract.partySize` = [3, 3, 3, 4, 4], `contract.hamletPartyMax` = 2 | 5.4.1 |
| Hit | `roll < hitChance` | `combat.hitChance` = 0.90 | 5.5 |
| Damage | Combat formula in §5.0 (bucket order, Armor on direct attacks only, taken% after Armor, immunity) | `combat.varianceLo` = 0.85, `combat.varianceHi` = 1.15, `combat.minDamage` = 1, `combat.takenCap` = 0.75 | 5.0, 5.5 |
| Silvered sub-hit | `f × Might_eff × variance × crit × resist[Silver]`, no Armor | `gear.silveredFraction` = 0.25 | 5.3.6 |
| Crit | `roll < critChance → ×critMult` | `combat.critChance` = 0.10, `striker.critChance` = 0.20, `combat.critMult` = 1.5 | 5.3.3 |
| Healing | Mender: `m × Might` on the lowest-% standing hunter (herself included) if any is below the threshold | `mender.healMult` = 1.5, `mender.healBelow` = 0.70, `mender.attackMult` = 0.50 | 5.3.3 |
| Targeting | weight by role | `target.vanguardWeight` = 3, `target.otherWeight` = 1 | 5.3.3 |
| Turn meter | meter += Speed each tick; act at the threshold; fail at the tick limit | `combat.meterThreshold` = 100, `combat.maxTicks` = 400 | 5.5 |
| Odds preview | `n` simulated fights; margin `±1.96 × √(p(1−p)/n)` | `odds.samples` = 500 **[JC: raised from 200; keeps the margin within ±4.4 points]** | 5.4.2 |
| Well prepared | bounty multiplier | `prep.wellPreparedBounty` = 1.5 | 5.4.3 |
| Preparation limits | bombs per party; the resistance from which a species is weak to a damage type (§8.3 bold) | `prep.bombSlots` = 2, `prep.weakAt` = 1.25 | 5.7 |
| Suggested party | Stage 1: k samples per party (same seeds); stage 2: top N at `stage2Samples`, then the winner at full samples | `suggest.stage1Samples` = 50, `suggest.stage1PerCandidate` = 20, `suggest.finalists` = 3, `suggest.stage2Samples` = 200 *(D73)* | 6.5 |
| World-boss tokens *(v0.9)* | 1 per interval, banking up to the max; hunters rest after an attempt | `boss.tokenInterval` = 8 h, `boss.tokenMax` = 6, `boss.hunterRest` = 24 h | 5.12 |

### 7.5 Bestiary & preparation

| Formula | Expression | Constants | § |
|---|---|---|---|
| Knowledge thresholds | kills to reach Studied / Mastered | `knowledge.studiedKills` = 4, `knowledge.masteredKills` = 10 | 5.6.2 |
| Knowledge damage | knowledge bucket | `knowledge.studiedDamage` = 0.05, `knowledge.masteredDamage` = 0.10 | 5.6.2 |
| Clue time | per clue; × multiplier if Studied | `clue.time` = 30 min, `clue.studiedMult` = 0.5 | 5.6.3 |
| Lodge slots | 1 per level | `lodge.maxLevel` = 3 | 5.6.3 |
| Oil bonus | vs the matching family | `oil.familyBonus` = 0.35 | 5.7 |
| Brew time | per item, one per Hut level at a time | `brew.time` = 10 min, `hut.maxLevel` = 5 | 5.7 |

### 7.6 The Long Night *(v0.4, D106–D114)*

Every constant here is tunable unless marked locked.

| Formula | Expression | Constants | § |
|---|---|---|---|
| Threat rate | per hour by Rank, × (1 − slow); slow = 2% per level of Walls or Watchtower | `threat.ratePerHour` = { hamlet 0, keep 0.5, citadel 1, bastion 1 } *(D138)*, `threat.defenseSlowPerLevel` = 0.02 | 5.9.1 |
| Threat from contracts | +f × tier on a failure; −c × tier on a success; never below 0 | `threat.failedPerTier` = 3, `threat.completedPerTier` = 0.76 *(D138)* | 5.9.1 |
| Wave strength from Threat | Health and Might × (1 + w × Threat) | `threat.waveStrengthPerPoint` = 0.0061 *(D138)* | 5.9.3 |
| Walls | party taken% −x per level in the stand (75% cap, `combat.takenCap`) | `walls.takenPerLevel` = 0.02 | 5.9.2 |
| Watchtower | at tick 1 of each wave, v × level Steel damage, ignores Armor | `watchtower.volleyPerLevel` = 20 | 5.9.2 |
| Defense costs | level building, `base × 1.75^(L−1)` | Walls 20,000 wood + 10,000 iron; Watchtower 15,000 wood + 8,000 iron + 100 silver (content, D44) | 5.9.2 |
| Waves | wave n at tier `t₁ + floor((n − 1) / k)`; past tier 5 the §7.4 tier scaling continues | `laststand.firstTier` = 2, `laststand.wavesPerTier` = 2 | 5.9.3 |
| Stand party | up to N active hunters | `laststand.partyMax` = 6 **(locked)** | 5.9.3 |
| Between waves | standing hunters recover a share of max Health | `laststand.recoverBetween` = 0.20 | 5.9.3 |
| Stand preview | practice stands; range = 10th–90th percentile | `laststand.previewSamples` = 100, `laststand.policySamples` = 20 | 5.9.3, 6.5 |
| Embers | `floor(rankMult × Σ_(n ≤ waves) p × g^(n−1) × (1 + b × Threat) + q × trophies)` | `embers.perWave` = 4, `embers.waveGrowth` = 1.15, `embers.threatBonus` = 0.007 *(D138)*, `embers.perTrophy` = 1, `embers.rankMult` = { hamlet 0.25, keep 0.5, citadel 0.75, bastion 1 } | 5.9.4 |
| Relic milestones | the first stand ever to hold each wave count | `relics.waveMilestones` = [6, 9, 12, 15, 18, 21] | 5.9.6 |
| Levels kept | `1 + floor((L − 1) × k)`, k = base + Old Hands | `longNight.levelsKept` = 0.5 | 5.9.7 |
| Warden upgrades | level L costs `c × g^(L−1)` Embers | per upgrade, in the content (§8.9) | 5.9.5 |
| v0.4 arrival cap | trophies part ≤ share × the cycle-1 median | `longNightArrival.emberCapShare` = 1.2 **(locked)**, `longNightArrival.cycle1MedianEmbers` = 193 (set from the tuned simulator: the median of cycle 1's stand, Standard, Monday, 5 seeds; D112, D138) | 5.9.8 |

### 7.7 The story *(v0.5, D144–D166)*

Every constant here is tunable (D166).

| Formula | Expression | Constants | § |
|---|---|---|---|
| Stand band | Broken below `heldFrom`; Held below `triumphantFrom`; Triumphant from it | `band.heldFrom` = 12, `band.triumphantFrom` = 15 (waves) *(D194; were 9 and 12)* | 5.14.8 |
| Trust steps | contracts won for a village to rise from each level (Cold, Wary, Hopeful, Trusting); a Triumphant stand counts as `trust.triumphantContracts` contracts for every village | `trust.stepContracts` = [8, 15, 20, 25] *(D237; first was 10)*, `trust.triumphantContracts` = 10 *(D195)* | 5.14.6 |
| Hunter letters | at the highest level ever reached | `letters.levels` = [5, 8] | 5.14.7 |
| Runed sub-hit | `f × Might_eff × variance × crit × resist[Rune]`, no Armor | `gear.runedFraction` = 0.25 | 5.3.6 |
| Ribbonshade share | the share of ruin contracts (tiers 2–4) that is a Ribbonshade while a Ribbonshade name is still missing | `ruin.ribbonshadeShare` = 0.75 | 5.14.4 |

Trait and ability numbers (Shield-companion, Old Wright, and the Cursed creatures' abilities) live with their content, like every earlier trait and ability (§8.3, §8.5). The Wright's Blade's Might and cost live with the gear content (§5.3.6).

### 7.8 Alchemy discovery & skills *(v0.6, D193–D220)*

Every constant here is tunable unless marked locked.

| Formula | Expression | Constants | § |
|---|---|---|---|
| Experiment | 1 unit of each of two ingredients; takes the time (× Copper Still) | `experiment.time` = 10 min, `experiment.units` = 1 | 5.8.3 |
| Skill level | level L → L+1 costs `b × g^L` XP; 0–10 | `skill.maxLevel` = 10 **(locked)**, `skill.xpBase` = 20, `skill.xpGrowth` = 1.6 | 5.8.6 |
| Skill XP | per activity | `skill.xp.alchemy` = { brew 1, experiment 3, property 10 }, `skill.xp.smithing` = { gearPerTier 2, smithyLevel 2 }, `skill.xp.lore` = { clue 1, knowledgeLevel 5, document 5 }, `skill.xp.command` = { contractPerTier 2, wave 1, delveFloor 1 } *(D237; was 1; `delveFloor` v0.8, D316, D345)* | 5.8.6 |
| Skill bonuses | per level | `skill.alchemyPotency` = 0.03, `skill.smithingCost` = 0.021 *(D240; was 0.04, D228, D237)*, `skill.loreClueTime` = 0.04, `skill.commandXp` = 0.04 | 5.8.6 |

Brew numbers live with their content, like every consumable (§5.8.5): Coldwater 0.40 Fire taken; Owl-Eye 0.10 hit chance; Steadfast 1 use; Poppy Smoke 1 lost action; the new oils use `oil.familyBonus`. The properties table is content (§8.6).


### 7.9 Delves *(v0.7, D244–D272)*

Every constant here is tunable unless marked **locked** (D268).

| Formula | Expression | Constants | § |
|---|---|---|---|
| Party, floors, doors, offers | fixed shape of a run | `delve.partySize` = 3 **(locked)**, `delve.floors` = 6 **(locked)**, `delve.doors` = 2 **(locked)**, `delve.offers` = 3 **(locked)** | 5.10.2, 5.10.5 |
| Depth | floors 1–3 at base; 4–6 at base + step; guardian at base + guardian step | `delve.baseTier` = { keep: 3, citadel: 4, bastion: 5 }, `delve.upperTierStep` = 1, `delve.guardianTierStep` = 2 | 5.10.3 |
| Group | members per floor; each a contract monster of the tier × these | `delve.groupSize` = { floors1to3: 2, floors4to6: 3 }, `delve.memberHealth` = 0.5, `delve.memberMight` = 0.6 | 5.10.4 |
| Guardian | Deep species of the tier × this Health | `delve.guardianHealth` = 2 | 5.10.4, 8.3 |
| Recovery | standing hunters recover this share of max Health before each floor | `delve.recovery` = 0.2 | 5.10.6 |
| Rarity | weights per offered card; floor 6's minimum | `delve.rarityWeights` = { faint: 70, warm: 25, bright: 5 }, `delve.lastFloorMinRarity` = 'warm' | 5.10.5 |
| The Unlit's door | chance per floor once unlocked; at most per run | `delve.unlitDoorChance` = 0.25, `delve.unlitDoorsPerRun` = 1 **(locked)** | 5.10.5 |
| Reagents | per floor cleared; from the guardian | `delve.reagentsPerFloor` = 1, `delve.guardianReagents` = 2 | 5.10.7 |
| Riftglass pay | per floor cleared; for the guardian | `riftglass.perFloor` = 2, `riftglass.guardian` = 4 | 5.10.7 |
| Allowance | grows `weeklyCap ÷ 7` a day; banks up to `bankWeeks × weeklyCap` | `riftglass.weeklyCap` = 70 **(locked)**, `riftglass.bankWeeks` = 2 **(locked, existing)** | 5.10.8 |
| Shop | costs | `riftglass.shop.lateHours` = [30, 45, 60, 75, 90], `riftglass.shop.trait` = 40, `riftglass.shop.cosmetic` = 25, `riftglass.shop.chosenStart` = 60, `riftglass.shop.reroll` = 60 | 5.10.8 |

Blessing numbers live with their content (§8.8), the guardians' with the monsters (§8.3), the Delve relics' with the relics (§8.10a), the alternate traits' with the traits (§8.5a), as every earlier ability, trait and brew does.

### 7.10 Hunter depth *(v0.8, D300–D328)*

Every constant here is tunable unless marked **locked** (D325).

| Formula | Expression | Constants (key = starting value) | § |
|---|---|---|---|
| Loot chance | per contract won | `loot.chanceBase` = 0.10, `loot.chancePerTier` = 0.05 | 5.11.2 |
| Loot rarity | weights per item | `loot.rarityWeights` = { fine: 65, rare: 27, heroic: 8 } | 5.11.2 |
| Bonus lines | sizes | `loot.lines` = { might: 0.06, health: 0.08, armor: 2, speed: 1, crit: 0.04, bane: 0.12 } | 5.11.2 |
| Stores | cap | `stores.cap` = 40 **(locked)** | 5.11.7 |
| Salvage | share of iron and silver put in; silver per line | `salvage.share` = 0.25, `salvage.perLine` = 20 | 5.11.7 |
| Ranks | highest level ever needed; trophies | `rank.wrightLevel` = 5 **(locked)**, `rank.masterLevel` = 10 **(locked)**, `rank.wrightTrophies` = 10, `rank.masterTrophies` = 60 | 5.11.3 |
| Talent points | by rank | `talent.points` = { apprentice: 1, wright: 3, masterWright: 5 } **(locked)** | 5.11.3 |
| Talent tiers | stars to open tiers 1–3 | `talent.tierStars` = [0, 2, 4] **(locked)** | 5.11.3 |
| Stars | star n costs n × these; growth per star | `star.max` = 5 **(locked)**, `star.embersPerStar` = 20, `star.trophiesPerStar` = 10, `star.growthPerStar` = 0.01 | 5.11.3 |
| Keepsake | slots per hunter | `keepsake.slots` = 1 **(locked)** | 5.11.6 |
| Yard XP | share of a contract's XP; cap at the nth-highest level | `yard.share` = 0.25, `yard.capRank` = 3 **(locked)** | 5.11.5 |
| Delve XP | per floor cleared × tier; guardian × tier | `delve.xpPerTier` = 10, `delve.guardianXpPerTier` = 20 | 5.10.7 |
| Guardian loot | rarity weights | `delve.guardianLootWeights` = { fine: 50, rare: 35, heroic: 15 } | 5.10.7 |

Command XP per Delve floor is the `delveFloor` field of `skill.xp.command` (§7.8; Q26 (a), D345). Use-skill, talent and Legendary numbers live with their content (§8.5b, §8.11, §8.12), as every earlier trait, ability and blessing does.

---

## 8. Starter Content

Content for v0.1–v0.4. Each table maps one-to-one to a content file in `src/content/` (see `technical-design.md`). Later milestones add rows, not new formats.

**[JC]** Every proper noun below still needs the collision search from §2.3 before it ships. That's a task in the implementation plan.

### 8.1 Buildings

The v0.1 buildings are in the table in §5.1.2. Added in v0.2–v0.4 (Keep unless noted):

| Building | Type | Base cost | Effect | From |
|---|---|---|---|---|
| Barracks | Level (max 5) | 600 wood, 300 iron, 100 silver | Active roster cap = 3 + level (G5) | v0.2 |
| Trophy Hall | Unique | 500 wood, 200 iron | +0.5% all production (except silver) per trophy earned this cycle (cumulative) | v0.2 |
| Hunter's Lodge | Level (max 3) | 800 wood, 400 iron, 200 silver | 1 investigation slot per level | v0.3 |
| Alchemist's Hut | Level (max 5) | 700 wood, 300 iron, 150 silver | Brews consumables; 1 brew at a time per level | v0.3 |
| Herb Garden | Count | 300 wood, 100 food | +1 yarrow, mugwort and juniper every 10 min | v0.3 |
| Walls | Level (max 10 in Citadel, 15 in Bastion) | 20,000 wood, 10,000 iron | In the Last Stand, the party takes 2% less damage per level; each level slows Threat by 2% | v0.4 (Citadel) |
| Watchtower | Level (max 10 / 15) | 15,000 wood, 8,000 iron, 100 silver | At the start of each wave, a volley of 20 × level Steel damage that ignores Armor; each level slows Threat by 2% | v0.4 (Citadel) |

### 8.2 Villages (contract givers)

| Village | Region | Location tags | Gift reagents |
|---|---|---|---|
| Dubno Ford | Lowland river crossing | river, field | honeycomb, hare's foot |
| Kozly Hollow | Lowland goatherd village in the old wood | forest, field, ruin *(v0.5)* | honeycomb, pitch |
| Mirograd | Lowland market town (the largest) | field, river | hare's foot, pitch |
| Velkvik | Highland fjord village | river, barrow, ruin *(v0.5)* | rime salt, pitch, noon poppy *(D239)* |
| Ravenfell | Highland hamlet among the barrow-hills | barrow, forest, ruin *(v0.5)* | rime salt |

A contract's location tag comes from its village. **Each success also gives one gift reagent** from that village (v0.3+). **Ruin** (v0.5, D157) joins three villages' tags; like barrows, ruins are never generated in the Hamlet or at tier 1, so a village whose only possible tags are ruled out picks from the rest.

### 8.3 Monsters

**How to read this table:**
- Stats are at the monster's **base tier** (the first tier in its range).
- Each tier above that multiplies Health and Might by 1.35 and Armor by 1.15 (§7.4).
- Speed doesn't scale.
- "Atk" is attacks per action (turn meter, §5.5).

| Monster | Family | Locations | Tiers | Health | Might | Armor | Speed | Atk |
|---|---|---|---|---|---|---|---|---|
| Gloam Wolf | Beasts & Wilds | forest, field, river, barrow | 1–2 | 120 | 10 | 2 | 14 | 2 |
| Kikimora | Field & Forest Spirits | forest, field, river | 1–2 | 110 | 12 | 3 | 13 | 1 |
| Upyr | Restless Dead | field, barrow | 2–3 | 170 | 16 | 4 | 10 | 1 |
| Rusalka | Water Spirits | river | 2–3 | 150 | 14 | 2 | 12 | 1 |
| Poludnitsa | Field & Forest Spirits | field | 2–4 | 160 | 15 | 3 | 11 | 1 |
| Vodyanoy | Water Spirits | river | 3–5 | 230 | 20 | 7 | 7 | 1 |
| Draugr | Restless Dead | barrow | 3–5 | 260 | 22 | 9 | 6 | 1 |
| Bies | Beasts & Wilds | forest, field | 3–5 | 220 | 18 | 5 | 12 | 1 |
| Leshy | Field & Forest Spirits | forest | 4–5 | 320 | 20 | 8 | 8 | 1 |
| Strzyga | Restless Dead | barrow, field | 4–5 | 240 | 24 | 5 | 13 | 1 |
| Huldra *(⚑ added, A3)* | Field & Forest Spirits | forest, field | 2–4 | 150 | 15 | 3 | 12 | 1 |
| Nix *(⚑ added, A3)* | Water Spirits | river | 3–5 | 210 | 19 | 4 | 13 | 1 |
| Gloam-moths *(v0.5)* | Cursed | ruin | 2–3 | 120 | 6 | 0 | 15 | 3 |
| Ribbonshade *(v0.5)* | Cursed | ruin | 2–4 | 140 | 14 | 2 | 11 | 1 |
| Anvil-wight *(v0.5)* | Cursed | ruin | 3–5 | 250 | 21 | 11 | 6 | 1 |
| Rimewrought *(v0.5)* | Cursed | ruin | 4–5 | 360 | 24 | 14 | 5 | 1 |
| Unlit's Breath *(v0.7)* | Deep | Delve guardian | 2+ (any) | 260 | 14 | 2 | 12 | 1 |
| The Forgotten *(v0.7)* | Deep | Delve guardian | 2+ (any) | 240 | 18 | 5 | 10 | 1 |
| The Dross-Tide *(v0.7)* | Deep | Delve guardian | 2+ (any) | 320 | 16 | 10 | 6 | 1 |

**Stats** (Deep guardians; base tier 2; Delve-only; ×`delve.guardianHealth` Health on top of tier scaling):

**Resistances** (multiplier on incoming damage of each type; **bold** = weakness, ≥ 1.25):

| Monster | Steel | Silver | Fire | Frost | Rune | Venom |
|---|---|---|---|---|---|---|
| Gloam Wolf | 1.0 | 1.0 | **1.25** | 1.0 | 1.0 | **1.25** |
| Kikimora | 1.0 | **1.25** | **1.5** | 0.75 | 1.0 | 0.5 |
| Upyr | 0.75 | **1.5** | **1.25** | 0.75 | **1.25** | 0 |
| Rusalka | 1.0 | **1.5** | 0.75 | **1.25** | 1.0 | 0.5 |
| Poludnitsa | 1.0 | **1.25** | 0.25 | **1.75** | 1.0 | 0.75 |
| Vodyanoy | 0.75 | **1.25** | 0.5 | **1.5** | 1.0 | 1.0 |
| Draugr | 0.75 | **1.5** | **1.5** | 0.25 | **1.25** | 0 |
| Bies | 1.0 | 1.0 | **1.25** | 1.0 | **1.5** | 0.75 |
| Leshy | 0.75 | 1.0 | **1.75** | 0.75 | **1.25** | 0.5 |
| Strzyga | 0.75 | **1.5** | 1.0 | 1.0 | **1.5** | 0.5 |
| Huldra | 1.0 | **1.25** | **1.25** | 1.0 | 1.0 | 0.75 |
| Nix | 1.0 | **1.25** | 0.75 | **1.5** | 1.0 | 0.5 |
| Gloam-moths | 0.75 | 1.0 | **1.75** | 1.0 | 1.0 | **1.25** |
| Ribbonshade | 1.0 | **1.25** | 0 | **1.75** | 0.75 | 0 |
| Anvil-wight | 0.5 | 1.0 | 0.5 | 1.0 | **1.75** | 0 |
| Rimewrought | 0.75 | 0.75 | **1.5** | 0 | **1.5** | 0 |
| Unlit's Breath | 1.0 | 1.0 | **1.5** | 0 | **1.25** | 0 |
| The Forgotten | 1.0 | **1.25** | 1.0 | 1.0 | **1.5** | 0 |
| The Dross-Tide | 0.75 | 1.0 | 0.5 | **1.25** | **1.5** | 0 |

**Abilities, clue tags, and drops:**

| Monster | Ability (exact effect) | Clue tags | Drop (v0.3) | Folklore basis |
|---|---|---|---|---|
| Gloam Wolf | *Hamstring:* each hit has a 25% chance to cut the target's Speed by 30% for the target's next 3 actions | tracks, livestock, night | wolf fang | Wolves grown wrong in the Gloam: grey, gaunt, too quiet |
| Kikimora | *Spoil:* its first hit on each hunter ruins that hunter's unused potion | house, livestock, swamp | thornwood | Household/swamp spirit whose mischief turns to malice |
| Upyr | *Bloodfeast:* heals 50% of the damage it deals | grave, bloodless, night | grave dust | Restless dead risen from an improper burial |
| Rusalka | *Drowning Song:* on its 1st, 5th, 9th… action, instead of attacking, it charms the lowest-Armor hunter, who loses their next action | drowned, song, night | river pearl | Drowned maiden of rivers and fields |
| Poludnitsa | *Noon Heat:* on each of its actions, every hunter loses 3% of max Health (Fire; ignores Armor). A Frost Pot suppresses it for the monster's next 3 actions | noon, fields, madness | noon poppy | Lady Midday, who strikes field workers at noon |
| Vodyanoy | *Drag Under:* every 3rd action, its attack grabs the target: they lose their next action and take ×2 from the next hit | drowned, mill, swamp | river pearl | Old man of the water, lord of mill-ponds and weirs |
| Draugr | *Barrow-Grip:* every 3rd action, its attack holds the target (they lose their next action). *Swell:* below 50% Health, Armor +50% (stat%) | grave, cold, treasure | grave dust, rime salt | Barrow-dead, swollen and heavy, guarding grave goods |
| Bies | *Malice:* +5% Might after each of its actions, stacking (status%) | madness, livestock, tracks | thornwood | Malevolent spirit of the wild places |
| Leshy | *Lead Astray:* on each of its actions, 15% chance one random hunter loses their next action. *Root-Wall:* regenerates 5% of max Health on each of its actions | lost, forest-shift, tracks | thornwood | Lord of the forest who misleads travelers and changes size with the trees |
| Strzyga | *Second Soul:* the first time it reaches 0 Health, it rises at 40% (once per fight) | grave, bloodless, strange-birth | grave dust | A person born with two souls; after death, one hunts the living |
| Huldra | *Enthrall:* on its 1st action and every 4th after, the hunter with the highest Might is enthralled: they lose their next action, and the Huldra heals 10% of max Health | stranger, lost, livestock | thornwood | Forest woman with a hidden tail who lures and punishes; keeper of cattle in the deep woods |
| Nix | *Riverhorse:* on its 1st action, it carries off the lowest-Health hunter, who can't act or be targeted until 3 of the Nix's actions have passed, then returns having lost 20% of max Health. A Saltburst cancels it | drowned, song, horse | river pearl | Shape-shifting water spirit, often a white horse that carries riders into the river |
| Gloam-moths | *Lightless* (passive): while the swarm stands, every hunter's hit chance is 10 points lower | lightless, swarm, night | thornwood | Original: a swarm that eats light and warmth |
| Ribbonshade | *Seal-burn* (passive): a hunter who hits it with a direct attack takes 10% of the damage dealt back as Fire, ignoring Armor. Each one carries a name until all six are found (§5.14.4) | ribbon, singed, forge | grave dust | Original: a pitiable shape in an old forge, still wearing an apprentice's ribbon |
| Anvil-wight | *Re-forge:* every 3rd action, instead of attacking, it restores 10% of max Health. A Saltburst cancels it | hammering, forge, cold | grave dust | Original: a dead Wright, still hammering at a cold anvil |
| Rimewrought | *Unthawed:* the first Fire hit it takes in a fight strips 30% of its Armor for the rest of the fight (stat%) | cold, iron-tread, forge | rime salt | Original: an old war-construct of the order, frozen by a cold from below |
| Unlit's Breath | *Chill:* a hunter it hits receives 50% less healing for their next 3 actions (status%, refreshes). *Drain:* on each of its actions, every standing hunter loses 2% of max Health as Frost damage, ignoring Armor | — | rime salt | Original: a drifting cold (lore §12.2) |
| The Forgotten | *Nameless* (passive): +3% Might and +3% Health (stat%) for each of the 16 contract species not yet Studied (up to +48%); its breakdown lists them | — | noon poppy | Original: shapes no one remembers |
| The Dross-Tide | *Settling:* every 3rd action, its attack hits every standing hunter (each hit rolled and resolved as a direct attack; Armor applies) | — | river pearl | Original: dross given a shape |

*Coverage (§8.3.1) is unchanged: the Deep family never appears on contracts or in the Last Stand in v0.7.*

**Saltburst** cancels the first trigger of any ability marked above and blocks abilities for the monster's next 3 actions (§5.7).

*⚑ Abilities restated for the turn meter (G4).*

#### 8.3.1 Coverage: location × tier → candidates *(⚑ added, revision A3)*

Barrow and ruin contracts start at tier 2; ruin contracts arrive in v0.5 (D157, D158).

| Location | T1 | T2 | T3 | T4 | T5 |
|---|---|---|---|---|---|
| Forest | Wolf, Kikimora | Wolf, Kikimora, Huldra | Bies, Huldra | Bies, Leshy, Huldra | Bies, Leshy |
| Field | Wolf, Kikimora | Wolf, Kikimora, Upyr, Poludnitsa, Huldra | Upyr, Poludnitsa, Bies, Huldra | Poludnitsa, Bies, Strzyga, Huldra | Bies, Strzyga |
| River | Wolf, Kikimora | Wolf, Kikimora, Rusalka | Rusalka, Vodyanoy, Nix | Vodyanoy, Nix | Vodyanoy, Nix |
| Barrow | *(not generated)* | Wolf, Upyr | Upyr, Draugr | Draugr, Strzyga | Draugr, Strzyga |
| Ruin *(v0.5)* | *(not generated)* | Moths, Ribbonshade | Moths, Ribbonshade, Anvil-wight | Ribbonshade, Anvil-wight, Rimewrought | Anvil-wight, Rimewrought |

**Required content-validation test.** For every location × tier cell any village can generate, it checks that:
1. at least 1 species qualifies;
2. at least 2 qualify wherever investigation applies, or else contracts in that cell arrive pre-identified;
3. every pair of species in a cell has different clue-tag sets, so 3 clues always identify exactly one.

The test runs on every content change.

### 8.4 Clue library (v0.3)

Each clue tag has several in-world texts. A contract draws one text per revealed tag, picked by seed. One example per tag:

| Tag | Example clue text |
|---|---|
| tracks | "Prints in the mud, too wide for any dog, sunk deep at the heel." |
| livestock | "Three goats dead in the pen. The gate was latched from the inside." |
| night | "It only comes after the last lamp is out." |
| house | "Pots broken in the night, wool tangled into knots no one tied." |
| swamp | "The reeds by the old peat-cut have gone black and stinking." |
| grave | "The new grave's soil was turned over, from below." |
| bloodless | "The body was pale as tallow, and there was no blood on the bed." |
| cold | "Frost on the barrow stones in midsummer." |
| treasure | "The tomb-robbers came back raving about gold, and only one came back." |
| drowned | "Two drowned at the ford this month, both strong swimmers." |
| song | "The fishermen hear a woman singing where no woman should be." |
| mill | "The mill-wheel stops at night, as if something holds it." |
| noon | "The reapers who fell sick all fell at midday." |
| fields | "The barley is flattened in a ring, and nothing walked in." |
| madness | "He came home talking to someone who wasn't there." |
| lost | "Woodcutters walk for hours and come out where they started." |
| forest-shift | "The old path is gone. The trees stand where it used to run." |
| strange-birth | "The woman's son was born with two teeth, and he died last winter." |
| stranger *(⚑ added)* | "A woman no one knew danced at the harvest feast. Three men followed her into the wood." |
| horse *(⚑ added)* | "A white horse stood by the ford at dusk. The miller's boy climbed on, and it walked into the river." |
| lightless *(v0.5)* | "Lanterns go out in the old yard, one after another, though there's no wind." |
| swarm *(v0.5)* | "Something rose off the rafters like smoke, and it was wings." |
| ribbon *(v0.5)* | "A herd-boy saw a shape at the forge door with a blue ribbon on its sleeve." |
| singed *(v0.5)* | "The goat that wandered in came out with its coat scorched in the shape of a hand." |
| forge *(v0.5)* | "The marks on the lintel are the old order's: an anvil with a flame on it." |
| hammering *(v0.5)* | "You can hear hammering from the ruin at night. Nobody's lit that forge in twenty years." |
| iron-tread *(v0.5)* | "Footprints in the frost, each one as big as a shield and pressed an inch into rock." |

**Generator rules:**
1. A contract's candidate list is every species whose locations include the contract's tag and whose tier range covers the contract tier.
2. Its 3 clues must, taken together, narrow that list to exactly the true species. When the tag pool can't do that, the generator picks another species.

### 8.5 Hunters (v0.2)

**Role baselines at level 1:**

| Role | Health | Might | Armor | Speed |
|---|---|---|---|---|
| Vanguard | 160 | 12 | 8 | 8 |
| Striker | 100 | 20 | 3 | 12 |
| Mender | 110 | 10 | 4 | 10 |

Individual hunters vary from the role baseline by up to ±10% or 1 point per stat, whichever is larger (so Armor and Speed may move by 1).

| Hunter | Role | Damage | Origin | Traits | Unlock | Stats (H/M/A/S) | Sketch |
|---|---|---|---|---|---|---|---|
| **Halvar Two-Smokes** | Vanguard | Steel | Highland | Shieldwall, Steady | Start (free) | 170/12/8/7 | Former charcoal-burner. Calm, enormous, smells permanently of smoke. |
| **Zora Sedlak, the Ferrywoman** | Striker | Steel | Lowland | Fen-born, Quick | Start (free) | 100/20/3/13 | Ran the Dubno ferry until the river turned deadly. Fights with a boathook. |
| **Old Ostap** | Mender | Steel | Lowland | Bonesetter, Hard to kill | First successful contract | 115/10/4/9 | Village bonesetter, 58. Has buried two masters and a wife, and isn't done yet. *(From cycle 3, when it becomes true: "has outlived three wardens.")* |
| **Bjarna Ice-Hand** | Striker | Frost | Highland | Cold-blooded, Fell-born | 3 successful contracts | 95/21/3/12 | Velkvik fisherwoman. Her rime-dipped spear never quite thaws. |
| **Vesna of the Weir** | Mender | Venom | Lowland | Herbwise *(v0.3)*, Fen-born | Complete a river contract | 105/11/4/11 | Herbwife who knows which roots heal and which ones stop hearts. |
| **Radek the Gravedigger** | Vanguard | Silver | Lowland | Grave-warden, Hard to kill | Defeat an Upyr | 165/11/9/7 | Has buried half of Mirograd. Lately his shovel has been silver-shod. |
| **Sigrun Halfhand** | Striker | Fire | Highland | Fire-touched, Lantern-bearer | Smithy level 5 | 100/22/4/11 | Exiled Emberwright apprentice who won't say why she left. *(lore hook)* |
| **Toma Kettle** | Vanguard | Steel | Wanderer | Haggler, Quick | Earn 2,000 silver in bounties | 150/12/7/8 | Tinker and talker. Has opinions about every price at the hold. |
| **Stanko Sleepless** *(v0.3)* | Striker | Venom | Lowland | Wolf-friend, Quick | The Gaunt Wolf reaches Studied | 95/21/3/12 | Sits up nights with a knife dipped in something he keeps in a goat's horn. Nobody in the Hollow has seen him sleep. |
| **Herdis Strayfinder** *(v0.3)* | Mender | Frost | Highland | Tracker, Hard to kill | Build the Hunter's Lodge | 120/9/4/10 | Can follow a week-old track across bare rock. The iron heel of her crook is rime-salted, an old Ravenfell habit against things that walk at night. |

**Recruitment prices** *(⚑ revision G5)*: Halvar, Zora and Arvid *(v0.5)* free; Ostap 150; Herdis 300 *(v0.3)*; Vesna 350; Bjarna 400; Stanko 450 *(v0.3)*; Radek 500; Toma 600; Sigrun 1,200 silver.

**Traits:**

| Trait | Exact effect | Active from |
|---|---|---|
| Shieldwall | While this Vanguard is standing, allies take −10% damage | v0.2 |
| Steady | Damage variance narrowed to 0.95–1.05 | v0.2 |
| Fen-born | +15% Might on river contracts | v0.2 |
| Fell-born | +15% Might on barrow contracts | v0.2 |
| Quick | +3 Speed | v0.2 |
| Bonesetter | +25% healing done | v0.2 |
| Hard to kill | Recovery times −30% | v0.2 |
| Cold-blooded | Crits deal ×1.75 instead of ×1.5 | v0.2 |
| Grave-warden | +20% Might vs Restless Dead | v0.2 |
| Fire-touched | +20% Fire damage dealt; −20% Fire damage taken | v0.2 |
| Lantern-bearer | Party hit chance +5% on barrow contracts | v0.2 |
| Haggler | +10% bounty silver on contracts this hunter joins | v0.2 |
| Herbwise | Potions carried by this hunter are 25% stronger | v0.3 |
| Wolf-friend | +20% Might vs Beasts & Wilds | v0.3 *(Stanko)* |
| Tracker | While this hunter is idle at the hold, one Lodge slot reveals clues 25% faster | v0.3 *(Herdis)* |
| Shield-companion | While this Vanguard is standing, the party member with the lowest % Health takes −15% damage (taken%; ties by party slot) | v0.5 *(Arvid)* |
| Old Wright | +20% Might vs the Cursed family | v0.5 *(Arvid)* |

#### 8.5a Alternate traits *(v0.7, D260)*

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

**v0.5 adds Arvid Netmender** *(⚑ lore C4; D154: "Stonebrow" is a Warcraft surname)*, a story hunter **who arrives in play from v0.6 (Act III)**:

| Hunter | Role | Damage | Origin | Traits | Unlock | Stats (H/M/A/S) | Sketch |
|---|---|---|---|---|---|---|---|
| **Arvid Netmender** *(v0.5)* | Vanguard | Rune | Highland | Shield-companion, Old Wright | **Arrives with Ilse when Act III begins** (v0.6, D211): he joins the roster directly (active if there's room, otherwise the reserve), at **the level of your highest-level hunter at that moment** (after any Long Night halving), within the Rank's level cap | 175/12/9/7 | Velkvik net-mender, 51, who keeps a runed axe he won't talk about. Says he's too old for this. Hasn't missed a fight. |

Portrait: a grey beard in two braids, a fisherman's knit cap, a scarred leather collar, a faint rune-mark on the axe haft. Every hunter has two letters from v0.5 (§5.14.7).

**v0.3 adds 2 hunters:** Stanko Sleepless (a Wolf-friend Striker with Venom damage) and Herdis Strayfinder (a Tracker Mender), defined by the owner (Q12, D101). That brings the roster to 10. The Barracks cap of 8 makes roster choice matter.

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

### 8.6 Ingredients (v0.3; properties v0.6, D202)

Each ingredient carries **3 hidden properties** (§5.8.1). **Bold** = proved by a v0.3 recipe and known from the start (15); the rest are found by experiment (21). Each property is named by the brew it makes.

| Ingredient | Source | Properties |
|---|---|---|
| Yarrow | Herb Garden | **Drowned-Bane Oil** · **Mending Draught** · Hardwood Tonic |
| Mugwort | Herb Garden | **Thornbane Oil** · **Quickfoot Tincture** · Steadfast Draught |
| Juniper | Herb Garden | **Grave Oil** · **Hardwood Tonic** · Steadfast Draught |
| Honeycomb | Gift: Dubno Ford, Kozly Hollow | **Mending Draught** · Owl-Eye Drops · Poppy Smoke |
| Hare's foot | Gift: Dubno Ford, Mirograd | **Quickfoot Tincture** · Hidebane Oil · Owl-Eye Drops |
| Pitch | Gift: Kozly Hollow, Mirograd, Velkvik | **Fire Pot** · Wright's Oil · Drowned-Bane Oil |
| Rime salt | Gift: Velkvik, Ravenfell; drop: Draugr, Rimewrought *(v0.5)* | **Frost Pot** · **Saltburst** · Grave Oil |
| Grave dust | Drop: Upyr, Draugr, Strzyga, Ribbonshade, Anvil-wight *(v0.5)* | **Grave Oil** · Wright's Oil · Saltburst |
| River pearl | Drop: Rusalka, Vodyanoy, Nix | **Drowned-Bane Oil** · Coldwater Draught · Frost Pot |
| Thornwood | Drop: Kikimora, Bies, Leshy, Huldra, Gloam-moths *(v0.5)* | **Thornbane Oil** · **Hardwood Tonic** · Fire Pot |
| Wolf fang | Drop: Gaunt Wolf | Hidebane Oil · Owl-Eye Drops · Steadfast Draught |
| Noon poppy | Gift: Velkvik *(Q19, D239)*; drop: Poludnitsa | Coldwater Draught · Poppy Smoke · Mending Draught |

Carriers per brew (2–3 each): Grave Oil 3, Drowned-Bane 3, Thornbane 2, Mending 3, Hardwood 3, Quickfoot 2, Fire Pot 2, Frost Pot 2, Saltburst 2, Hidebane 2, Wright's Oil 2, Coldwater 2, Owl-Eye 3, Steadfast 3, Poppy Smoke 2 = 36. No two ingredients have the same three. **Content test (T6.1):** every brew has ≥ 2 carriers (≥ 1 for bombs), each ingredient exactly 3 distinct properties, and the 15 bold ones are exactly the v0.3 recipes'.

**Drop rate:** each success yields `tier` units of that monster's drop, plus 1 gift reagent from the village.

### 8.7 Consumables

See the table in §5.7 (9 items in v0.3) and §5.8.5 (6 more in v0.6): 15 in all.

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

### 8.9 Warden upgrades (v0.4, D111; names D116)

Bought with Embers on The Hearth (§5.9.5). Level L costs `cost × growth^(L−1)` Embers. Every value is tunable.

| Upgrade | Effect per level | Max | Cost | Growth |
|---|---|---|---|---|
| Kept Coals | +10% all production except silver (ember bucket) | 10 | 15 | 1.5 |
| Full Larder | Each cycle starts with +200 food and +200 wood | 5 | 10 | 1.6 |
| Young Families | Each cycle starts with +1 Cottage and +2 peasants | 5 | 20 | 1.6 |
| Old Hands | Hunters keep 10 more percentage points of their levels at the Long Night (50% → 100%) | 5 | 30 | 1.8 |
| Drill Yard | +10% contract XP | 5 | 15 | 1.6 |
| Village Goodwill | +5% bounty silver (bounties only; seams untouched, G1) | 5 | 25 | 1.7 |
| Swift Roads | Contracts take 10% less time | 3 | 25 | 1.8 |
| Late Lantern | +1 h offline cap (still within the 24 h ceiling) | 4 | 20 | 2 |

### 8.10 Relics (v0.4, D111)

Found at Last Stand wave milestones (§5.9.6). Bonuses go in the relic bucket; none touches silver. Every value is tunable.

| Relic | Effect |
|---|---|
| Plough-Share | +10% food |
| Mason's Plumb | +10% wood and iron |
| Tally Stick | +15% contract XP |
| Bone Whistle | Clues take 15% less time |
| Copper Still | Brewing takes 20% less time |
| Iron Shutter | In the Last Stand, the party takes 5% less damage (counts toward the 75% cap) |

#### 8.10a Delve relics *(v0.7, D261)*

Kept forever; shown on the Roll of Wardens. **Their effects work only inside Delves**, so they never touch contracts, the Last Stand or the hold. Each is found by **whichever of its two sources comes first**. No relic slots.

| Relic | Effect (in Delves) | Delve source | Idle source |
|---|---|---|---|
| **Spindle Whorl** | +5% Might | First guardian beaten in the Keep | Every Field & Forest species Studied |
| **Cold Iron Nail** | −5% damage taken | First guardian beaten in the Citadel | Every Restless Dead species Studied |
| **Rift Lantern** | +10 points of recovery between floors | First guardian beaten in Bastion | Every Water Spirit species Studied |
| **Bell Clapper** | The first offer of each run shows 4 blessings instead of 3 | First Unlit's Breath defeated | Every Beasts & Wilds species Studied |
| **Salt Ring** | Guardians have 10% less Health | First Forgotten defeated | Every Cursed species Studied |
| **Horn Spoon** | Guardians drop 1 more unit | First Dross-Tide defeated | The recipe book complete (36 of 36) |

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

## Judgment calls in §6–8

1. **Simulated players start runs on Monday at 07:00,** with a second run starting Saturday at 09:00.
2. **Later cycles must each be at least 15% faster than the first,** with a floor of 2 days *(D134)*.
3. **Odds preview raised from 200 to 500 simulated fights.** This keeps the displayed margin within ±4.4 points. *(Small edit to approved §5.4.2.)*
4. **Monster tier scaling is relative to each monster's base tier,** and Armor scales more slowly (1.15 per tier) than Health and Might (1.35). *(Small edit to approved §5.4.1.)*
5. **"Leshy bark" renamed to "thornwood"** and dropped by three monsters, so the forest oil is available from tier 1. *(Small edit to approved §5.7.)*
6. **Village gifts:** each success also gives a village-specific reagent. This is how honeycomb, hare's foot, pitch, and rime salt enter the game; from v0.6 Velkvik also gifts noon poppy (Q19, D239).
7. **Preparation-matters check:** matched preparation must raise the odds by at least 15 points. This is the main simulator guard on the Witcher influence.
8. **Silver check:** at least 70% of silver income must come from bounties once contracts unlock.
9. **The hunter roster and stats in §8.5,** including Sigrun Halfhand as an Emberwright lore hook.
10. **v0.3 brings 2 more hunters (10 total) against a Barracks cap of 8,** so roster choice matters.
11. **The Pale Smith patron points toward the Emberwrights** in the lore.
12. **Every proper noun still needs a collision search** before it ships; that's a task in the implementation plan.

---

## 9. UI Screens (phone-first)

### 9.1 Layout and interaction rules

**All mocks in §9 are illustrative.** Their numbers follow the formulas, but they aren't test cases; the only exact example is §5.5.1 *(⚑ revision A14)*.

**Target size.** The layout is designed for a 360–430 px wide portrait phone and scales up (D02).
- **≥ 900 px wide:** two columns. Navigation becomes a left sidebar, the main screen sits in the middle, and the detail panel (breakdowns, logs, hunter details) opens on the right instead of as a sheet.
- **≥ 1300 px wide:** the right column stays open.

**Shell.** Every screen shares the same frame:

```
┌──────────────────────────────────┐
│ 🌾1.2K  🪵860  ⛏️310  ⚪42   ⚠️ │  ← resource bar (tap: rates)
├──────────────────────────────────┤
│                                  │
│          (screen content)        │
│                                  │
├──────────────────────────────────┤
│ Hold  Hunters Contracts Bestiary ⋯│ ← tab bar (badges show
└──────────────────────────────────┘    "something to do")
```

- **Resource bar.** Always visible. Tapping it opens a sheet with per-minute rates and each rate's breakdown. A ⚠️ appears for idle peasants or finished contracts.
- **Tabs.** Hold · Hunters · Contracts · Bestiary · More. **A tab appears only when its system unlocks** **[JC]**. v0.1 shows only Hold and More. Hidden tabs are better than greyed-out promises (pillar 5, and the "no fake progress bar" rule in §5.1.3).
- **Breakdowns.** Long-press any number (or hover, on desktop) to open its breakdown sheet (§5.0). A small ⓘ next to key numbers shows that a breakdown exists, for anyone who forgets the gesture.
- **Sheets, not pages.** Details open as bottom sheets that swipe down to close. The tab under them keeps its scroll position.
- **Touch targets:** at least 44 × 44 px. Primary actions sit in the lower half of the screen, within thumb reach.
- **Number formatting:** 3 significant digits plus a suffix (K, M, B, T, Qa, Qi), then scientific notation above 1e21. Exact values appear in breakdowns.
- **Theme** **[JC]**: dark by default, a warm candlelit palette in keeping with "heroic with dark edges". A light theme is in Settings.
  - Pixel font for headings and numbers in the resource bar only. Body text uses a readable system font, because pixel fonts are hard to read at body size on phones.
  - Respects the system "reduce motion" and text-size settings.
- **Art placement:** sprites appear in building rows, hunter cards, monster entries, and the hold header. Every image comes from the asset manifest with a placeholder fallback, so a missing sprite never breaks a screen.

### 9.2 Hold (v0.1)

```
┌──────────────────────────────────┐
│  [pixel hold scene · Hamlet]     │
│  Stanholm — Hamlet    Rank ▸     │
├──────────────────────────────────┤
│ PEASANTS 7 · 9 beds  idle 1 ⚠️   │
│ [Settle one]   Auto ✔            │
│ Farmer      4/6   [−] [+] [fill]  │
│ Woodcutter  2/3   [−] [+] [fill]  │
│ Miner       0/2   [−] [+] [fill]  │
├──────────────────────────────────┤
│ BUILD                 ×1 ×10 Max  │
│ ▣ Cottage ×3   +2 housing        │
│   🪵46 🌾15          [Buy] ●     │
│ ▣ Farm ×2      +3 farmer slots   │
│   🪵53               [Buy]       │
│ ▣ Mill  Lv2/5  +25% food         │
│   🪵367 ⛏️122         [Upgrade]   │
│ ...                              │
└──────────────────────────────────┘
```

- The Peasants heading shows the peasant count and the beds (housing); a line under the Settle button says why settling is blocked (no free beds, or not enough food) (D63).
- ● marks the best payback among affordable options. It's a hint only, and it can be turned off in Settings.
- Buildings group into **Housing · Gathering · Crafting · Hold**. In v0.1 there are few enough buildings to show them as one list.
- **Rank ▸** opens the Rank screen: the part of old Stanholm the next Rank restores, its requirements as a checklist, its costs, and what it unlocks. Unbuilt future content shows as "Coming in a later milestone" (§5.1.3).
- Unaffordable rows show their cost in a muted color, plus a "ready in ~1 h 20 m" estimate at current rates.

### 9.3 "While you were away" sheet (v0.1)

```
┌──────────────────────────────────┐
│ While you were away              │
│ 14h 20m away · 12h counted (cap) │
├──────────────────────────────────┤
│ +18.4K 🌾  +11.2K 🪵  +3.1K ⛏️    │
│ +3 peasants settled              │
│ ✔ Drowned at Dubno Ford — won ▸  │
│ ✖ Barrow at Ravenfell — lost ▸   │
│   Halvar wounded · 4h left       │
│ 📖 Rusalka: Identified           │
├──────────────────────────────────┤
│            [ Onward ]            │
└──────────────────────────────────┘
```

- Lines marked ▸ open the full log.
- Contract, injury, and bestiary lines appear only once those systems exist.

### 9.4 Contracts board (v0.2)

```
┌──────────────────────────────────┐
│ BOARD 4/6     next in 1h 12m     │
├──────────────────────────────────┤
│ ⏱ Running                         │
│  Gloam Wolf · T1 · 12m left      │
├──────────────────────────────────┤
│ ✔ Ready to collect (1)  [Collect]│
├──────────────────────────────────┤
│ Open                             │
│ ▸ Dubno Ford · river · T2        │
│   "Two drowned at the ford…"     │
│   ? 3 candidates · 🔍 2/3 clues  │
│   ⚪96 · 🏆2 · 1h                 │
│ ▸ Ravenfell · barrow · T3        │
│   Draugr (Studied) · ⚪154 · 2h   │
└──────────────────────────────────┘
```

- The 🔍 clue progress shows only for unknown monsters (v0.3).
- **Collect** gathers every finished contract at once and shows a summary like the away sheet.

### 9.5 Contract launch sheet (v0.2–v0.3)

```
┌──────────────────────────────────┐
│ Ravenfell · Draugr · T3 · 2h     │
│ weak: Silver ×1.5, Fire ×1.5     │
│ resists: Frost ×0.25, Venom ×0   │
├──────────────────────────────────┤
│ PARTY (3)        [Suggest best]  │
│ [Halvar ▾] [Radek ▾] [Zora ▾]    │
├──────────────────────────────────┤
│ PREPARE                (v0.3)    │
│ Oil    Grave Oil ×3 ✔ matched    │
│ Potion Mending · Hardwood · —    │
│ Bombs  Fire Pot ✔ weak · —       │
├──────────────────────────────────┤
│ ODDS  78% ±4                Why▸ │
│ unprepared would be 52%          │
│ Halvar: 18% wounded              │
│ Zora:    9% wounded              │
│ Provisions 🌾436 (paid at launch) │
├──────────────────────────────────┤
│        [ Send the hunters ]      │
└──────────────────────────────────┘
```

- The odds update live as the party and preparation change. The "unprepared would be" line keeps the value of preparation visible.
- **Why ▸** opens the odds breakdown: party damage per 100 ticks against the monster's effective Health, the monster's damage per 100 ticks against the party's effective Health, expected ticks, and every contributing modifier.
- **Reckless contracts** (below 35%): the launch button turns red and reads "Send them anyway". It opens a confirmation listing each hunter's exact death chance (§5.3.7).
- **Unknown monster:** the resistance lines read "? 3 candidates", and the odds show "assumes unidentified" (§5.6.3).

### 9.6 Fight log (v0.2)

```
┌──────────────────────────────────┐
│ ✔ Draugr slain · tick 182        │
│ ⚪230 (×1.5 well prepared) 🏆4    │
│ grave dust ×3 · rime salt ×1     │
├──────────────────────────────────┤
│ t1 Fire Pot → Draugr 60 · 200/260│
│ t7 Zora hits Draugr 19 · 181/260 │
│ t17 Draugr hits Halvar 14 ·156/170│
│ t50 Barrow-Grip! Halvar is held  │
│ ...                              │
│ [Ticks ▾] [Show rolls ☐] [Seed]  │
└──────────────────────────────────┘
```

- **Show rolls** expands every line to its full roll detail (§5.5).
- **Seed** shows the fight seed and offers "replay fight", which re-runs it to confirm the log matches. This is mostly a debugging aid, kept visible on purpose (D10).
- Logs can be collapsed to one line per 50 ticks.

### 9.7 Hunters (v0.2)

```
Active 6/8 · Reserve 2                      Hunter detail (sheet)
┌──────────────────────────────┐ ┌──────────────────────────────┐
│ [spr] Halvar Two-Smokes      │ │ [sprite]  Zora Sedlak        │
│ Vanguard · Steel · Lv4       │ │ the Ferrywoman               │
│ ● Ready                      │ │ Striker · Steel · Lv5 ▓▓░ XP  │
│ [spr] Zora Sedlak            │ │ H 140  M 37  A 8  S 16 ⓘ      │
│ Striker · Steel · Lv5        │ │ Fen-born: +15% Might (river)  │
│ ⏱ On contract · 40m          │ │ Quick: +3 Speed               │
│ [spr] Radek                  │ │ Weapon  Steel Blade [Upgrade] │
│ Vanguard · Silver · Lv3      │ │ Armor   Mail                  │
│ ✚ Wounded · 3h 10m           │ │ Record  14 won · 2 lost       │
│ — Candidates —               │ │ Bio ▸                         │
│ Bjarna Ice-Hand  ⚪400  [Hire]│ └──────────────────────────────┘
└──────────────────────────────┘
```

- **Filters:** role, damage type, status.
- **Reserve** *(⚑ revision G5)*: reserve hunters are listed below the active roster. Swapping a hunter in or out is one tap.
- **Locked hunters:** they appear at the bottom as silhouettes, with their unlock condition shown ("Defeat an Upyr"). Knowing what to chase is part of the collection feel.

### 9.8 Bestiary (v0.3)

```
Grid (by family)                 Entry (sheet)
┌──────────────────────────────┐ ┌──────────────────────────────┐
│ RESTLESS DEAD          2/3   │ │ [sprite]   DRAUGR            │
│ [Upyr] [Draugr] [?]          │ │ Restless Dead · Studied ▓▓▓░  │
│ WATER SPIRITS          1/2   │ │ 4 kills · Mastered at 10      │
│ [Rusalka] [·]                │ │ "Barrow-dead, swollen and     │
│ FIELD & FOREST         2/4   │ │  heavy, who guard what was    │
│ [Kikimora][Poludn.][·][·]    │ │  buried with them…"           │
│ BEASTS & WILDS         1/2   │ │ Resistances  Steel ×0.75 …    │
│ [Gloam Wolf] [·]             │ │ Barrow-Grip · Swell ⓘ         │
└──────────────────────────────┘ │ +5% damage (Studied)          │
  [?] = Sighted · [·] = Unknown  │ Encounters ▸ (last 5 logs)   │
                                 └──────────────────────────────┘
```

### 9.9 Alchemist's Hut (v0.3)

The Hut opens from its building row on the Hold screen.

```
┌──────────────────────────────────┐
│ ALCHEMIST'S HUT Lv2 · 2 kettles  │
│ ⏱ Grave Oil 4m · ⏱ Fire Pot 9m   │
├──────────────────────────────────┤
│ STORES  Grave Oil 3 · Fire Pot 1 │
│ REAGENTS yarrow 12 · grave dust 5│
├──────────────────────────────────┤
│ Grave Oil   2 grave dust 1 juniper│
│ +35% vs Restless Dead   [Brew ×1]│
│ Saltburst   2 rime salt · 1 ⚪    │
│ needs rime salt (have 1)  muted  │
└──────────────────────────────────┘
```

**From v0.6:**
- Three sections: **Brew** (as in v0.3, every known recipe of each brew, the 2:1 split picker), **Experiment** (two ingredient pickers, the cost "1 each · 10m", what's still hidden on each, "already tried" or "nothing left to learn" when refused), **Book** (the 12 × 3 grid with "?" for hidden properties, the count "Properties found: N of 36", each brew with its known recipes).
- A discovery shows as *"Discovered: Hidebane Oil."* on the Hut, the away sheet and results.

### 9.10 More menu

| Item | Contents | From |
|---|---|---|
| Reports | The last 3 away sheets; the last 50 fight logs | v0.1 / v0.2 |
| Hall of the Fallen | Memorials to dead hunters (§5.3.7) | v0.2 |
| Save & Data | See below | v0.1 |
| Settings | Theme, best-buy hint on/off, rates per min/hour, reduce motion | v0.1 |
| Debug | Only in dev builds or with `?debug` (see below) | v0.1 |
| About & Credits | Version, `credits.md` contents (CC0 sources) | v0.1 |

**Save & Data:**

```
┌──────────────────────────────────┐
│ Last saved 12s ago (auto)        │
│ [Save now]                       │
│ [Copy save code]  [Paste code]   │
│ [Download save file] [Load file] │
│ Backup slot: 6m ago  [Restore]   │
│ ─────────────────────────────    │
│ [Reset everything…] (2 confirms) │
└──────────────────────────────────┘
```

**Debug panel** (D17, v0.1):
- Time skip: +1 m, +1 h, +12 h, or a custom amount. It runs the same offline code path.
- Add resources.
- Set the RNG seed.
- Unlock a Rank.
- Show raw state as JSON.
- Run the simulator's Standard policy for N hours.
- Force a contract outcome *(v0.2)*.

### 9.11 What exists when

| Milestone | Screens |
|---|---|
| v0.1 | Shell, Hold, Rank screen, away sheet, rates sheet, breakdown sheets, More (Reports, Save & Data, Settings, Debug, About) |
| v0.2 | + Hunters (roster, detail, candidates), Contracts (board, launch sheet, fight log), Hall of the Fallen, gear upgrades |
| v0.3 | + Bestiary (grid, entries), investigation on the board and launch sheet, preparation on the launch sheet, Alchemist's Hut |
| v0.4 | + Threat meter, Citadel and Bastion on the Rank screen, defenses, The Hearth (upgrades and relics), the Last Stand screen, the Long Night sheets, the arrival sheet (§9.13) |
| v0.5 | + the Archive tab (Bestiary, Library, Accounts, Names), the document reader, story scenes, the Villages panel, letters on the hunter sheet, warden naming, the Roll of Wardens, bands on the stand screens (§9.14) |
| v0.6 | + the Hut's Experiment and Book sections; "What the ember remembers" (warden skills) on the Rank screen; skill lines on the away sheet and new-warden sheet; Arvid's arrival; Act III's documents and scenes |
| v0.7 | + the Rift card on the Hold screen; the Delve sheets (entry, floor playback and log, doors, blessings, Your blessings, guardian, result); the Riftglass shop on the Rank screen; alternate traits on the hunter sheet; battle sprites; the Echoes shelf; Act IV's documents and scenes (§9.15) |
| v0.8 | + rank, stars, talents, use-skill and three slots on the hunter sheet; the slot picker; Stores with Salvage; Rank up and Add a star; loot, Legendary, rank-up and yard lines on the away sheet and results; Act V's documents and scenes; the Rift card's sixth-door line (§9.16) |

**Honest scope note.** Claude Code builds these layouts reliably. What it does less well without human eyes is visual polish: spacing, contrast, how pixel art and UI chrome feel together.
- Each milestone's playtest checklist includes a short "looks wrong on my phone" pass, where you send screenshots.
- A real art and UX pass is scheduled for v1.0.


### 9.12 Art direction *(⚑ revision C7 [JC])*

The full pipeline (manifest, generators, credits) belongs in `technical-design.md`. This is the look it has to produce.

- **One palette:** a single limited palette of 32 colors, chosen in v0.1 from a palette published for free use and recorded in `credits.md`. Every asset, from a pack or generated, is recolored to it. That's what makes mixed sources look like one game.
- **Sizes:** 16 px icons (resources, statuses, traits); 32 px buildings, items and battle sprites; 64 px hunter and monster portraits. Integer scaling only (2×, 3×, 4×), nearest-neighbor.
- **Source plan:**

| Asset | Source |
|---|---|
| Terrain, hold-scene tiles, UI frames | CC0 packs, recolored to the palette |
| Resource and item icons | CC0 packs where they fit; code-generated for the rest |
| **Hunter portraits** | **Code-generated** by a modular portrait generator: face, hair, beard, headgear, armor collar and weapon silhouette, each a layer, palette-swapped per hunter from a seed in their content entry |
| **Monster portraits and battle sprites** | **Code-generated** from part templates (body shape, head, limbs, features), one template set per family |
| Buildings | CC0 packs where they fit; otherwise generated from simple modular parts |

- **Battle sprites (v0.7, D265):** 32 px, code-generated from part templates per family, for the 16 contract species, the 3 Deep guardians and the 11 hunters (from their portrait parts). Animation: a 2-frame idle, a lunge when attacking, a white flash when hit, a downed pose; reduce-motion shows still frames. A contact sheet goes to the owner one session before the Delve screens; a rejected sprite falls back to the 64 px portrait shrunk to 32 px.
- Also v0.7: patron sigils (6, 16 px), rarity frames (Faint, Warm, Bright), icons for Riftglass and the six Delve relics, and the four hold cosmetics in the hold scene.
- **v0.8 (D324):** 16 px icons for the 7 base pieces; 4 item rarity frames (Common, Fine, Rare, Heroic), distinct from the Delve frames; 6 keepsake icons; a star icon; 3 rank badges; icons for the nine older brews. A contact sheet for the owner's review in the playtest.

**Honest note:** the generated monsters (especially the poludnitsa, vodyanoy, huldra and nix) will be the weakest art in the game. CC0 packs almost never include folklore creatures like these. The asset manifest lets you swap in better art later without touching code.

### 9.13 Long Night screens *(v0.4, D107–D112, D115)*

- **Threat meter** (Hold screen, from the Keep): the value and "+X per hour now". Long-press for the breakdown: the Rank's rate, what defenses take off, contracts completed and failed.
- **Rank screen** (Hearth Hall): Citadel and Bastion Rank-ups with requirements and costs; the restoration sheet without an inscription (v0.5 adds them); **The Hearth** (Embers on hand, the warden upgrades, the relics you own); from Bastion, **Make the Last Stand**; from v0.6, **What the ember remembers**: the four warden skills (§5.8.6).
- **Last Stand screen:** the wave list (the first 12; "?" for species not yet Identified); six slots with the suggested six; one oil and one potion per hunter; bombs shown as "thrown automatically from stores"; the preview (expected waves with a range; Embers now with the breakdown and per day of the cycle; Threat by tomorrow; Embers tomorrow, labeled as an estimate); **Start**, with a confirmation that says the Long Night follows.
- **The Long Night sheets**, in order (§5.9.7): the stand's result, with a link to each wave's log; the closing line; The Hearth; the new-warden sheet with the choice of 3 active hunters.
- **Arrival sheet** (old saves only, §5.9.8).

### 9.14 Story screens *(v0.5, D144–D166)*

- **Archive tab** (replaces the Bestiary tab once Ilse arrives; §5.14.3): four sections in a segmented control: **Bestiary** (the v0.3 screen), **Library**, **Accounts**, **Names**. A badge counts unopened items.
- **Library:** grouped by act, then type; a letters shelf for hunter letters. Each row: title, witness, where it was found. Tapping opens the **reader**: the text in the body font on a parchment-toned card, any Ilse note under it in italics, and "Found: [condition], [cycle]".
- **Accounts:** one card per event; tapping shows each account's excerpt side by side (stacked on a phone), each labeled with its witness and a link to the full document.
- **Names:** *"Names found: N of 40"*, then the 40 rows in order: found rows show name, village and year; missing rows show the hint. No progress bar beyond the count.
- **Scene sheets** (Ilse's arrival, Sigrun at the door, a Ribbonshade's ribbon, Pechko's closing scenes): the same sheet as Rank-up scenes, one tap to dismiss, kept in the Library.
- **Villages panel** (Contracts board, above the open contracts, collapsible): one row per village with its trust level, its one-line description and "6 of 10 contracts toward Wary"; long-press for the breakdown.
- **Hunter detail:** a **Letters** row (levels 5 and 8, locked rows show "at level 5"); a new letter shows a badge.
- **Warden naming:** a text field (24 characters) with **Suggest**, on the new-warden sheet and, for an old save, on its arrival scene (one field per earlier warden).
- **Roll of Wardens** (Rank screen, Hearth Hall, below The Hearth): the worn first line, then one line per warden (§5.14.5); tapping a warden's line shows that cycle's stand result.
- **Stand screen:** the band thresholds next to the preview; **result sheet:** the band, the residents' lines, trust steps and the testament (§5.14.8–§5.14.9).

### 9.15 Delve screens *(v0.7, D264)*

- **Rift card** (Hold screen, under the hold header, from the first Keep): *"Riftglass: 40 waiting, banks up to 140"* (long-press: the allowance's breakdown), and **Delve** or **Continue (floor 3)**. The Hold tab shows a badge when a run is paused or the allowance is full. No new tab.
- **Entry sheet:** three slots with a suggested three (Vanguard, Striker, Mender if available, highest levels); unavailable hunters greyed with the reason ("on a contract", "recovering"); the depth ("Keep: floors tier 3–4, guardian tier 5"); the allowance; Chosen start, if bought; **Start**.
- **Floor:** the group and the party as battle sprites; the fight plays back in about 10–20 s; **Skip** and **Log** (the fight log of §9.6, with group targets named: "Zora hits the second Upyr"). Health bars carry over.
- **Doors:** two large cards, each with the patron's name and sigil and *"Ahead: Restless Dead"*.
- **Blessing:** three cards: rarity frame, name, one-line effect; the Unlit's red *"but…"* line; Re-roll, if bought. **Your blessings** (always available between floors): every blessing taken, with breakdowns.
- **Guardian:** one line, then the fight.
- **Result:** floors cleared; Riftglass earned and the allowance left (or *"The rift is quiet tonight"*); reagents; any Ember-echo (opens in the reader) or relic; a Pechko line. **Leave run** between floors, with a confirmation.
- **Away sheet:** *"A Delve is waiting on floor 3."* and *"Riftglass waiting: 40 of 140."*
- **Rank screen:** **The Riftglass shop** beside The Hearth (§5.10.8). **Hunter sheet:** the alternate trait switch, once bought.
- **The Last Stand's confirmation** adds, when a run is paused: *"Your Delve ends here; you keep what it earned."*

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

## 10. Out of Scope

**Out for this project (listed in the brief):**
- Multiplayer of any kind.
- Leaderboards.
- Monetization and its patterns: ads, shops, premium currency, energy systems.
- Gacha or randomized hunter pulls.
- Audio: music and sound effects. **[JC: revisit after v1.0. The asset manifest reserves an `audio` section so sound can be added without restructuring.]**

**Out because of the platform or audience (judgment calls):**

| Item | Why it's out | Instead |
|---|---|---|
| Push notifications ("contract finished") | Web push needs a server; the game has none | An app-icon badge where the browser supports it (set while the app is open), and the "Ready to collect" list on open |
| Cloud saves and sync | Needs a server | Save code and save file export/import (§9.10) |
| Accounts and login | No server, single player | — |
| Multiple save slots | Unneeded for one player | One save plus an automatic backup slot |
| Tutorial and onboarding | D12: audience is just the owner | Help text, inspectable formulas, unlock hints |
| Localization | English only | Text lives in content files, so translation stays possible later |
| Anti-cheat and save validation beyond schema checks | D21 | The debug panel is a feature, not a cheat |
| Mod support or a content editor | Content files are already plain TypeScript data | Edit content files directly |
| Achievements | Not in the brief | **[JC: candidate for v1.0 polish]** |
| Records screen; CSV/JSON export of history and logs | Declined in the GDD review (G9) | Reports keeps recent logs; the Roll of Wardens (v0.5) keeps per-cycle history in-world |
| The mystery's final act | Timing open (D24.10) | Decided when v0.10 starts |

**Deferred, not cut.** Anything listed at outline level in §5.8–5.13 is in scope for its milestone and gets full detail just before that milestone starts.

---

## Judgment calls in §9–10

1. **Tabs appear only when their system unlocks.** v0.1 shows just Hold and More.
2. **Dark candlelit theme by default,** with a light theme in Settings. The pixel font is used only for headings and resource-bar numbers.
3. **A ● best-payback hint on the Hold screen,** which can be turned off.
4. **The launch sheet always shows "unprepared would be X%"** next to the real odds.
5. **The fight log shows the seed and offers "replay fight"** to anyone, not just in debug.
6. **Locked hunters show as silhouettes with their unlock condition.**
7. **Two-column desktop layout at 900 px and wider,** three columns at 1300 px.
8. **A screenshot-based "looks wrong on my phone" pass** in every milestone's playtest checklist.
9. **No push notifications** (they need a server). An app-icon badge stands in where supported; support on iPhone home-screen apps is limited.
10. **Audio is revisited after v1.0,** with a slot reserved in the asset manifest.
11. **Achievements are a candidate for v1.0 polish.**

---

## Judgment calls added in the GDD review revision (D30–D31)

Each one is also marked **[JC]** where it appears.

1. **Start with 1 Farmer + 2 Woodcutters.** If the Mine misses 5 minutes, raise starting wood to 70 rather than moving the target. (§5.1.4)
2. **`advance()` is event-driven,** so offline chunk size never changes results. (§5.2)
3. **Best-payback weights:** food 1, wood 1.5, iron 3, silver 12. (§5.1.2)
4. **Bounty base 60, and the silver-share check is cumulative over the Keep phase.** (§5.4.1, §6.3)
5. **Combat bucket order;** taken% adds, is capped at 75%, and applies after Armor. (§5.0)
6. **Silver sub-hits ignore Armor;** Armor applies only to direct attacks; resistance 0 means 0 damage. (§5.3.6, §5.5)
7. **Turn-meter ties go to hunters before the monster** (no roll); the fight limit is 400 ticks. (§5.5)
8. **Armor and Speed don't scale with level.** (§5.3.2)
9. **A tier unlocks after 3 successes at the tier below;** the mix is 60% at the highest unlocked tier. (§5.4.1)
10. **Contract rewards apply at completion,** not at collection. (§5.4.3)
11. **Barrow contracts start at tier 2;** Huldra and Nix added to fill coverage gaps. (§8.3)
12. **Hamlet active roster cap of 3; Citadel and Bastion each add 2;** hunters are never deleted. (§5.3.1)
13. **Fixed recruitment prices per hunter.** (§5.3.1, §8.5)
14. **The board opens when the first Mine is built.** (§5.4.1)
15. **Before v0.4, dead hunters return after 3 days.** (§5.3.7)
16. **World-boss hunters rest for 24 h after an attempt.** (§5.12)
17. **The v0.4 Embers cap is 120% of the simulated cycle-1 median;** the Trophy Hall is uncapped before v0.4. (§5.9)
18. **Two patron doors per floor.** (§5.10)
19. **Performance budgets and the two-stage Suggest search.** (§6.5)
20. **Art direction:** one 32-color palette, 16/32/64 px sizes, generated portraits. (§9.12)

## Judgment calls added from the lore revision (D32)

1. **"Keeper" replaces Forge-Mother,** and **Gloam Wolf** replaces Hollow Wolf. (§2.5, §8.3)
2. **Story hunters never die;** Arvid joins in v0.5. (§5.3.7, §8.5)
3. **Four Orders, including the Quenchers;** the remnant Wrights join your order. (§5.13)
4. **Six patrons;** the Unlit appears only after Act V. (§8.8)
5. **Each Rank-up restores part of old Stanholm.** (§5.1.3)
6. **Ostap's bio changes in cycle 3.** (§8.5)

## Judgment calls added in the v0.5 flesh-out (D144–D166)

1. **The stand stays a "reach Bastion, go" moment in v0.5;** the timing is looked at again in the v1.0 balance pass. (§5.9.3, D144)
2. **Bands from fixed wave thresholds:** Broken ≤ 8, Held 9–11, Triumphant ≥ 12. (§5.14.8)
3. **Trust rises from contracts and Triumphant stands, never drops, and changes no numbers in v0.5.** (§5.14.6)
4. **Documents arrive on fixed conditions, never by chance,** spread across the Ranks. (§5.14.2)
5. **Old saves start Act I at once;** Ilse brings what's already behind them. (§5.14.1)
6. **The Bestiary tab becomes the Archive** when Ilse arrives with the first document. (§5.14.3)
7. **Wardens are named, with Suggest;** the Roll starts with a worn line, legible in Act IV. (§5.14.5)
8. **Letters at levels 5 and 8 (was 10), from the highest level ever reached;** every hunter has two. (§5.14.7)
9. **Ruins from the Keep at tier 2+,** from Kozly Hollow, Velkvik and Ravenfell; four Cursed creatures. (§5.4.1, §8.3)
10. **The Wright's Blade** is the fourth weapon tier and keeps the Silver sub-hit. (§5.3.6)
11. **Arvid Netmender** (was Stonebrow): a Rune Vanguard, free, from Act III. (§8.5)
12. **The Deep family waits** for the acts that explain it. (§5.6.1)

## Judgment calls added in the v0.6 flesh-out (D193–D220)

1. **Bands 12 / 15, and a Triumphant stand is worth 10 contracts of trust** for every village; stands keep the band they earned. (§5.14.6, §5.14.8)
2. **Three properties per ingredient, fixed in content, pairs only;** experiments teach and never brew. (§5.8.1–5.8.3)
3. **The nine v0.3 recipes stay known;** the book opens with 15 of 36 properties. (§5.8.1)
4. **Six new brews,** each answering a named gap; two are new fight rules (Steadfast, Poppy Smoke). (§5.8.5)
5. **Four warden skills, 0–10, kept forever; only Alchemy touches fights** and is frozen at launch. (§5.8.6)
6. **No hunter use-skills** before v0.8. (§5.8.7)
7. **Arvid arrives with Ilse when Act III begins,** at your highest hunter's level. (§8.5)
8. **Act III reveals the vow's second half** in Arvid's testament. (`lore-secrets.md` §26)

## Judgment calls added in the v0.7 flesh-out (D244–D279)

1. **The existing checks judge the player who never Delves;** the Delver is judged only on the new rows (D269).
2. **No relic slots;** the Delve relics work only in Delves (D261).
3. **No trophies, bestiary kills or XP from Delves in v0.7;** v0.8 decides (D262, D278, Q21).
4. **Group targeting by role, no new dice** (D251).
5. **The Deep family debuts as Delve guardians** (D252).
6. **The Rift lives on the Hold screen, not a sixth tab** (D264).
7. **Rarities are Faint, Warm and Bright,** to stay clear of v0.8's loot rarities.
8. **Acts from Act IV on start on load with fresh counters** (D246).

## Judgment calls added in the v0.8 flesh-out (D300–D328)

1. **Gear climbs by rework,** keeping bonus lines and today's costs (D304).
2. **Legendaries are milestone rewards, kept forever, in a keepsake slot;** never random, never from Delves (D306).
3. **Stars cost Embers and trophies,** which gives Embers a use again (D310).
4. **Ranks read the highest level ever,** so a Long Night never takes one away (D309).
5. **Yard XP goes to every hunter not on the contract,** capped at the third-highest level (D315).
6. **Delve XP and loot only while a run pays Riftglass,** so nothing can be farmed (D316).
7. **Act V's letters come up through the crack,** on ordinary conditions; Delves still carry no plot (D302).
8. **The simulator splits into parallel CI jobs,** each under 5 minutes (D320).
