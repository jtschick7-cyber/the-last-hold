# OUT-6 — Names (v1.0 flesh-out, 2026-10-21, revised after the red-team review)

**No new person, place, creature or Order is introduced in v1.0.** Nothing needs adding to `tests/content/names.ts`.

| Name | Status | What was searched | Note for `tests/content/names.ts` |
|---|---|---|---|
| Gaunt Wolf | **Settled in D71** (the v0.5 flesh-out); already used in lore-secrets, Acts IV and VI, the Hidebane Oil row, Stanko's unlock and the Wolf fang row. v1.0 only makes GDD §8.3, §9.4 and §9.8 agree (D483). | The D71 search is in the log; I did not repeat it in full. My own web search for "Gaunt Wolf" creature game on 2026-10-21 found nothing matching a game creature (the results were unrelated: a tabletop animal chart, an indie game, a Werewolf page). | **Check it is listed** with D71's date; **add nothing if it is.** If it is missing, add it with the note "settled D71; confirmed D483". |
| "The Last Hold" | Final (D482) | Searched in earlier milestones; not repeated | none |
| Settings labels ("Text size", "Match phone", "Large", "Largest", "Backup reminder", "Last exported") | Ordinary interface words, not proper nouns | — | none |

**What I could not settle (Q48, informational):** my search tool is weak for exact phrases, and "gaunt" also appears in Warhammer 40,000 (Commissar Ibram Gaunt of the *Gaunt's Ghosts* novels, and the "-gaunt" Tyranid units that are also in Tacticus). I did not read §2.3's full list, only its 40K row, which bans named chapters, legions and characters and does not name "gaunt". I do not know whether D71's search considered it. Treat the result as "no collision found", not "checked everywhere".

**Rule for Claude Code:** a new proper noun that is not in this file must be searched against GDD §2.3, and on a collision stop and ask, with alternatives.
