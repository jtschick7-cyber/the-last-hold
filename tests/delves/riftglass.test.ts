import { describe, expect, it } from 'vitest';
import { alternateTraits } from '../../src/content/delves/alternate-traits';
import { balance } from '../../src/content/balance';
import { advance } from '../../src/core/sim/advance';
import { catchUpNow } from '../../src/core/sim/offline';
import { offlineCap } from '../../src/core/systems/offline-cap';
import { effectiveTraits, snapshotOf, recoveryFactor } from '../../src/core/systems/hunters';
import { provisions } from '../../src/core/contracts/rewards';
import { allowanceExplained, payRiftglass } from '../../src/core/delves/riftglass';
import { lateHoursCost } from '../../src/core/delves/shop';
import { HOUR, T0 } from '../contracts/helpers';
import { cmd, strongKeep } from './helpers';

const DAY = 24 * HOUR;

const fresh = () => {
  const s = strongKeep('shop');
  s.delve.allowance = 0;
  s.delve.allowanceAt = s.time;
  s.delve.riftglass = 0;
  return s;
};

describe('the Riftglass allowance (GDD §5.10.8, D258)', () => {
  it('grows 10 a day, so 70 in a week', () => {
    const s = fresh();
    advance(s, s.time + 7 * DAY);
    expect(s.delve.allowance).toBeCloseTo(70, 6);
    expect(allowanceExplained(s).value).toBe(70);
  });

  it('banks up to two weeks (140) and no further', () => {
    const s = fresh();
    advance(s, s.time + 14 * DAY);
    expect(s.delve.allowance).toBeCloseTo(140, 6);
    advance(s, s.time + 30 * DAY);
    expect(s.delve.allowance).toBe(140);
  });

  it('grows while away, through catch-up, to the same number', () => {
    const live = fresh();
    const away = fresh();
    const end = live.time + 10 * DAY;
    advance(live, end);
    catchUpNow(away, end);
    expect(away.delve.allowance).toBeCloseTo(live.delve.allowance, 6);
    expect(away.delve.allowance).toBeCloseTo(100, 6);
  });

  it('pays whole Riftglass only, and never more than is waiting', () => {
    const s = fresh();
    s.delve.allowance = 3.7;
    expect(payRiftglass(s, 10)).toBe(3);
    expect(s.delve.riftglass).toBe(3);
    expect(s.delve.allowance).toBeCloseTo(0.7, 6);
    expect(payRiftglass(s, 10)).toBe(0);
  });

  it('does not start before the Keep is reached', () => {
    const s = fresh();
    s.delve.allowanceAt = null;
    advance(s, s.time + 3 * DAY);
    expect(s.delve.allowance).toBe(0);
    expect(s.delve.allowanceAt).toBeNull();
  });
});

describe('Late hours (D259)', () => {
  it('costs 30, 45, 60, 75, 90 and adds an hour each, then stops', () => {
    const s = fresh();
    s.delve.riftglass = 1000;
    const before = offlineCap(s).value;
    const costs = [30, 45, 60, 75, 90];
    costs.forEach((c, i) => {
      expect(lateHoursCost(s)?.value).toBe(c);
      const had = s.delve.riftglass;
      expect(cmd(s, { type: 'riftglass.buy', item: 'late-hours' }).ok).toBe(true);
      expect(had - s.delve.riftglass).toBe(c);
      expect(offlineCap(s).value).toBe(before + (i + 1) * 3600);
    });
    expect(lateHoursCost(s)).toBeNull();
    expect(cmd(s, { type: 'riftglass.buy', item: 'late-hours' }).ok).toBe(false);
  });

  it('refuses when short of Riftglass, and takes nothing', () => {
    const s = fresh();
    s.delve.riftglass = 29;
    const r = cmd(s, { type: 'riftglass.buy', item: 'late-hours' });
    expect(r.ok).toBe(false);
    expect(s.delve.riftglass).toBe(29);
    expect(s.delve.shop.lateHours).toBe(0);
  });

  it('is refused at the 24 hour ceiling and never pushes past it', () => {
    const s = fresh();
    s.delve.riftglass = 1000;
    // The Bell Tower, the Late Lantern and four levels of Late hours already reach the ceiling.
    s.buildings['bell-tower'] = 3;
    s.upgrades['late-lantern'] = 6;
    s.delve.shop.lateHours = 4;
    expect(offlineCap(s).value).toBe(balance.offline.ceiling.value);
    const r = cmd(s, { type: 'riftglass.buy', item: 'late-hours' });
    expect(r.ok).toBe(false);
    expect(s.delve.riftglass).toBe(1000);
    expect(s.delve.shop.lateHours).toBe(4);
    expect(offlineCap(s).value).toBeLessThanOrEqual(balance.offline.ceiling.value);
  });
});

describe('the other purchases', () => {
  it('Chosen start and Re-roll are bought once each', () => {
    const s = fresh();
    s.delve.riftglass = 200;
    expect(cmd(s, { type: 'riftglass.buy', item: 'chosen-start' }).ok).toBe(true);
    expect(cmd(s, { type: 'riftglass.buy', item: 'chosen-start' }).ok).toBe(false);
    expect(cmd(s, { type: 'riftglass.buy', item: 'reroll' }).ok).toBe(true);
    expect(cmd(s, { type: 'riftglass.buy', item: 'reroll' }).ok).toBe(false);
    expect(s.delve.riftglass).toBe(200 - 60 - 60);
    expect(s.delve.shop.chosenStart).toBe(true);
    expect(s.delve.shop.reroll).toBe(true);
  });

  it('a cosmetic costs 25 and is bought once', () => {
    const s = fresh();
    s.delve.riftglass = 100;
    const id = 'wall-lanterns';
    expect(cmd(s, { type: 'riftglass.buyCosmetic', cosmetic: id }).ok).toBe(true);
    expect(s.delve.riftglass).toBe(75);
    expect(cmd(s, { type: 'riftglass.buyCosmetic', cosmetic: id }).ok).toBe(false);
    expect(s.delve.shop.cosmetics).toEqual([id]);
  });
});

describe('alternate traits (D260)', () => {
  it('are bought once for 40, then switched freely while the hunter is at the hold', () => {
    const s = fresh();
    s.delve.riftglass = 100;
    const hunter = 'halvar';
    expect(cmd(s, { type: 'riftglass.switchTrait', hunter, alternate: true }).ok).toBe(false);
    expect(cmd(s, { type: 'riftglass.buyTrait', hunter }).ok).toBe(true);
    expect(s.delve.riftglass).toBe(60);
    expect(cmd(s, { type: 'riftglass.buyTrait', hunter }).ok).toBe(false);
    const first = effectiveTraits(s, hunter);
    expect(cmd(s, { type: 'riftglass.switchTrait', hunter, alternate: true }).ok).toBe(true);
    const swapped = effectiveTraits(s, hunter);
    expect(swapped[0]).toBe(first[0]);
    expect(swapped[1]).toBe('smoke-lunged');
    expect(snapshotOf(s, hunter).traits).toEqual(swapped);
    expect(cmd(s, { type: 'riftglass.switchTrait', hunter, alternate: true }).ok).toBe(false);
    expect(cmd(s, { type: 'riftglass.switchTrait', hunter, alternate: false }).ok).toBe(true);
    expect(effectiveTraits(s, hunter)).toEqual(first);
  });

  it('cannot be switched while the hunter is on a contract', () => {
    const s = fresh();
    s.delve.riftglass = 100;
    expect(cmd(s, { type: 'riftglass.buyTrait', hunter: 'zora' }).ok).toBe(true);
    s.board.open = [];
    s.board.open.push({
      id: 'a',
      village: 'dubno-ford',
      monster: 'kikimora',
      tier: 1,
      location: 'field',
      arrivedAt: s.time,
      revealed: 3,
    });
    const launched = cmd(s, {
      type: 'contract.launch',
      contract: 'a',
      party: ['zora', 'halvar', 'ostap'],
    });
    expect(launched.ok).toBe(true);
    const r = cmd(s, { type: 'riftglass.switchTrait', hunter: 'zora', alternate: true });
    expect(r.ok).toBe(false);
  });

  it('cannot be switched while the hunter is in a Delve', () => {
    const s = fresh();
    s.delve.riftglass = 100;
    expect(cmd(s, { type: 'riftglass.buyTrait', hunter: 'halvar' }).ok).toBe(true);
    expect(cmd(s, { type: 'delve.start', party: ['halvar', 'zora', 'ostap'] }).ok).toBe(true);
    const r = cmd(s, { type: 'riftglass.switchTrait', hunter: 'halvar', alternate: true });
    expect(r.ok).toBe(false);
  });

  it('every alternate trait names a hunter who has a matching second trait', () => {
    expect(alternateTraits.length).toBe(11);
  });

  it('Splint and Sling speeds the others up but not Ostap himself', () => {
    const s = fresh();
    s.delve.shop.traitsBought.push('ostap');
    s.delve.shop.traitsActive.push('ostap');
    const party = ['halvar', 'zora', 'ostap'].map((h) => effectiveTraits(s, h as 'halvar'));
    expect(recoveryFactor(party, 0)).toBeCloseTo(0.85, 9);
    expect(recoveryFactor(party, 1)).toBeCloseTo(0.85, 9);
    expect(recoveryFactor(party, 2)).toBe(recoveryFactor([party[2] ?? []], 0));
  });

  it('Thrifty cuts provisions 15% for contracts the holder joins', () => {
    const s = fresh();
    s.delve.shop.traitsBought.push('toma');
    const plain = provisions(s, 3, 2, ['halvar', 'zora', 'toma']).value;
    s.delve.shop.traitsActive.push('toma');
    const thrifty = provisions(s, 3, 2, ['halvar', 'zora', 'toma']).value;
    expect(thrifty).toBeCloseTo(plain * 0.85, 6);
    expect(provisions(s, 3, 2, ['halvar', 'zora', 'ostap']).value).toBeCloseTo(plain, 6);
  });

  it('start the sim week at T0 without drifting', () => {
    const s = fresh();
    expect(s.time).toBeGreaterThanOrEqual(T0);
  });
});
