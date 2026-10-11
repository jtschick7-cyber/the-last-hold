# The Last Hold

An idle game about a warden rebuilding a ruined frontier fortress. It runs in the browser, installs to a phone's Home Screen, and plays offline.

- **Play (live):** https://jtschick7-cyber.github.io/the-last-hold/
- **Preview (the milestone being built):** https://jtschick7-cyber.github.io/the-last-hold/preview/

Live and preview are separate apps with separate saves. On iPhone, install each one to the Home Screen before playing; the installed app keeps its own storage, apart from Safari.

## For whoever builds it

Start with [`CLAUDE.md`](CLAUDE.md). The design lives in [`docs/`](docs/): the game design (`gdd.md`), the technical design, the implementation plan, and the decisions log. Progress notes are in `docs/progress.md`.

```
npm ci
npm run dev      # local dev server
npm run check    # typecheck, lint, format, tests, fast simulator checks
npm run build    # production build (LH_CHANNEL=preview for the preview channel)
```

Node 22 (see `.nvmrc`).
