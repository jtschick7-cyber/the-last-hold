import { HUNTER_IDS } from '../../src/content/hunters';
import { computeOdds } from '../../src/core/contracts/odds';
import { suggestParty } from '../../src/core/contracts/suggest';
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

(window as unknown as { __bench: () => { odds: number; suggest4: number } }).__bench = () => {
  const party = HUNTER_IDS.slice(0, 3).map((id) => snap(id));
  // A typical launch: four hunters free, parties of up to three.
  const free = HUNTER_IDS.slice(0, 4).map((id) => snap(id));
  return {
    odds: best(() => computeOdds({ ...base, party })),
    suggest4: best(() => suggestParty({ ...base, available: free, maxParty: 3 })),
  };
};
const out = document.getElementById('out');
if (out) out.textContent = 'ready';
