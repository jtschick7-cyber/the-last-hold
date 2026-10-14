// Plan T4.11b (GDD §5.9.3): the suggested six.
import { describe, expect, it } from 'vitest';
import { hunters, type HunterId } from '../../src/content/hunters';
import { suggestSix } from '../../src/core/stand/suggest';
import { freshHunter } from '../../src/core/state/hunters-state';
import { createNewGame } from '../../src/core/state/new-game';

const roster = (levels: Partial<Record<HunterId, number>>) => {
  const s = createNewGame('six', 0);
  s.hunters = {};
  s.roster.active = [];
  for (const [id, level] of Object.entries(levels)) {
    s.hunters[id as HunterId] = { ...freshHunter(), level: level ?? 1 };
    s.roster.active.push(id as HunterId);
  }
  return s;
};

describe('the suggested six', () => {
  it('takes the highest levels, at most six', () => {
    const s = roster({
      halvar: 9,
      zora: 8,
      ostap: 2,
      bjarna: 7,
      vesna: 6,
      radek: 5,
      sigrun: 4,
      toma: 3,
    });
    const six = suggestSix(s);
    expect(six).toHaveLength(6);
    expect(six).not.toContain('ostap');
  });

  it('keeps at least one Vanguard and one Mender when the roster has them', () => {
    const ids = Object.keys(hunters) as HunterId[];
    const vanguard = ids.find((id) => hunters[id].role === 'vanguard');
    const mender = ids.find((id) => hunters[id].role === 'mender');
    const others = ids.filter(
      (id) => hunters[id].role !== 'vanguard' && hunters[id].role !== 'mender',
    );
    if (!vanguard || !mender) throw new Error('content has no vanguard or mender');
    const levels: Partial<Record<HunterId, number>> = { [vanguard]: 1, [mender]: 1 };
    others.slice(0, 6).forEach((id, i) => (levels[id] = 10 + i));
    const six = suggestSix(roster(levels));
    expect(six).toContain(vanguard);
    expect(six).toContain(mender);
    expect(six).toHaveLength(Math.min(6, Object.keys(levels).length));
  });

  it('only suggests active hunters', () => {
    const s = roster({ halvar: 3, zora: 2 });
    s.hunters.ostap = { ...freshHunter(), level: 20 }; // in the reserve
    expect(suggestSix(s)).toEqual(['halvar', 'zora']);
  });
});
