import type { Migration } from './migrations';

type Plain = Record<string, unknown>;

const asPlain = (v: unknown): Plain => (typeof v === 'object' && v !== null ? (v as Plain) : {});
const list = (v: unknown): Plain[] => (Array.isArray(v) ? (v as Plain[]) : []);

// v6 → v7 (plan T7.1 and T7.5, D245, D246, D267): the v0.7 additions to the save.
//
// 1. Each act records the contracts won against each monster family, which Act IV's margins
//    count (D245). Acts already begun start at none.
// 2. Delves (GDD §5.10): no run, no Riftglass, an empty allowance that starts to grow from now
//    if a Keep has been reached (D258; the first accrual is this load), no relics or echoes,
//    nothing bought, the way-down scene still to play.
// 3. Act IV starts on load in the current cycle (D246). In v6 a cycle after Act III's stand had
//    an act number but no story. The cycles' act numbers above III are story-less: they are
//    cleared, the current one becomes Act IV, the counters recorded for story-less acts are
//    dropped, and Act IV begins fresh at the save's time. D4-01 then plays on load (the
//    `story.startActIV` command); its Rank documents are found only if the Rank is already
//    behind this cycle. A new game reaches each act the cycle after the previous act's stand.
//
// Frozen here (III was the last written act in v6), so a later change to the content never
// rewrites an old save.
const V6_LAST_WRITTEN_ACT = 3;
const ACT_IV = V6_LAST_WRITTEN_ACT + 1;

const startingDelve = (allowanceAt: number | null): Plain => ({
  run: null,
  result: null,
  runs: 0,
  riftglass: 0,
  allowance: 0,
  allowanceAt,
  sceneSeen: false,
  unlitOpen: false,
  shop: {
    lateHours: 0,
    traitsBought: [],
    traitsActive: [],
    cosmetics: [],
    chosenStart: false,
    reroll: false,
  },
  deep: {},
  relics: [],
  echoes: [],
  taken: {},
  kills: {},
  guardiansBeaten: {},
});

export const v6ToV7: Migration = (state) => {
  const s: Plain = structuredClone(state);
  const story = asPlain(s.story);
  const cycles = list(s.cycles);
  const current = cycles[cycles.length - 1];
  const currentAct = typeof current?.act === 'number' ? current.act : null;
  const rebase = current !== undefined && currentAct !== null && currentAct > V6_LAST_WRITTEN_ACT;
  const time = typeof s.time === 'number' ? s.time : 0;
  const cycleNumber =
    typeof asPlain(s.cycle).number === 'number' ? (asPlain(s.cycle).number as number) : 1;

  let acts: Plain[] = list(story.acts).map((a) => ({ ...a, winsByFamily: {} }));
  let newCycles: Plain[] = cycles;
  if (rebase) {
    // Story-less acts: their rows and labels are dropped; the current cycle tells Act IV.
    acts = acts.filter((a) => typeof a.act === 'number' && a.act <= V6_LAST_WRITTEN_ACT);
    acts.push({
      act: ACT_IV,
      cycle: cycleNumber,
      startedAt: time,
      wins: 0,
      winsByVillage: {},
      ruinWins: 0,
      winsByFamily: {},
    });
    newCycles = cycles.map((c, i) =>
      typeof c.act === 'number' && c.act > V6_LAST_WRITTEN_ACT
        ? { ...c, act: i === cycles.length - 1 ? ACT_IV : null }
        : c,
    );
  }

  const keepReached =
    cycles.some((c) => asPlain(c.ranks).keep !== undefined) ||
    ['keep', 'citadel', 'bastion'].includes(String(asPlain(s.cycle).age));
  return {
    ...s,
    cycles: newCycles,
    story: { ...story, acts },
    delve: startingDelve(keepReached ? time : null),
  };
};
