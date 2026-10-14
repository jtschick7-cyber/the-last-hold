import type { Migration } from './migrations';

type Plain = Record<string, unknown>;

const asPlain = (v: unknown): Plain => (typeof v === 'object' && v !== null ? (v as Plain) : {});

// v5 → v6 (plan T6.3, D218): alchemy discovery and warden skills. The recipe book opens
// with the 15 properties the nine v0.3 recipes prove (D200) and no pairs tried; every
// skill starts at 0 XP (D205, an old save can't credit them fairly); the six new brews
// get empty store slots; a brew in the kettles records the recipe it was paid with; the
// Alchemy level on running contracts, fight records and stand records is 0, so every
// replay is unchanged (D206); and each past stand keeps the band it earned under the
// thresholds of its day, 9 and 12 (D194). Frozen here, so a later change to the content
// never rewrites an old save.
const V5_RECIPES: Readonly<Record<string, Plain>> = {
  'grave-oil': { ingredients: { 'grave-dust': 2, juniper: 1 }, resources: {} },
  'drowned-bane-oil': { ingredients: { 'river-pearl': 2, yarrow: 1 }, resources: {} },
  'thornbane-oil': { ingredients: { thornwood: 2, mugwort: 1 }, resources: {} },
  'mending-draught': { ingredients: { yarrow: 2, honeycomb: 1 }, resources: {} },
  'hardwood-tonic': { ingredients: { thornwood: 1, juniper: 2 }, resources: {} },
  'quickfoot-tincture': { ingredients: { mugwort: 2, 'hares-foot': 1 }, resources: {} },
  'fire-pot': { ingredients: { pitch: 1 }, resources: { wood: 1 } },
  'frost-pot': { ingredients: { 'rime-salt': 1 }, resources: { wood: 1 } },
  saltburst: { ingredients: { 'rime-salt': 2 }, resources: { silver: 1 } },
};
/** The property indexes (§8.6 order) the nine v0.3 recipes prove, per ingredient. */
const V5_KNOWN_PROPERTIES: Readonly<Record<string, readonly number[]>> = {
  yarrow: [0, 1],
  mugwort: [0, 1],
  juniper: [0, 1],
  honeycomb: [0],
  'hares-foot': [0],
  pitch: [0],
  'rime-salt': [0, 1],
  'grave-dust': [0],
  'river-pearl': [0],
  thornwood: [0, 1],
  'wolf-fang': [],
  'noon-poppy': [],
};
const V5_NEW_BREWS = [
  'hidebane-oil',
  'wrights-oil',
  'coldwater-draught',
  'owl-eye-drops',
  'steadfast-draught',
  'poppy-smoke',
] as const;
const V5_HELD_FROM = 9;
const V5_TRIUMPHANT_FROM = 12;

export const v5ToV6: Migration = (state) => {
  const s: Plain = structuredClone(state);
  const queues = asPlain(s.queues);
  const log = asPlain(s.log);
  const list = (v: unknown): Plain[] => (Array.isArray(v) ? (v as Plain[]) : []);
  return {
    ...s,
    stores: { ...asPlain(s.stores), ...Object.fromEntries(V5_NEW_BREWS.map((id) => [id, 0])) },
    queues: {
      ...queues,
      brewing: list(queues.brewing).map((j) => ({
        kind: 'brew',
        item: j.item,
        doneAt: j.doneAt,
        paid: structuredClone(V5_RECIPES[String(j.item)] ?? { ingredients: {}, resources: {} }),
      })),
    },
    running: list(s.running).map((r) => ({ ...r, alchemy: 0 })),
    log: { ...log, recentFights: list(log.recentFights).map((f) => ({ ...f, alchemy: 0 })) },
    cycles: list(s.cycles).map((c) => {
      const stand = c.stand === null || c.stand === undefined ? null : asPlain(c.stand);
      if (!stand) return c;
      const waves = typeof stand.wavesHeld === 'number' ? stand.wavesHeld : 0;
      return {
        ...c,
        stand: {
          ...stand,
          band:
            waves >= V5_TRIUMPHANT_FROM ? 'triumphant' : waves >= V5_HELD_FROM ? 'held' : 'broken',
          alchemy: 0,
        },
      };
    }),
    book: {
      properties: Object.fromEntries(
        Object.entries(V5_KNOWN_PROPERTIES).map(([id, known]) => [id, [...known]]),
      ),
      tried: [],
    },
    skills: { alchemy: 0, smithing: 0, lore: 0, command: 0 },
  };
};
