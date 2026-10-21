# OUT-9 — Technical design changes for v0.10

**Apply to `docs/technical-design.md` in the docs commit.** Built from §5.2, §6.2, §7.2, §9.4, §13 and §14 only; Appendix 1 was not seen (if the repo's Appendix 1 contradicts this, stop and ask). *(Revised after the independent review, 2026-10-21.)*

## §5.2 Game state — add to `GameState`, and a new block

```ts
  orders: OrdersState                            // v0.10; standing, seats, chapters (below)
```

```ts
type OrderId = 'moot' | 'greyWives' | 'bellWatchers' | 'quenchers'   // this is also the list order

interface OrdersState {
  opened: Partial<Record<OrderId, { at: number }>>        // for good; `at` is the wall-clock `now` the game uses for `meta.lastSeen`
  counts: Record<OrderId, Record<string, number>>         // live per-source counts from v10 on, for ALL four Orders, opened or not
  start: Record<OrderId, number>                           // the one migration backfill, already capped (0 in a new game)
  triumphant: number                                       // Triumphant stands counted since v10 (applies to every Order)
  delveWindow: { start: number; used: number } | null      // event-clock start of the current window, and standing used in it
  levelHigh: Record<OrderId, number>                       // highest level ever reached (never drops)
  seats: OrderId[]                                         // length ≤ seat count, kept in list order
  thirdSeat: boolean                                       // opened once, kept forever
  lastChange: number | null                                // eventNow() of the last seat change
  chaptersRead: Record<OrderId, number>                    // 0 to 4
  readWith: Record<OrderId, OrderId[][]>                   // per chapter read, the seats at the time, in list order (D419)
  openingQueue: OrderId[]                                  // opening scenes waiting, in the order the Orders opened
  seatStepPending: boolean                                 // the one-time load "Seat your Orders" sheet
}
```

- **Standing is derived, never stored:** `standing(o) = start[o] + Σ counts[o][source] × weight[source] + triumphant × triumphantChunk`. **Level is derived** from standing and the thresholds and is the **higher of that and `levelHigh[o]`**, so tuning a weight down can never lower a level (D410). `levelHigh` is raised in the same command that adds standing.
- **Counts change only in the command or event that does the thing** (a contract resolves, a brew finishes, a document is found, a Delve floor's result is applied, a stand ends) — **including events inside `advance`** — never on a timer. A source counts for an Order whether or not it has opened. **Delve floors:** a floor counts only if its applied result paid at least 1 Riftglass; `delveWindow` starts at the first counted floor (as `eventNow`), `used` is capped at `orders.delveWeeklyCap`, and a floor after `start + orders.delveWindow` starts a new window.
- **Seat count** is `thirdSeat ? orders.seatsMax : orders.seatsStart`.
- **The third-seat check** (`checkThirdSeat`) runs **after any level change, at the Quenchers' opening and on load**; it sets `thirdSeat` once, when two Orders have `levelHigh = 4` and `opened.quenchers` exists. It is idempotent.
- **Cooldown:** a seat change is allowed when `lastChange === null` or `eventNow(state, now) − lastChange ≥ orders.swapCooldown`. It reuses the monotone clock of §5.2, so a rewound device clock gives no free change. A new warden's arrival sets `lastChange = null`. Seating into a free seat at an Order's opening does not set `lastChange`.
- **Nothing seats itself** (D422): `opened` and `openingQueue` are set by `openOrders` and the triggers; `seats` only by the player's commands.
- **Chapters are derived, not stored:** the playable chapter for an Order is `chaptersRead[o] + 1` when the Order is open and seated, `level(o) ≥` that number, and its condition holds (lore §33 Part B: OR-G1 Vesna on the roster; OR-G2 Ilse arrived; OR-G3 Ostap and Vesna on the roster; OR-M4 the Quenchers have opened; OR-Q4 the Moot has opened). The list of playable chapters is sorted by list order, then chapter number.
- **Long Night:** `orders` is kept whole (D410). A new warden does not clear `openingQueue`.
- **Validation:** `seats` has no duplicates, is in list order and has only opened Orders; `chaptersRead[o] ≤ levelHigh[o]`; `readWith[o].length === chaptersRead[o]`; `thirdSeat` implies two Orders with `levelHigh = 4` and `opened.quenchers`; counts are non-negative integers; unknown ids drop with a warning.

## §5.2 — commands (names are the debug and sim interface)

`orders.seat(order)`, `orders.unseat(order)`, `orders.swap(out, in)`, `orders.setSeats(list)` (the new-warden step and the load sheet; no cooldown), `orders.readChapter(order)` (reads **that Order's** next playable chapter, records the seats in list order, raises nothing else), `orders.finishOpening(order, seatIt)` (pops that Order from `openingQueue`; seats it only if `seatIt` and a seat is free). Every command is pure on `(state, now)`, returns a result with a reason when refused, and rolls nothing.

## §6.2 Time — advance **(changed)**

`advance` **does** touch Orders, in three ways, and each needs a test:
1. **Standing is added by events inside it** (a contract completing, a brew or experiment finishing, a clue revealing a property, a document found by a condition met in the catch-up).
2. **The Quenchers' Threat factor works over time:** the hourly Rank rate is multiplied by `1 − threatStep × level` for the seated level, so `advance` over a long gap must equal many short steps (the **time-away equivalence test**, run with the Quenchers seated and with a seat change inside the gap).
3. **An Order can open during the catch-up** (D5-08 found). `advance` only records the facts; **`openOrders` runs after the catch-up** so contracts finishing in it are counted once (their counts come from the events, not from a backfill).

**Order of a load:** migrate → catch up (`advance`) → `openOrders` (flags, `openingQueue`, `seatStepPending` for a migrated save) → `checkThirdSeat` → the UI shows scenes (act scenes, the events scene, Orders openings, the "Seat your Orders" sheet, chapters).

The only time-based Orders value besides Threat is the cooldown, derived from `eventNow`, like tokens and rest (§6.2, D359). The offline cap does not touch it.

## §7.2 Streams — no change

**Orders use no random stream.** Nothing is rolled; chapter variants are chosen from the seats. This is stated so no one adds one.

## §9.4 Versioning and migrations — add

- **v9 → v10** *(v0.10; `save/migration-v10.ts`; fixture `tests/saves/fixtures/v9-owner.json`, the owner's real save (see OUT-8))*:
  - adds `orders` with empty `opened`, zero `counts`, `triumphant: 0`, `delveWindow: null`, `levelHigh` all 0, `seats: []`, `thirdSeat: false`, `lastChange: null`, `chaptersRead` 0, `readWith` empty, `openingQueue: []`, `seatStepPending: false`;
  - **backfills once:** `start[o]` = the standing the save's history gives for the sources it holds (every source in GDD §5.13.2; past Triumphant stands from `cycles[].stand` bands), **capped at `thresholds[o][orders.backfillCapLevel − 1]`**, and `levelHigh[o]` = the level that standing gives; the backfill returns the list of sources it **could not recover**, which the load puts in the warnings and the diagnostics (those start at 0);
  - does **not** open any Order or queue any scene: **`openOrders` does,** after the catch-up, by the same function the live game uses at a trigger;
  - **Tests:** the fixture loads, migrates, validates and round-trips; `start` equals an independent recount, capped; the warnings name the unrecoverable sources; no `opened`, `openingQueue` or `seats` is set by the migration; **every golden fight replays line for line.** Then, in T10.6, the openings are checked against a table worked out from the fixture itself (not hard-coded to one act).

## §10 UI architecture — add

The Orders card, Order sheets, the seat step and the Library shelf read only `standing`, `level`, `seats`, the derived playable chapters, `openingQueue` and `readWith` through selectors. Perk factors are computed in the core and passed to the breakdown trees (§5.4) as named lines; the UI never multiplies anything itself. **Scene order on one load is fixed in the UI shell:** act scenes, the events scene, Orders openings, the "Seat your Orders" sheet, chapters.

## §13 Balance simulator — add

- A new policy `sim/policies/orderer.ts` and a shard `orders` (Monday seeds only). Every other policy issues no `orders.*` command, so their reports equal the v0.9 baseline.
- The Orderer plays like Standard **and runs Delves as the Delver does once they are open**; it taps "Seat it" at an opening when a seat is free; it ranks Orders to seat by chapters playable now, then chapters unread, then list order.
- Report fields: first-open time per Order, chapter-1 time per Order, level-4 time per Order, chapter times, the silver and provisions shares, the stand results with the perk on and off, Embers per stand.
- The shard has its own 5-minute budget (D320).

## §14 Testing strategy — add

- Standing sources (including inside `advance`), thresholds, the high-water level, the Delve window and cap, the Triumphant chunk (core unit tests).
- Seats: the third seat for every order of events, the cooldown on `eventNow`, the new-warden step (core unit tests).
- Perks: with nothing seated every result equals v0.9 (replay test); each factor equals `1 − step × level`; the perk-ceiling test; the **time-away equivalence test** with the Quenchers seated.
- Chapters: waiting, no blocking, order, the two holds, variants, recorded seats, a chapter that becomes playable without a command (core story tests).
- Content test: OUT-3 Part F (automated checks, with a planted-bad-text test for each).
- The Delve-optional test (D20, D271) lists Delve standing as a reward with an idle source.
- The names test: the four Order names, titles and level names are listed with the OUT-6 date.
- The migration test (above) and a scripted full run through the debug commands.
- Playwright: one seat change and one chapter on the phone viewport; no sideways scroll at 360, 900 and 1300 px.

## §17 Risks and honest notes — add

- The backfill depends on what the owner's save keeps (Q35). A source the save does not hold starts at 0 and is named; the cap makes the start level 1 whatever the history.
- The Quenchers' Threat perk changes stand waves **and** the Embers per stand, so it is re-judged on the Orderer only; it is not tested against the old players because they never seat it.
