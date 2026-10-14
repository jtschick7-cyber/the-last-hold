import { HUNTER_IDS } from '../../src/content/hunters';
import { computeOdds } from '../../src/core/contracts/odds';
import { suggestParty } from '../../src/core/contracts/suggest';
import { previewStand } from '../../src/core/stand/preview';
import { snap } from '../combat/helpers';

// GDD §6.5: the live odds panel (500 fights) and Suggested party, timed in this
// browser. Playwright slows the CPU 4× first, as a stand-in for a mid-range phone,
// then calls window.__bench(). Best of a few runs, after a warm-up.
const RUNS = 3;

const best = (f: () => unknown): number => {
  f();
  let ms = Number.POSITIVE_INFINITY;
  for (let i = 0; i < RUNS; i++) {
    const t = performance.now();
    f();
    ms = Math.min(ms, performance.now() - t);
  }
  return ms;
};

const base = {
  gameSeed: 'bench',
  contractId: 'c-bench',
  monster: { monster: 'upyr' as const, tier: 3 },
  location: 'field' as const,
  rank: 'keep' as const,
};

type Bench = {
  odds: number;
  suggest4: number;
  oddsUnknown: number;
  suggestUnknown: number;
  stand: number;
};

(window as unknown as { __bench: () => Bench }).__bench = () => {
  const party = HUNTER_IDS.slice(0, 3).map((id) => snap(id));
  // A typical launch: four hunters free, parties of up to three.
  const free = HUNTER_IDS.slice(0, 4).map((id) => snap(id));
  // GDD §6.5, plan T3.10: an unidentified monster (three candidates) with preparation.
  const unknown = {
    ...base,
    monster: ['upyr', 'draugr', 'strzyga'].map((m) => ({
      monster: m as 'upyr',
      tier: 4,
      knowledge: 0,
    })),
    prep: {
      oils: { halvar: 'grave-oil' as const },
      potions: { zora: 'quickfoot-tincture' as const },
      bombs: ['fire-pot' as const, 'saltburst' as const],
    },
  };
  return {
    odds: best(() => computeOdds({ ...base, party })),
    suggest4: best(() => suggestParty({ ...base, available: free, maxParty: 3 })),
    oddsUnknown: best(() => computeOdds({ ...unknown, party })),
    suggestUnknown: best(() => suggestParty({ ...unknown, available: free, maxParty: 3 })),
    // GDD §6.5 (D114): the Last Stand preview, 100 practice stands of six level-10 hunters.
    stand: best(() =>
      previewStand({
        stand: {
          seed: 'bench:stand:1',
          threat: 40,
          party: HUNTER_IDS.slice(0, 6).map((id) => snap(id, { level: 10 })),
          prep: {
            oils: {},
            potions: { [HUNTER_IDS[0] ?? 'halvar']: 'mending-draught' },
            bombs: [],
          },
          bombs: { 'fire-pot': 4, saltburst: 2 },
          defenses: { walls: 10, watchtower: 10 },
          relics: [],
          knowledge: {},
        },
        samples: 100,
        rank: 'bastion',
        trophies: 60,
        cycleDays: 3,
        threatPerDay: 40,
        trophiesPerDay: 20,
      }),
    ),
  };
};
const out = document.getElementById('out');
if (out) out.textContent = 'ready';
