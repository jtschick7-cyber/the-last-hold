# OUT-5 — Questions (v1.0 flesh-out, 2026-10-21, revised after the red-team review)

Append to `docs/questions.md`. Q46 and up. Format as in the file.

## v1.0 questions *(from the v1.0 flesh-out, 2026-10-21)*

### Q46 — What to do about the time it takes to Study all 16 species *(opened 2026-10-21; blocks nothing, answered after TV.11)*
- **What I found:** the 40 names and Act VI's stand arrive by cycle 6 in the simulator (D470). The owner estimates about **20 cycles** to Study all 16 contract species in their own play (a count that includes the early cycles of their own save). So the species half of the ending's gate is the long half. v1.0 is an audit, so nothing is changed (D478).
- **What happens next:** TV.11 runs a report-only variant of Standard that prefers unstudied species and reports days and cycles for all 16 Studied: once as a **best case** (it sees each contract's true species) and once as a **realistic** case (it sees only the candidate list a player sees).
- **Options (after the estimate):** (a) **Leave it.** The ending is a long-term goal, and the card shows what is missing. (b) **Ease it with a change to the Studied rule.** This is bigger than it sounds: `knowledge.studiedKills` is locked and also drives the Studied damage bonus, half clue time, the six Delve relics' idle sources ("every X species Studied", GDD §8.10a), the Forgotten's Nameless count and every row that depends on them, so it needs a decisions row and a re-run of the whole simulator. (c) **A small UI help** (the Remembering card or the Bestiary names the species still missing). This needs new player-facing text and a GDD edit, which v1.0's rule against new strings forbids without a decisions row, so it would be a new row and, at most, a small extra task. (d) Something you name.
- **Recommendation:** decide after the estimate. If both variants also take far longer than cycle 6, (c) is the lightest fix; if the realistic case is close to your 20, (a).
- **Blocks:** nothing in v1.0.
- **Answer (owner):** *(open)*

### Q47 — Where do the settings live? *(opened 2026-10-21; answered by the review)*
- **Answer from the review:** the existing settings (theme, best-buy hint, rate unit, reduce motion) are **inside the save** (technical design §5.2). Ruling D486 (Proposed): they stay as they are, with no schema change; Text size and the Backup reminder go in a new settings key outside the save; Reduce motion stays a boolean read as "phone or switch".
- **Status:** **Answered (a)** by D486, pending the owner's yes (D491).

### Q48 — The "Gaunt Wolf" name search *(informational; opened 2026-10-21)*
- **Context:** the name "Gaunt Wolf" was settled in **D71** (the v0.5 flesh-out) and is already used in lore-secrets, Acts IV and VI, the Hidebane Oil row and Stanko's unlock; v1.0 only makes GDD §8.3, §9.4 and §9.8 agree (D483). I do not know whether D71's search considered that "Gaunt" is also a Warhammer 40,000 name (Commissar Ibram Gaunt, and "-gaunt" units); GDD §2.3's 40K rule, as I read it, bans named chapters, legions and characters, and "Gaunt Wolf" is none of those. My own search found nothing that matches a game creature, but the tool is weak for exact phrases.
- **Options:** (a) Keep "Gaunt Wolf". (b) Use another name (it is a display-name change only).
- **Status:** **Open (informational).**

### Q49 — Two polish items earlier documents promised to v1.0 *(opened 2026-10-21; asks for a yes or no)*
- **What I found:** GDD §5.12.12 says "Event-only cosmetics, art for the Great Beasts' full portraits and the legendary hunters' animation are polish (v1.0)", and the v0.9 plan says the same. Neither was in the v1.0 scope you approved.
- **Proposal (D490):** the Great Beasts' portraits are part of the art pass if you mark them; **event-only cosmetics and the legendary hunters' animation are deferred past v1.0** because they are new content, and the GDD line is edited to say so (OUT-2a E12).
- **Options:** (a) Defer them as proposed (my recommendation). (b) Add them to v1.0, which would add tasks and probably 2–4 sessions. (c) Cut them for good.
- **Answer (owner):** **(a) yes, defer them as proposed,** 2026-10-21 (D490).

### Q50 — Two practical questions for the art and the icon *(asked and answered 2026-10-21)*
- (1) **Which phone do you play on, iPhone or Android?** **Answer: iPhone.** So the apple-touch-icon matters, the "export your save code before removing or re-adding the app" warning applies, and the phone's own text-size setting is **not** expected to reach the game (iPhone home-screen apps generally do not follow it), which makes the in-app Text size the real control. TV.4a still checks what the build does today.
- (2) **How can you view the contact sheets?** **Answer: in the conversation,** if Claude Code provides them there. Claude Code therefore **shows every contact sheet and before/after sheet in the conversation** (and also commits them to `docs/flesh-out/v1.0/contact-sheets/`); if its tool cannot show images, it stops and tells the owner.
- **Status:** **Answered**, owner, 2026-10-21.

### Closed or answered by this flesh-out
- **Q42 (Hearth Hall look):** closed; the frost and lamp art is built and was approved in the v0.11 playtest.
- **Q43 (Gaunt or Gloam Wolf):** **Answered: Gaunt Wolf**, owner, 2026-10-21 (D483; the name was already settled in D71).
- **Q35:** already closed in D467; the v0.11 summary's question 10 is stale.
- **Q41:** stays open (informational).
