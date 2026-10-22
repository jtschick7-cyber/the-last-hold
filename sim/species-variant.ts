// v1.0 (plan TV.11, D478 (3), D485 (4)): the REPORT-ONLY "Study all 16 species" estimate. Standard
// with one extra rule (sim/species-order.ts), played twice, plus Standard itself as the control:
//   control  Standard as it is
//   A        best case: sees each contract's true species
//   B        realistic: sees only the candidate list a player sees
// 5 Monday seeds, up to 25 cycles, once, locally. Not in sim.yml, the baseline or targets.ts.
// Run: npx vite-node sim/species-variant.ts            (writes the report next to the v1.0 notes)
import { mkdirSync, writeFileSync } from 'node:fs';
import { play } from '../src/core/policies';
import { freshMemory, type PolicyMemory } from '../src/core/policies/long-night';
import { createNewGame } from '../src/core/state/new-game';
import { CONTRACT_SPECIES } from '../src/content/remembering';
import {
  actVIStandApplied,
  endingChoosable,
  namesFound,
  speciesStudied,
} from '../src/core/story/remembering';
import { STARTS } from './run';
import { speciesOrder, unstudiedSeen, unstudiedTrue } from './species-order';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const MAX_CYCLES = 25;
const MAX_DAYS = 120;
const SEEDS = 5;

type Mode = 'control' | 'A' | 'B';
const LABEL: Record<Mode, string> = {
  control: 'Standard (control)',
  A: 'A: best case (true species)',
  B: 'B: realistic (candidate list)',
};
interface Moment {
  readonly days: number;
  readonly cycle: number;
}
interface Result {
  readonly mode: Mode;
  readonly seed: number;
  readonly all16: Moment | null;
  readonly namesAndStand: Moment | null;
  readonly ending: Moment | null;
  readonly speciesAtEnd: number;
  readonly cyclesDone: number;
  readonly seconds: number;
}

const runOne = (mode: Mode, seed: number): Result => {
  const t0 = Date.now();
  const start = STARTS.mon;
  const state = createNewGame(`sim-${seed}`, start);
  const memory: PolicyMemory = freshMemory();
  if (mode === 'A') memory.contractOrder = speciesOrder(unstudiedTrue);
  if (mode === 'B') memory.contractOrder = speciesOrder(unstudiedSeen);
  let all16: Moment | null = null;
  let namesAndStand: Moment | null = null;
  let ending: Moment | null = null;
  let prevCycle = state.cycle.number;
  play(state, {
    policy: 'opening',
    startedAt: start,
    until: start + MAX_DAYS * DAY,
    memory,
    stop: (s) => ending !== null || s.cycle.number > MAX_CYCLES,
    onCheckIn: (rec, s) => {
      const at = { days: (rec.at - start) / DAY, cycle: prevCycle };
      if (all16 === null && speciesStudied(s) >= CONTRACT_SPECIES.length) all16 = at;
      if (namesAndStand === null && namesFound(s) >= 40 && actVIStandApplied(s)) namesAndStand = at;
      if (ending === null && endingChoosable(s)) ending = at;
      prevCycle = s.cycle.number;
    },
  });
  return {
    mode,
    seed,
    all16,
    namesAndStand,
    ending,
    speciesAtEnd: speciesStudied(state),
    cyclesDone: state.cycle.number - 1,
    seconds: (Date.now() - t0) / 1000,
  };
};

const fmt = (m: Moment | null): string =>
  m ? `cycle ${m.cycle}, day ${m.days.toFixed(1)}` : 'not in 25 cycles';
const median = (xs: number[]): string => {
  if (xs.length === 0) return 'n/a';
  const s = [...xs].sort((a, b) => a - b);
  return String(s[Math.floor(s.length / 2)]);
};

const started = Date.now();
const results: Result[] = [];
for (const mode of ['control', 'A', 'B'] as const)
  for (let seed = 1; seed <= SEEDS; seed++) {
    const r = runOne(mode, seed);
    results.push(r);
    console.log(
      `${mode} seed ${seed}: all 16 ${fmt(r.all16)}; ending ${fmt(r.ending)} (${r.seconds.toFixed(0)} s)`,
    );
  }

const lines: string[] = [
  '# Study all 16 species: the report-only estimate (v1.0 TV.11, D478, D485 (4), Q46)',
  '',
  `Played ${new Date().toISOString().slice(0, 10)}, 5 Monday seeds (sim-1 to sim-5), up to ${MAX_CYCLES} cycles, once, locally, by \`sim/species-variant.ts\`. Not part of \`sim.yml\`, the baseline or \`sim/targets.ts\`; nothing here is a row.`,
  '',
  "Standard plus one rule: among the contracts whose tier is within one of the tier Standard would pick, take the one whose species is not yet Studied (ties in Standard's order), else Standard's choice. **A** sees each contract's true species; **B** sees only the candidate list a player sees (a contract counts as unstudied if any candidate is). The control is plain Standard.",
  '',
  "A cycle is counted as the one the check-in began in. Days are game days from the start. The owner's own estimate of about 20 cycles includes the early cycles of their own save, and a real player does not play Standard's schedule; read these as a floor, not a forecast.",
  '',
  "| Player | Seed | All 16 Studied | 40 names and Act VI's stand | Ending choosable |",
  '|---|---|---|---|---|',
  ...results.map(
    (r) =>
      `| ${LABEL[r.mode]} | ${r.seed} | ${fmt(r.all16)} | ${fmt(r.namesAndStand)} | ${fmt(r.ending)} |`,
  ),
  '',
  '| Player | Median cycle, all 16 Studied | Median cycle, names and stand | Median cycle, ending choosable | Seeds that got there |',
  '|---|---|---|---|---|',
  ...(['control', 'A', 'B'] as const).map((m) => {
    const rs = results.filter((r) => r.mode === m);
    const c = (k: 'all16' | 'namesAndStand' | 'ending'): number[] =>
      rs.flatMap((r) => (r[k] ? [r[k].cycle] : []));
    return `| ${LABEL[m]} | ${median(c('all16'))} | ${median(c('namesAndStand'))} | ${median(c('ending'))} | ${c('ending').length} of ${rs.length} |`;
  }),
  '',
  `Total run time ${((Date.now() - started) / 60000).toFixed(1)} minutes.`,
  '',
];
const out = new URL('../docs/flesh-out/v1.0/', import.meta.url);
mkdirSync(out, { recursive: true });
writeFileSync(new URL('species-estimate.md', out), lines.join('\n'));
console.log('wrote docs/flesh-out/v1.0/species-estimate.md');
