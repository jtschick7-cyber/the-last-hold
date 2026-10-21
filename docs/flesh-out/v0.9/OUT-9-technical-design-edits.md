# OUT-9 — `technical-design.md` edits for v0.9 (flesh-out, 2026-10-20; revised after the review)

Delta-only. Apply as its own docs commit with the other flesh-out files, before building (as v0.8 did). Built only from the sections kept in the attachment (§4.2–4.3, §5, §6.2, §7.2, §9.4, §13–14); Appendix 1 of the attached copy opens like a briefing sheet for the drafting session ("These rules replace the omitted sections") and ends mid-block, so nothing here depends on it. **If the repo's technical design has a v0.9 design-constraints appendix, mark it "answered in the v0.9 flesh-out (D357–D387); where it and this file differ, this file wins"; if its own copy contradicts a line below, stop and ask the owner.** The migration is described in §9.4 below (the appendix's "§5.2 and the plan" pointer is satisfied by T9.1).

---

## ADD to the `GameState` interface in §5.2 (after `legendaries`):

```ts
  events: EventsState                            // v0.9; tokens, rests, the boss visit, hunt points (below)
```

and to `CycleRecord` (described in the "Cycle history" bullet) the field `standPool: 'base' | 'dross' | null`.

```ts
interface EventsState {
  opened: boolean                    // true once the Citadel has been reached (D366); never goes back
  sceneSeen: boolean                 // the one-time scene (GDD §5.12.1)
  clock: { value: number; high: number }  // the monotone event clock (below); `value` is event time in ms, `high` the latest real time seen
  tokens: { count: number; at: number | null }  // tokens at event time `at`; at is null until events first open
  attempts: number                   // monotone counter; part of every attempt's seed
  rest: Record<HunterId, number>     // restUntil in event time, ms; entries already in the past are dropped on load
  boss: { visit: number              // 0-based; the boss is order[visit % 3], the pass is floor(visit / 3)
          tier: number | null        // fixed at the visit's first attempt
          pool: number | null        // Health left; null until the first attempt
          paid: number               // milestones already paid this visit, 0–4
          attempts: number }         // attempts made in this visit
  hunts: Record<HuntId, { points: number; unlocked: boolean }>
  last: EventResult | null           // the latest attempt's result, kept until read (a closed app still shows it)
  recent: FightRef[]                 // the last `events.recentKeep` (10) event fights: seeds and inputs, never logs (§5.3)
}
```

## ADD a bullet after the "Hunter depth and Act V" bullet of §5.2:

- **Events and Act VI** *(v0.9, plan T9.1–T9.3, D358–D387)*:
  - **`events`** holds everything above. It is **kept through the Long Night** (GDD §5.12.10) and is small (well under 1 KB).
  - **The event clock (D359, D387).** `eventNow(state, now) = clock.value + max(0, now − clock.high)`. Whenever the game loads or runs a command, it first folds in the elapsed time: `if now > clock.high { clock.value += now − clock.high; clock.high = now }`. A clock set **back** changes nothing (`now < high`, so no time passes and none is lost); a clock set back **then forward** adds time only beyond `high`, so **no free time** is gained. **There is no `rebaseEvents`.** This is uncapped (the offline cap does not apply) and independent of `lastSeen` and the production high-water mark of §6.4.
  - **Tokens are derived, not ticked.** `tokens.count` is the bank at event time `tokens.at`; with `t = eventNow(state, now)`, the bank now is `count` if `count ≥ boss.tokenMax`, otherwise `min(tokenMax, count + floor((t − at) / tokenInterval))`, with progress `(t − at) mod tokenInterval`. A spend normalises first: from a full bank it sets `at = now`; from a part-full bank it keeps the progress (`at = now − progress`). `at = null` means events have not opened yet.
  - **Rest is derived.** A hunter rests while `rest[id] > eventNow(state, now)`. A resting hunter is not blocked from contracts or Delves (GDD §5.12.2).
  - **Eligibility** is a selector: not on a contract, not in a Delve, not recovering, not resting.
  - **The boss's pool** is stored in Health points, not as a share, so the preview and the milestones read the same number. Milestone thresholds are `boss.milestones` × the visit's starting pool (`poolStart` is recomputed from the fixed tier and `boss.poolBase`, never stored).
  - **`last`** holds a short result (damage dealt, the pool left, milestones paid, XP per hunter, loot lines, the `FightRef`) so a result is never lost if the app closes during playback. It is cleared when read.
  - **`CycleRecord.standPool`** is set when the cycle's wave list is first fixed (Bastion reached): `dross` if **Act VI has begun in the save at that moment** (Act VI's own cycle and every cycle after it, whether or not it carries an act; owner, D386), otherwise `base`. Null before Bastion. **No wave of the Dross-Tide is guaranteed**; a `dross` pool only makes it possible. It is copied into the stand's saved inputs, so a rebuilt wave list uses the same pool (GDD §5.9.3, D363).
  - **New content ids** (unknown ids drop with a warning on load, never a crash): hunters `gest-tall-torch`, `ragnhild-eye-taker`, `radmila-of-the-reeds`; Great Beasts `lindworm-of-velk-fjord`, `barrow-king`, `mother-of-the-river`; quarries `stoneback-fell-troll`, `mara-of-kettle-barrow`, `likho-one-eyed`; hunts `stoneback`, `mara`, `likho` (tracks `…-1` to `…-3`); documents `D6-01` to `D6-10`; the document type `rime`.
  - **Story:** `story.startAct` already generalises (v8); Act VI adds its `ActProgress` the same way. `ActProgress.winsByFamily` stays separate per act (D318).
- **Derived values** stay derived: the pool bar, the milestone marks, the tier, the preview, odds, points totals and every rest time come from selectors that take `now` and return `Breakdown` trees.

## ADD to the `FightRef` interface in §5.3 (**an addition: every existing field stays**, including `location`, `rulesVersion`, `time` and the Alchemy level the real save records; see `v8-owner.json` `recentFights`):

```ts
interface FightRef { /* … all existing fields unchanged … */
                     event?: { kind: 'boss' | 'hunt'; attempt: number; id: string } }  // v0.9, optional
// and on the monster record (MonsterInstance snapshot): healthOverride?: number   // v0.9, optional
```

- **Snapshots freeze hunter stats at launch,** so later level-ups don't change a replayed log. An event fight's `monster` holds the Great Beast at the visit's tier with the optional **`healthOverride` equal to the pool at launch** (absent on every older record, so old snapshots stay valid); **the Alchemy level is frozen at launch for event fights**, as for contracts (D206); `event` is absent on every older reference, so every old snapshot replays unchanged (D337 (8), D340 (13) pattern). For an event fight `contractId` holds the string `event:${attempt}`.

## ADD to the table of §6.2 "Event sources" — **nothing.** Replace the line "Ties at the same instant ..." with:

- **Ties at the same instant** apply in a fixed order: completions → recoveries → brews → clues → refills → settles **[JC]**. **v0.9 adds no event source and no slot:** the token tick, a hunter's rest ending and a pool being emptied are **not `advance` events.** They are functions of the stored timestamps and of `now`, evaluated by selectors and by `apply(state, cmd, now)`, so the tie order is unchanged (D359).

and ADD after the "How the equivalence test compares states" bullet:

- **Event timers and the offline cap** *(v0.9, D359)*. The 12 h offline cap (24 h ceiling) limits how much *production* `advance` integrates; it does **not** limit the token bank or rest, because those are worked out from timestamps, so they are right at any `now` however long the game was closed. The offline report is unchanged except the one away-sheet line when the bank filled. **Equivalence tests for events:** (1) the token count after 30 h in one jump equals the count after 30 h in a 12 h + 12 h + 6 h sequence of loads (integers, exactly equal); (2) spending at an instant gives the same bank as ticking to it in 1-s steps and then spending.
- **Backward clock (D21) for events:** the event clock of §5.2 is monotone, so nothing special happens on a backward step: the existing handler resets `lastSeen` and applies elapsed 0, and `events.clock` simply does not move. Tests: (1) a clock moved back 3 h leaves tokens-to-next and every rest remaining exactly as they were; (2) **the round trip**: moved back 3 h and then forward 3 h, the bank and every rest equal what they were before both moves (no free time); (3) forward 3 h past the old high-water mark adds exactly 3 h.
- **Riftglass differs on purpose:** its allowance grows inside `advance` and respects the offline cap; tokens and rests do not. After a long absence the two banks behave differently; the away sheet only mentions the token bank when it filled.

## ADD rows to the table in §7.2 "Streams":

| Boss attempt (v0.9) | `${gameSeed}:boss:${attempt}:${partyIds}:${prepIds}` (`attempt` is the monotone counter, so the same party twice differs) |
| Hunt attempt (v0.9) | `${gameSeed}:hunt:${attempt}:${huntId}:${track}:${partyIds}:${prepIds}` |
| Boss kill item (v0.9) | `${gameSeed}:eventloot:${visit}` (rolled once, at the kill, in the order base, rarity, lines, like contract loot) |
| Boss preview, sample i | `${gameSeed}:bossodds:${visit}:${partyIds}:${i}`, a distinct prefix, so it never equals the real attempt; same dice for every party |
| Hunt odds, sample i | `${gameSeed}:huntodds:${huntId}:${track}:${partyIds}:${i}` (prepared and unprepared share their dice, as D98) |
| Suggest for events | `${gameSeed}:eventsuggest:${visit or huntId-track}:${i}`, a distinct prefix; **the same seeds for every party** |
| Stand waves (unchanged) | `${gameSeed}:stand:${cycle}`, drawn from the pool named by `CycleRecord.standPool`; the `base` pool draws exactly as before v0.9, so no existing stream or stand shifts |

New streams never reuse an existing prefix, so adding events shifts no other system's results.

## ADD a bullet to §9.4 "Versioning and migrations" (after the three-point list):

- **v8 → v9** *(v0.9; `save/migration-v9.ts`; fixture `tests/saves/fixtures/v8-owner.json`, the owner's real save of 2026-10-20: cycle 19, Bastion, Act IV, 11 hunters, one Legendary)*:
  - adds `events` with `opened: false`, `sceneSeen: false`, `tokens: { count: 0, at: null }`, `attempts: 0`, empty `rest`, `boss: { visit: 0, tier: null, pool: null, paid: 0, attempts: 0 }`, `hunts` for the three hunts at `points: 0, unlocked: false`, `last: null`, `recent: []`;
  - sets `standPool: 'base'` on every past cycle record; on the current cycle record, `'base'` if Bastion has been reached, otherwise `null`;
  - leaves every hunter, item, Legendary, story and stand record **as it is** (no gear changes, no new Common items, no new documents);
  - does **not** open events: **the load path does,** by the same function the live game uses on reaching the Citadel (`openEvents(state, now)`), so the migration needs no clock. For a save at or past the Citadel it sets `opened: true`, `tokens.at = now` (an empty bank) and the scene pending. For the owner's save: events open on the first load, with an empty bank.
  - **Validation additions:** `tokens.count` is clamped to 0–`boss.tokenMax`; `points` to 0–`hunt.unlockPoints`; `boss.tier` to null or 3–12; `paid` to 0–4; unknown hunt, boss or hunter ids drop with a warning; a `rest` entry in the past is dropped.
  - **`clock`** starts as `{ value: 0, high: <load time> }`.
  - **Tests:** the fixture loads, migrates, validates and round-trips (save → load → equal); the migrated owner save has `opened` true after the load path, an empty bank, `standPool: 'base'` on cycle 19, `cycles[18].stand` still null (the current cycle's stand record), and **every existing golden fight replays line for line, and every recorded fight and stand keeps its result** (recorded fights keep only their result, D344 (1); stop and ask otherwise, D308). A second fixture, **`tests/saves/fixtures/v9.json`**, is the migrated owner save played 72 h under a fixed seed, as v5, v6 and v8 each have one.

## ADD to §13.1 "Shape" (after the Policies bullet):

- **The Eventer** *(v0.9, D367)* is `sim/policies/eventer.ts`: Standard's decisions at every check-in, plus the event rules of GDD §6.1. It issues only `Command`s (`boss.attempt`, `hunt.attempt`) through the same `apply`, ignores check-ins made while events are locked, and plays until all content like the Monday Standard runs. It runs the **Monday seeds only**, as its own shard (below). Standard, Light, Heavy, Opening and the Delver **issue no event command**, so their reports **before Act VI's content equal the v0.8 baseline**; from cycle 6, Act VI's documents and the Dross-Tide stands change what they see, so those baselines are re-recorded once at T9.12 and the old rows re-judged on them.

## ADD to §13.3 "Checks" (after the milestone bullet):

- **v0.9 checks** are in `sim/checks/v09.ts` and read thresholds from `sim/targets.ts` (new rows, **their own commit**, owner-approved): first boss attempt within 24 h of the Citadel; first boss defeated by the end of the second cycle after events open; first legendary hunter by the end of the third; tokens not wasted (full bank at no more than 15% of the Eventer's unlocked check-ins); and the existing silver check (#6) with boss silver counted. Two more rows are **proposed** (D383): *Act VI lands in its cycle* and *the Dross-Tide stand probe*. All are judged on the **median of the 5 Monday seeds**; Saturday is reported only. The cycle in which events open is cycle 1 for the cycle-counting rows. The old stand rows are judged only to cycle 3 and never reach Act VI, so the Dross-Tide stand probe is the check on those stands.
- **Shards** (`sim/shards.ts`, D351): the Eventer's 5 runs are a **fourth shard, `events`,** played as its own parallel job; the `judge` job downloads four result files. No existing shard grows, so each job stays within the 5 min limit (D320). **If any job goes over 5 min, stop and ask; never trim seeds or rows.**

## ADD rows to the table in §14 "Testing strategy":

| **Event timers** | Token bank and rest are right at any `now`: 30 h in one jump equals 12 + 12 + 6 h loads; a spend equals ticking to it; a backward clock changes no remaining time; **a clock set back then forward gives no free time** | v0.9 |
| **Boss attempt** | Same seed and inputs twice → the same pool and the same log; the pool never rises; milestones are paid once per visit, in order; a kill starts the next visit; the tier is fixed at the first attempt | v0.9 |
| **Hunt attempt** | Restrictions admit exactly the legal hunters; points add up and cap at the total; unlock arrives once, at the right level, as a Wright if that level is 5 or more and an Apprentice otherwise; a replay pays no points | v0.9 |
| **New combat effects** | Sit the Vigil (once per fight, only for another hunter), Fjord Roar and Weir-Pull (hunters' meters pushed back), Ill Luck (crit aura) and a boss with the shared pool as Health each change only fights that include them; Hold the Stair and Sit the Vigil on one hit resolve Arvid's moved hit first | v0.9 |
| **Stand pool** | `base` pools are unchanged for every recorded stand and golden fight; a `dross` pool differs only by the Dross-Tide; the flag is set once, at Bastion, to `dross` whenever Act VI has begun in the save, including the story-less cycles after it; a save that begins Act VI after its pool was fixed keeps `base` | v0.9 |
| **Content: events** | No required name, document or bestiary entry is event-only; every track has at least 4 legal hunters among the starting eleven; every Great Beast and quarry has a "What it was" line and a resistance row; the Act VI Names column holds exactly #1–3 | v0.9 |
| **Names (Act VI)** | Names #1–3 each have exactly one source (the Rank documents D6-03 to D6-05); none of the 37 others is carried; no Act VI text says, asks for or begins the names | v0.9 |
| **Simulator checks** | The v0.9 rows | v0.9 |

and ADD to the "Name collision list" paragraph's text: *v0.9 adds the names in `flesh-out/v0.9/OUT-6`; the content test fails until they are listed.*

## ADD to the debug commands (the core debug commands, each sets `debugUsed`; GDD §5.12 and plan T9.3):

`debug.addToken`, `debug.fillBank`, `debug.endRests` and the existing `debug.startAct` for Act VI. They are core commands, not UI-only switches, so the Eventer and the tests can use them.
