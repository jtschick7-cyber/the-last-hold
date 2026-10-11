# Decisions Log

Newest at the bottom. Status: **Decided** (owner's call), **Accepted** (proposed, confirmed by owner), **Proposed** (awaiting confirmation). Reversing a decision adds a new row that supersedes the old one.

| ID | Date | Decision | Source | Status |
|---|---|---|---|---|
| D01 | 2026-10-11 | Tone: heroic fantasy with dark edges | Brief, decision 1 | Decided |
| D02 | 2026-10-11 | Platform: both equally; phone-first layout that scales up | Brief, decision 2 | Decided |
| D03 | 2026-10-11 | Play pattern: balanced; quick check-ins, plus Delves for longer sessions | Brief, decision 3 | Decided |
| D04 | 2026-10-11 | Visual style: pixel-art-style sprites from the start | Brief, decision 4 | Decided |
| D05 | 2026-10-11 | Setting: blend of Slavic and Nordic folklore | Brief, decision 5 | Decided |
| D06 | 2026-10-11 | Prestige: voluntary with pressure. Threat rises over the cycle; the player chooses when to make the Last Stand, and its outcome sets the relic payout | Brief, decision 6 | Decided |
| D07 | 2026-10-11 | Hunter death: injuries with recovery time; death only on reckless or badly prepared contracts | Brief, decision 7 | Decided |
| D08 | 2026-10-11 | Offline progress: capped at about 12 h, with upgrades that extend the cap | Brief, decision 8 | Decided |
| D09 | 2026-10-11 | Pacing to first Long Night: about 3–5 days | Brief, decision 9 | Decided |
| D10 | 2026-10-11 | Numbers fully transparent: formulas, odds, and full logs | Brief, decision 10 | Decided |
| D11 | 2026-10-11 | Art: asset packs where they fit, code-generated for the gaps, all swappable | Brief, decision 11 | Decided |
| D12 | 2026-10-11 | Audience: just the owner; no tutorial or onboarding required | Brief, decision 12 | Decided |
| D13 | 2026-10-11 | Repo to be created fresh; Claude helps set it up | Owner | Decided |
| D14 | 2026-10-11 | CC0 assets only; no paid art. Narrows D11: "asset packs" means CC0 packs only | Owner | Decided |
| D15 | 2026-10-11 | Claude writes the full central mystery and lore | Owner | Decided |
| D16 | 2026-10-11 | Check-in model: 4–6 check-ins of 2–3 min on workdays, plus a 15–30 min Delve session a few times a week | Claude proposal | Accepted |
| D17 | 2026-10-11 | Stack: TypeScript (strict), Vite, Vitest, Preact, Vite PWA plugin. The core is pure TypeScript so it can run headless | Claude proposal | Accepted |
| D18 | 2026-10-11 | Large numbers: standard JS numbers with a custom formatter; add a big-number library only if the simulator shows overflow | Claude proposal | Accepted |
| D19 | 2026-10-11 | World-boss attempts reset at 4 a.m. local time; Legendary Hunts run on a real calendar about every 2–3 weeks; both carry over across Long Nights | Claude proposal | Accepted |
| D20 | 2026-10-11 | Delve rewards: capped weekly currency, lore, and sidegrade relics; idle-only play reaches all content about 20–30% slower | Claude proposal | Accepted |
| D21 | 2026-10-11 | No anti-cheat; a clock set backward is ignored | Claude proposal | Accepted |
| D22 | 2026-10-11 | Docs are Markdown under `docs/`, plus `CLAUDE.md` at the root; diagrams in Mermaid | Claude proposal | Accepted |
| D23 | 2026-10-11 | Process: outline first, then one section per turn (design doc, technical design, implementation plan, CLAUDE.md), each ending with a list of judgment calls | Claude proposal | Accepted |
| D24 | 2026-10-11 | Deliverables outline (`docs/outline.md`) approved as written, including its 10 judgment calls: separate lore bible, role and damage-type names, no storage caps in v0.1, pacing targets, typed TypeScript content files, standard JS numbers, browser smoke test from v0.2, v0.0 bootstrap milestone, premise direction and working names, final-act timing left open | Owner ("push and go") | Accepted |
| D25 | 2026-10-11 | Repo created: `jtschick7-cyber/the-last-hold` (public, Node `.gitignore`, no license); GitHub Pages deploys via GitHub Actions | Owner | Decided |
