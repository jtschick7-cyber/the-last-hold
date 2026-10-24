import { bandLabels, type Band } from '../src/content/story/scenes';
import { bandFor } from '../src/core/story/band';
import { median } from './checks/helpers';
import type { RunResult } from './run';
import { E_GRID, S_GRID, STEP_KINDS, type StepKind, type VigilProbe } from './vigil-probe';

// Plan KV.8 (D546 (1), D549 (1)): the Rising Vigil curve, written for the owner to read before
// answering Q57 (steady additive steps or compounding steps). Medians across the Monday seeds, with
// the range, never an average; the band is the one the median waves earn.

const probes = (runs: readonly RunResult[]): { seed: string; probe: VigilProbe }[] =>
  runs.flatMap((r) => (r.vigil?.probe ? [{ seed: r.spec.seed, probe: r.vigil.probe }] : []));

const letter: Record<Band, string> = { broken: 'B', held: 'H', triumphant: 'T' };
const range = (xs: readonly number[]): string =>
  Math.min(...xs) === Math.max(...xs) ? `${xs[0]}` : `${Math.min(...xs)}–${Math.max(...xs)}`;
const row = (cells: readonly string[]): string => `| ${cells.join(' | ')} |`;
const header = (first: string, levels: readonly number[]): string[] => [
  row([first, ...levels.map((l) => `L${l}`)]),
  row(['---', ...levels.map(() => '---')]),
];
const kindName: Record<StepKind, string> = {
  additive: 'Additive step (1 + w × Threat + s × L)',
  compounding: 'Compounding step (1 + w × Threat + (1 + s)^L − 1)',
};
const pointName = (i: number): string => (i === 0 ? "the stand's own Threat" : 'twice that Threat');

/** Waves held at each level: cross-seed median with the range, then the band of that median. */
const wavesTables = (all: { seed: string; probe: VigilProbe }[], kind: StepKind, t: number) => {
  const levels = Array.from({ length: (all[0]?.probe.levels ?? 0) + 1 }, (_, i) => i);
  const threats = all.map((a) => Math.round(a.probe.threats[t]?.threat ?? 0)).join(', ');
  const out = [
    `#### ${kindName[kind]}, ${pointName(t)} (Threat ${threats} by seed)`,
    '',
    'Cells: median waves held (range over the seeds), then the band: B Broken, H Held, T Triumphant.',
    '',
    ...header('s', levels),
  ];
  S_GRID.forEach((s, si) => {
    out.push(
      row([
        `${s}`,
        ...levels.map((l) => {
          const pts = all.map((a) => a.probe.threats[t]?.waves[kind][si]?.[l]?.median ?? 0);
          const m = median(pts);
          return `${m} (${range(pts)}) ${letter[bandFor(m)]}`;
        }),
      ]),
    );
  });
  return out;
};

/** Waves lost by level 1, 2 and 3 for each seed (what KV.9's rule reads). */
const lostTable = (all: { seed: string; probe: VigilProbe }[], kind: StepKind, t: number) => {
  const out = [
    `#### Waves lost, per seed: ${kindName[kind]}, ${pointName(t)}`,
    '',
    row(['s', 'seed', 'L0', 'lost at L1', 'lost at L2', 'lost at L3']),
    row(['---', '---', '---', '---', '---', '---']),
  ];
  S_GRID.forEach((s, si) => {
    for (const a of all) {
      const w = a.probe.threats[t]?.waves[kind][si] ?? [];
      const l0 = w[0]?.median ?? 0;
      out.push(
        row([`${s}`, a.seed, `${l0}`, ...[1, 2, 3].map((l) => `${l0 - (w[l]?.median ?? 0)}`)]),
      );
    }
    const losts = [1, 2, 3].map((l) =>
      median(
        all.map(
          (a) =>
            (a.probe.threats[t]?.waves[kind][si]?.[0]?.median ?? 0) -
            (a.probe.threats[t]?.waves[kind][si]?.[l]?.median ?? 0),
        ),
      ),
    );
    out.push(row([`${s}`, '**median**', '', ...losts.map((x) => `**${x}**`)]));
  });
  return out;
};

/** Total Embers at levels 0 to 3 for every (s, e): cross-seed median, and its ratio to level 0. */
const embersTable = (all: { seed: string; probe: VigilProbe }[], kind: StepKind, t: number) => {
  const out = [
    `#### Embers at levels 0 to 3: ${kindName[kind]}, ${pointName(t)}`,
    '',
    'Cells: median total Embers, and its ratio to level 0 (the e rule wants 1.00 at levels 1 to 3).',
    '',
    row(['s', 'e', 'L0', 'L1', 'L2', 'L3']),
    row(['---', '---', '---', '---', '---', '---']),
  ];
  S_GRID.forEach((s, si) =>
    E_GRID.forEach((e, ei) => {
      const at = (l: number): number =>
        median(all.map((a) => a.probe.threats[t]?.embers[kind][si]?.[ei]?.[l] ?? 0));
      const base = at(0);
      out.push(
        row([
          `${s}`,
          `${e}`,
          `${base}`,
          ...[1, 2, 3].map((l) => `${at(l)} (${(base === 0 ? 0 : at(l) / base).toFixed(2)})`),
        ]),
      );
    }),
  );
  return out;
};

export const curveMarkdown = (runs: readonly RunResult[]): string => {
  const vigil = runs.filter((r) => r.vigil !== undefined);
  const all = probes(runs);
  const lines: string[] = [
    '# The Rising Vigil curve (plan KV.8, measured, not decided)',
    '',
    'Written by `npm run sim:vigil`. **Nothing here changes a constant**: `vigil.strengthPerLevel` and `vigil.embersPerLevel` are still the 0.25 placeholders; KV.9 picks them after the owner answers Q57.',
    '',
    '## What was measured',
    '',
    `- **The Vigilant** (D546 (2)) plays like Standard on the ${vigil.length} Monday seeds, opens the Remembering gate with the **debug shortcut** \`debug.rememberingOpenGate\` once Act VI's stand is applied (Q58), switches Rising Vigil On and makes 3 stands (levels 1, 2, 3).`,
    `- **Why \`debugUsed\` is true:** the shortcut is a debug command, so the run is marked. It proves the switch, the levels and the curve; it does not prove a real player reaches the gate (the reachability row does that).`,
    `- **The probe** (D546 (1)): a copy of the Vigilant's state at the check-in where it makes its first stand with the switch On. At levels 0 to 10 it runs ${all[0]?.probe.samples ?? 100} practice stands with the same seeds at every level, at two Threat points (the stand's own, and twice it), for a grid of \`s\` (${S_GRID.join(', ')}) and \`e\` (${E_GRID.join(', ')}), for both steps. Waves held depend on \`s\` only; the Embers are the real payout of the median waves.`,
    '- **Additive** adds `s × L` to the wave strength; **compounding** adds `(1 + s)^L − 1` (the same percent harder at each level). For Embers the same two forms with `e`. In the probe the compounding value is tried as the per-level step `((1 + s)^L − 1) ÷ L`, so the sum is the same number.',
    '- Cells are the **median over the seeds** (the range in brackets), never an average.',
    '',
    "## The Vigilant's real stands (placeholder constants)",
    '',
    row([
      'seed',
      'debugUsed',
      'gate opened',
      'level',
      'cycle',
      'waves',
      'band',
      'Embers',
      'Threat',
    ]),
    row(['---', '---', '---', '---', '---', '---', '---', '---', '---']),
  ];
  for (const r of vigil) {
    const v = r.vigil;
    if (!v) continue;
    const gate = v.gateOpened
      ? `${Math.round(v.gateOpened.hours)} h, cycle ${v.gateOpened.cycle}`
      : 'never';
    if (v.stands.length === 0)
      lines.push(row([r.spec.seed, `${v.debugUsed}`, gate, '–', '–', '–', '–', '–', '–']));
    for (const s of v.stands)
      lines.push(
        row([
          r.spec.seed,
          `${v.debugUsed}`,
          gate,
          `${s.level}`,
          `${s.cycle}`,
          `${s.waves}`,
          bandLabels[s.band as Band] ?? s.band,
          `${s.embers}`,
          s.threat.toFixed(1),
        ]),
      );
  }
  lines.push('', '## Waves held by level', '');
  for (const kind of STEP_KINDS)
    for (const t of [0, 1]) lines.push(...wavesTables(all, kind, t), '');
  lines.push('## Waves lost at levels 1 to 3, per seed', '');
  for (const kind of STEP_KINDS) for (const t of [0, 1]) lines.push(...lostTable(all, kind, t), '');
  lines.push('## Embers by level', '');
  for (const kind of STEP_KINDS)
    for (const t of [0, 1]) lines.push(...embersTable(all, kind, t), '');
  return `${lines.join('\n')}\n`;
};
