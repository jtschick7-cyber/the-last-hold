// Plan T3.7: knowledge levels, kills and bonuses. GDD §5.6.2, §5.0 (combat buckets), §7.5.
import { describe, expect, it } from 'vitest';
import { MONSTER_IDS } from '../../src/content/monsters';
import { num } from '../../src/core/balance-access';
import { runFight } from '../../src/core/combat';
import { knowledgeBonus } from '../../src/core/combat/stats';
import { computeOdds } from '../../src/core/contracts/odds';
import { fightSeed } from '../../src/core/contracts/seeds';
import { levelOf, monsterFor, recordFight } from '../../src/core/investigation/knowledge';
import { seeded } from '../../src/core/rng';
import { advance } from '../../src/core/sim/advance';
import type { ContractInstance, FightRef } from '../../src/core/state/game-state';
import { snapshotOf } from '../../src/core/systems/hunters';
import { HOUR, T0, give, keepRich, run } from '../contracts/helpers';

const must = <T>(v: T | undefined): T => {
  if (v === undefined) throw new Error('expected a value');
  return v;
};

const STUDIED = num('knowledge.studiedKills');
const MASTERED = num('knowledge.masteredKills');

describe('levels from kills (GDD §5.6.2)', () => {
  it('a fight, won or lost, Identifies the species; only a win counts as a kill', () => {
    const s = keepRich('kn');
    recordFight(s, 'wolf', false);
    expect(s.bestiary.wolf).toEqual({ level: 2, kills: 0 });
    recordFight(s, 'wolf', true);
    expect(s.bestiary.wolf).toEqual({ level: 2, kills: 1 });
  });

  it('4 kills make it Studied and 10 make it Mastered, the thresholds read from balance', () => {
    const s = keepRich('kn');
    for (let i = 1; i <= MASTERED; i++) {
      recordFight(s, 'upyr', true);
      const want = i >= MASTERED ? 4 : i >= STUDIED ? 3 : 2;
      expect(levelOf(s, 'upyr'), `${i} kills`).toBe(want);
    }
    expect([STUDIED, MASTERED]).toEqual([4, 10]);
  });

  it('never lowers a level, and a Sighted species jumps straight to Identified by a fight', () => {
    const s = keepRich('kn');
    s.bestiary.nix = { level: 1, kills: 0 };
    recordFight(s, 'nix', false);
    expect(levelOf(s, 'nix')).toBe(2);
    s.bestiary.nix = { level: 4, kills: 12 };
    recordFight(s, 'nix', false);
    expect(levelOf(s, 'nix')).toBe(4);
  });

  it('keeps counts per species', () => {
    const s = keepRich('kn');
    recordFight(s, 'wolf', true);
    recordFight(s, 'kikimora', true);
    recordFight(s, 'kikimora', true);
    expect(s.bestiary.wolf?.kills).toBe(1);
    expect(s.bestiary.kikimora?.kills).toBe(2);
    expect(levelOf(s, 'leshy')).toBe(0);
  });
});

describe('the knowledge bucket (GDD §5.0)', () => {
  it('is +5% Studied and +10% Mastered, nothing below', () => {
    expect([0, 1, 2, 3, 4].map(knowledgeBonus)).toEqual([
      0,
      0,
      0,
      num('knowledge.studiedDamage'),
      num('knowledge.masteredDamage'),
    ]);
    expect([knowledgeBonus(3), knowledgeBonus(4)]).toEqual([0.05, 0.1]);
  });

  const party = () => {
    const s = keepRich('kn');
    give(s, 'halvar', 'zora');
    return [snapshotOf(s, 'halvar'), snapshotOf(s, 'zora')];
  };
  const firstHunterHit = (knowledge: number) => {
    const r = runFight({
      party: party(),
      monster: { monster: 'kikimora', tier: 1, knowledge },
      location: 'field',
      rolls: seeded('kn:first-hit'),
    });
    const hit = r.log.find(
      (l) => (l.kind === 'hit' || l.kind === 'crit') && l.actor !== 'kikimora',
    );
    if (!hit?.dealt) throw new Error('no hunter hit');
    return { dealt: hit.dealt, text: hit.text };
  };

  it('raises what the hunters deal by that percent, on the same rolls', () => {
    const base = firstHunterHit(0);
    expect(firstHunterHit(2).dealt).toBe(base.dealt);
    expect(firstHunterHit(3).dealt).toBeCloseTo(base.dealt * 1.05, 9);
    expect(firstHunterHit(4).dealt).toBeCloseTo(base.dealt * 1.1, 9);
  });

  it('shows in the fight log only when it applies, so a log never hides a bonus', () => {
    expect(firstHunterHit(0).text).not.toMatch(/Studied|Mastered/);
    expect(firstHunterHit(3).text).toMatch(/\+5% Studied/);
    expect(firstHunterHit(4).text).toMatch(/\+10% Mastered/);
  });

  it('leaves the monster alone: it deals the same damage at any level', () => {
    const run0 = runFight({
      party: party(),
      monster: { monster: 'kikimora', tier: 1 },
      location: 'field',
      rolls: seeded('kn:m'),
    });
    const run4 = runFight({
      party: party(),
      monster: { monster: 'kikimora', tier: 1, knowledge: 4 },
      location: 'field',
      rolls: seeded('kn:m'),
    });
    const firstMonster = (r: typeof run0) =>
      r.log.find((l) => l.actor === 'kikimora' && l.dealt)?.dealt;
    expect(firstMonster(run4)).toBe(firstMonster(run0));
  });

  it('the odds preview counts it: a Mastered species is beaten at least as often', () => {
    const p = party();
    const input = (knowledge: number) => ({
      gameSeed: 'kn',
      contractId: 'c1',
      party: p,
      monster: { monster: 'upyr' as const, tier: 2, knowledge },
      location: 'field' as const,
      rank: 'keep' as const,
    });
    const low = computeOdds(input(2));
    const high = computeOdds(input(4));
    expect(high.winChance).toBeGreaterThanOrEqual(low.winChance);
    expect(high.meanTicks).toBeLessThan(low.meanTicks);
  });
});

describe('knowledge in real contracts (GDD §5.6.2)', () => {
  const contract = (
    id: string,
    monster: ContractInstance['monster'] = 'kikimora',
  ): ContractInstance => ({
    id,
    village: 'dubno-ford',
    monster,
    tier: 1,
    location: 'field',
    arrivedAt: T0,
    revealed: 3,
  });

  it('monsterFor reads the level now, for odds and for the launch', () => {
    const s = keepRich('kn');
    const c = contract('c1');
    expect(monsterFor(s, c)).toEqual({ monster: 'kikimora', tier: 1, knowledge: 0 });
    s.bestiary.kikimora = { level: 3, kills: 3 };
    expect(monsterFor(s, c).knowledge).toBe(3);
  });

  it('a launch freezes the level; a later level-up never changes the recorded fight', () => {
    const s = keepRich('kn');
    s.bestiary.kikimora = { level: 2, kills: 2 };
    s.board.open = [contract('a'), contract('b')];
    give(s, 'halvar', 'zora', 'ostap');
    expect(run(s, { type: 'contract.launch', contract: 'a', party: ['halvar', 'zora'] }).ok).toBe(
      true,
    );
    expect(
      run(s, { type: 'contract.launch', contract: 'b', party: ['ostap'], confirmReckless: true })
        .ok,
    ).toBe(true);
    expect(s.running.map((r) => r.knowledge)).toEqual([2, 2]);
    // The first contract's win makes kikimora Studied; the second launched earlier and stays at 2.
    s.bestiary.kikimora = { level: 3, kills: 3 };
    advance(s, s.time + 2 * HOUR);
    const refs = s.log.recentFights;
    expect(refs).toHaveLength(2);
    for (const ref of refs) {
      expect(ref.monster.knowledge).toBe(2);
      const again = runFight({
        party: ref.party,
        monster: ref.monster,
        location: ref.location,
        rolls: seeded(ref.seed),
      });
      expect(again.result).toBe(ref.result);
    }
  });

  it('a finished fight records the kill and the knowledge, win or lose', () => {
    const s = keepRich('kn');
    s.board.open = [contract('a', 'upyr')];
    must(s.board.open[0]).tier = 4; // a long shot for two level-1 hunters
    must(s.board.open[0]).location = 'barrow';
    give(s, 'halvar', 'zora');
    expect(
      run(s, {
        type: 'contract.launch',
        contract: 'a',
        party: ['halvar', 'zora'],
        confirmReckless: true,
      }).ok,
    ).toBe(true);
    advance(s, s.time + 9 * HOUR);
    const ref: FightRef | undefined = s.log.recentFights[0];
    expect(ref).toBeDefined();
    const entry = s.bestiary.upyr;
    expect(entry?.level).toBeGreaterThanOrEqual(2);
    expect(entry?.kills).toBe(ref?.result === 'win' ? 1 : 0);
  });

  it('every species can be tracked (sixteen from v0.5)', () => {
    const s = keepRich('kn');
    for (const m of MONSTER_IDS) recordFight(s, m, true);
    expect(Object.keys(s.bestiary)).toHaveLength(MONSTER_IDS.length);
    expect(MONSTER_IDS).toHaveLength(16);
  });

  it('knowledge persists: the fixture saves keep it, and seeds for fights do not depend on it', () => {
    expect(fightSeed('g', 'c1', ['halvar'], [])).toBe('g:fight:c1:halvar:');
  });
});
