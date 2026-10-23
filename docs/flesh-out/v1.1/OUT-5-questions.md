# OUT-5 — Updates to `docs/questions.md` (v1.1 flesh-out, 2026-10-22, revised after red-team review)

Apply these exact edits to `docs/questions.md` to close Q41, Q46 and Q48 per D505, and add the v1.1 section at the bottom. If any Find block does not match exactly once, stop and ask the owner before editing (S14).

---

## 1. Close Q41

**Find:**
```markdown
**Q41 — Name searches I could not fully settle.** *(Informational. Opened 2026-10-21.)*
My search tool returned nothing that matches "Remember Them" or "Keep the Vigil" as a game ending, and nothing for "The Remembering" next to the games in GDD §2.3. It also returned unrelated games called "Vigil" and "Remember Me." The search tool is weak for exact phrases, so please treat this as "no collision found," not "checked everywhere." Details in OUT-6.
Status: **Open (informational).**
```

**Replace with:**
```markdown
**Q41 — Name searches I could not fully settle.** *(Informational. Opened 2026-10-21; closed 2026-10-22.)*
My search tool returned nothing that matches "Remember Them" or "Keep the Vigil" as a game ending, and nothing for "The Remembering" next to the games in GDD §2.3. It also returned unrelated games called "Vigil" and "Remember Me." The search tool is weak for exact phrases, so please treat this as "no collision found," not "checked everywhere." Details in OUT-6.
Status: **Closed (accepted by the owner, 2026-10-22, D505).**
```

## 2. Close Q46

**Find:**
```markdown
- **Answer (owner):** (c), 2026-10-22 (D493). The wording and where it shows are waiting for the owner's approval before building.
```

**Replace with:**
```markdown
- **Answer (owner):** (c), 2026-10-22 (D493). Built and shipped in v1.0 (*"Not yet known well: …"* on the Remembering card). Closed in the v1.1 flesh-out (2026-10-22, D505): the owner confirmed the long-term chase felt satisfying in play and no spawn-rate change is wanted.
```

## 3. Close Q48 and update the closing list at the bottom of docs/questions.md

**Find:**
```markdown
### Q48 — The "Gaunt Wolf" name search *(informational; opened 2026-10-21)*
- **Context:** the name "Gaunt Wolf" was settled in **D71** (the v0.5 flesh-out) and is already used in lore-secrets, Acts IV and VI, the Hidebane Oil row and Stanko's unlock; v1.0 only makes GDD §8.3, §9.4 and §9.8 agree (D483). I do not know whether D71's search considered that "Gaunt" is also a Warhammer 40,000 name (Commissar Ibram Gaunt, and "-gaunt" units); GDD §2.3's 40K rule, as I read it, bans named chapters, legions and characters, and "Gaunt Wolf" is none of those. My own search found nothing that matches a game creature, but the tool is weak for exact phrases.
- **Options:** (a) Keep "Gaunt Wolf". (b) Use another name (it is a display-name change only).
- **Status:** **Open (informational).**
```

**Replace with:**
```markdown
### Q48 — The "Gaunt Wolf" name search *(informational; opened 2026-10-21; closed 2026-10-22)*
- **Context:** the name "Gaunt Wolf" was settled in **D71** (the v0.5 flesh-out) and is already used in lore-secrets, Acts IV and VI, the Hidebane Oil row and Stanko's unlock; v1.0 only makes GDD §8.3, §9.4 and §9.8 agree (D483). I do not know whether D71's search considered that "Gaunt" is also a Warhammer 40,000 name (Commissar Ibram Gaunt, and "-gaunt" units); GDD §2.3's 40K rule, as I read it, bans named chapters, legions and characters, and "Gaunt Wolf" is none of those. My own search found nothing that matches a game creature, but the tool is weak for exact phrases.
- **Options:** (a) Keep "Gaunt Wolf". (b) Use another name (it is a display-name change only).
- **Answer (owner):** (a) Keep "Gaunt Wolf", closed 2026-10-22 (D505).
```

**And find at the bottom of docs/questions.md:**
```markdown
- **Q41:** stays open (informational).
```

**Replace with:**
```markdown
- **Q41, Q46, Q48:** closed 2026-10-22 in the v1.1 flesh-out (D505).
- **Q47:** closed as answered by D486 in v1.0; settings key expanded in v1.1 with `holdView` (D503).

## v1.1 questions *(from the v1.1 flesh-out, 2026-10-22)*

No open questions at the end of the v1.1 flesh-out. Any question Claude Code hits during v1.1 starts at **Q51**.
```
