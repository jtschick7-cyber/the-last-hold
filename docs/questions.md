# Open questions for the owner

Claude Code adds a question here when a task is blocked and the owner isn't available (CLAUDE.md, "Working with the owner"). The blocked task is marked `[?]` in the plan.

**Format:**

### Q<n> — <short title> (blocks T<x.y>) — open | answered
- **Question:**
- **Options:** (a) … (b) …
- **Recommendation:**
- **Answer (owner):** (a), 2026-10-12. The download steps are in `art-src/PACKS-NEEDED.md`, together with the art packs.

---

### Q1 — Where the CC0 pixel font comes from (blocks T1.20a) — answered
- **Question:** GDD §9.1 and technical design §10 call for a CC0 pixel font for headings and the resource bar. Claude Code's sessions can't reach Kenney, OpenGameArt or similar sites, and npm has no CC0 pixel font. How should we get one?
- **Options:**
  (a) You download **Kenney Fonts** (kenney.nl/assets/kenney-fonts, CC0) and put the zip in `art-src/fonts/`. I pick one face, add it with a manifest entry, and credit it. It can ride along with the art pack list (T1.30).
  (b) I draw an original pixel font in-repo (digits, A–Z, a few symbols): CC0 by authorship, no download, but plainer.
  (c) Keep the system monospace stand-in until the v1.0 art pass.
- **Recommendation:** (a). Kenney's fonts are made for exactly this and are CC0. I'd fold it into the T1.30 pack list so you download once.
- **Answer (owner):**

### Q2 — Which palette (blocks T1.28) — open
- **Question:** every piece of art gets recolored to one 32-color palette (GDD §9.12). Which of the three candidates?
- **Where to look:** https://jtschick7-cyber.github.io/the-last-hold/preview/palettes.html shows each palette's 32 colors and a small Hold mock-up in it.
- **Options:** (a) DawnBringer 32: earthy and balanced, a classic for fantasy pixel art. (b) Endesga 32: brighter and more saturated, cooler darks. (c) Zughy 32: warm and muted, with plum-brown darks.
- **Recommendation:** (c) Zughy 32. Its warm, muted darks fit "heroic with dark edges" and the candlelit theme best, and its greens and browns suit fields, timber and stone. (a) is a close second.
- **Answer (owner):**

### Q3 — Download the art packs and the font (blocks T1.31 and T1.20a) — open
- **What's needed:** four CC0 zip files from Kenney, uploaded to the repository. The exact list and step-by-step instructions are in `art-src/PACKS-NEEDED.md`.
- **Answer (owner):** say "uploaded" when it's done.
