import { ENDING_IDS, type EndingRecord, type RememberingState } from '../state/remembering-state';
import { arr, bool, count, Invalid, nonNegative, obj } from './guards';

// Technical design §5.2 and §9.4 (v11, D461): the ending part of the save guard. Order is array
// order, never time: `at` is read but not compared. Unknown ending ids drop with a warning. A
// state commands cannot make (a repeat, `vigil` after `remember`, a cycle that does not exist)
// is refused as damage. Dropping an ending recorded before Act VI's stand, and keeping one whose
// gate no longer holds, need the gate and are added with it (T11.2).
export const rememberingFrom = (
  v: unknown,
  cycleNumber: number,
  warnings: string[],
): RememberingState => {
  const o = obj(v, 'remembering');
  const endings: EndingRecord[] = [];
  for (const [i, x] of arr(o.endings, 'remembering.endings').entries()) {
    const w = `remembering.endings[${i}]`;
    const e = obj(x, w);
    if (typeof e.ending !== 'string' || !(ENDING_IDS as readonly string[]).includes(e.ending)) {
      warnings.push(`Dropped unknown ${w}.`);
      continue;
    }
    const ending = e.ending as EndingRecord['ending'];
    if (endings.some((r) => r.ending === ending)) throw new Invalid(`${w} repeats an ending.`);
    if (ending === 'vigil' && endings.some((r) => r.ending === 'remember'))
      throw new Invalid(`${w} comes after Remember Them.`);
    const cycle = count(e.cycle, `${w}.cycle`);
    if (cycle < 1 || cycle > cycleNumber)
      throw new Invalid(`${w}.cycle isn't a cycle of this save.`);
    endings.push({ ending, at: nonNegative(e.at, `${w}.at`), cycle });
  }
  return {
    nearSeen: bool(o.nearSeen, 'remembering.nearSeen'),
    readyNoted: bool(o.readyNoted, 'remembering.readyNoted'),
    endings,
  };
};
