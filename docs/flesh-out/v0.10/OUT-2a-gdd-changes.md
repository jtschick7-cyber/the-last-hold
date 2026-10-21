# OUT-2a — GDD changes for v0.10 (Orders)

**Apply to `docs/gdd.md` in the docs commit, except §7.12 (OUT-2b), which waits for T10.2.** Where a change says "replace", replace the whole named section or line. Decision numbers are those in OUT-1. *(Revised after the independent review, 2026-10-21.)*

---

## 1. Replace §5.13 in full

### 5.13 Orders *(v0.10; ⚑ v0.10 flesh-out, D407–D425)*

**What Orders are.** Four groups who stand beside the hold, each with a short questline of four chapters and four levels of **standing** (D408). They are **story first, with a choice that costs something:** the player has a limited number of **seats**, and only seated Orders give their perks and advance their story. They give **no silver, no fight number and no gate** (D418). Your hunters are the refounded Emberwrights (lore L2); surviving Wrights join you rather than forming an Order.

| Order | Who | Opens when | Voice | Number perk (per level) |
|---|---|---|---|---|
| **Thanes' Moot** | The five village heads | The first Keep | Marta Dubska, usually | Contract provisions food −3% |
| **Grey Wives** | Herbwives and midwives | The first Alchemist's Hut | Vesna, Ostap, an unnamed eldest Grey Wife | Brew and experiment time −4% |
| **Bell-Watchers** | Families who ring bells for the ones gone onward | Ilse's arrival | Halina, Dana Lisová, Ilse | Clue time −4% |
| **The Quenchers** | Kozly Hollow's young; they want the stove put out | D5-08 is found | Bohdan Kozel (Věra sympathises, does not join) | The hourly Threat rate −3% |

#### 5.13.1 Opening *(D413, D421, D422)*
- Each Order **opens once, for good,** at its trigger, with a short **opening scene** (OUT-3 Part C). The scene ends with **"Seat it"** if a seat is free (otherwise **"Continue"**) and **"Not now."** No Order ever seats itself.
- **Order of a load:** migrate, catch up the time away, open any Order whose trigger has been passed (including D5-08 found during the catch-up), check the third seat, then show scenes. **Scene order:** act scenes, the events scene, the Orders opening scenes (Moot, Grey Wives, Bell-Watchers, Quenchers), the "Seat your Orders" sheet, then chapters.
- The Moot's opening uses no Sending, Deep or "onward" knowledge, so it is safe at the first Keep of a new game.

#### 5.13.2 Standing and levels *(D410)*
- **Standing** is one number per Order. It **only grows,** is **never lost,** and **is kept forever through the Long Night.** It grows whether or not the Order is seated, **and from the moment v10 exists, even before the Order has opened** (so nothing has to be reconstructed at an opening).
- Sources (counted by the command or event that does the thing, including events inside `advance`, never on a timer):

| Order | What adds standing | Weight (`orders.standing.*`) |
|---|---|---|
| Moot | Each contract won, any village | 1 |
| Grey Wives | Each brew finished · each experiment finished · each property revealed | 1 · 3 · 10 |
| Bell-Watchers | Each document found · each hunter letter found · each name found | 5 · 5 · 10 |
| Quenchers | Each Kozly Hollow contract won · each Delve floor **whose result paid at least 1 Riftglass** (window cap) | 2 · 1 (cap `orders.delveWeeklyCap` per window) |
| Every Order | Each **Triumphant** stand | `orders.triumphantChunk` each |

- **Events add nothing in v0.10.** A **window** starts at the first counted Delve floor and lasts `orders.delveWindow` (7 days) on the event clock; floors after the cap add nothing until a new window starts. A run with Cold Comfort pays no Riftglass and so adds nothing. Delve standing is a Delve reward with an idle source (Kozly Hollow contracts), so the Delve-optional rule (D20, D271) holds.
- **Four levels** per Order at the thresholds in §7.12 (sketches). Level is derived from standing and is never lower than the highest level reached. The level names are **Neighbour, Friend, Ally, Kin** for every Order (different from village trust's Cold, Wary, Hopeful, Trusting, Sworn).
- **A save migrated from v9** gets **one** backfill at the migration: the sources the save holds, capped at `orders.backfillCapLevel` (level 1), shown on the Order sheet as *"Brought from before the Orders: n"*. What the save cannot recover starts at 0 and the load names it. A new game has nothing to backfill.
- **Breakdown.** Every number has a breakdown (§5.0): the Order sheet lists each source with its count, weight and share, then the next threshold.

#### 5.13.3 Seats *(D412)*
- **Two seats at the start.** A **third opens once, for good,** when **two Orders are at level 4 and the Quenchers have opened.** It is checked after every level change, at the Quenchers' opening and on load, so it opens whichever of the two conditions comes last; it is kept forever through the Long Night.
- **The card's seat lines:** third seat closed: *"Seats: 2 of 3 (the third opens when two Orders reach their top level and the Quenchers have come)."* Third seat open: *"Seats: 3 of 3."* Then always a line *"In seats: Thanes' Moot, Grey Wives"* or *"In seats: none."*
- An Order takes **one seat**; there is no partial seating. An open Order that is not seated shows "Not seated" and a line about what seating it would give.
- **Only seated Orders** give perks (§5.13.5) and advance their questline (§5.13.6).

#### 5.13.4 Changing seats *(D412)*
- **At every new warden's arrival** the new-warden sheet has a skippable **"Seat your Orders"** step. The previous seats carry over by default; changes there are free and clear the cooldown. **On load,** the same step appears once as a sheet on the Hold screen, after any opening scenes, and stays reachable from the Orders card until it is used.
- **Mid-cycle**, from an Order sheet: **Seat** (into a free seat), **Unseat**, or **Swap** (one Order for another). Any change starts a **24 h cooldown on the monotone event clock** (`eventNow`, §5.12.2; `orders.swapCooldown`), shown as "Can change in 9 h 20 m". Seating an Order into a free seat when it first opens does not start the cooldown.
- Changing seats loses nothing. Perks apply to what starts afterwards: **a brew or experiment queued after the change** gets the new time (one already queued keeps the time it was queued with), a clue started after it, a contract launched after it, and the Threat factor from the change onward.

#### 5.13.5 Perks *(D411)*
Each level of a **seated** Order gives **one small number and one story or knowledge perk.** The level-4 totals are the ceilings in §7.12. There is **no new bonus bucket:** each number is its own factor, shown as its own line in the breakdown ("Thanes' Moot, Friend: −6%").

| Order | Number | Story or knowledge perk (texts: OUT-3 Part E) |
|---|---|---|
| Moot | Contract provisions food × (1 − 0.03 × level) (§5.4 step 4) | A head's line at the end of that village's notices; a "What the heads say about you" entry on the Villages panel |
| Grey Wives | Brew and experiment time × (1 − 0.04 × level) (§5.7, §5.8.3) | A hint toward a brew in the Book, from "the eldest Grey Wife"; **an elder's note instead once the Book holds that brew** |
| Bell-Watchers | Clue time × (1 − 0.04 × level) (§5.6.3) | A sharper where-to-look sentence for still-missing names in the Names view (a rule, OUT-3 E3), **a remark by Halina or Dana once the group is found;** no new name, source or document |
| Quenchers | The hourly Rank Threat rate × (1 − 0.03 × level) (§5.9.1; Threat from failed contracts is unchanged) | A Kozly Hollow voice (witness Bohdan Kozel) added to the Accounts event "What the hearth leaves" |

- No fight formula changes; `rulesVersion` stays 5. **The Quenchers' perk is a trade:** a lower Threat makes each wave weaker (§5.9.1: −0.61% Health and Might a point) **and lowers the Embers a stand pays** (+0.7% a point, §5.9.4). The Order sheet says so. The stand preview (§5.9.3) uses the seated factor and recomputes at a seat change, so its "tomorrow" estimate never goes stale.

#### 5.13.6 Questlines *(D414, D419)*
- **Four chapters per Order,** each a short scene sheet. A chapter is **playable** when its Order is open and seated, the Order's level is at least the chapter's number, the previous chapter is read, and its condition holds (OUT-3 Part B). Otherwise it **waits.** What is playable is worked out from the state; an unseated Order's waiting chapter never blocks another's. The card and the Order sheet show **"A chapter waits for a seat."**
- Scenes open **one at a time** on the Hold screen; closing a chapter counts as read. Each ends with Close and, if another waits, Next. Chapters are kept on the Library's **Orders** shelf and can be read again.
- **The opposed pair.** The Moot's and the Quenchers' **chapter 4 each have two endings** (OUT-3 D): variant A when the other Order is also seated when the chapter is read, otherwise variant B. **Each chapter 4 waits until the other Order has opened,** and the Order sheet says which way it will read.
- **The seated Orders at each reading are saved** (D419) for v0.11.
- **No chapter carries a required name, document, bestiary entry or Legendary** (lore §8), and **nobody says, asks for or begins the Sent's names** (D386). Chapter 4 of every Order ends on a threshold.
- The sixteen titles are in D414 and the full texts in OUT-3.

#### 5.13.7 How Orders touch other systems *(D418)*
- **Contracts:** each win adds standing (Moot, and Quenchers for Kozly Hollow). No contract changes.
- **Delves:** floors that paid Riftglass add Quenchers standing within the window cap. No Delve content changes.
- **Events:** nothing adds standing; the seat cooldown reuses the event clock.
- **The Hold:** the Orders card sits after the Events card, or after the last card shown if there is no Events card.
- **The Last Stand:** a Triumphant stand adds standing; the Quenchers' perk slows Threat.
- **The Long Night:** keeps standing, the opened flags, the third seat, the chapters read and the seats. A new warden may change seats freely.

#### 5.13.8 What's still for later
v0.11 "The Remembering" and the ending (D415); anything that gives Orders a silver or fight effect; more Orders; events adding standing.

---

## 2. Other changes

| Where | Change |
|---|---|
| **§4.1 resource table, the "Reputation" row (line 193)** | Replace with: `\| **Standing** \| Per Order \| Play already done: contracts won, brews, experiments, properties, documents, letters, names, Kozly Hollow contracts, Triumphant stands (no new chores) \| Never spent: levels unlock chapters and small perks while the Order is seated \| **Yes** \| v0.10 \|` |
| **§4.2 flow diagram** | Add a small group: *Orders: standing* fed by Contracts, Alchemy, the Archive and the Last Stand's Triumphant band, with a dotted "seated: small factors" arrow to Provisions, Brew and experiment time, Clue time and Threat (Claude Code uses the diagram's real node ids). |
| **§4, a new line under the tables** | *"Orders (v0.10) turn play already done into standing; they add no resource, income or bucket. Their perks are named factors on a time, a cost or Threat's hourly rate (§5.13.5)."* In the Threat row add: *"the hourly Rank rate × (1 − the Quenchers' step × level) while that Order is seated."* |
| **§5.0 (Breakdowns)** | Add: *"Order perks are not a bonus bucket: each is a separate named factor applied after the buckets and shown as its own line."* |
| **§5.4 (the Village row, line 590)** | Replace "ties into Reputation in v0.10" with *"the Thanes' Moot counts a contract won for any village toward its standing (v0.10)."* |
| **§5.6.3, §5.7, §5.8.3, §5.4 step 4, §5.9.1** | One sentence each: *"While the [Order] is seated, [time/cost/rate] is multiplied by (1 − step × level) (§5.13.5)."* |
| **§5.9.3 (the stand preview)** | Add: *"The preview uses the Threat factor of the Orders seated now and is worked out again when a seat changes (§5.13.5)."* |
| **§5.9.7 (Long Night), "Kept" column** | Add the row: *"Orders: standing, which Orders have opened, the third seat, chapters read and the seats they were read with (v0.10)."* In "What you see, in order", item 4: *"The new-warden sheet … You choose your 3 active hunters, **and, once an Order is open, whether to seat your Orders (§5.13.4)**."* |
| **§5.12.2 (Tokens and rest)** | Add: *"The event clock is also used for the Orders seat cooldown (§5.13.4)."* |
| **§5.12.12, first bullet** | Replace with: *"Events add nothing to Orders in v0.10 (§5.13.2); that may change later."* |
| **§5.14.1 (Acts)** | Replace the Act VI note: *"Act VI closes with 'The story continues in a later version.' That line stays through v0.10 and is removed when v0.11 ships (D415)."* |
| **§5.14.3 (the Archive's Library list)** | Add: *"From v0.10 it has an **Orders** shelf: one entry per chapter read, with a 'read with …' line (§5.13.6)."* |
| **§5.14.4 (Names)** | Add: *"While the Bell-Watchers are seated, a still-missing name's hint gets one more sentence from the rule in §5.13.5. It adds no name and no source."* |
| **§5.14.6 (Village trust), the "What it does" bullet (line 1316)** | Replace "Trust changes no number in v0.5; rewards wait for the Thanes' Moot (v0.10)." with *"Trust changes no number; the Thanes' Moot (v0.10) adds the heads' lines, not rewards (§5.13.5)."* |
| **§5.14.9 (What the Long Night shows)** | Add a line: *"The new-warden sheet's 'Seat your Orders' step appears once an Order is open (§5.13.4)."* |
| **§6.1 (Player model)** | Add the **Orderer**: *"Plays like Standard on the Monday seeds only, **and runs Delves as the Delver does once they are open,** and is the only player that seats an Order. It taps 'Seat it' at an opening when a seat is free. At each new warden it seats the Orders ranked by chapters playable now, then chapters unread, then list order (Moot, Grey Wives, Bell-Watchers, Quenchers). It takes the third seat the moment it opens, never uses the mid-cycle swap, reads every chapter when it is playable, and plays until every chapter has played, up to the 42-day cap. Every other player never seats an Order, so their baselines do not change (D417)."* |
| **§6.2 (Targets)** | Add the six **Proposed** rows (table below), held for the owner's approval in their own commit. |
| **§6.3 (Engagement checks)** | Add: *"#6 (silver share ≥ 70%) and #8 (provisions share 20–40%) are also run on the Orderer's report, with the Moot perk counted."* |
| **§6.5 (Budgets)** | Add *proposed, measure first* rows: Orders card render, Order sheet open, standing recompute after a command, the v9 → v10 migration of the fixture, the Orderer shard (≤ 5 min), save size growth. The owner sets the real numbers after T10.19 measures them. |
| **§7.4 (pointer)** | Add one line: *"Order perks and standing: §7.12."* |
| **§7.12** | New; OUT-2b, added at T10.2. |
| **§9.3 (the away sheet)** | Add Orders lines (once an Order is open): *"The Thanes' Moot: Friend."* (a level up), *"A chapter waits for a seat."*, *"A third seat has opened."* |
| **§9.11** | Add the row (two columns, like the table): `\| v0.10 \| Orders: the Orders card, the Order sheets, the "Seat your Orders" step, chapter and opening scenes, the Library's Orders shelf, the Villages panel's "What the heads say" entry (§5.13, §7.12, §9.18) \|`. *(The existing v0.9 row has an extra column; fix it to two columns while you are there.)* |
| **§9.18** | New; below. |
| **§10 (Out of scope), the line "The mystery's final act … Decided when v0.10 starts"** | Replace with: `\| The mystery's final act \| v0.11 "The Remembering" (D415) \| Its own flesh-out before v0.11 \|`. Add: *"Orders giving silver or fight bonuses; events adding standing; a seat cost; a fifth Order."* |
| **Judgment calls list** | Add: the readings in D420 and the sketches (weights, thresholds, Triumphant chunk, Delve cap and window, perk steps, backfill cap), each marked **[JC]**. |

### §6.2 — Proposed Orderer rows *(judged on the median of the 5 Monday seeds; held until the owner approves them; D417)*

| Row | Judged on | Threshold |
|---|---|---|
| *Proposed:* First chapter in time | Orderer | chapter 1 of each Order plays within 24 h of its Order opening |
| *Proposed:* Every Order reaches level 4 | Orderer | by the end of cycle 6 |
| *Proposed:* All 16 chapters have played | Orderer | by the end of cycle 8 |
| *Proposed:* Silver check #6 with Orders | Orderer | at least 70% of silver from bounties |
| *Proposed:* Provisions share with the Moot perk | Orderer | stays in 20–40% |
| *Proposed:* Stand rows with the Quenchers perk | Orderer | "Best Last Stand timing" (days 4–5), "First Long Night" (days 3–5), "Act VI lands in its cycle" and the Dross-Tide stand probe still pass; Embers per stand with and without the perk are reported |
| *Content test (not a row)* | — | no required content is Order-only; the texts equal OUT-3 |

### §9.18 Orders screens *(v0.10, D416)*
- **The Orders card** (Hold screen, after the Events card when it is shown, otherwise after the last card shown). Title "Orders". The two seat lines (§5.13.3). One row per open Order: name, level word and count ("Friend · 62"), "Seated" or "Not seated", and "A chapter waits for a seat." when a chapter waits. A closed Order is not listed. Before any Order has opened the card is hidden. A **"Seat your Orders"** button shows while the load step is pending.
- **The Hold tab badge:** one badge, shown while a chapter can be read now or an Order with a due chapter is not seated. It is worked out from the state and clears when neither is true.
- **An Order sheet** (tap a row). Top: name, level word, standing and the next threshold. Then: **Breakdown** (each source with count × weight, the "Brought from before the Orders" line; long-press for the formula), the four levels with their perks (the current level's number shown as the real number, e.g. "−8% provisions food"; the Quenchers' line says "easier waves, smaller Embers"), chapters (read, playable, waiting and why), and **Seat / Unseat / Swap** with the cooldown line. Unseating shows "You keep your standing and chapters."
- **"Seat your Orders"** (new-warden sheet, after the existing lines; and as a sheet on load): a short list of open Orders with a toggle each, limited by the seats. "Skip" keeps the previous seats.
- **Chapter and opening scenes** use the existing scene sheet; an opening ends with **Seat it / Continue and Not now**.
- **The Library's Orders shelf** (the Rime pattern): one entry per chapter read, titled and re-readable, with a "read with …" line from D419. Not shown until the first chapter is read.
- **The Villages panel** gains **What the heads say about you** (Moot perk, seated only).
- **Layout checks (Playwright, phone and the 900/1300 px breakpoints):** no sideways scroll (`scrollWidth ≤ innerWidth`) with every Orders surface open; every button reachable without overlap.
