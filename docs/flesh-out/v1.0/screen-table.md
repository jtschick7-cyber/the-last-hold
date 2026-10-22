# Screen table (TV.3a)

Every screen on the GDD §9.20 list, how the sweep reaches it, and which save fixture it uses. Generated from `tests/e2e/polish-screens.ts`; later tasks (TV.4, TV.6 and the layout checks) reuse it. A flow that changes the save is run on a fresh load. "v11:candidate" is v11 with Herdis sent back to the candidates (a test-only edit); "new" is a new game. The debug commands are the buttons in More > Debug.

| Flow (screens it covers) | Fixture | How it is reached |
|---|---|---|
| hold-bastion | v11 | fixture v11, nothing |
| rates | v11 | the resource bar |
| breakdown | v11 | first "Show breakdown" on the Hold |
| rank | v11 | Hold, Rank ▸ |
| hunters-roster | v11 | Hunters tab |
| hunters-candidates | v11:candidate | fixture v11 with Herdis sent back to the candidates (a test-only edit), Hunters tab |
| hunter-sheet | v11 | Hunters tab, Halvar |
| slot-picker | v11 | Hunters tab, Halvar, first Change |
| stores | v11 | Hunters tab, By slot |
| contracts-board | v11 | Contracts tab |
| villages | v11 | Contracts tab, open Villages |
| launch-sheet | v11 | Contracts tab, first Prepare |
| bestiary | v11 | Archive tab, Bestiary |
| bestiary-entry | v11 | Archive, Bestiary, Upyr |
| archive-library | v11 | Archive, Library |
| archive-accounts | v11 | Archive, Accounts |
| archive-names | v11 | Archive, Names |
| document-reader | v11 | Archive, Library, a letter |
| orders-seats | v11 | Hold, Change seats ▸ |
| order-sheet | v11 | Hold, Thanes' Moot |
| last-stand | v11 | Hold, Rank ▸, Make the Last Stand |
| delve-entry | v11 | Hold, Delve |
| more-menu | v11 | More tab |
| more-reports | v11 | More, Reports |
| more-fallen | v11 | More, Hall of the Fallen |
| more-save | v11 | More, Save & Data |
| more-settings | v11 | More, Settings |
| more-about | v11 | More, About & Credits |
| more-diagnostics | v11 | More, Diagnostics |
| hold-ages (changes the save) | new | a new game (Hamlet); More, Debug, Unlock Keep, then Unlock Citadel, then Unlock Bastion |
| chapter-scene (changes the save) | v11 | More, Debug, Play chapter (an Orders chapter scene) |
| onload-v11 | v11 | loading fixture v11 (the sheets open by themselves, one after the other) |
| onload-v10-played | v10-played | loading fixture v10-played |
| onload-v6 | v6 | loading fixture v6 |
| delve-run (changes the save) | v11 | Hold, Delve, Start, then doors, blessings, Fight, Skip, Continue until Done |
| events-boss (changes the save) | v11 | More, Debug, Fill the attempt bank; Hold, The Great Beast, Send a party, Suggest best, Send the hunters, Log, Skip, See the result |
| events-hunt (changes the save) | v11 | More, Debug, Fill the attempt bank; Hold, Legendary Hunts, The Toll Road, Suggest best, Send the hunters, Skip, See the result |
| hut | v11 | Hold, the Alchemist's Hut row, Open |
| remembering-remember (changes the save) | v11 | More, Debug, Finish Act VI; the near scene; Open the gate; Remember Them; the reading; the ending cards; the Library shelf |
| remembering-vigil (changes the save) | v11 | More, Debug, Finish Act VI, Open the gate; Hold, Keep the Vigil |
| long-night (changes the save) | v11 | More, Debug, Finish Act VI (plays the Last Stand and the Long Night); the sheets that follow, then the new warden's arrival |

The sweep's findings are in `tap-sweep-report.txt` (regenerate: `TAP_REPORT=<file> npx playwright test tests/e2e/polish-tap-targets.spec.ts --project=phone-chromium`, with the preview build running on port 4173).
