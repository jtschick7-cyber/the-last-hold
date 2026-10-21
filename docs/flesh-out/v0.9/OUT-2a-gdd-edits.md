# OUT-2a — `gdd.md` edits for v0.9 Events (flesh-out, 2026-10-20)

Delta-only. Section edits are marked `REPLACE`, `ADD after` or `NEW`. The constants (new §7.11 and the §7.4 pointer) are in **OUT-2b** and go in with the code that reads them (task T9.2), as v0.8 did with §7.10.

Order to apply: A (small replacements), B (§5.12), C (stand and story), D (simulator), E (content), F (screens), G (the §9.11 table row). *(Revised after the review, D386, D387: the old Part G, which edited a GDD "Appendix 1" that gdd.md does not have, is dropped.)*

---

# A. Small replacements

## REPLACE the Events row of the table in §3.1:

| **Events** | Whenever tokens are banked *(⚑ revision G7: was daily)* | A world-boss attempt or a Legendary Hunt attempt, each with a party of up to four, with different hunters each time | Who to spend on which attempt | Hunter XP, boss rewards, hunt points and, in the end, the three legendary hunters | v0.9 |

## REPLACE the "Boss marks / Hunt points" row of the table in §4.1:

| **Hunt points** | Event progress | Legendary Hunts | Unlocking a legendary hunter (counts per hunt, kept through the Long Night) | **Yes** | v0.9 |

*(There is no "Boss marks" currency: boss rewards are silver, reagents, hunter XP and an item (D361).)*

## ADD after the §5.9.3 bullet "Each wave's species is picked from those whose tier range includes the wave's tier (above tier 5: those that reach tier 5)." (inside "The waves are monsters you know."):

  - **From Act VI (D363),** a stand's species pool also includes **the Dross-Tide**, at any tier. Which pool a stand uses is fixed when its wave list is first fixed, at the moment Bastion is reached: `standPool` is `dross` if **Act VI has begun in the save at that moment** (Act VI's own cycle and every cycle after it, including the story-less ones; owner, D386), otherwise `base` (the species of §8.3.1 only). **No wave of the Dross-Tide is guaranteed:** a `dross` stand may roll none. It is saved on the cycle record, so **a stand made earlier, and every golden or recorded stand, keeps its old pool and replays line for line** (`rulesVersion` stays 5). A `dross` stand's wave list **shows the Dross-Tide by name** (it can never be investigated), and its stand kills **count nowhere**: no bestiary entry, no knowledge level, no drop (§5.10.7). Its Health in a stand is the ordinary tier-scaled Health, without the Delve guardian multiplier (D363, D369).

## REPLACE the "Deep bestiary" row of the table in §5.10.7:

| Deep bestiary | Each Delve guardian defeated counts as a kill of that Deep species. **The Dross-Tide in a Last Stand (Act VI or later) counts as nothing** (D363). | Knowledge levels as §5.6.2; Delve-only, so excluded from the true-ending count |

---

# B. REPLACE §5.12 (the whole section, heading to the next `###`)

### 5.12 Events *(v0.9; ⚑ v0.9 flesh-out, D357–D387)*

*⚑ Revised (G7): events wait for you.*

Two kinds of event, both spent from **one bank of attempt tokens**: a **world boss**, a Great Beast with one Health pool that every attempt chips away at, and three **Legendary Hunts**, each a set of three fights that unlock a legendary hunter. Both use the shipped systems (ranks, stars, talents, use-skills, items, Legendaries, preparation) and **no parallel reward pipeline** (D361). Events never punish absence: nothing runs while you are away, tokens bank by real time, and a reward can be delayed but never forfeited. Event numbers are named constants in §7.11; the `boss.*` ones are **locked** (plan §0.6).

#### 5.12.1 Opening events *(D366)*
- **Events open for good the first time the Citadel is reached.** A short scene plays once:
  - *Brana comes up from the gate with three notes folded in her fist. "Velkvik, Ravenfell and Mirograd, all in the one week," she says. "A thing in the fjord, a thing under the barrows, a thing in the river. They aren't asking for contracts. They're asking for you."*
  - *She sets a fourth note on the table, the paper gone soft as cloth. "And this is the Ford's grandmothers, asking for the old hunters. They say the stories are true if you tell them in the right order."*
  - *Pechko, from behind the stove, without turning: "Take four. Rest them a day. Big things don't hurry."*
- **Where:** an **Events card on the Hold screen**, under the Rift card (§9.17). There is no new tab.
- **After a Long Night** the Hamlet returns, and events are locked until the Citadel is reached again in the new cycle. Tokens keep banking while locked (a full bank still stops at 6), rests keep running, and boss progress and hunt points wait (§5.12.10). The scene is not shown again.
- **A save from before v0.9** that has already reached the Citadel this cycle gets events on load, with the scene, and an **empty bank** (D369).

#### 5.12.2 Tokens and rest *(D359)*
- **Tokens:** 1 every `boss.tokenInterval` 8 h, banking up to `boss.tokenMax` 6. A boss attempt costs 1 token; a hunt attempt costs 1 token.
  - **The bank starts empty** at the moment events first open, then banks by **real time**, locked or not.
  - It is a **hard cap**: at 6 the bank is full and extra time is lost. The Events card says *"Tokens: 6 of 6, full"*, and **while events are open** a **badge on the Hold tab** shows until a token is spent. **While events are locked there is no badge** (there is nothing to act on).
  - Spending from a full bank restarts the clock from that moment; spending from a part-full bank keeps the progress toward the next token.
- **Rest:** every hunter who takes part in a boss or hunt attempt **rests `boss.hunterRest` 24 h** before taking part in another. Rest is per hunter, not per player.
  - It blocks **only other event attempts.** A resting hunter can still take contracts and Delves, and a hunter on a contract does not rest from it.
  - The hunter sheet and the party picker show *"Rests for 9 h 20 m"*.
- **Time away.** Both clocks are worked out from stored timestamps against the current time, not from `advance` events, so the offline cap (§5.2) does not apply to them: the bank and every rest are right the moment the game opens, however long you were away.
  - *Example:* back after 30 h away, the bank has gained 3 tokens plus 6 h toward the next, and every rest that began before you left is over.
  - If events are open and the bank filled while you were away, the away sheet says so (*"The attempt bank filled while you were away. Time past a full bank is lost."*). Nothing else about events appears on the away sheet, because nothing happens while away. Riftglass differs on purpose: its allowance grows inside `advance` and respects the offline cap; tokens and rests do not.
- **Clock (D21, D49):** event timers run on a **monotone event clock** that advances only by elapsed time beyond the game's high-water mark. A clock set back changes no remaining time; a clock set back and then forward again gives **no free time** (the forward jump only recovers what the rewind took).
- **Breakdowns:** the token count (interval, time since the last token, next in), the rest remaining.

#### 5.12.3 Who can attend *(D279, D369)*
- **Any owned hunter, active or in the reserve,** can take part.
- A hunter **cannot** if they are on a contract or in a Delve, recovering from an injury, or resting from an earlier event attempt. The picker shows the reason beside the name. **Injured hunters stay out of events** (as Contracts and Delves bar them); the **Last Stand is the exception**, as the all-hands end of a cycle (D110, D386).
- Events cause **no injuries and no deaths and no recovery timers** (D358). The 24 h rest is the whole cost.
- A party is **up to `boss.partySize` 4**; it may be smaller. A hunt track may allow fewer hunters still (§8.14).

#### 5.12.4 World bosses *(D358, D360)*
- **One boss at a time, in a fixed order:** the Lindworm of Velk Fjord, the Barrow-King, the Mother of the River (`boss.order`, §8.13). When a boss falls, the next arrives. After the third, the order begins again **one tier higher** (`boss.passTierStep`), so there is always a boss.
- **A visit** is one boss from first arrival to its fall. Its **tier is fixed by the hold's Rank when the visit's first attempt is made** (`boss.baseTier`: Citadel 4, Bastion 5), plus one for each completed pass through the three. A Rank-up in the middle of a visit changes nothing. Past tier 5 the usual scaling goes on (Health and Might ×1.35, Armor ×1.15 per tier above the base tier, §7.4). The boss sheet shows the tier before the first attempt, and the preview says what the tier would be.
- **The pool** is the boss's Health, shared by every attempt in the visit: `boss.poolBase` at base tier 3, scaled by tier (§7.11). It is sized so that a good party takes about 12 attempts to empty it.
- **An attempt** is worked out at once from its seed and **played back** with Skip and Log, like a Delve floor:
  1. Pick up to 4 eligible hunters (**Suggest** fills four, with the highest expected damage, using the same stage-1 method and the same dice for every party as Suggest on a contract, §6.5) and the preparation: one oil and one potion per hunter, up to 2 bombs (`prep.bombSlots`). Oils, traits and bane lines follow the boss's named family (§8.13); location traits (Fen-born and so on) do not apply, as in the Last Stand. **Suggest** has a budget: it tries parties in a fixed order and stops at the first that clears a damage floor (a boss cannot be "won", so the contract shortcut of D74 does not apply), and the preview runs in the odds worker (budgets in plan T9.7).
  2. Pay 1 token. The attendees rest 24 h from that moment.
  3. The fight is an ordinary fight (§5.0, §5.5): the boss enters with **Health equal to the pool still standing.** It ends when the party is down or at tick 400. **The pool afterwards is the boss's Health at the end,** so everything the party dealt counts, a hunter who went down early still counts what they dealt, and the boss can never end above the pool it started with.
  4. Potions and bombs are spent whether or not the attempt goes well.
- **The preview** (in the odds worker, `boss.previewSamples` 100): 100 practice fights with their own seeds give the **median damage** as a share of the pool still standing, a 10th–90th percentile range, and a **Why?** breakdown. A boss has no win chance, so none is shown, and "Reckless" never appears (nobody is hurt). The preview also shows *"Would bring the next milestone: 50%"* when it would.
- **The kill:** the attempt that takes the pool to 0 kills the boss. The next boss arrives at once. A kill is logged in the Archive (§5.12.8).
- **The fight log** is regenerated on demand from the seed and the inputs (technical design §5.3); a fight whose replay differs from its record shows *"recorded with an older rules version"*.

#### 5.12.5 Boss rewards *(D361)*
- **Milestones** fall at 25%, 50% and 75% of the pool and at the kill (`boss.milestones`). **Each is paid once per visit,** by the attempt that crosses it; an attempt that crosses two pays both.
  - **Silver:** `boss.silverBounties` multiples of one bounty at the visit's tier and the hold's current age (§7.4). Small on purpose, so the silver check (§6.3 #6) still holds. **Boss silver is not bounty silver:** it counts in the total only, so the check's 70%-from-bounties share is measured against a total that includes it.
  - **Reagents** of the boss's one kind (`boss.reagents`; the Barrow-King pays grave dust only).
  - **At the kill, one item,** always (`boss.itemChance` 1), rolled by the loot rules (§5.11.2) with the boss's rarity weights (`boss.itemRarityWeights`). A Silvered Blade or an Emberwright Plate, half each. If Stores is full it is salvaged and the result says so.
  - **No Embers and no trophies** from bosses (they feed prestige and ranks).
- **Hunter XP (D315 answered):** each attendee earns `boss.xpPerTier` × the visit tier in XP for every attempt, win or lose, inside the hold's level cap (`gainXp`). Reserve hunters included, so a late recruit catches up by attending. **Yard XP (§5.11.5) stays contracts-only.**
- **The result sheet** shows damage dealt, the pool left, each milestone with what it paid, XP per hunter, the rest times, and any item, with a breakdown for each number.

#### 5.12.6 Legendary Hunts *(D362)*
- **Three hunts,** each with a **quarry** (§8.14), a **legendary hunter** it unlocks, and **three tracks.** All three are open from the start. You start each attempt yourself from the Events card: there is no board, no timer and nothing running between attempts.
- **A track** restricts who can come, by role, trait or damage type (§8.14), and has a fixed tier (`hunt.trackTiers` 3, 4, 5). The picker lists only legal hunters and gives the reason for the rest.
- **An attempt** is one fight against the quarry at the track's tier: up to 4 legal hunters, preparation as for a contract, **one token**, and the 24 h rest for every attendee.
  - It uses the contract fight rules (§5.5) and is shown with **ordinary win odds** and *"unprepared would be X%"* (§9.5); there is no Reckless line, because nobody is hurt.
  - It is a win if the quarry is down within 400 ticks with a hunter standing; otherwise a loss. **Location traits do not apply** in hunts, as in bosses and the Last Stand.
- **Points (`hunt.trackPoints`):** a win pays the track's win points, a loss pays fewer, so **no attempt is wasted.** Harder tracks pay more. Points add up per hunt. **Points carry over** across attempts, closing the app and the **Long Night.**
- **Unlock:** when a hunt's points reach `hunt.unlockPoints`, its legendary hunter arrives (§5.12.7) and the hunt is unlocked for good. The counter stops at its total.
- **XP:** each attendee earns `hunt.xpPerTier` × the track's tier for a win and `hunt.lossXpShare` of that for a loss, inside the level cap. Yard XP is not paid.
- **Replays (D362):** an unlocked hunt stays open. A replay still costs a token and the rest, and pays hunter XP and, on a win, `hunt.replayReagents` reagent of the quarry's kind. No points, no item.

#### 5.12.7 The legendary hunters *(D362, D368, D369)*
- **They join free.** Active if there is room (the Barracks cap, §5.3), otherwise the reserve. They arrive at the **level of your highest-level hunter at that moment**, within the Rank's level cap (the Arvid rule, §8.5), with no stars and no talents picked. **Rank on arrival (owner, D386):** a **Wright** (use-skill ready, §8.5b) only if that arrival level is **5 or more** (`rank.wrightLevel`); below 5 they arrive as **Apprentices** and follow the normal rank rule. They arrive wearing the first-tier Common pieces for their role, made for them (not taken from Stores).
- They are **new hunters** with a role, two traits, a damage type, a use-skill and a sketch (§8.5). **They have no letters** (§5.14.7), are not on the 40-name roll, and none is Yrsa (lore §14). They cannot buy alternate traits (§8.5a).
- They level, halve at the Long Night and are kept like any hunter. Because each arrives at your highest level, the yard's cap (`yard.capRank`, the third-highest level) can jump when one joins; **that jump is accepted** (D386). They are **excluded from the idle-only "every hunter at Wright" check** (D353): that means the eleven recruitable hunters. **Until unlocked a legendary hunter does not appear in the Hunters tab** (no locked silhouette); the hunt list shows their portrait greyed (§9.17).
- Their arrival is one line on the unlock sheet (§8.14).

#### 5.12.8 The Great Beasts shelf *(D365)*
- The Archive's Bestiary gets an **optional "Great Beasts" shelf.** A boss or quarry is **Identified** the first time it is fought (its stats, resistances and abilities are shown and preparation can target it) and shows its "What it was" line (lore §8) from then on. It has **no Studied or Mastered levels** and no kill count that matters.
- It is **optional:** excluded from the true-ending count, never needed for any required set, and it carries no name on the 40-name roll (lore §8, §14).
- **Families (D369):** a Great Beast counts as a named family for **oils, traits and bane lines** only (§8.13, §8.14). It does not count for knowledge, the bestiary count, any Legendary's milestone, the six Delve relics' idle sources or the Forgotten's Nameless count.
- **Empty state:** with nothing fought yet the shelf reads *"Nothing met yet. The Great Beasts are on the Events card."*

#### 5.12.9 The Dross-Tide in the Last Stand *(D363)*
See §5.9.3. In short: in every stand whose wave list is fixed once Act VI has begun, the species pool includes the Dross-Tide (no wave guaranteed); the pool is fixed on the cycle record, so no earlier stand changes; it is shown by name; its stand kills count nowhere. The stand preview is the same code with other seeds, so it uses the same pool.

#### 5.12.10 What the Long Night keeps *(D359, D360, D362)*
- **Kept:** tokens (and their clock), every rest, the boss visit (which boss, its fixed tier, the pool, the milestones already paid), hunt points, unlocked hunts and the legendary hunters themselves.
- **Not kept:** nothing about events is reset. Events are **locked** until the Citadel is reached in the new cycle (§5.12.1); a hunter's level is halved like any hunter's (§5.9.7).
- **No attempt is ever in progress** between actions (each is worked out at once), so there is nothing to abort or bank.

#### 5.12.11 What events do not touch *(D387)*
Boss and hunt wins are **not contract wins.** They do not change threat, act counters ("the nth contract won in Act VI"), contracts-won statistics, tier or hunter unlock conditions, Command XP or Lore XP. A Great Beast is Identified on its first attempt and grants no Lore XP. Event fights appear in the "recent" list (the last `events.recentKeep` 10).

#### 5.12.12 What's still for later
- Orders (v0.10) may reward event standing; v0.9 pays nothing from events to Orders.
- No Delve trophies, bestiary kills or Legendaries come from events; no event is the only source of anything required (lore §8).
- More hunts, more bosses, a boss shop and Boss marks are not planned.
- Event-only cosmetics, art for the Great Beasts' full portraits and the legendary hunters' animation are polish (v1.0).

---

# C. Story

## ADD after the "Act V (v0.8, D301)" bullet in §5.14.1:

- **Act VI (v0.9, D364):** the cycle after Act V's stand. A save in a story-less cycle starts Act VI **on load** with fresh counters (D246); the on-load line is *"Pechko is sitting by the crack when you come in. The frost on the floor has shapes in it."* and D6-01 plays. A save in Act V's cycle reaches it with the next warden. **After Act VI's Last Stand, the cycles that follow carry no act**, and their Long Night shows *"The story continues in a later version."* until The Remembering ships (D24.10). Act VI carries exactly the three names #1–3, on the Keep, the Citadel and Bastion (`lore-secrets.md` §31).

## REPLACE the "Types" bullet of §5.14.2:

- **Types** (`lore-secrets.md` §15.1): letter, journal page, ledger page, testament, field note, resident scene, **Ember-echo** (v0.7, belongs to no act, §5.10.7) and **Rime** (v0.9, D364): the Unlit's writing in frost, on its own Library shelf, in a reader of pale text on a dark card. Act VI's testament is a Rime.

## ADD after the "Act V's letters come up through the crack..." bullet in §5.14.2 "Delivery":

  - Act VI's Rime documents are the cold writing for itself: the away sheet and results say *"There is new writing in the rime by the crack: 'You came back warm'."* A Rime on a Rank-up arrives on the Rank-up sheet with the same words, and Act VI's testament arrives on the stand's result sheet like the others (D364).

## ADD after the sentence "When Act V begins, the line reads ..." in the first bullet of §5.14.3:

 When Act VI begins, the line reads *"Ilse is back from Velkvik with the archive. Pechko is sitting by the crack behind the stove, and the frost on the floor has shapes in it."*

## REPLACE the "Library" and "Accounts" bullets of §5.14.3:

  - **Library:** every document found, grouped by act, then by type, newest first. Each opens in a reader, with any note of Ilse's under it. Letters from hunters (§5.14.7) have their own shelf. From v0.7 the Library has an **Echoes** shelf (Ember-echoes from Delves). From v0.9 it has a **Rime** shelf (the Unlit's writing, D364).
  - **Accounts:** for each key event (Act I: the Night of the Fall, the apprentices; Act II adds the bell; Act III adds **Yrsa's choice**; Act IV adds **The light in the window**; Act V adds **What the hearth leaves**; Act VI adds **What the cold wants**), every account found, side by side, each labeled with its witness. Nothing is marked true.

## REPLACE the first bullet of §5.14.7:

- **Every hunter has two letters** (D156), except the three legendary hunters (D368), at **levels 5 and 8** (D155; `letters.levels`), counting the **highest level the hunter has ever reached**, so the Long Night's halving never takes one away.

## REPLACE item 2 of §5.14.9:

2. The act's testament (Act I: D1-06; Act II: D2-09; Act III: D3-06; Act IV: D4-06; Act V: D5-06, followed by Yrsa's Thole's line; **Act VI: D6-06, a Rime**), or *"The story continues in a later version."* if the act isn't written.

---

# D. Simulator

## ADD a row after "Delver" in the table of §6.1:

| **Eventer** (`eventer`, *from v0.9*, D367) | Same as Standard | None. At each check-in, it spends banked tokens (below) | The v0.9 event rows only. **Monday seeds only.** |

## ADD at the end of the "What the policy does at each check-in" bullets of §6.1:

- **Events** *(Eventer only, v0.9, D367)*: at each check-in, while a token is banked and **four eligible hunters are free** (not on a contract, not resting, not injured), it makes one attempt.
  - **Boss or hunt:** the boss, unless a legendary hunter is within reach (a win on that hunt's best legal track would take its points to `hunt.unlockPoints` or beyond), in which case that hunt.
  - **Locked check-ins** (events not open) do not count toward any Eventer row; the Eventer **runs until all content**, like the Monday Standard runs (owner, D386).
  - **Party:** the four fresh hunters with the highest levels, with at least one Vanguard and one Mender (a hunt track's restriction applies; if fewer than four legal hunters are free, it waits). **Preparation:** the usual kit, as for a contract against the same family.
  - **Track:** the highest-paying track it has a legal full party for.
  - It never replays an unlocked hunt, never spends a token it cannot use, and never leaves an attempt half made.
  - **Standard, Light, Heavy, Opening and the Delver never touch events.** The Eventer's contract decisions are Standard's, so it leaves hunters on contracts when Standard would.

## ADD to the end of the table in §6.2 (before the "Reported only" paragraph):

| First boss attempt *(D367)* | ≤ 24 h after the Citadel opens events (Eventer, **median of the Monday seeds**) | v0.9 |
| First boss defeated *(D367)* | By the end of the second cycle after events open (Eventer, median of the Monday seeds; the cycle in which events open is cycle 1) | v0.9 |
| First legendary hunter unlocked *(D367)* | By the end of the third cycle after events open (Eventer, median of the Monday seeds; the opening cycle is cycle 1) | v0.9 |
| Tokens not wasted *(D367)* | A full bank at no more than 15% of the Eventer's **unlocked** check-ins (median of the Monday seeds). If it still fails, Q28's path applies | v0.9 |
| Act VI lands in its cycle *(D383, proposed)* | D6-01 to D6-06 found by the end of cycle 6; D6-07 with the next warden (Standard); D6-08 to D6-10 reported only | v0.9 |
| Dross-Tide stand probe *(D383, proposed)* | In Act VI-era cycles, Standard's stand reaches the Held band (12 or more waves) at the median of the Monday seeds, and the preview's range still agrees with the real result | v0.9 |

## ADD after "Reported only: ..." in §6.2:

*Judging (v0.9):* every v0.9 row is judged on the **median of the Monday seeds** (Saturday reported only). Standard, Light, Heavy, Opening and the Delver issue no event commands, so their reports before Act VI's content equal the v0.8 baseline; from cycle 6, Act VI's documents and the Dross-Tide stands change what they see, so their baselines are re-recorded once (T9.12).
*Reported only (v0.9):* boss attempts per cycle, damage per attempt, milestones paid, silver from bosses, hunt points per cycle, tokens spent and wasted, and rest-blocked check-ins (Eventer).
**Content test (v0.9, D367):** no required name, document or bestiary entry has an event as its only source (lore §8); the Great Beasts, the quarries and the Dross-Tide in a stand are optional and counted nowhere.

## ADD to check #6 in §6.3 (end of the sentence):

 *(v0.9: the Eventer's silver from bosses counts in the total, not as bounty silver; the check still has to pass.)*

---

# E. Content

## REPLACE the italic line after the table in §8.3 ("*Coverage (§8.3.1) is unchanged ...*"):

*Coverage (§8.3.1) is unchanged for contracts. The Deep family never appears on contracts. From Act VI on, the Dross-Tide can join the Last Stand's waves (§5.9.3, D363).*

## ADD after the §8.3.1 coverage table and its content-validation test:

**Stand pool (v0.9, D363).** A stand's wave list picks from the species whose tier range fits each wave. `standPool: base` is the contract species of the table above (exactly as before v0.9); `standPool: dross` (any stand whose wave list was fixed once Act VI had begun) adds the Dross-Tide (tier 2+, any); no wave of it is guaranteed. The content test also checks that **every `base` pool is unchanged**, that a `dross` pool differs only by the Dross-Tide, and that the pool of every recorded stand replays.

## ADD after the paragraph "**v0.5 adds Arvid Netmender** ..." table in §8.5 (before "**v0.3 adds 2 hunters**"):

**v0.9 adds three legendary hunters** *(D362, D368, D381)*, each from Gloamreach folk-history, none central to the mystery and none Yrsa. They **arrive free** when their hunt is unlocked (§5.12.7), at your highest level; a Wright if that level is 5 or more, else an Apprentice (D386). **They have no letters, no recruitment price and no alternate trait.**

| Hunter | Role | Damage | Origin | Traits | Unlock | Stats (H/M/A/S) | Sketch |
|---|---|---|---|---|---|---|---|
| **Gest Tall-Torch** | Vanguard | Fire | Highland | Fire-touched, Tall Torch | The Stoneback hunt: 100 points | 172/12/8/7 | Kept a pine torch burning at the head of the Stoneback pass, winter after winter, so no one would walk into the troll's hands in the dark. Never learned not to fear the dark; learned to be careful of it. |
| **Ragnhild the Eye-Taker** | Striker | Frost | Highland | Cold-blooded, Eye-Taker | The Likho hunt: 100 points | 98/21/3/12 | A fell-woman from the high pastures, said to have taken an eye from every bad thing that crossed her flock. She keeps the count on a knotted cord and won't say how many knots it has. Likho is one-eyed because of her; Likho remembers. |
| **Radmila of the Reeds** | Mender | Silver | Lowland | Bonesetter, Night-Sitter | The Mara hunt: 100 points | 112/10/4/10 | Marsh-wife who sat up at every sickbed below Dubno Ford, with a silver spoon under every pillow. Says the worst thing she ever cured was loneliness, and that it came back. |

Portraits (art task): Gest, a big man in a fur cap with a pine torch on his shoulder and singed knuckles; Ragnhild, a lean woman in a sheepskin with a bone needle through her cap and a cord at her belt; Radmila, a stout woman in marsh-green wool with a silver spoon in her apron pocket.

**Traits added** (to the table of §8.5):

| Trait | Exact effect | Active from |
|---|---|---|
| Eye-Taker | +10 points crit chance | v0.9 *(Ragnhild)* |
| Tall Torch | While this Vanguard is standing, party hit chance +3 points | v0.9 *(Gest)* |
| Night-Sitter | +20% Might vs Field & Forest Spirits | v0.9 *(Radmila)* |

**The roster** becomes at most 14 hunters (the eleven of §8.5 and the three). The Barracks cap still limits the active roster (§5.3).

## ADD after the last row of the table in §8.5b:

| Gest Tall-Torch | **Torch Held High** | Every 3rd action, instead of attacking | Until his next action, every hunter deals +15% damage (outgoing%) |
| Ragnhild the Eye-Taker | **Take the Eye** | Her first hit in a fight | If the hit lands, the target's Might is −15% for the rest of the fight (status%) |
| Radmila of the Reeds | **Sit the Vigil** | Once per fight, when another hunter would be downed while Radmila stands | That hit leaves the hunter at 1 Health instead of downing them (after Armor and taken%). *New in v0.9: it can appear only in fights that include her, so no existing fight, golden or recorded stand changes (D369). **Order:** if Hold the Stair and Sit the Vigil both trigger on one hit, Arvid's moved hit resolves first and Radmila's save applies to what is left.* |

## NEW: §8.13 Great Beasts *(v0.9, D358–D361, D365, D381)*

Optional entries on the Archive's **Great Beasts** shelf (§5.12.8). Each is a **world boss**: it has a **pool** (shared Health across attempts) in place of a Health figure. Stats are at **base tier 3**; each tier above multiplies the pool and Might by 1.35 and Armor by 1.15 (§7.4). Speed doesn't scale. All numbers are **tunable content** (§8 header) except `boss.poolBase` (**locked**, D372), and are first sketches for the simulator to calibrate (T9.13). "Family" is the family a Great Beast counts as for oils, traits and bane lines (D369).

| Great Beast | Family (for oils and traits) | Pool (base tier) | Might | Armor | Speed | Atk |
|---|---|---|---|---|---|---|
| **The Lindworm of Velk Fjord** | Beasts & Wilds | `boss.poolBase` | 38 | 10 | 9 | 2 |
| **The Barrow-King** | Restless Dead | `boss.poolBase` | 80 | 12 | 6 | 1 |
| **The Mother of the River** | Water Spirits | `boss.poolBase` | 25 | 8 | 11 | 2 |

**Resistances** (bold = weakness, ≥ 1.25):

| Great Beast | Steel | Silver | Fire | Frost | Rune | Venom |
|---|---|---|---|---|---|---|
| The Lindworm of Velk Fjord | 0.75 | 1.0 | **1.5** | 0.5 | 1.0 | **1.25** |
| The Barrow-King | 0.5 | **1.5** | **1.25** | 0.25 | **1.25** | 0 |
| The Mother of the River | 1.0 | **1.25** | 0.5 | **1.5** | 1.0 | 0.25 |

**Abilities, drops and what it was:**

| Great Beast | Ability (exact effect) | Reagent (milestones, kill) | What it was |
|---|---|---|---|
| The Lindworm of Velk Fjord | *Coil:* every 3rd action, its attack holds the target (they lose their next action). *Fjord Roar:* on its 1st action and every 5th after, instead of attacking, every hunter's meter is knocked back 20 | wolf fang | A long grey worm that lay in the fjord mouth until the herring ran thin. Velkvik says it was always there; Velkvik's grandmothers say it wasn't. |
| The Barrow-King | *Barrow-Grip:* every 3rd action, its attack holds the target (they lose their next action). *Grave Chill:* on each of its actions, every standing hunter loses 2% of max Health as Frost damage, ignoring Armor | grave dust | A chieftain buried with his hall around him. The barrow doors were sealed with iron, and the iron didn't hold. |
| The Mother of the River | *Drowning Song:* on its 1st, 5th, 9th… action, instead of attacking, it charms the lowest-Armor hunter, who loses their next action. *Weir-Pull:* every 4th action, instead of attacking, every hunter's meter is knocked back 25 | river pearl | The river's eldest drowned, who kept the others in order. The mills below her pools stopped grinding the year she woke. |

**Hunter's notebook** (the Great Beasts shelf, under "What it was"; the voice of the setting primer §6.4):
- **The Lindworm of Velk Fjord:** *"It holds you still, then roars, and everyone's footing goes. Bring fire, and someone who can cover the lost turns. Expect to be back tomorrow."*
- **The Barrow-King:** *"The cold gets in whether he hits you or not. Steel does little; silver and rune work do the damage. Rest your Mender, because she'll need it."*
- **The Mother of the River:** *"Sings the one with the thinnest armour to sleep, and shoves everyone's pace back. Frost and silver. She finds the weak one, so there's no point hiding them."*

- **Saltburst** cancels the first trigger of any ability above and blocks abilities for the boss's next 3 actions, as for any monster (§5.7).
- **No boss heals itself,** so the pool can only go down (the rule of §5.12.4 caps it anyway).
- Folklore bases: a fjord worm in the Norse-Germanic manner; a barrow-lord in the manner of the Nordic grave-mound dead; the drowned-queen of river folklore. **Original names and rows** (§2.3): no creature from any influence.

## NEW: §8.14 Legendary Hunts: quarries, tracks, points *(v0.9, D362, D380, D381)*

Each hunt has one **quarry**, three **tracks** and one **legendary hunter**. Quarry stats are at **base tier 3**; a track's tier is `hunt.trackTiers` (3, 4, 5), scaled as §7.4. Numbers are tunable content.

| Quarry | Family (oils, traits) | Hunt unlocks | Health | Might | Armor | Speed | Atk |
|---|---|---|---|---|---|---|---|
| **Stoneback the Fell Troll** | Beasts & Wilds | Gest Tall-Torch | 1,100 | 30 | 12 | 6 | 1 |
| **The Mara of Kettle Barrow** | Field & Forest Spirits | Radmila of the Reeds | 700 | 22 | 3 | 14 | 2 |
| **Likho the One-Eyed** | Cursed | Ragnhild the Eye-Taker | 900 | 26 | 6 | 12 | 1 |

| Quarry | Steel | Silver | Fire | Frost | Rune | Venom |
|---|---|---|---|---|---|---|
| Stoneback the Fell Troll | 0.75 | 1.0 | **1.5** | 0.75 | **1.25** | 0.5 |
| The Mara of Kettle Barrow | 1.0 | **1.5** | 1.0 | 1.0 | **1.25** | 0.5 |
| Likho the One-Eyed | 1.0 | **1.25** | 0.75 | **1.5** | 1.0 | 0.75 |

| Quarry | Ability (exact effect) | Reagent (on a replay win) | What it was |
|---|---|---|---|
| Stoneback the Fell Troll | *Boulder Toss:* every 4th action, instead of attacking, its throw hits every standing hunter (each hit rolled and resolved as a direct attack; Armor applies). *Moss-Mend:* regenerates 3% of max Health on each of its actions | wolf fang | A hill-troll half turned to rock by a dawn he took for a friend. He still guards the pass; he has forgotten what from. |
| The Mara of Kettle Barrow | *Night-Weight:* on its 1st action and every 4th after, the hunter with the highest Might loses their next action. *Quick Dark:* its first hit on each hunter ruins that hunter's unused potion | thornwood | The weight on a sleeper's chest, grown a body. She has sat on one sleeper a night, for more nights than the barrow has stones. |
| Likho the One-Eyed | *Ill Luck* (passive): every hunter's crit chance is 10 points lower while Likho stands. *Misfortune:* on each of its actions, 15% chance one random hunter loses their next action | rime salt | Misfortune given one eye and a long coat. It follows whoever laughs last, and it has not yet been out-waited. |

**Hunter's notebook** (the Great Beasts shelf, under "What it was"):
- **Stoneback the Fell Troll:** *"Throws boulders at all of you at once, and mends between throws. Fire and rune hurt him. Out-damage the mending or don't bother."*
- **The Mara of Kettle Barrow:** *"Sits on whoever hits hardest, and spoils the first potion she touches. Silver bites. Keep a second plan."*
- **Likho the One-Eyed:** *"Everything goes slightly wrong around him: a missed blow, a lost turn. Frost and silver. Take the steady ones and expect a few lost turns."*

**Tracks** (each restricts who can come; a hunter must meet it, and the party is up to 4, or fewer):

| Hunt | Track | Name | Who may come | Tier |
|---|---|---|---|---|
| Stoneback | I | The Toll Road | Vanguards and Strikers only | 3 |
| Stoneback | II | Cold Iron | Steel or Rune damage only | 4 |
| Stoneback | III | The Old Hands | Hunters with the Quick or Hard to kill trait | 5 |
| Mara of Kettle Barrow | I | The Waking | Strikers and Menders only | 3 |
| Mara of Kettle Barrow | II | Candle and Salt | Fire, Frost or Silver damage only | 4 |
| Mara of Kettle Barrow | III | Sitting Up | Hunters with the Hard to kill, Lantern-bearer, Tracker or Bonesetter trait | 5 |
| Likho | I | One Eye Open | Menders and Vanguards only | 3 |
| Likho | II | A Cold Reckoning | Venom, Frost or Silver damage only | 4 |
| Likho | III | The Counting | Hunters with the Grave-warden, Wolf-friend, Old Wright, Fen-born or Fell-born trait | 5 |

With the eleven starting hunters, each track has at least four legal hunters (counting the damage types and traits of §8.5); once the three legendary hunters arrive, more. The content test checks that **every track has at least four legal hunters among the starting eleven** and that no track needs a hunter that only an event gives.

**Points** (`hunt.trackPoints`, §7.11): track I pays 12 for a win and 4 for a loss; II pays 20 and 6; III pays 32 and 10. A hunt unlocks at `hunt.unlockPoints` 100 (about six to eight attempts).

**Unlock lines** (shown on the unlock sheet):
- Gest: *"Gest Tall-Torch has come down from the pass with a pine torch over his shoulder. 'The road's clear,' he says. 'I thought I'd see who cleared it.'"*
- Ragnhild: *"Ragnhild the Eye-Taker has come in from the fells with a cord at her belt. She doesn't say how many knots it has. 'Likho's the one-eyed one now,' she says. 'You're welcome.'"*
- Radmila: *"Radmila of the Reeds has put a silver spoon under every pillow in the barracks before anyone could ask. 'Sleep,' she says. 'I'll sit.'"*

---

# F. Screens

## ADD after the last bullet of §9.2 (the Hold screen) — one line:

- **Events card** (from the first Citadel, D366): sits under the Rift card; see §9.17.

## NEW: §9.17 Events screens *(v0.9, D366)*

- **Events card (Hold screen):** under the Rift card.
  - *"Events · Tokens 4 of 6 · next in 3 h 12 m"*, the boss line (*"The Lindworm of Velk Fjord · tier 4 · 71% left"*) and *"Legendary Hunts: 2 of 3 to unlock"*.
  - **A full bank** shows *"Tokens: 6 of 6, full"*, and **only while events are open** puts a **badge on the Hold tab** until a token is spent. If the Rift's badge and the events badge both apply, the tab shows one badge, and each card carries its own mark.
  - Before the Citadel is reached in a cycle the card reads *"Events wait for the Citadel."* with the tokens and rests still counting.
- **Boss sheet:** the Great Beast's portrait and name, the tier and its breakdown, the **pool bar** with the three milestone marks and what each pays, tokens, and **Send a party.** The last result is below it.
- **Party picker** (boss and hunt):
  - Up to 4 hunters, active and reserve, each row with its rank badge, level, role, damage and the **reason** if unavailable (*"On a contract"*, *"Rests for 9 h 20 m"*, *"Recovering"*, and for a hunt *"Track needs a Mender"*).
  - **Suggest** fills the best legal four.
  - Preparation pickers as the contract launch sheet (§9.5): oil, potion, bombs, with the Great Beast's resistances and weaknesses shown beside them.
- **Boss preview panel:** *"Expected damage: 4.8K, 15% of what is left. Likely 3.9K to 5.7K."*, with **Why?** and a *"Would bring the next milestone"* line. No win chance and no Reckless line.
- **Empty states:** with every hunter resting, the boss sheet reads *"Everyone is resting. The next is ready in 3 h 40 m."* and Send is disabled. The Great Beasts shelf and the Rime shelf (before Act VI) read *"Nothing here yet."* (§5.12.8).
- **The last result** stays at the top of the boss sheet and the hunt list until the next attempt, and survives closing the app (the newest of the `events.recentKeep` 10 recent fights).
- **Hunt list:** the three hunts, each with its quarry, its legendary hunter's portrait (greyed until unlocked), points *"46 of 100"* with a breakdown, and the three tracks with their restrictions and tiers. An unlocked hunt reads *"Unlocked. Replay for XP and a reagent."*
- **Hunt sheet (track):** the §9.5 odds panel (win odds, the 10th–90th range, *"unprepared would be X%"*, no Reckless line), the legal party picker and preparation.
- **Playback and results:** the attempt plays back like a Delve floor with **Skip** and **Log** (the log is regenerated from the seed). The result sheet shows, for a boss, damage dealt, the pool left, each milestone and its pay, XP per hunter, rest times and any item; for a hunt, the win or loss, points, XP and any unlock. Every number has a breakdown.
- **Unlock sheet:** the legendary hunter's portrait and line (§8.14), with *"Joins the active roster"* or *"Joins the reserve (the barracks are full)"*.
- **Hunter sheet:** one line, *"Rests for 9 h 20 m"* while resting, and the legendary hunters show *"No letters."* Legendary hunters not yet unlocked do not appear in the Hunters tab (§5.12.7). Nothing else changes.
- **The Archive:** a **Great Beasts** shelf in the Bestiary (an entry per boss and quarry, Identified on first fight, no levels) and a **Rime** shelf in the Library (pale text on a dark card, §5.14.3).
- **Away sheet:** only the full-bank line, while events are open (§5.12.2). Nothing about events happens while away.
- **Events scene:** the one-time scene of §5.12.1 as a scene sheet, like the Rank-up scenes.

---

# G. The "what exists when" table

## ADD a row to the §9.11 table (match its columns and order):

| v0.9 | Events: the Events card, world bosses (three Great Beasts), Legendary Hunts (three hunters, nine tracks), the Great Beasts shelf, the Rime shelf, Act VI and the Dross-Tide in the Last Stand | §5.12, §8.13, §8.14, §9.17, §7.11 |

*(There is no Appendix 1 edit: gdd.md has no such appendix. If the repo's technical design still carries the v0.9 design-constraints appendix, OUT-9 marks it answered.)*
