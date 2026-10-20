import { HUNT_IDS } from '../../content/hunts';
import type { Migration } from './migrations';

type Plain = Record<string, unknown>;

const asPlain = (v: unknown): Plain => (typeof v === 'object' && v !== null ? (v as Plain) : {});
const list = (v: unknown): Plain[] => (Array.isArray(v) ? (v as Plain[]) : []);

// v8 → v9 (plan T9.1, D382, technical design §9.4): events.
//
// 1. `events` is added closed, with an empty bank and nothing in progress. The migration needs no
//    clock: the load path opens events by the same function the live game uses on reaching the
//    Citadel (`openEvents`), so a save already at the Citadel gets events, the one-time scene and
//    an empty bank on its first load (D369 (1)).
// 2. Every cycle record gets `standPool`: `base` for every past cycle, and for the current one
//    `base` if Bastion has been reached (its wave list is fixed by then, before Act VI began), else
//    null (D363). Nothing about hunters, items, Legendaries, story or stands changes, so every
//    golden fight and recorded stand replays as before.
export const v8ToV9: Migration = (state) => {
  const s: Plain = structuredClone(state);
  const meta = asPlain(s.meta);
  const high =
    typeof meta.clockHighWater === 'number'
      ? meta.clockHighWater
      : typeof s.time === 'number'
        ? s.time
        : 0;
  const cycles = list(s.cycles);
  const cycleAge = asPlain(s.cycle).age;
  return {
    ...s,
    cycles: cycles.map((c, i) => {
      const current = i === cycles.length - 1;
      const bastion = cycleAge === 'bastion' || asPlain(c.ranks).bastion !== undefined;
      return { ...c, standPool: current && !bastion ? null : 'base' };
    }),
    events: {
      opened: false,
      sceneSeen: false,
      clock: { value: 0, high },
      tokens: { count: 0, at: null },
      attempts: 0,
      rest: {},
      boss: { visit: 0, tier: null, pool: null, paid: 0, attempts: 0 },
      hunts: Object.fromEntries(HUNT_IDS.map((id) => [id, { points: 0, unlocked: false }])),
      last: null,
      recent: [],
    },
  };
};
