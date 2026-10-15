import { monsters } from '../../content/monsters';
import type { Migration } from './migrations';

type Plain = Record<string, unknown>;

const asPlain = (v: unknown): Plain => (typeof v === 'object' && v !== null ? (v as Plain) : {});
const list = (v: unknown): Plain[] => (Array.isArray(v) ? (v as Plain[]) : []);

// v7 → v8 (plan T8.5, D306–D318): hunter depth.
//
// 1. Each hunter's gear slot becomes an equipped Common item with the same base and so the same
//    numbers (D317, D308). `paid` is the iron and silver of the base's step costs up to its tier at
//    today's prices (before any Smithing cut), which Salvage returns a share of.
// 2. Each hunter gets the rank their highest level ever qualifies for, free (D311): Wright at 5,
//    Master-Wright at 10, else Apprentice. Stars 0, no talents, no keepsake.
// 3. Legendaries whose milestone is already met are found on load (D317): a family whose species
//    are all Mastered. They wait in Stores; no one wears them yet (D328 (5)).
// 4. Per-act family counters (D318): Act IV's counts are kept; Acts I–III's are cleared, because
//    nothing reads them and their real counts can't be recovered.
// 5. Act V starts on load in a story-less current cycle, with fresh counters (D246): as v7 did for
//    Act IV, the cycles' act numbers above IV are cleared and the current one becomes Act V. A
//    save in Act IV's cycle reaches Act V with the next warden instead.
//
// Frozen here (IV was the last written act in v7; the tables below are v0.8's), so a later change
// to the content never rewrites an old save.
const V7_LAST_WRITTEN_ACT = 4;
const ACT_V = V7_LAST_WRITTEN_ACT + 1;

/** Iron and silver put into a gear piece by crafting it and every tier below (GDD §5.3.6, no Smithing cut). */
const PAID: Readonly<Record<string, { iron: number; silver: number }>> = {
  'iron-blade': { iron: 60, silver: 0 },
  'steel-blade': { iron: 310, silver: 0 },
  'silvered-blade': { iron: 560, silver: 120 },
  'wrights-blade': { iron: 1160, silver: 420 },
  'hide-armor': { iron: 0, silver: 0 },
  mail: { iron: 300, silver: 0 },
  'emberwright-plate': { iron: 900, silver: 150 },
};

const LEGENDARY_OF_FAMILY: Readonly<Record<string, string>> = {
  'field-and-forest-spirits': 'barley-knot',
  'beasts-and-wilds': 'wolf-tooth-string',
  'restless-dead': 'coffin-silver',
  'water-spirits': 'ferrymans-coin',
  cursed: 'rune-nail',
};

const MASTERED = 4;
const WRIGHT_LEVEL = 5;
const MASTER_LEVEL = 10;

export const v7ToV8: Migration = (state) => {
  const s: Plain = structuredClone(state);
  const cycleNumber =
    typeof asPlain(s.cycle).number === 'number' ? (asPlain(s.cycle).number as number) : 1;
  const time = typeof s.time === 'number' ? s.time : 0;

  // 1–2. Items and ranks.
  const story = asPlain(s.story);
  const peaks = asPlain(story.peakLevels);
  const hunters = asPlain(s.hunters);
  const items: Plain[] = [];
  const newHunters: Plain = {};
  for (const [id, raw] of Object.entries(hunters)) {
    const h = asPlain(raw);
    const worn: Plain = {};
    for (const slot of ['weapon', 'armor'] as const) {
      const base = h[slot];
      if (typeof base !== 'string') {
        worn[slot] = null;
        continue;
      }
      const itemId = `i${items.length + 1}`;
      items.push({
        id: itemId,
        base,
        rarity: 'common',
        lines: [],
        paid: { ...(PAID[base] ?? { iron: 0, silver: 0 }) },
        where: { hunter: id, slot },
      });
      worn[slot] = itemId;
    }
    const level = typeof h.level === 'number' ? h.level : 1;
    const peak = Math.max(typeof peaks[id] === 'number' ? (peaks[id] as number) : 0, level);
    newHunters[id] = {
      ...h,
      ...worn,
      rank: peak >= MASTER_LEVEL ? 'masterWright' : peak >= WRIGHT_LEVEL ? 'wright' : 'apprentice',
      stars: 0,
      talents: [],
      keepsake: null,
    };
  }

  // 3. Legendaries already earned.
  const bestiary = asPlain(s.bestiary);
  const legendaries: Plain[] = [];
  for (const [family, legendary] of Object.entries(LEGENDARY_OF_FAMILY)) {
    const species = Object.values(monsters).filter((m) => m.family === family);
    const all = species.every((m) => {
      const level = asPlain(bestiary[m.id]).level;
      return typeof level === 'number' && level >= MASTERED;
    });
    if (species.length > 0 && all) legendaries.push({ id: legendary, cycle: cycleNumber });
  }

  // 4–5. Family counters and Act V.
  const cycles = list(s.cycles);
  const current = cycles[cycles.length - 1];
  const currentAct = typeof current?.act === 'number' ? current.act : null;
  const rebase = current !== undefined && currentAct !== null && currentAct > V7_LAST_WRITTEN_ACT;
  let acts: Plain[] = list(story.acts).map((a) => (a.act === 4 ? a : { ...a, winsByFamily: {} }));
  let newCycles: Plain[] = cycles;
  if (rebase) {
    acts = acts.filter((a) => typeof a.act === 'number' && a.act <= V7_LAST_WRITTEN_ACT);
    acts.push({
      act: ACT_V,
      cycle: cycleNumber,
      startedAt: time,
      wins: 0,
      winsByVillage: {},
      ruinWins: 0,
      winsByFamily: {},
    });
    newCycles = cycles.map((c, i) =>
      typeof c.act === 'number' && c.act > V7_LAST_WRITTEN_ACT
        ? { ...c, act: i === cycles.length - 1 ? ACT_V : null }
        : c,
    );
  }

  return {
    ...s,
    hunters: newHunters,
    items,
    itemSeq: items.length,
    legendaries,
    stats: { ...asPlain(s.stats), trophiesSpent: 0 },
    cycles: newCycles,
    story: { ...story, acts },
  };
};
