# OUT-7 — Summary for the owner (v0.7 flesh-out, 2026-10-14)

## What we decided (D244–D279)

**Delves.** A run is 6 floors and a guardian with 3 hunters, about 5 minutes. Each fight is worked out at once and played back with small animated sprites, and you can skip it or read the log. Delves open for good at your first Keep, from a Rift card on the Hold screen (no new tab). Pechko's crack behind the stove is the way down. Difficulty follows your Rank. Floors hold groups of 2–3 weaker monsters of one family. Hunters hit by role (the Vanguard the front monster, the Striker the weakest). Nothing comes home: no injuries, deaths or timers. No oils, potions or bombs: the blessings are the preparation.

**Patrons and blessings.** Five patrons, 8 blessings each, in three rarities (Faint, Warm, Bright). Two doors a floor, then pick 1 of 3. The Unlit's 8 are built but stay locked until Act V (there's a debug switch to try them). Guardians are the Deep family: Unlit's Breath, the Forgotten and the Dross-Tide.

**Rewards.** Riftglass, limited by an allowance of 10 a day that banks up to 140. It buys extra offline hours, an alternate trait for each hunter, four hold cosmetics, and two Delve-only upgrades. Delves also give reagents, 15 Ember-echoes (patron fragments that never spoil the plot), and six new relics that work only inside Delves (each can also be found without Delving). No trophies, and no bestiary progress for normal monsters.

**The "Delves are optional" promise.** The 35 existing checks keep judging the simulated player who never Delves, so v0.7 can't break them through Delves. A new Delving player is judged on three new things: its first guardian by cycle 2, Act IV in its cycle, and that the non-Delver reaches "all content" no more than 1.3× later. A plain test also checks that every Delve reward has a non-Delve source or is only a sidegrade.

**Act IV, The Keeper.** Written in full and approved. Dobrava's names are in the margins of the order's old bestiary, Pechko finally explains, and the light in the window was hers. It reaches your save on load in cycle 19, with fresh counters, so it won't all land at once the way Act III did.

**Saves.** Schema v7, using the save code you pasted today as the real-save fixture. rulesVersion goes to 4 (you approved). Every old fight must replay exactly.

**v0.8 (direction only).**
- Gear becomes items: Common items from the Smithy, loot from Fine to Legendary. They reset each Long Night.
- Hunter ranks become Apprentice → Wright → Master-Wright. Ranks and stars are kept forever.
- Reserve hunters earn some XP in the yard, so late recruits like Arvid catch up.
- Each hunter gets a personal use-skill, plus passive talent trees.
- Act V gets written at v0.8's flesh-out.

## Still open
- **Q20:** are monsters named in Delves? (I recommend yes, always.)
- **Q21:** do Delves give XP? (I recommend no, until v0.8.)
- Answering both ("Q20 a, Q21 a") before Claude Code starts unblocks everything.
- **To check first:** Arvid joined your save at level 1, which looks wrong against D211. Claude Code checks this as v0.7's second task.
- **Drafted for your OK later**, with the sprites: the guardians' bestiary blurbs, the relic one-liners and Pechko's after-run lines (`lore-secrets.md` §29, marked "Proposed").
- **The final act's timing** (D24.10) stays open for v0.10.

## What to playtest later
- Whether a 5-minute run feels right, and whether doors and blessings feel like real choices.
- Whether group fights read clearly on a phone (watch one, skip one, read one log).
- Whether the allowance and the shop give you something to want, given that your Embers are already unspent.
- Act IV on your own save: does D4-01 play on load, and do the margins and Pechko's scenes land?
- The battle sprites and new art.
- Notes for later milestones from your save: every stand was Triumphant, all villages are Sworn, and Embers have nothing left to buy. These are worth watching in v0.8–v0.10. Nothing in v0.7 changes them.
