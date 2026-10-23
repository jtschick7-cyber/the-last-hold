# TL.3 doc edits — DRAFT for the owner to read (nothing below is applied yet)

**Status: APPLIED 2026-10-23 on the owner's approval (D509 added as Proposed).**

Why: the docs say a new game saves "only the Hearth Hall". The build saves the Hall at (3, 3) and then places the starting Farm and Woodcutter's Camp by the normal rules, so the tray starts empty (the owner asked for this in TL.3, and agreed on 2026-10-23).

## Edit 1 — GDD §5.1.5, rule 6 (`docs/gdd.md`, one occurrence)

Find:
> 6. On new game creation (M3), `placed` initializes with only `hearth-hall: { x: 3, y: 3 }` (no ghosts for unbuilt buildings). At the start of a new cycle after the Long Night, starting buildings wake up or auto-place in Hamlet.

Replace with:
> 6. On new game creation (M3), `placed` starts with `hearth-hall: { x: 3, y: 3 }` (no ghosts for unbuilt buildings), and the starting Farm and Woodcutter's Camp are then placed by rules 3 and 4, nearest the middle first, so the tray starts empty. At the start of a new cycle after the Long Night, starting buildings wake up at their saved spots, or are placed by the same rules if they have none; the saved blueprint is otherwise untouched.

## Edit 2 — Technical design §19.2 (`docs/technical-design.md`, one occurrence)

Find:
> - Brand new games (M3) initialize `placed` with only `{ 'hearth-hall': { x: 3, y: 3 } }` (no ghosts for undiscovered buildings).

Replace with:
> - Brand new games (M3) start `placed` with `{ 'hearth-hall': { x: 3, y: 3 } }` (no ghosts for undiscovered buildings); `createNewGame` then calls `autoPlaceUnlocked`, which places the starting Farm and Woodcutter's Camp, so the tray starts empty.

## Edit 3 (optional) — Technical design §19.3, auto-placement hook: two clarifications of how it behaves

Add after the "Order:" bullet:
> - A tile held by any saved coordinate (including a piece not yet built) counts as taken when finding a free tile.
> - Defenses use only the defense order; if none of those tiles is open in the current clearing, the piece waits in the tray.
> - After a purchase, only pieces that purchase newly unlocked are placed; a piece the player sent to the tray stays there. A Rank-up, a new game and a new cycle place every unlocked piece that has no spot.

## Decisions row to add (status Proposed; one row, appended to `docs/decisions.md`)

> | D509 | 2026-10-23 | **TL.3 layout placement, as built.** A new game places the starting Farm and Camp at once (tray starts empty); saved blueprint tiles count as taken for automatic placement; a defense with no open defense tile waits in the tray; after a purchase only newly unlocked pieces are placed. Two tests written earlier in this milestone changed to match (`tests/saves/v12-migration.test.ts`, `tests/layout/layout.test.ts`); nothing loosened. GDD §5.1.5 rule 6 and technical design §19.2 reworded to match. | Claude proposal | Proposed |

(D509 is the next free number after D508; I will check before adding.)
