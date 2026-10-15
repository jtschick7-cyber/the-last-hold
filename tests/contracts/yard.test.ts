// Plan T8.10 (GDD §5.11.5, D315): the yard. Everyone at the hold who isn't on a finished contract
// earns a quarter of the XP a hunter on it earned, never past the third-highest hunter's level.
import { describe, expect, it } from 'vitest';
import type { HunterId } from '../../src/content/hunters';
import { applyYard, yardCap } from '../../src/core/contracts/yard';
import { advance } from '../../src/core/sim';
import type { GameState } from '../../src/core/state/game-state';
import { foundLines } from '../../src/core/story/found-lines';
import { xpToNext } from '../../src/core/systems/hunters';
import { HOUR, keepRich, run } from './helpers';

const levels = (s: GameState, spec: Partial<Record<HunterId, number>>): void => {
  for (const [id, level] of Object.entries(spec) as [HunterId, number][]) {
    const h = s.hunters[id];
    if (h) {
      h.level = level;
      h.xp = 0;
    }
  }
};

/** Runs one tier-1 contract with `party` to its end; returns the result. */
const contract = (s: GameState, party: HunterId[], monster: 'kikimora' | 'wolf' = 'kikimora') => {
  const n = s.board.open.length + s.results.length;
  s.board.open.push({
    id: `y${n}`,
    village: 'mirograd',
    monster,
    tier: 1,
    location: 'field',
    arrivedAt: s.time,
    revealed: 3,
  });
  expect(run(s, { type: 'contract.launch', contract: `y${n}`, party }).ok).toBe(true);
  advance(s, s.time + 24 * HOUR);
  const r = s.results[s.results.length - 1];
  if (!r) throw new Error('no result');
  return r;
};

describe('the yard (D315)', () => {
  it('a hunter at the hold earns 25% of the XP a hunter on the contract earned', () => {
    const s = keepRich('yard-share');
    levels(s, { halvar: 6, zora: 6, ostap: 6, sigrun: 1 });
    const r = contract(s, ['zora', 'halvar', 'ostap']);
    expect(r.xp).toBeGreaterThan(0);
    expect(s.hunters.sigrun?.xp).toBeCloseTo(r.xp * 0.25, 9);
    expect(s.hunters.sigrun?.level).toBe(1);
  });

  it('a failure still pays half the XP, so the yard earns a quarter of that half', () => {
    let checked = 0;
    for (let n = 0; n < 12 && checked === 0; n++) {
      const s = keepRich(`yard-fail-${n}`);
      levels(s, { halvar: 3, zora: 3, ostap: 3, sigrun: 1 });
      s.board.open.push({
        id: 'hard',
        village: 'mirograd',
        monster: 'draugr',
        tier: 4,
        location: 'barrow',
        arrivedAt: s.time,
        revealed: 3,
      });
      run(s, {
        type: 'contract.launch',
        contract: 'hard',
        party: ['zora', 'halvar', 'ostap'],
        confirmReckless: true,
      });
      advance(s, s.time + 48 * HOUR);
      const r = s.results[s.results.length - 1];
      if (!r || r.success || r.xp === 0) continue; // a loss where at least one hunter lived
      expect(s.hunters.sigrun?.xp).toBeCloseTo(r.xp * 0.25, 9);
      checked += 1;
    }
    expect(checked).toBe(1);
  });

  it('nobody earns when the whole party dies: there was no XP to share', () => {
    const s = keepRich('yard-wipe');
    levels(s, { sigrun: 1 });
    expect(applyYard(s, ['zora'], 0)).toEqual([]);
    expect(s.hunters.sigrun?.xp).toBe(0);
  });

  it('stops at the third-highest hunter’s level and banks nothing beyond it', () => {
    const s = keepRich('yard-cap');
    // Levels: 7, 6, 5 are the top three; sigrun sits one XP short of 5.
    levels(s, { halvar: 7, zora: 6, ostap: 5, sigrun: 4, toma: 2, bjarna: 1, vesna: 1, radek: 1 });
    expect(yardCap(s)).toBe(5);
    const h = s.hunters.sigrun;
    if (!h) throw new Error('no sigrun');
    h.xp = xpToNext(4) - 1;
    const keys = applyYard(s, ['zora'], 1000);
    expect(h.level).toBe(5); // reached the cap, not past it
    expect(h.xp).toBe(0);
    expect(keys).toContain('yard:sigrun:5');
    // Already at the cap: nothing changes, and nothing is wasted from their progress.
    const ostap = s.hunters.ostap;
    if (!ostap) throw new Error('no ostap');
    ostap.xp = 7;
    applyYard(s, ['zora'], 1000);
    expect(ostap.level).toBe(5);
    expect(ostap.xp).toBe(7);
    // Above the cap: untouched.
    expect(s.hunters.halvar?.level).toBe(7);
  });

  it('with fewer than three hunters the cap is the lowest, so it catches nobody up', () => {
    const s = keepRich('yard-few');
    for (const id of ['ostap', 'bjarna', 'vesna', 'radek', 'sigrun', 'toma'] as const) {
      Reflect.deleteProperty(s.hunters, id);
    }
    s.roster.active = ['halvar', 'zora'];
    levels(s, { halvar: 3, zora: 1 });
    expect(yardCap(s)).toBe(1);
    applyYard(s, ['halvar'], 1000);
    expect(s.hunters.zora?.level).toBe(1);
  });

  it('an injured hunter earns it; a hunter in a Delve does not; the dead are gone from the roster', () => {
    const s = keepRich('yard-who');
    levels(s, { halvar: 6, zora: 6, ostap: 6, sigrun: 1, toma: 1, bjarna: 1 });
    const sig = s.hunters.sigrun;
    if (sig) sig.recovery = { kind: 'injured', until: s.time + 99 * HOUR } as never;
    s.delve.run = { party: ['toma'] } as unknown as GameState['delve']['run'];
    const r = contract(s, ['zora', 'halvar', 'ostap']);
    expect(s.hunters.sigrun?.xp).toBeCloseTo(r.xp * 0.25, 9); // injured: earns
    expect(s.hunters.toma?.xp).toBe(0); // in a Delve: no
    expect(s.hunters.bjarna?.xp).toBeCloseTo(r.xp * 0.25, 9); // active or reserve alike
  });

  it('a hunter on the contract earns their own XP, not the yard’s on top', () => {
    const s = keepRich('yard-own');
    levels(s, { halvar: 6, zora: 6, ostap: 6, sigrun: 1 });
    const r = contract(s, ['zora', 'halvar', 'ostap']);
    expect(s.hunters.zora?.xp).toBeCloseTo(r.xp, 9);
  });

  it('pays the yard once for every finished contract, one per contract', () => {
    const s = keepRich('yard-two');
    levels(s, { halvar: 6, zora: 6, ostap: 6, sigrun: 1 });
    const a = contract(s, ['zora', 'halvar', 'ostap']);
    const b = contract(s, ['zora', 'halvar', 'ostap']);
    expect(s.hunters.sigrun?.xp).toBeCloseTo((a.xp + b.xp) * 0.25, 9);
  });

  it('a yard level is one line on the result: "The yard: Sigrun reached level 2."', () => {
    const s = keepRich('yard-line');
    levels(s, { halvar: 6, zora: 6, ostap: 6, sigrun: 1 });
    const h = s.hunters.sigrun;
    if (!h) throw new Error('no sigrun');
    h.xp = xpToNext(1) - 1;
    const r = contract(s, ['zora', 'halvar', 'ostap']);
    expect(r.found).toContain('yard:sigrun:2');
    expect(foundLines(s, r.found ?? [])).toContain('The yard: Sigrun reached level 2.');
  });

  it('a yard level counts for the name letters like any other (D315, the plan’s catch-up goal)', () => {
    const s = keepRich('yard-letter');
    levels(s, { halvar: 8, zora: 8, ostap: 8, sigrun: 4 });
    const h = s.hunters.sigrun;
    if (!h) throw new Error('no sigrun');
    h.xp = xpToNext(4) - 1;
    const r = contract(s, ['zora', 'halvar', 'ostap']);
    expect(h.level).toBe(5);
    expect(s.story.peakLevels.sigrun).toBe(5);
    expect(r.found?.some((k) => k.startsWith('letter:sigrun'))).toBe(true);
  });
});
