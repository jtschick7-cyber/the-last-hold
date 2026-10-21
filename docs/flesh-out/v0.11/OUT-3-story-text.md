# OUT-3 — Lore and story text for v0.11 (word for word, ready to paste)

**Where it goes:** a new section **§34 "The Remembering, in full"** at the end of `docs/lore-secrets.md`, plus the small edits at the end of this file. Claude Code writes these texts **exactly as below** and invents none (CLAUDE.md). **Your read is the check:** one wrongness at a time, plain voice, nothing contradicting the lore, and the three lines marked ★ (they are the ones I wrote freshest, and they wait for your yes).

## 34. The Remembering, in full *(v0.11 flesh-out, D446–D460)*

**Rules the texts follow** (lore §8, §16, §17; setting primer; D386, D448 to D459):
- **Before the player taps Remember Them, no text says, asks for or begins the Sent's names** (D386, D467). The only place the 40 names appear is the reading (34.5), exactly as in §20. The card, R-03 and R-10 speak of "reading the roll" because they *are* the ending's own scenes; they are exempt by id from the phrase list in 34.10, but they still contain no name.
- People named are only those who already exist: Pechko, Brana, Ilse, Sigrun, Marta Dubska, Marta, Bohdan Kozel, Bohdan, Gunnar, Ilona, Sólveig, Vesna, Halina, Dana Lisová, Dana, Věra. The eldest Grey Wife stays unnamed. **No new person name; no new place.**
- No avoid-list words (*ash, ashen, cinder, kindle, hollow* other than Kozly Hollow or the Hollow, *tithe, bonfire, throne, soul(s), fed, feeding*). No relative counts of years ("three years ago"). Year numbers appear only in the reading, as on the roll.
- One wrongness per scene, never stated outright. The Unlit speaks only in rime, plainly.
- "Pechko" is the hearth (lore §7). He may say things the others cannot.

---

### 34.1 Pechko, before the gate is open *(a resident scene; plays once, on the first visit to the Hold screen after Act VI's Last Stand result has been applied)*

**R-01 · The line along the wall** *(the gate is not yet open)*

> Pechko has swept the frost into a line along the foot of the wall. The frost has let him.
>
> "It's near," he says. "I can tell by how the stove sits. But the roll isn't full yet, and there are beasts we haven't learned properly."
>
> He nods at the Names page, and then at the Bestiary, the way you would nod at two people at a back table.
>
> "No hurry. The cold has waited this long."

*Wrongness:* the frost lets itself be swept.

**R-02 · Everything on the table** *(the gate is already open when the scene plays)*

> Pechko is standing when you come in, which he never is. The stove is ticking in a way you haven't heard before, slow, like someone counting under their breath.
>
> "It's all there," he says. "Everything we were short of. The roll is full and the beasts are known."
>
> He looks at the crack, and then at you.
>
> "Whenever you like. Or not yet. Either is allowed."

*Wrongness:* the stove is counting.

*Rule:* if the gate is open when the scene would play, R-02 plays; otherwise R-01. Whichever plays sets `nearSeen`. If R-01 played and the gate opens later, **there is no second scene**: the card simply changes to its ready form (34.2).

---

### 34.2 The card on the Hold screen *(title "The Remembering"; after the Orders card)*

**Gate not open** (the numbers are worked out, not stored):
> **The Remembering**
> Names found: {n} of 40.
> Creatures known well: {s} of {t}.
> *Pechko says it's near.*
> [ Names ] [ Bestiary ]

("Creatures known well" means Studied or better. {t} is the number of contract species. The two buttons open the Names view and the Bestiary.)

**The ready line** *(D466; the first away sheet or result sheet after the gate opens, once, only after Pechko's scene; no badge)*:
> The Remembering is ready. Pechko is waiting by the stove.

**Gate open, nothing chosen yet:**
> **The Remembering**
> Everything's on the table.
> **Remember Them** — Read the roll aloud, in the Hearth Hall.
> **Keep the Vigil** — Not yet. The hold goes on as it is.

**After Keep the Vigil** (does not depend on the gate, D461 (5)):
> **The Remembering**
> You are keeping the vigil. The roll can be read whenever you say.
> **Remember Them**

**After Remember Them** (does not depend on the gate):
> **The Remembering**
> The roll was read. It is in the Library whenever you want it again.
> [ Read it again ]

---

### 34.3 Remember Them: the opening *(plays when you tap Remember Them)*

**R-03 · The roll**

> Ilse has carried the roll down from the archive and set it on the table, and then, not trusting the table, picked it up again. Brana has lit every lamp in the Hall. Pechko is by the crack.
>
> "You read," Ilse says. "I've read them to myself so many times I'm no use."
>
> It is the first time anyone has asked you to read something aloud in this room.
>
> The frost on the floor has gathered at the edge of the crack. It isn't writing. It is listening.

*Wrongness:* the frost is listening. (Then the reading starts at once: 34.5.)

---

### 34.4 Keep the Vigil *(plays once, when you choose it)*

**R-10 · Later**

> You tell Pechko you are not ready to read it yet.
>
> He nods, as if you had told him the weather. "Aye. It's a lot, to read aloud in a room."
>
> He leans the broom against the stove. "The cold has learned patience. We can learn it too. Brana will keep the roll with the lamps. It'll be here."
>
> Brana puts the kettle on, which is how she says the matter is closed. The frost along the foot of the wall stays where it is, patient as a dog at a door.

*Wrongness:* the frost doesn't mind being told "later." *Nothing is taken away; Remember Them stays on the card.*

---

### 34.5 The reading

**What the screen shows:** one name at a time, centred, on the dark card used for scenes. Each name is a single line in the format of lore §20:

> **{Name}**
> {Village} · onward, year {N} of the order.

The names come **automatically, in order of year,** about 2 seconds each; a tap shows the next at once; **Skip** jumps to the end. The Library's re-read plays the same screen.

**The roll, exactly (lore §20; the content test compares every line to this table):**

| # | Name | Village | Year |
|---|---|---|---|
| 1 | Milena Horská | Mirograd | 200 |
| 2 | Ketil Ormsson | Velkvik | 202 |
| 3 | Mirek Bárta | Kozly Hollow | 204 |
| 4 | Hild Aslaugsdóttir | Ravenfell | 206 |
| 5 | Radim Tkadlec | Mirograd | 208 |
| 6 | Ragna Leifsdóttir | Velkvik | 210 |
| 7 | Vít Brodský | Dubno Ford | 212 |
| 8 | Danica Mlynářová | Mirograd | 214 |
| 9 | Sten Ulfsson | Ravenfell | 216 |
| 10 | Eyvind Stensson | Velkvik | 218 |
| 11 | Vojtěch Sládek | Mirograd | 220 |
| 12 | Jarka Habrová | Kozly Hollow | 222 |
| 13 | Libor Kovář | Mirograd | 224 |
| 14 | Asta Hallsdóttir | Velkvik | 226 |
| 15 | Signy Hrafnsdóttir | Ravenfell | 228 |
| 16 | Zdena Rybová | Mirograd | 230 |
| 17 | Pavel Lesák | Kozly Hollow | 232 |
| 18 | Kazimír Plachý | Mirograd | 234 |
| 19 | Orm Ketilsson | Velkvik | 236 |
| 20 | Torgils Torkelsson | Ravenfell | 238 |
| 21 | Ludmila Hrubá | Mirograd | 240 |
| 22 | Anežka Vrbová | Kozly Hollow | 242 |
| 23 | Ondřej Vlček | Mirograd | 244 |
| 24 | Brynja Torsdóttir | Velkvik | 246 |
| 25 | Halla Runólfsdóttir | Ravenfell | 248 |
| 26 | Božena Stará | Mirograd | 250 |
| 27 | Štěpán Koláček | Mirograd | 252 |
| 28 | Lubomír Přívozník | Dubno Ford | 254 |
| 29 | Ivka Rohová | Kozly Hollow | 256 |
| 30 | Finn Aslaksson | Velkvik | 258 |
| 31 | Tadeáš Kopecký | Kozly Hollow | 260 |
| 32 | Ulf Sigvaldsson | Ravenfell | 262 |
| 33 | Hana Dvorská | Mirograd | 264 |
| 34 | Leif Sveinsson | Velkvik | 266 |
| 35 | Tomek Lis | Kozly Hollow | 268 |
| 36 | Tova Eyvindsdóttir | Velkvik | 270 |
| 37 | Eirik Varn | Velkvik | 272 |
| 38 | Ylva Ketilsdóttir | Ravenfell | 274 |
| 39 | Jaro Studnička | Mirograd | 276 |
| 40 | Sigrun Ormsdóttir | Ravenfell | 278 |

(Claude Code builds the screen from the same table as the Names view's data, so the two cannot differ; the content test checks the table against this one.)

**After the fortieth name, one line in rime appears on the floor of the card:** ★

> — in rime, on the Hearth Hall floor —
> Forty. Known, every one. I can put the count down.

*(This answers D6-02, where the cold said "I counted forty", and D6-06, "I am asking to be known".)*

---

### 34.6 After the reading

**R-04 · The count**

> The frost on the floor draws back toward the crack, the way a tide goes out. It does not take long.
>
> Ilse closes the roll. Her fingers have left marks in the cover.
>
> "That's the count," says Pechko. He sounds like a man who has been told the bread is done. "Aye. That's the count."
>
> Where the frost was, there is a damp patch on a flagstone. Brana puts her boot on it by accident, and apologises to it.

*Wrongness:* the cold goes gently, and Brana is sorry to a damp patch.

**R-04b · The fortieth** *(only if Sigrun is on the roster, active or reserve; D466 (2))* ★

> Sigrun is at the back of the Hall, without her lantern. She heard her own name last, with the year she was meant to go, and she hasn't moved since.
>
> "It's strange, being counted for something I didn't do," she says. "It's stranger to be counted right."

*Wrongness:* she is remembered for the journey she refused. *(The roll keeps her line as lore §20 has it: she was entered for year 278 and ran.)*

**Then, one card for each Order whose chapter 4 you read** *(fixed order: the Thanes' Moot, the Grey Wives, the Bell-Watchers, the Quenchers; each is its own card; an Order whose chapter 4 was not read has no card, except that **the Quenchers, if they have opened,** have Věra's fallback; if they never opened, they have no card)*

**R-05 · The Thanes' Moot** — chapter 4 read with the Quenchers seated (variant A):

> Marta Dubska has come up with the other heads, and Bohdan Kozel has come with them. Nobody arranged it. The chair Brana set at the head of the table is still empty. Marta rests a hand on the back of it as she goes by, and takes the hand away again, and says nothing.

**R-05 · The Thanes' Moot** — chapter 4 read without the Quenchers seated (variant B):

> Marta Dubska has come up with Gunnar, Ilona and Sólveig. There is a chair for Kozly Hollow at the end of the table, and she has had it set, though nobody expects it to be filled. "It stands there," she says, to nobody. "Somebody can use it if they've a mind."

**R-06 · The Grey Wives** *(chapter 4 read; no variants)*

> The eldest Grey Wife has come up with Vesna. The cup she left on the table by the kettles is still there. She looks into it. It is empty, and rinsed.
>
> "Well," she says. "Somebody came."
>
> Vesna looks at Brana. Brana looks at the ceiling.

**R-07 · The Bell-Watchers** *(chapter 4 read; no variants)*

> Halina has come up from Mirograd and stopped under the gatehouse arch. The bell is where Brana hung it, the cloth lying on the stone beneath. She looks at the roll in Ilse's hands. Then she reaches up and strikes the bell with the flat of her hand, once.
>
> It carries a long way down the valley. Dana Lisová lays her own hand on the bronze to still it, and is the last to take it away.

**R-08 · The Quenchers** — chapter 4 read with the Moot seated (variant A):

> At dusk the lamps go into the windows in Kozly Hollow, house by house. Bohdan Kozel sets one in the fourth window, the one that faces the road up to the hold. Then he comes out and stands in the road with his cap on.
>
> "I said it to the heads, and they heard it," he says. "I can light a window to that."

**R-08 · The Quenchers** — chapter 4 read without the Moot seated (variant B):

> At dusk the lamps go into the windows in Kozly Hollow, house by house. Bohdan Kozel sets one in the fourth window, the one that faces the road up to the hold. Then he comes out and stands in the road with his cap on.
>
> "The stone never warmed in my hand," he says. "The stove does. I'll light the window. I'll not stop asking what it costs, mind."

**R-08 · The Quenchers** — chapter 4 never read *(Věra's fallback)*

> Věra has come up from Kozly Hollow with the others. "The Hollow is still making up its mind," she says. "Bohdan has a window that faces this road. If it's dark, don't take it for an answer."

*Wrongness (all three):* the lamp, or the dark window, in the one house that argued. *Threshold:* the lit window.

**R-09 · The hearth keeps itself** ★ *(Pechko, on the next card)*

> "You'll want to know about the stove," Pechko says. "It's keeping itself. Don't ask me how. I've never seen it do that. Wardens will still come and go. They always did. Old habit, and a good one. I'd not take it from them."

*Wrongness:* the stove no longer needs the wardens, and Pechko would rather they came.

Then **R-11** (34.7) is the last card, and the ending returns to the Hold screen with the card from 34.2, "After Remember Them."

---

### 34.7 After Remember Them: what stays

**R-11 · It is warm where I am** *(a Rime; **not a found document** (D463): it is the last card of the ending sequence, derived from the saved ending, then it sits on the Rime shelf under "After the ending." It adds no Bell-Watchers standing, no Lore XP, no Archive badge and no act grouping.)*

> — in rime, on the Hearth Hall floor —
> It is warm where I am. I had forgotten it could be.
> Keep the roll where people can find it. Read it again whenever you like; I will hear it.
> I am not asking for anything now.

*Ilse's note:* *"The rime is gone from the floor. I copied it first."*

**Resident lines after Remember Them** *(added to the idle rotation; shown only once the ending is recorded; they replace nothing)*

- Pechko: *"I sat up for the crack, out of habit. It had nothing to say. I sat up anyway."*
- Pechko: *"The stove is better company now it isn't working so hard."*
- Pechko: *"Frost on the sill this morning. Plain frost. I was glad of it."*
- Brana: *"Kettle boiled first go this morning. I'll not question it."*
- Brana: *"Hunters still go out and still come back. That part is ours."*
- Brana: *"I stopped checking the lamps at night. Then I started again. Habit."*
- Ilse: *"I've started a new page in the archive. It has no heading yet."*
- Ilse: *"People ask me to read the roll to them. I say it's in the Library. They ask again."*

**The Roll of Wardens mark** *(on the entry of the warden in office when Remember Them was chosen; a small lamp, drawn in code)*

> Read the roll aloud.

**The Hearth Hall scene** *(the look change, drawn in code, owner approves at T11.11)*: the frost is gone from the floor and from the sill, and a lamp sits in the window. Nothing else about the scene changes.

---

### 34.8 The Library's shelf "The Remembering" *(not shown until one entry is reached)*

- **The reading** — *"The roll, read aloud in the Hearth Hall."* Replays the **whole sequence** (R-03, the reading, R-04, R-04b if Sigrun is on the roster, the Order cards, R-09, R-11), so an interrupted ending loses nothing (D461 (3)). Skip works on the reading only. Shown after Remember Them.
- **Later** — *"Pechko, when you were not ready."* Plays R-10. Shown after Keep the Vigil.

(R-11 also sits on the existing Rime shelf, under "After the ending," with its Ilse's note. R-01 and R-02 are resident scenes and are not listed.)

---

### 34.9 What comes out: the closing line

**Removed everywhere:** the Act VI closing line (D415, D455). It is replaced by nothing. A cycle with no act simply does not show that step. (Act VI's testament D6-06 still plays at its stand; the Long Night order for cycles with an act is unchanged.)

---

### 34.10 Checks for the content test *(Claude Code builds these; they follow lore §33 Part F)*

1. Every text in 34.1 to 34.8 equals this file (string equality).
2. **Forbidden words** absent (case-insensitive, whole words): *ash, ashen, ashes, cinder, cinders, kindle, kindled, tithe, bonfire, throne, soul, souls, fed, feeding*; *hollow* only inside *Kozly Hollow* or as *the Hollow* (the check ignores the case of "the", so "The Hollow" at the start of a sentence passes).
3. **No relative years** (the lore §33 Part F rule 3 pattern), and no number of years in any text except the reading.
4. **The 40 names appear only in the reading and the Names view** (not in R-01 to R-03, R-04 to R-11, the card, or any resident line). The reading table equals lore §20 line for line, in year order.
5. **People named** are on the allowed list above.
6. R-01, R-02 and the ready line contain none of: *say the names, speak the names, read the names, their names, the forty, the Sent, Sending, seal, Deep, Forge, Drowned Bell*.
7. The Orders cards: given a fixture for each case (chapter 4 not read; read with the other Order seated; read without it; the Quenchers never opened), exactly the cards in 34.6 appear, in the fixed order, and **current seats and levels change nothing.** R-04b appears only with Sigrun on the roster.
8. **No side effects (D463):** across the whole ending, `orders` (standing, counts, seats, levels, `readWith`) and `skills` are unchanged, and no document is filed.

---

## Small edits to existing lore text

1. `lore-secrets.md` §5, the line beginning "**If you finish a cycle whose act isn't written yet,**" (it quotes the closing line).
   → **replace the whole line** with: *"If a cycle has no act, its Long Night shows nothing in that step (v0.11, D455: every act is now written and the closing line is gone)."* The old line must not remain, so no live doc quotes the removed line (T11.3).
2. `lore-secrets.md` §31, the line beginning "**After Act VI:** the cycles that follow have no act."
   → replace the whole line with: **"After Act VI:** the cycles that follow have no act. Their Long Night shows no closing line (D455). The Remembering (§34) begins from the Hold screen.""
3. `lore-secrets.md` §6: under the table add *"v0.11 ships Remember Them and Keep the Vigil (D448). The Descent is deferred to its own flesh-out; the closing scene does not promise it."* and **change the table**: the Remember Them row's "the bestiary complete (§8)" → "every contract species at Studied (§8, D449)"; the Keep the Vigil row's "Any time" → "When Remember Them is open (D459)" and its shape "Continue the cycle as an endless mode with rising difficulty. Bittersweet." → "Not yet: the game goes on as it is, and Remember Them stays open. Rising difficulty is deferred (D453)."
   Also **§8**: in "The bestiary requirement" bullet, add "(Studied, 4 kills; D449)" after "counts every species that appears in contracts or the Last Stand".
4. `lore-secrets.md` §14, Quenchers row: append *"(v0.11, D454: their stake is an answer in the ending, not a button.)"*
5. `lore-secrets.md` §34 (new final note, D463): *"After Remember Them the Long Night carries on unchanged. The fallen warden's ember still goes to the seal (§7); 'the seal no longer needs fuel' (§6) is read as R-09 says: the hearth keeps itself, and wardens still come by old habit."*
