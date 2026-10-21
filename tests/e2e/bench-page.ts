import { HUNTER_IDS } from '../../src/content/hunters';
import { computeOdds } from '../../src/core/contracts/odds';
import { suggestParty } from '../../src/core/contracts/suggest';
import { computeHuntOdds, suggestHuntParty } from '../../src/core/systems/hunt-odds';
import { previewBoss, suggestBossParty } from '../../src/core/systems/boss-odds';
import { previewStand } from '../../src/core/stand/preview';
import { snap } from '../combat/helpers';
import { ORDER_IDS } from '../../src/content/orders';
import { apply } from '../../src/core/commands/apply';
import { loadEnvelope } from '../../src/core/save';
import { createNewGame } from '../../src/core/state/new-game';
import { orderStanding } from '../../src/core/systems/orders';
import { orderSheetView } from '../../src/core/systems/orders-sheet-view';
import { ordersCardView } from '../../src/core/systems/orders-view';
import v9Owner from '../saves/fixtures/v9-owner.json';
import v10Played from '../saves/fixtures/v10-played.json';

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
  bossPreview: number;
  bossSuggest: number;
  huntOdds: number;
  huntSuggest: number;
  ordersCard: number;
  ordersSheet: number;
  ordersStanding: number;
  ordersMigration: number;
  rememberingMigration: number;
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
  // Plan T9.7: the boss preview (100 practice fights) and Suggest for a boss with all 14 hunters
  // free, when no party clears the floor (the worst case: it runs out its tries).
  const orders = createNewGame('bench', 0);
  for (const order of ORDER_IDS) apply(orders, { type: 'debug.ordersOpen', order }, orders.time);
  const boss = {
    gameSeed: 'bench',
    visit: 0,
    boss: 'lindworm-of-velk-fjord' as const,
    tier: 4,
    poolStart: 32400,
    pool: 32400,
    paid: 0,
  };
  const fourteen = HUNTER_IDS.slice(0, 14).map((id) => snap(id, { level: 9 }));
  // Plan T9.8 (measured for the GDD §6.5 rows): hunt odds on the hardest track with preparation
  // (prepared and unprepared runs) and hunt Suggest with 14 hunters, running out its 10 tries.
  const hunt = {
    gameSeed: 'bench',
    hunt: 'stoneback' as const,
    track: 3 as const,
    tier: 5,
  };
  const huntPrep = {
    oils: { [HUNTER_IDS[0] ?? 'halvar']: 'grave-oil' as const },
    potions: { [HUNTER_IDS[1] ?? 'zora']: 'quickfoot-tincture' as const },
    bombs: ['fire-pot' as const, 'saltburst' as const],
  };
  return {
    huntOdds: best(() => computeHuntOdds({ ...hunt, party: fourteen.slice(0, 4), prep: huntPrep })),
    huntSuggest: best(() =>
      suggestHuntParty({ ...hunt, available: fourteen, maxParty: 4, prep: huntPrep, tries: 10 }),
    ),
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
    // Plan T10.19 (GDD §6.5, D445): the Orders' card, an Order sheet, the standing of all four after
    // a command, and the v9 → v10 migration of the owner's save, on a game with every Order open.
    ordersCard: best(() => ordersCardView(orders, orders.time)),
    ordersSheet: best(() => orderSheetView(orders, 'moot', orders.time)),
    ordersStanding: best(() => ORDER_IDS.forEach((id) => orderStanding(orders, id))),
    ordersMigration: best(() => loadEnvelope(structuredClone(v9Owner))),
    // Plan T11.16 (D464 (5)): the v10 → v11 migration of a played v10 save, on the load path. GDD §6.5 row (D469).
    rememberingMigration: best(() => loadEnvelope(structuredClone(v10Played))),
    bossPreview: best(() => previewBoss({ ...boss, party: fourteen.slice(0, 4) })),
    bossSuggest: best(() =>
      suggestBossParty({
        ...boss,
        available: fourteen,
        maxParty: 4,
        floor: Number.MAX_SAFE_INTEGER,
        tries: 10,
      }),
    ),
  };
};
const out = document.getElementById('out');
if (out) out.textContent = 'ready';
