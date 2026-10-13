// Plan T4.13 (GDD §6.1, D114): the simulated player's v0.4 rules.
import { describe, expect, it } from 'vitest';
import { consumables } from '../../src/content/consumables';
import { monsters } from '../../src/content/monsters';
import { apply, type Command } from '../../src/core/commands';
import { labFirstSetBuilt } from '../../src/core/policies/lab';
import { contractMoves } from '../../src/core/policies/contracts';
import { provisions } from '../../src/core/contracts/rewards';
import { freshHunter } from '../../src/core/state/hunters-state';
import { T0 } from '../contracts/helpers';
import {
  defenseMoves,
  emberMoves,
  freshMemory,
  standKit,
  standMove,
} from '../../src/core/policies/long-night';
import { policyAgeUp, recruitHold } from '../../src/core/policies/goals';
import { standSeed, waveList } from '../../src/core/stand/waves';
import type { GameState } from '../../src/core/state/game-state';
import { keepRich } from '../contracts/helpers';

const actor = (s: GameState) => {
  const done: Command[] = [];
  return {
    done,
    act: (cmd: Command): boolean => {
      const ok = apply(s, cmd, s.time).ok;
      if (ok) done.push(cmd);
      return ok;
    },
  };
};
const none = () => ({ food: 0, wood: 0, iron: 0, silver: 0 });

describe('the simulated player in v0.4 (GDD §6.1)', () => {
  it('works toward Citadel and Bastion; hires leave its silver only while saving for it', () => {
    const s = keepRich('ranks');
    expect(policyAgeUp(s)?.to).toBe('citadel');
    const DAY = 86_400_000;
    s.peasants.total = 10;
    expect(recruitHold(s, DAY)).toBe(0); // 50 peasants still missing
    Object.assign(s.buildings, { mill: 10, smithy: 8, barracks: 1 });
    s.peasants.total = 50;
    s.resources = { food: 0, wood: 0, iron: 0, silver: 0 };
    expect(recruitHold(s, DAY)).toBe(0); // requirements met, but far from affordable
    s.resources = { food: 1e7, wood: 1e7, iron: 1e7, silver: 1e6 };
    expect(recruitHold(s, DAY)).toBe(1_000); // affordable within 2 check-ins: saving
  });

  it('from the Keep, the Lodge, Hut and one Garden come before recruits and gear', () => {
    const s = keepRich('lab');
    expect(labFirstSetBuilt(s)).toBe(false);
    Object.assign(s.buildings, { 'hunters-lodge': 1, 'alchemists-hut': 1, 'herb-garden': 1 });
    expect(labFirstSetBuilt(s)).toBe(true);
    s.cycle.age = 'hamlet';
    s.buildings['hunters-lodge'] = 0;
    expect(labFirstSetBuilt(s)).toBe(true); // no such rule in the Hamlet
  });

  it('raises Walls and the Watchtower in turn, the lower one first', () => {
    const s = keepRich('walls');
    s.cycle.age = 'citadel';
    s.resources = { food: 1e9, wood: 1e9, iron: 1e9, silver: 1e9 };
    const { act, done } = actor(s);
    expect(defenseMoves(s, act, none)).toBe(20);
    expect(s.buildings.walls).toBe(10);
    expect(s.buildings.watchtower).toBe(10);
    expect(done.slice(0, 4).map((c) => (c.type === 'build.upgrade' ? c.building : ''))).toEqual([
      'walls',
      'watchtower',
      'walls',
      'watchtower',
    ]);
  });

  it('spends Embers on the cheapest upgrade, ties in list order', () => {
    const s = keepRich('embers');
    s.embers = 40;
    const { act } = actor(s);
    emberMoves(s, act);
    // Full Larder 10, then Kept Coals 15 (ties with Drill Yard; list order), then Drill Yard 15.
    expect(s.upgrades['full-larder']).toBe(1);
    expect(s.upgrades['kept-coals']).toBe(1);
    expect(s.upgrades['drill-yard']).toBe(1);
    expect(s.embers).toBe(0);
  });

  it('the stand kit: the oil for the most common oiled family in the first 12 waves; Draughts', () => {
    const s = keepRich('kit');
    s.cycle.age = 'bastion';
    const oiled = new Set(
      Object.values(consumables).flatMap((c) => (c.effect.kind === 'oil' ? [c.effect.family] : [])),
    );
    const families = waveList(standSeed(s), 12)
      .map((w) => monsters[w.monster].family)
      .filter((f) => oiled.has(f));
    const top = [...new Set(families)].sort(
      (a, b) => families.filter((f) => f === b).length - families.filter((f) => f === a).length,
    )[0];
    for (const id of Object.keys(s.stores) as (keyof typeof s.stores)[]) s.stores[id] = 2;
    const kit = standKit(s, ['halvar', 'zora', 'ostap']);
    const oils = Object.values(kit.oils);
    expect(oils).toHaveLength(2); // two in the stores
    for (const o of oils) {
      const e = o ? consumables[o].effect : null;
      expect(e?.kind === 'oil' && e.family).toBe(top);
    }
    expect(Object.values(kit.potions)).toEqual(['mending-draught', 'mending-draught']);
  });

  it('stands at the first check-in where Embers per day drops, not before', () => {
    const s = keepRich('stand');
    s.cycle.age = 'bastion';
    const memory = freshMemory();
    const { act } = actor(s);
    expect(standMove(s, act, memory)).toBe(false); // the first look only remembers
    expect(memory.lastPerDay).not.toBeNull();
    memory.lastPerDay = Number.POSITIVE_INFINITY; // pretend yesterday paid more per day
    expect(standMove(s, act, memory)).toBe(true);
    expect(s.cycle.number).toBe(2);
    expect(s.cycles[0]?.stand?.party.length).toBeGreaterThan(0);
  });

  it('leaves a Tracker home when a party without her is within 5 points and a Lodge slot is busy', () => {
    const s = keepRich('tracker');
    s.hunters.herdis = freshHunter();
    s.roster.active = ['herdis', ...s.roster.active];
    Object.assign(s.buildings, { 'hunters-lodge': 1, 'alchemists-hut': 1, 'herb-garden': 1 });
    s.board.open = [
      {
        id: 'easy',
        village: 'dubno-ford',
        monster: 'kikimora',
        tier: 1,
        location: 'field',
        arrivedAt: T0,
        revealed: 3,
      },
      {
        id: 'look',
        village: 'velkvik',
        monster: 'nix',
        tier: 5,
        location: 'river',
        arrivedAt: T0,
        revealed: 0,
      },
    ];
    s.queues.investigation = [{ contractId: 'look', nextClueAt: s.time + 60_000 }];
    // Food for the easy contract only, so the tier-5 one stays on the board with its slot busy.
    s.resources.food = provisions(s, 3, 1).value + 1;
    const { act, done } = actor(s);
    contractMoves(s, act, { ...none(), food: s.resources.food });
    const launch = done.find((c) => c.type === 'contract.launch' && c.contract === 'easy');
    expect(launch && launch.type === 'contract.launch' && launch.party).not.toContain('herdis');
    expect(s.running.find((r) => r.contract.id === 'easy')?.party).not.toContain('herdis');
  });

  it('never stands below Bastion, or while the v0.4 arrival is still due', () => {
    const s = keepRich('no-stand');
    const memory = { cycle: 1, lastPerDay: Number.POSITIVE_INFINITY };
    const { act } = actor(s);
    expect(standMove(s, act, memory)).toBe(false);
    s.cycle.age = 'bastion';
    s.arrivalDue = true;
    expect(standMove(s, act, memory)).toBe(false);
  });
});
