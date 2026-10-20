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
// 3. Act VI starts on load in a story-less current cycle, with fresh counters (D246, D364): as v8 did
//    for Act V, the cycles' act numbers above V are cleared and the current one becomes Act VI. A
//    save in Act V's cycle reaches Act VI with the next warden instead. Frozen here (V was the last
//    written act in v8), so a later change to the content never rewrites an old save.
const V8_LAST_WRITTEN_ACT = 5;
const ACT_VI = V8_LAST_WRITTEN_ACT + 1;

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
  const currentAct = cycles[cycles.length - 1]?.act;
  const rebase = typeof currentAct === 'number' && currentAct > V8_LAST_WRITTEN_ACT;
  const story = asPlain(s.story);
  const cycleNumber =
    typeof asPlain(s.cycle).number === 'number' ? (asPlain(s.cycle).number as number) : 1;
  const time = typeof s.time === 'number' ? s.time : 0;
  return {
    ...s,
    ...(rebase
      ? {
          story: {
            ...story,
            acts: [
              ...list(story.acts).filter(
                (a) => typeof a.act === 'number' && a.act <= V8_LAST_WRITTEN_ACT,
              ),
              {
                act: ACT_VI,
                cycle: cycleNumber,
                startedAt: time,
                wins: 0,
                winsByVillage: {},
                ruinWins: 0,
                winsByFamily: {},
              },
            ],
          },
        }
      : {}),
    cycles: cycles.map((c, i) => {
      const current = i === cycles.length - 1;
      const bastion = cycleAge === 'bastion' || asPlain(c.ranks).bastion !== undefined;
      const act =
        typeof c.act === 'number' && c.act > V8_LAST_WRITTEN_ACT
          ? { act: current ? ACT_VI : null }
          : {};
      return { ...c, ...act, standPool: current && !bastion ? null : 'base' };
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
