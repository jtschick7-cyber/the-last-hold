# OUT-2a — GDD changes for v0.11 (apply to `docs/gdd.md` in the docs commit)

Texts quoted as "find" are copied from the GDD as it stands; Claude Code replaces them exactly. If a find text no longer matches, search for the section number and apply the same change by hand, then tell the owner.

## A. New section §5.15 (insert after §5.14, before "Judgment calls in §5")

### 5.15 The Remembering *(v0.11; ⚑ v0.11 flesh-out, D446–D460)*

**What it is.** The end of the story. After Act VI the player can **Remember Them** (read the Sent's 40 names aloud in the Hearth Hall) or **Keep the Vigil** (not yet). Two endings ship; **The Descent is deferred** (D448). The Orders are **not** a gate and **never change which ending is open** (D447).

**5.15.1 The gate (D449).** Remember Them is open when:
1. **all 40 names are found** (§5.14.4), and
2. **every contract species is at Studied or better.** The gate reads the **stored knowledge level** (Studied is 4 kills, `knowledge.studiedKills`, locked; §5.6.2), not raw kills. "Contract species" are the 16 species that appear in contracts; the base Last Stand pool is exactly those species (§5.9.3, §8.3.1), so there is no stand-only species. A content test pins the list, and changing it needs a decisions row (D461). **Not counted:** the Great Beasts, hunt quarries, Delve-only species and the Dross-Tide (lore §8, D363, D365).

The gate is **worked out from the state each time and never stored.** Names found and Studied knowledge never go down, so the gate does not close again in play. The card forms after a choice do **not** depend on the gate (D461).

**5.15.2 When it appears (D450).**
- **Pechko's scene.** Once, on the first visit to the Hold screen after Act VI's Last Stand result has been applied: R-01 if the gate is not open, R-02 if it is (lore §34.1). Sets `remembering.nearSeen`.
- **The card** (Hold screen, after the Orders card; title "The Remembering"). Not shown before `nearSeen`. Three forms (lore §34.2):
  - *Gate not open:* "Names found: n of 40." and "Creatures known well: s of t.", plus **Names** and **Bestiary** buttons. **No bar, no countdown, no percentage.**
  - *Gate open, nothing chosen:* two buttons, **Remember Them** and **Keep the Vigil**.
  - *After a choice:* the forms of lore §34.2.
- **No Hold tab badge** for the card. The first time the gate opens after Pechko's scene, the next away sheet or result sheet carries one line (lore §34.2, D466), once; this needs the flag `readyNoted`.
- **Close rule:** the scene counts as seen (`nearSeen`) when it is closed with Continue; closing with the ✕ leaves it waiting (D432 (4), D461).

**5.15.3 The choice (D453, D459).**
- **When it can be chosen:** Act VI's stand result has been applied **and** the gate is open. The command is refused otherwise (D461).
- **Remember Them** plays the whole sequence: R-03, the reading, R-04, R-04b (only if Sigrun is on the roster), the Order cards, R-09, R-11 (5.15.5, 5.15.6). It is recorded **once,** the moment it is chosen. The Library entry replays the **whole sequence,** so an interrupted ending loses nothing (D461).
- **Keep the Vigil** is offered only when the gate is open (D459 (1)). It plays R-10 once, is recorded once, and **changes nothing in the game.** It adds **no** difficulty (rising difficulty is a later flesh-out, §10). After it, the card shows only Remember Them.
- Nothing locks. Both can be re-read from the Library shelf "The Remembering" (§9.19).
- The reading never starts by itself: only a tap on the card starts it (D459 (3)).

**5.15.4 The reading (D456).** One name at a time, in year order, each with its village and year in the format of lore §20 ("Name · Village · onward, year N of the order."). Automatic, about 2 s a name; a tap shows the next at once; **Skip** jumps to the end. After the fortieth name the Unlit answers with one line in rime. The 40 names come from the same table as the Names view.

**5.15.5 Orders in the ending (D451, D454).** After the aftermath card, one card for each Order whose **chapter 4 was read,** in the fixed order Thanes' Moot, Grey Wives, Bell-Watchers, Quenchers:

| Order | Which card | Chosen by |
|---|---|---|
| Thanes' Moot | R-05 A or R-05 B | `readWith[moot][3]` contains the Quenchers → A, else B |
| Grey Wives | R-06 | chapter 4 read |
| Bell-Watchers | R-07 | chapter 4 read |
| Quenchers | R-08 A or R-08 B; or Věra's fallback if chapter 4 was never read | `readWith[quenchers][3]` contains the Moot → A, else B |

**Current seats and levels play no part.** An Order that was never finished is silent. The Quenchers' card (or Věra's fallback) shows **only if the Quenchers have opened;** they open when D5-08 is found, which the gate does not need, so a save may reach the ending without them (D466).

**5.15.6 After Remember Them (D457).**
- *Text:* the Rime R-11 is the last card of the sequence (it is derived from the saved ending, **not a found document,** and fires no standing, skill XP or Archive hooks, D463); Pechko, Brana and Ilse get the added resident lines (lore §34.7); Pechko's R-09 plays at the end of the ending; the Roll of Wardens entry of the warden in office gets a small lamp and the line "Read the roll aloud."
- *Look:* in the Hearth Hall scene the frost is gone and a lamp sits in the window (drawn in code, approved by the owner).
- **No number changes anywhere.** Not Threat, not rates, not waves, not Embers. `rulesVersion` stays 5.

**5.15.7 What it never does.**
- It adds no combat, no random stream, no new resource, no gate on any other system.
- No required content is Order-only, Delve-only, event-only or missable (lore §8). Each of the 40 names and each contract species has a source that is not an Order, a Delve or an event; a content test proves it (D458).
- It does not use the avoid-list words, and it offers no "keep the fire or let it go out" choice (§2.3): Keep the Vigil is "not yet," not a rival ending.

**5.15.8 Save (D452, D466).** One small block, `remembering`: `nearSeen`, `readyNoted` and a list of endings reached with time and cycle (order = array order; time is information only). Technical design §5.2 and §9.4 (schema 11).

**5.15.9 After the ending the game carries on (D463).** The Long Night, stands, Pechko's stand line, the new-warden sheet and the Dross-Tide waves are unchanged. The hearth keeping itself is a story fact (R-09), not a rule change.

## B. Edits to existing GDD text

**B1. §5.9.7 (Long Night order list)**
- Find (in §5.9.7): `2. *"The story continues in a later version."* (P4) From v0.5: the act's testament instead, while its act is written (§5.14.9).`
- Replace with: `2. The act's testament while the cycle has an act (§5.14.9). A cycle with no act skips this step (D455).`

**B2. §5.9.9 (story bullet)**
- Find (in §5.9.9): `**Until an act is written, a finished cycle closes with "The story continues in a later version"; when the act ships, its documents unlock in your current cycle** *(⚑ P4 [JC])*.`
- Replace with: `**Every act is written (v0.11, D455); a cycle with no act closes with nothing in that step.** *(⚑ P4 [JC], superseded by D455)*`

**B3. §5.14 (the "act that isn't written yet" bullet)**
- Find: `- **An act that isn't written yet** (from Act IV): its cycle has no act documents, and its Long Night shows *"The story continues in a later version."* Ruins, Ribbonshade names and hunter letters carry on, because they aren't tied to an act. When the act ships, it starts in the current cycle (P4), and the next ones follow one per cycle.`
- Replace with: `- **A cycle with no act** (after Act VI): no act documents, and its Long Night shows no closing line (D455). Ruins, Ribbonshade names and hunter letters carry on, because they aren't tied to an act.`

**B4. §5.14 (Act VI paragraph)**
- Find: `and Act VI closes with *"The story continues in a later version."* That line stays through v0.10 and is removed when v0.11 ships (D415).`
- Replace with: `and the Act VI closing line was removed in v0.11 (D415, D455).`

**B5. §5.14.9 (list of what shows)**
- Find: `**Act VI: D6-06, a Rime**), or *"The story continues in a later version."* if the act isn't written.`
- Replace with: `**Act VI: D6-06, a Rime**); a cycle with no act shows nothing in this step.`

**B6. §10 Out of Scope.** Replace the row `| The mystery's final act | v0.11 "The Remembering" (D415) | Its own flesh-out before v0.11 |` with:
`| The Descent (a third ending) | Deferred (D448) | Its own later flesh-out |`
and add:
`| Rising difficulty for Keep the Vigil (an endless mode) | Deferred (D453) | Keep the Vigil changes nothing for now; its own later flesh-out |`
and change the Achievements row to read `[JC: candidate for v1.0 polish; the owner decides at the v1.0 flesh-out]`.

**B7. §6.2 (targets): add after the v0.10 rows**
`| *Proposed:* The Remembering is reachable *(D458, D464)* | The ending is choosable (gate open and Act VI's stand applied, §5.15.3) by the end of cycle **N** (Standard, median of the 5 Monday seeds). **N is the measured median** (T11.15), so the row passes by construction; the owner approves N before it is enforced. A seed that never gets there counts as later than any N. Judged only in `sim.yml`, not in the fast set. | v0.11 |`
and, under the content tests: `**Content test (v0.11, D458):** every one of the 40 names and every contract species has a source that is not an Order, a Delve or an event (it extends the existing required-content tests); the contract-species list is pinned; the Remembering texts equal lore §34; the 40 names equal lore §20.`

**B8. §9.11 (What exists when):** add a line: `The Remembering card: from the first Hold-screen visit after Act VI's Last Stand result. The Library shelf "The Remembering": from the first ending reached.`

**B9. §9 new subsection, after §9.18:**

### 9.19 The Remembering screens *(v0.11)*
- **The card** (§5.15.2, lore §34.2). Phone-first; plain text lines; two buttons when open.
- **Pechko's scene** uses the existing scene sheet.
- **The reading screen:** full-screen dark card; name large, village and year small; Skip at the bottom; **reduced-motion:** names change without fading; speed unchanged. Tap anywhere shows the next name.
- **The ending cards** (aftermath, Orders, R-09) use the existing scene sheet one after another, each with Continue.
- **The Library shelf "The Remembering"** (the Rime pattern): "The reading" (replays the whole sequence, 5.15.3; Skip on the reading only) and "Later" (R-10). R-11 also sits on the Rime shelf under "After the ending."
- **The Hearth Hall look** after Remember Them (frost gone, lamp in the window), drawn in code.
- **Layout checks (Playwright, phone and 900/1300 px):** no sideways scroll with the card, the reading screen and every ending card open; **all 40 names with their village lines** fit without clipping at the narrowest width.

**B10. "Judgment calls added in the v0.11 flesh-out (D446–D460)"** (new block at the end of the judgment-call sections):
1. Untested Orders are read gently, never gate the ending (D447).
2. Two endings; The Descent waits (D448).
3. The gate is derived, never stored (D449).
4. A quiet card, no bar, no countdown (D450).
5. Recorded history, not current seats, decides what the Orders say (D451).
6. One small save block (D452).
7. Nothing locks; Keep the Vigil changes nothing (D453).
8. The Quenchers answer in the ending, not by a button (D454).
9. No replacement for the removed closing line (D455).
10. The reading is automatic and skippable (D456).
11. One look change and no number changes after Remember Them (D457).
12. One reachability row and a content test (D458).
13. Long Night carries on, R-11 is not a document, Sigrun's line stays as the roll has it (D463, D466).
14. Readings in D459 (Keep the Vigil only when open; once, ever; the reading starts by tap; "Act VI has ended" = its stand result applied).

**B11. Stale GDD lines to update in the same docs commit (review N3).** Search for each and make the matching change; if a line cannot be found, say so in the progress entry.
- **§5.13.8** (the line saying the final act or v0.11 is "still for later"): change to say it shipped in v0.11 (§5.15).
- **§3.4 and §9.11 tables:** add a row for "The Remembering card" (from the first Hold-screen visit after Act VI's stand result).
- **§9.10 debug list:** add `debug.remembering.openGate()` and `debug.remembering.finishActVI()` (D462).
- **The GDD header status line:** add v0.11 (flesh-out 2026-10-21).
- **§5.13 / §9.18 Quenchers text** that says the Orders' last chapters are "for v0.11": point to §5.15.5.
