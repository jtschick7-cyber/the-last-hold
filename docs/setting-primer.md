# The Last Hold — Setting Primer

**Spoiler-free.** Claude Code may read this from v0.1 on. It covers everything needed to write v0.1–v0.4 text without knowing the central mystery.
**The full truth** lives in `lore-secrets.md`, which is **kept outside the repo until v0.5** (D36).
**Markers:** **[JC]** = judgment call. All proper nouns are working names until they pass the collision search (GDD §2.3).

---

## 1. Tone

**Heroic fantasy with dark edges** (D01).
- The dark is real, but the hold is a light.
- Hunters are ordinary brave people. Villagers are tired, wary, and grateful when it counts.
- Grief and old wrongs sit underneath, shown one small detail at a time and never announced.
- Humor is dry and occasional.
- Violence shows up as outcomes ("wounded: 3 days to recover"), never gore.

**The present is hopeful.** Every cycle, the villages trust the hold a little more, and the hunters become something like an order again.

---

## 2. The Gloamreach

A wide frontier between the southern kingdoms and the frozen north, where the valley fog never fully lifts.

| Band | Character | Folklore flavor | Villages |
|---|---|---|---|
| **The Lowlands** | River country, old woods, barley fields, mill-towns | Slavic | Dubno Ford, Kozly Hollow, Mirograd |
| **The Fells** | Cold highlands, fjord inlets, barrow-hills, standing stones | Nordic | Velkvik, Ravenfell |
| **The Deep** | The chasm beneath Stanholm. Nobody goes there. | — | — |

**Stanholm** stands where the lowland river meets the first fells. It's the only place both peoples ever agreed on anything.

**What everyone knows:**
- **Stanholm was the seat of the Emberwrights,** an order of fire-smiths who forged silvered and runed steel and fought the dark for the common folk.
- **Their public vow:** *"The fire for the folk."*
- **The hold fell twenty years ago in a single night,** the night the sky went black over the fells. The order died with it.
- **Since then, monsters are more common and crueler.** Grief that once faded now curdles. A careless burial now always rises.
- **Now a warden has come,** and the hearth in the ruined Hearth Hall is warm again.

**How the villages tell the Fall.** They don't agree. Most curse the order's last champion, **the Hearthblade** *(D142)*, and say she broke something she shouldn't have. A few quietly bless her. Nobody says why. *(That disagreement is deliberate; see §8.)*

---

## 3. Villages

**Who runs them:** a **thane** leads a fell village; a **headman or headwoman** leads a lowland one; **"village heads"** covers both.

| Village | Band | Head | Public face | Starting trust in the hold |
|---|---|---|---|---|
| **Dubno Ford** | Lowland | Headwoman **Marta Dubska** | River crossing and ferry. Proud, practical, quick to complain, quicker to help. | Wary |
| **Kozly Hollow** | Lowland | Headman **Bohdan Kozel** | Goatherds in the old wood. Insular. Gives little, notices everything. | Cold |
| **Mirograd** | Lowland | Headwoman **Ilona Sváteková** | The largest town, a market and mill-town. Practical about everything except grief. | Hopeful |
| **Velkvik** | Fells | Thane **Gunnar Ravnsson** | Fjord fishers. Hard-handed, generous once they trust you. | Wary |
| **Ravenfell** | Fells | Thane **Sólveig Arnadóttir** | A hamlet among the barrow-hills. Superstitious, for good reason. | Cold |

**Trust** rises one step at a time (Cold → Wary → Hopeful → Trusting → Sworn). It shows in the tone of contract notices and resident lines. **[JC: displayed from v0.5; seeded silently from v0.2.]**

---

## 4. Daily life

- **The villages are tired but not broken.** They pay bounties in silver and gifts, they name children after hunters who saved them, and they argue about everything.
- **Hunters are respected and slightly feared.** That's an old Gloamreach attitude toward anyone who walks toward monsters.
- **Religion is local and practical:** offerings to the domovoi, salt at thresholds, bells against drowning. No organized church appears. **[JC]**

---

## 5. Residents (public faces)

| Resident | Role | Voice |
|---|---|---|
| **Pechko**, the domovoi | The hold's household spirit, living behind the Hearth Hall stove | Grumpy and loving. Speaks in household metaphors: stoves, brooms, bread. Knows more than he says. |
| **Brana Kolar**, the steward | Runs the peasants and the stores; the voice of the Hold economy | Practical, dry, quietly brave. Counts everything. |
| **Ilse Marrow**, the archivist *(arrives v0.5)* | Keeps the hold's records and letters | A highland scholar: obsessive, kind, always half a page behind |

**Hunter public bios** (each hunter has a home band and a one-line backstory):

| Hunter | Band | One line |
|---|---|---|
| Halvar Two-Smokes | Fells | Former charcoal-burner. Calm, enormous, and smells permanently of smoke. |
| Zora Sedlak, the Ferrywoman | Lowlands | Ran the Dubno ferry until the river turned deadly. Fights with a boathook. |
| Old Ostap | Lowlands | Village bonesetter, 58. Has buried two masters and a wife, and isn't done yet. |
| Bjarna Ice-Hand | Fells | Velkvik fisherwoman whose rime-dipped spear never quite thaws |
| Vesna of the Weir | Lowlands | Herbwife who knows which roots heal and which ones stop hearts |
| Radek the Gravedigger | Lowlands | Has buried half of Mirograd. Lately his shovel has been silver-shod. |
| Sigrun Halfhand | Fells | Lost a hand young and won't say how. Knows forge-work better than she should. |
| Toma Kettle | Wanderer | Tinker and talker, with opinions about every price at the hold |
| Stanko Sleepless | Lowlands | Kozly Hollow goatherd who raised a wolf pup with his flock. Says the grey ones aren't wolves anymore, and he'd know. |
| Herdis Strayfinder | Fells | Has kept Ravenfell's sheep alive since she was nine, and found every one that strayed. Says hunters are easier: they tell you where it hurts. |

---

## 6. Writing specs for v0.1–v0.4 text

### 6.1 Building descriptions

- 1–2 sentences, present tense.
- Say what the building is now. Where it's relevant, add one detail of what it was in old Stanholm.
- Examples:
  - *Cottage* — "Four walls, a roof, a door that mostly shuts. Someone will call it home by nightfall."
  - *Smithy* — "The old forge-stones are still here, black with three hundred years of fire. They take heat faster than they should."

### 6.2 Brana and Pechko lines

Short, at most one sentence, one per trigger, each with 3–5 variants.

| Trigger | Who | Example |
|---|---|---|
| First building bought | Brana | "That's one. I'll start a list." |
| Idle peasants | Brana | "I've got hands sitting on their hands, warden." |
| Long absence (≥ 8 h) | Pechko | "You were gone. The stove wasn't. Sit." |
| Peasant milestone (10, 25, 50…) | Brana | "Ten souls. Ten mouths. I'll manage." |
| Rank-up | Pechko | "The old stones remember being a fortress. Let them." |
| First contract success *(v0.2)* | Brana | "Silver. Real silver. Say it again so I believe it." |

### 6.3 Village contract notices *(v0.2+)*

- From the village head, or a villager they send.
- 2–4 sentences. Describe **symptoms, never the monster's name**. Sign with name and village.
- The tone follows the village's trust level: colder villages are terser.
- Example (Dubno Ford, Wary):
  > *Two drowned at the ford this month, both strong swimmers. The ferry's tied up and the far bank is starving for it. We'll pay. — Marta Dubska, Dubno Ford*

### 6.4 Bestiary entries *(v0.3+)*

Each entry has:
- **Blurb:** 2–3 sentences in the voice of a hunter's notebook, drawn from folklore (GDD §2.4). Practical, a little wry.
- **"What it was":** one sentence on whose grief or which burial made this one. Every entry has one, and filling the bestiary means remembering them.
  - *Upyr* — "What it was: a miller buried in a hurry in the plague year, with no one left to watch the grave."
  - *Rusalka* — "What it was: a girl from Dubno Ford who walked into the river the spring her betrothed didn't come home."

### 6.5 Ranks restore Stanholm

Each Rank-up uncovers part of the old hold, with a short inscription.
- **Keep** (v0.1): the gatehouse and the **Roll of Honor**, a wall of names cut in bronze.
  - Inscription: *"Here are cut the names of those who gave their warmth to the hearth, that the folk might sleep."*
- **Citadel and Bastion** *(v0.4)*: neutral descriptions only, "the old Forge Hall" and "a sealed stair going down." Their inscriptions arrive with Act I in v0.5 (`lore-secrets.md`). **[JC]** The v0.4 text (D106), kept bare so v0.5 can replace or extend it:
  - *Citadel:* "The roof is back on the old Forge Hall. Its forges are cold."
  - *Bastion:* "Under the Bastion floor, a stair goes down to a sealed door."

### 6.6 The vow *(v0.2+)*

- The first time the hold reaches **Keep with hunters on the roster**, **Halvar and Old Ostap** lead the hunters in retaking the order's public vow, *"the fire for the folk,"* over the restored gatehouse.
- The hunters start calling themselves Emberwrights, half as a joke at first. **[JC]**

### 6.7 Early seeds (allowed from v0.2) **[JC]**

At most **1 in 10** contract notices may carry one of these. Never more than one per notice, never explained:
- Kozly Hollow notices sometimes end with *"…and may the Hearthblade's name be kept warm."*
- A Mirograd notice may mention *"my boy, who went onward with the order."*
- Ravenfell notices never mention the Hearthblade, whether blessing or curse.

### 6.8 Long Night text, before the story (v0.4) **[JC]**

v0.4 ships the Long Night's mechanics before Act I exists. Its text stays neutral:
- **The Last Stand:** the hold's defenders against "the dark at the walls." No names for what's coming.
- **After the stand:** Pechko, short: *"The walls fell. The hearth didn't. Someone will come."*
- **A new warden arrives:** *"Seasons pass. Someone new walks up the road, hands warm in the cold."* No name yet; naming starts in v0.5.
- **Embers:** "what the last warden left in the hearth." Nothing more.
- **Arriving at v0.4** (old saves only, GDD §5.9.8, D112): title "The Long Night"; *"The dark is at the walls tonight. Everyone who can hold a spear goes up."*, followed by a plain out-of-world note on what the first Long Night does to the save.

---

## 7. Naming rules

- Follow GDD §2.5 (Slavic and Nordic blend) and GDD §2.3 (the avoid list, including the Dark Souls and 40K clusters).
- **Before v0.5, don't invent names or explanations** for the order's secrets, for what happened to the apprentices who went onward, or for whatever lies beneath the hold. Those arrive with the story in v0.5. If a text seems to need one, ask.

---

## 8. Voice sample

This is Act I document D1-04. It's in the primer as the writing standard for every in-world text.

> *To the warden at Stanholm, if there is one again —*
>
> *My Jaro went up to the hold twenty-four springs ago with the order's ribbon on his sleeve. He was sixteen. We had a feast for it. The Wrights said he would be sent onward to the forges in the south, that a smith's life is a busy one, and that I should not expect letters.*
>
> *I did not expect letters. I waited four springs anyway, because a busy boy can still find an hour. Then the sky went out over the hold, and the Wrights were dead, and nobody could tell me where "onward" is. I have waited twenty springs more.*
>
> *If your hunters find a ribbon with a blue stitch at the hem, it is his. I would like it back.*
>
> *— Halina, of Mirograd, by the well*

**The rule:** plain, specific, human, and one wrongness at a time. No text ever states a secret outright.
