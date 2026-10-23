# OUT-5 — Edits to `docs/questions.md` (v1.2 flesh-out, 2026-10-23)

Each **Find** was copied from the Project's copy of `docs/questions.md` on 2026-10-23 and occurs **exactly once**. If one does not match exactly once, stop and tell the owner.

## Q1 — Close Q52 (its status text is stale)

D514 and D515 already corrected the piece counts in the GDD, the plan and the technical design (`progress.md`, 2026-10-23), so Q52's last sentence is out of date.

**Find:**
```markdown
The doc numbers (GDD, D501, plan) are still to be corrected at the next doc-edit approval.
```

**Replace with:**
```markdown
**Closed 2026-10-23: the doc numbers were corrected by D514 (GDD, plan) and D515 (technical design §19.2); D501's row stays as written, per the log's rule.**
```

**And find (so Q52 does not read both open and closed):**
```markdown
- **Status:** **Open (informational).** TL.8:
```

**Replace with:**
```markdown
- **Status:** **Closed (informational).** TL.8:
```

## Q2 — Replace the "no open questions" line for v1.1 with the v1.2 questions

**Find:**
```markdown
Any question Claude Code hits during v1.1 starts at **Q51**.
```

**Replace with:**
```markdown
Any question Claude Code hits during v1.1 starts at **Q51**. *(Q51 and Q52 were raised during v1.1; both are closed.)*
```

## Q3 — Append the v1.2 questions

This is an append, not a Find / Replace: add the text below to the very end of `docs/questions.md` (after the Q52 block), with one blank line before it.

**Append at the end of the file:**

```markdown

## v1.2 questions *(from the v1.2 flesh-out, 2026-10-23)*

### Q53 — Which clips make the seven sounds? *(opened 2026-10-23; blocks SF.9)*
- **Context:** Claude cannot hear. The sounds are picked by ear (D524). SF.4 builds an audition page (preview build only) with about 5 candidate clips per sound from the four Kenney packs (Interface Sounds, Impact Sounds, RPG Audio, Music Jingles).
- **Question:** for each of Build, Launch, Place, Win, Lose, Fanfare and Nightfall, which candidate do you pick, or "none of these"?
- **Options:** (a) pick from the candidates (recommended); (b) "none of these" for a slot, then Claude Code offers a second round of about 5 from the same packs; (c) allow one CC0 clip from another site for that slot, each source separately approved (D524 (1)).
- **Recommendation:** (a). Plan about 15 minutes of listening.
- **Blocks:** SF.9 (converting and shipping). SF.5–SF.8 do not wait for it.
- **Answer (owner):** *(pending)*

### Q54 — Will the picked sounds fit under 600 KB with the new code? *(opened 2026-10-23; resolved in SF.9)*
- **Context:** v1.1 measured 582,081 bytes (568 KB). The row is 614,400 bytes, so 32,319 bytes (about 31.6 KB) are left for the sound files **and** the new sound code (estimated 3–6 KB gzipped; not measured). The sound files are capped at 30 KB (D523).
- **Question (asked only if the picks do not fit):** SF.9 measures the build without sounds, computes the budget (`614,400 − that − 1,024`, at most 30 KB) and converts the picks. If they do not fit: (a) use fewer or shorter sounds (recommended); (b) pick shorter candidates for the longest slots; (c) propose a new measured size row for a later decision (not in v1.2). **The row is never changed silently.**
- **Status:** **Open until SF.9.** Claude Code writes the numbers in the progress entry.

### Q55 — Does Safari on your iPhone decode and play the files? *(opened 2026-10-23; answered at the playtest)*
- **Context:** Web Audio on iPhone needs a tap to start, follows the silent switch, and can stop after a call or a lock (D522 (3)). Headless tests cannot prove the real phone's behaviour. CI's WebKit may not decode MP3 (SF.10 says so if it cannot).
- **Question:** at the playtest, do all seven sounds play on your iPhone (live volume, silent switch respected, resume after leaving the app)?
- **Options:** (a) yes, all good; (b) one or more fail: Claude Code is told which and what happened, and the fix is a follow-up task (for example another file format for that device) with the owner's yes.
- **Status:** **Open until the playtest.**

### Q56 — The container may have no audio converter *(opened 2026-10-23; may block SF.4, which converts the audition candidates)*
- **Context:** the files are converted to mono MP3 while authoring (D522 (2)). Claude Code's container may lack a converter (such as ffmpeg). The audition candidates must be converted to MP3 at SF.4 (the packs ship as OGG, which an iPhone may not play), so the question comes up there, not later.
- **Options:** (a) install a system converter in the container (no change to the repo; recommended); (b) the owner converts on their computer with a tool Claude Code names, and uploads the files; (c) a new npm dev dependency for encoding (needs the owner's yes; it never ships to the player).
- **Recommendation:** (a), then (b). (c) only with the owner's yes.
- **Answer (owner):** *(pending; asked only if SF.4 finds no converter)*
```
