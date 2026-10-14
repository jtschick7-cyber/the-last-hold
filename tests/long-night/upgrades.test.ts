// Plan T4.9 (GDD §5.9.5–5.9.6, §8.9–8.10, D111): The Hearth, and what every warden
// upgrade and relic does. Starting-state upgrades and Old Hands are tested with the
// Long Night (long-night.test.ts); the Iron Shutter with the stand (tests/stand).
import { describe, expect, it } from 'vitest';
import { UPGRADE_IDS, upgrades } from '../../src/content/warden-upgrades';
import { brewMs } from '../../src/core/alchemy/brewing';
import {
  bounty,
  contractDuration,
  holdBounty,
  xpPerHunter,
} from '../../src/core/contracts/rewards';
import { clueDuration } from '../../src/core/investigation/lodge';
import { contractXpBonus } from '../../src/core/long-night/bonuses';
import { upgradeCost } from '../../src/core/long-night/hearth';
import { advance } from '../../src/core/sim';
import type { GameState } from '../../src/core/state/game-state';
import { createNewGame } from '../../src/core/state/new-game';
import { offlineCap } from '../../src/core/systems/offline-cap';
import { productionRate } from '../../src/core/systems/production';
import { HOUR, T0, keepRich, run } from '../contracts/helpers';

const fresh = (): GameState => {
  const s = createNewGame('upgrades', T0);
  s.peasants.jobs['silver-digger'] = 1;
  return s;
};

describe('The Hearth (GDD §5.9.5)', () => {
  it('level L costs cost × growth^(L − 1) Embers, rounded; Embers are spent', () => {
    const s = fresh();
    s.embers = 1000;
    expect(upgradeCost(s, 'kept-coals')?.value).toBe(15);
    expect(run(s, { type: 'upgrade.buy', upgrade: 'kept-coals' }).ok).toBe(true);
    expect(s.upgrades['kept-coals']).toBe(1);
    expect(s.embers).toBe(985);
    expect(upgradeCost(s, 'kept-coals')?.value).toBe(23); // 22.5, rounded half up
    run(s, { type: 'upgrade.buy', upgrade: 'kept-coals' });
    expect(upgradeCost(s, 'kept-coals')?.value).toBe(34); // 33.75
  });

  it('stops at the maximum, and refuses without enough Embers', () => {
    const s = fresh();
    s.embers = 1e6;
    for (let i = 0; i < upgrades['swift-roads'].maxLevel; i++)
      expect(run(s, { type: 'upgrade.buy', upgrade: 'swift-roads' }).ok).toBe(true);
    expect(run(s, { type: 'upgrade.buy', upgrade: 'swift-roads' }).ok).toBe(false);
    expect(upgradeCost(s, 'swift-roads')).toBeNull();
    const poor = fresh();
    poor.embers = 14;
    expect(run(poor, { type: 'upgrade.buy', upgrade: 'kept-coals' }).ok).toBe(false);
    expect(poor.embers).toBe(14);
  });

  it('every upgrade can be bought to its maximum, and there is no way to sell one back', () => {
    const s = fresh();
    s.embers = 1e9;
    for (const id of UPGRADE_IDS) {
      while (upgradeCost(s, id)) expect(run(s, { type: 'upgrade.buy', upgrade: id }).ok).toBe(true);
      expect(s.upgrades[id]).toBe(upgrades[id].maxLevel);
    }
  });
});

describe('upgrade and relic effects (GDD §8.9–8.10)', () => {
  it('Kept Coals: +10% all production per level in the ember bucket, never silver', () => {
    const s = fresh();
    const food = productionRate(s, 'food').value;
    const silver = productionRate(s, 'silver').value;
    s.upgrades['kept-coals'] = 3;
    expect(productionRate(s, 'food').value).toBeCloseTo(food * 1.3);
    expect(productionRate(s, 'silver').value).toBe(silver);
    expect(JSON.stringify(productionRate(s, 'food').breakdown)).toContain('Kept Coals');
  });

  it("Plough-Share +10% food; Mason's Plumb +10% wood and iron; neither touches silver", () => {
    const s = fresh();
    s.peasants.jobs.miner = 1;
    const before = (['food', 'wood', 'iron', 'silver'] as const).map(
      (r) => productionRate(s, r).value,
    );
    s.relics = [
      { id: 'plough-share', cycle: 1 },
      { id: 'masons-plumb', cycle: 1 },
    ];
    const after = (['food', 'wood', 'iron', 'silver'] as const).map(
      (r) => productionRate(s, r).value,
    );
    expect(after[0]).toBeCloseTo((before[0] ?? 0) * 1.1);
    expect(after[1]).toBeCloseTo((before[1] ?? 0) * 1.1);
    expect(after[2]).toBeCloseTo((before[2] ?? 0) * 1.1);
    expect(after[3]).toBe(before[3]);
  });

  it('Drill Yard +10% contract XP per level and the Tally Stick +15%, in the contract result', () => {
    const s = keepRich('xp');
    s.upgrades['drill-yard'] = 2;
    s.relics = [{ id: 'tally-stick', cycle: 1 }];
    expect(contractXpBonus(s).value).toBeCloseTo(0.35);
    s.board.open = [
      {
        id: 'x1',
        village: 'dubno-ford',
        monster: 'kikimora',
        tier: 1,
        location: 'field',
        arrivedAt: T0,
        revealed: 3,
      },
    ];
    expect(
      run(s, { type: 'contract.launch', contract: 'x1', party: ['halvar', 'zora', 'ostap'] }).ok,
    ).toBe(true);
    advance(s, T0 + 2 * HOUR);
    const r = s.results[0];
    expect(r?.xp).toBeCloseTo(xpPerHunter(1, r?.success ?? false) * 1.35);
  });

  it('Village Goodwill: +5% bounty silver per level, on contract bounties only', () => {
    const s = keepRich('goodwill');
    const plain = holdBounty(s, 3, []).value;
    s.upgrades['village-goodwill'] = 4;
    expect(holdBounty(s, 3, []).value).toBeCloseTo(plain * 1.2);
    const seams = fresh();
    const silver = productionRate(seams, 'silver').value;
    seams.upgrades['village-goodwill'] = 4;
    expect(productionRate(seams, 'silver').value).toBe(silver);
  });

  it('Swift Roads: contracts take 10% less time per level, and the timer uses it', () => {
    const s = keepRich('roads');
    const base = contractDuration(s, 2).value;
    s.upgrades['swift-roads'] = 2;
    expect(contractDuration(s, 2).value).toBeCloseTo(base * 0.8);
    s.board.open = [
      {
        id: 'r1',
        village: 'dubno-ford',
        monster: 'kikimora',
        tier: 2,
        location: 'field',
        arrivedAt: T0,
        revealed: 3,
      },
    ];
    expect(
      run(s, { type: 'contract.launch', contract: 'r1', party: ['halvar', 'zora', 'ostap'] }).ok,
    ).toBe(true);
    expect(s.running[0]?.endsAt).toBe(s.time + base * 0.8 * 1000);
  });

  it('Late Lantern: +1 h offline cap per level, never above the 24 h ceiling', () => {
    const s = fresh();
    const base = offlineCap(s).value;
    s.upgrades['late-lantern'] = 4;
    expect(offlineCap(s).value).toBe(base + 4 * 3600);
    s.cycle.age = 'keep';
    s.buildings['bell-tower'] = 3;
    expect(offlineCap(s).value).toBeLessThanOrEqual(24 * 3600);
    expect(JSON.stringify(offlineCap(s).breakdown)).toContain('Late Lantern');
  });

  it('Bone Whistle: clues take 15% less time; Copper Still: brewing 20% less', () => {
    const s = keepRich('lab');
    const clue = clueDuration(s, { monster: 'wolf' }, 9).value;
    const brew = brewMs(s);
    s.relics = [
      { id: 'bone-whistle', cycle: 1 },
      { id: 'copper-still', cycle: 1 },
    ];
    expect(clueDuration(s, { monster: 'wolf' }, 9).value).toBe(Math.round(clue * 0.85));
    expect(brewMs(s)).toBeCloseTo(brew * 0.8);
  });

  it('with no upgrades or relics nothing changes (contract fights and rewards as in v0.3)', () => {
    const s = keepRich('none');
    expect(contractXpBonus(s).value).toBe(0);
    expect(xpPerHunter(3, true, 0)).toBe(xpPerHunter(3, true));
    expect(holdBounty(s, 4, []).value).toBe(bounty(4, s.cycle.age, []).value);
  });
});
