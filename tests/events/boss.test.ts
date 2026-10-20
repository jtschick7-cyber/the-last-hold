// Plan T9.6 (GDD §5.12.4–§5.12.5, §5.12.10–§5.12.11, technical design §5.2–§5.3, D358–D361, D387):
// boss attempts on the owner's real save (the v8 fixture, migrated), with events open.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { runFight } from '../../src/core/combat';
import { apply } from '../../src/core/commands/apply';
import { bounty } from '../../src/core/contracts/rewards';
import { seeded } from '../../src/core/rng';
import { resetForNewCycle } from '../../src/core/long-night/reset';
import { encodeSaveFile, loadEnvelope, makeEnvelope } from '../../src/core/save';
import { catchUpNow } from '../../src/core/sim/offline';
import type { GameState } from '../../src/core/state/game-state';
import { attemptProblem, bossOfVisit, poolAtTier, visitTier } from '../../src/core/systems/boss';
import { eligibleHunters, tokenBank } from '../../src/core/systems/events';
import { HUNTER_IDS, type HunterId } from '../../src/content/hunters';
import { MS_PER_HOUR } from '../../src/core/time';

const owner = (): GameState => {
  const env = JSON.parse(
    readFileSync(new URL('../saves/fixtures/v8-owner.json', import.meta.url), 'utf8'),
  );
  const r = loadEnvelope(env);
  if (!r.ok) throw new Error(r.error);
  catchUpNow(r.value.state, r.value.state.time);
  return r.value.state;
};

/** A save with events open and a full bank, and the time to attempt at. */
const ready = (): { s: GameState; now: number; party: HunterId[] } => {
  const s = owner();
  const now = s.time;
  apply(s, { type: 'debug.fillBank' }, now);
  const party = eligibleHunters(s, now).slice(0, 4);
  return { s, now, party };
};

describe('the save under test', () => {
  it('has events open, an age that opens them, and at least four hunters able to attend', () => {
    const { s, party } = ready();
    expect(s.events.opened).toBe(true);
    expect(['citadel', 'bastion']).toContain(s.cycle.age);
    expect(party).toHaveLength(4);
  });
});

describe('boss.attempt', () => {
  it('spends a token, rests the party for 24 h and pays XP win or lose', () => {
    const { s, now, party } = ready();
    const xpBefore = party.map((id) => s.hunters[id]?.xp ?? 0);
    const levelsBefore = party.map((id) => s.hunters[id]?.level ?? 0);
    const r = apply(s, { type: 'boss.attempt', party }, now);
    expect(r.ok).toBe(true);
    expect(tokenBank(s, now).value.count).toBe(5);
    const rep = s.events.last?.boss;
    expect(rep?.xp).toBe(15 * (rep?.tier ?? 0));
    party.forEach((id, i) => {
      expect(s.events.rest[id]).toBe(s.events.clock.value + 24 * MS_PER_HOUR);
      const h = s.hunters[id];
      const gained = (h?.level ?? 0) > (levelsBefore[i] ?? 0) || (h?.xp ?? 0) > (xpBefore[i] ?? 0);
      expect(gained, id).toBe(true);
    });
    expect(s.events.attempts).toBe(1);
    expect(s.events.boss.attempts).toBe(1);
    expect(rep?.boss).toBe('lindworm-of-velk-fjord');
  });

  it('works the fight at once from a seed, and the recorded fight replays to the same pool', () => {
    const { s, now, party } = ready();
    apply(s, { type: 'boss.attempt', party }, now);
    const ref = s.events.recent[0];
    expect(ref?.event).toEqual({ kind: 'boss', attempt: 1, id: 'lindworm-of-velk-fjord' });
    expect(ref?.contractId).toBe('event:1');
    if (!ref) throw new Error('no fight kept');
    const again = runFight({
      party: ref.party,
      monster: ref.monster,
      location: ref.location,
      rolls: seeded(ref.seed),
      prep: ref.prep,
      alchemy: ref.alchemy,
    });
    expect(again.monsterHealth).toBe(s.events.boss.pool);
  });

  it('the same inputs twice give the same pool and the same result', () => {
    const a = ready();
    const b = ready();
    apply(a.s, { type: 'boss.attempt', party: a.party }, a.now);
    apply(b.s, { type: 'boss.attempt', party: b.party }, b.now);
    expect(b.s.events.boss).toEqual(a.s.events.boss);
    expect(b.s.events.last).toEqual(a.s.events.last);
  });

  it('the pool never rises, and the damage is exactly what the pool lost', () => {
    const { s, now, party } = ready();
    const start = poolAtTier(visitTier(s));
    apply(s, { type: 'boss.attempt', party }, now);
    const rep = s.events.last?.boss;
    expect(rep?.poolStart).toBe(start);
    expect(rep?.poolBefore).toBe(start);
    expect(rep?.poolAfter).toBeLessThanOrEqual(start);
    expect((rep?.poolBefore ?? 0) - (rep?.poolAfter ?? 0)).toBe(rep?.damage);
    expect(s.events.boss.pool).toBe(rep?.poolAfter);
  });

  it('fixes the tier at the first attempt: a Rank-up in the middle of the visit changes nothing', () => {
    const { s, now, party } = ready();
    s.cycle.age = 'citadel';
    apply(s, { type: 'boss.attempt', party: party.slice(0, 2) }, now);
    expect(s.events.boss.tier).toBe(4);
    s.cycle.age = 'bastion';
    expect(visitTier(s)).toBe(4);
    apply(s, { type: 'boss.attempt', party: party.slice(2, 4) }, now);
    expect(s.events.last?.boss?.tier).toBe(4);
    expect(s.events.boss.tier).toBe(4);
  });

  it('a Bastion visit starts at tier 5, and the second pass one tier higher', () => {
    const { s } = ready();
    s.cycle.age = 'bastion';
    expect(visitTier(s)).toBe(5);
    s.events.boss.visit = 3; // the first boss again, one pass done
    expect(bossOfVisit(3)).toBe('lindworm-of-velk-fjord');
    expect(visitTier(s)).toBe(6);
    s.cycle.age = 'citadel';
    expect(visitTier(s)).toBe(5);
  });

  it('refuses without changing anything: no token, a resting hunter, too many, the same hunter twice', () => {
    const { s, now, party } = ready();
    const snapshot = structuredClone(s);
    const first = party[0] as HunterId;
    const drained = owner();
    expect(attemptProblem(drained, party, { oils: {}, potions: {}, bombs: [] }, drained.time)).toBe(
      'No attempt token in the bank.',
    );
    const tooMany = HUNTER_IDS.filter((h) => s.hunters[h]).slice(0, 5);
    expect(apply(s, { type: 'boss.attempt', party: tooMany }, now).ok).toBe(false);
    expect(apply(s, { type: 'boss.attempt', party: [first, first] }, now).ok).toBe(false);
    expect(apply(s, { type: 'boss.attempt', party: [] }, now).ok).toBe(false);
    expect(s).toEqual(snapshot);
    // A hunter who attended rests, and cannot go again at once.
    apply(s, { type: 'boss.attempt', party: party.slice(0, 1) }, now);
    const after = structuredClone(s);
    const again = apply(s, { type: 'boss.attempt', party: party.slice(0, 1) }, now);
    expect(again.ok).toBe(false);
    expect(s).toEqual(after);
  });

  it('refuses while events are locked', () => {
    const { s, now, party } = ready();
    s.cycle.age = 'keep';
    const r = apply(s, { type: 'boss.attempt', party }, now);
    expect(r.ok).toBe(false);
  });
});

describe('milestones (GDD §5.12.5)', () => {
  const onePool = (s: GameState, share: number): number => {
    const tier = visitTier(s);
    s.events.boss = {
      visit: 0,
      tier,
      pool: Math.round(poolAtTier(tier) * share),
      paid: 0,
      attempts: 1,
    };
    return poolAtTier(tier);
  };

  it('an attempt that crosses two milestones pays both, once', () => {
    const { s, now, party } = ready();
    onePool(s, 0.4); // 60% already dealt: 25% and 50% are crossed, 75% is not (the party deals little)
    const silverBefore = s.resources.silver;
    const fangs = s.stores['wolf-fang'];
    apply(s, { type: 'boss.attempt', party }, now);
    const rep = s.events.last?.boss;
    expect(rep?.milestones).toEqual([0, 1]);
    const one = bounty(rep?.tier ?? 0, s.cycle.age, []).value;
    expect(rep?.silver).toBeCloseTo(2 * one, 6);
    expect(s.resources.silver - silverBefore).toBeCloseTo(2 * one, 6);
    expect(rep?.reagents).toEqual({ 'wolf-fang': 6 });
    expect(s.stores['wolf-fang'] - fangs).toBe(6);
    expect(s.events.boss.paid).toBe(2);
    // The next attempt pays none of them again.
    apply(s, { type: 'debug.endRests' }, now);
    apply(s, { type: 'boss.attempt', party }, now);
    expect(s.events.last?.boss?.milestones.every((m) => m >= 2)).toBe(true);
  });

  it('boss silver is not bounty silver; no Embers, no trophies, no contract counters (D387)', () => {
    const { s, now, party } = ready();
    onePool(s, 0.4);
    const before = {
      bounty: s.stats.bountySilver,
      trophies: s.stats.trophies,
      won: s.stats.contractsWon,
      lost: s.stats.contractsLost,
      embers: s.embers,
      threat: structuredClone(s.threat),
      bestiary: structuredClone(s.bestiary),
      tierWins: structuredClone(s.board.tierWins),
      records: party.map((id) => structuredClone(s.hunters[id]?.record)),
    };
    apply(s, { type: 'boss.attempt', party }, now);
    expect(s.stats.bountySilver).toBe(before.bounty);
    expect(s.stats.trophies).toBe(before.trophies);
    expect(s.stats.contractsWon).toBe(before.won);
    expect(s.stats.contractsLost).toBe(before.lost);
    expect(s.embers).toBe(before.embers);
    expect(s.threat).toEqual(before.threat);
    expect(s.bestiary).toEqual(before.bestiary);
    expect(s.board.tierWins).toEqual(before.tierWins);
    expect(party.map((id) => s.hunters[id]?.record)).toEqual(before.records);
  });

  it('a kill pays the 4th milestone (3 bounties, 6 reagents), one item, and starts the next boss at once', () => {
    const { s, now, party } = ready();
    const tier = visitTier(s);
    s.events.boss = { visit: 0, tier, pool: 1, paid: 3, attempts: 5 };
    const items = s.items.length;
    const silver = s.resources.silver;
    apply(s, { type: 'boss.attempt', party }, now);
    const rep = s.events.last?.boss;
    expect(rep?.killed).toBe(true);
    expect(rep?.poolAfter).toBe(0);
    expect(rep?.milestones).toEqual([3]);
    const one = bounty(tier, s.cycle.age, []).value;
    expect(rep?.silver).toBeCloseTo(3 * one, 6);
    expect(rep?.reagents).toEqual({ 'wolf-fang': 6 });
    const item = rep?.found.find((k) => k.startsWith('loot:') || k.startsWith('salvaged:'));
    expect(item).toBeDefined();
    if (item?.startsWith('loot:')) {
      expect(s.items.length).toBe(items + 1);
      expect(['silvered-blade', 'emberwright-plate']).toContain(item.split(':')[2]);
    } else expect(s.resources.silver).toBeGreaterThan(silver + 3 * one);
    expect(s.events.boss).toEqual({ visit: 1, tier: null, pool: null, paid: 0, attempts: 0 });
    expect(bossOfVisit(1)).toBe('barrow-king');
    expect(poolAtTier(visitTier(s))).toBe(poolAtTier(s.cycle.age === 'bastion' ? 5 : 4));
  });

  it('the Barrow-King pays grave dust only', () => {
    const { s, now, party } = ready();
    const tier = visitTier(s);
    s.events.boss = { visit: 1, tier, pool: 1, paid: 3, attempts: 5 };
    apply(s, { type: 'boss.attempt', party }, now);
    expect(s.events.last?.boss?.reagents).toEqual({ 'grave-dust': 6 });
  });

  it('Stores full: the kill’s item is salvaged and the result says so', () => {
    const { s, now, party } = ready();
    const tier = visitTier(s);
    s.events.boss = { visit: 0, tier, pool: 1, paid: 3, attempts: 5 };
    const filler = s.items[0];
    if (!filler) throw new Error('the save has no item to copy');
    while (s.items.filter((i) => i.where === null).length < 40)
      s.items.push({ ...structuredClone(filler), id: `f${s.items.length}`, where: null });
    apply(s, { type: 'boss.attempt', party }, now);
    expect(s.events.last?.boss?.found.some((k) => k.startsWith('salvaged:'))).toBe(true);
  });
});

describe('the Long Night (GDD §5.12.10)', () => {
  it('keeps the visit: which boss, its tier, the pool and the milestones already paid', () => {
    const { s, now, party } = ready();
    apply(s, { type: 'boss.attempt', party }, now);
    s.events.boss.paid = 2;
    const keep = structuredClone(s.events.boss);
    const tokens = structuredClone(s.events.tokens);
    resetForNewCycle(s);
    expect(s.events.boss).toEqual(keep);
    expect(s.events.tokens).toEqual(tokens);
  });
});

describe('saving after an attempt (technical design §5.2, §5.3, §9.4)', () => {
  it('round-trips the event fight reference and the result report unchanged', () => {
    const { s, now, party } = ready();
    apply(s, { type: 'boss.attempt', party }, now);
    const back = loadEnvelope(JSON.parse(encodeSaveFile(makeEnvelope(s, 0))));
    if (!back.ok) throw new Error(back.error);
    expect(back.value.state.events).toEqual(s.events);
    expect(back.value.state.events.recent[0]?.monster).toMatchObject({
      event: 'lindworm-of-velk-fjord',
    });
    expect(back.value.state.events.recent[0]?.location).toBeNull();
  });

  it('keeps only the last events.recentKeep fights', () => {
    const { s, now, party } = ready();
    for (let i = 0; i < 12; i++) {
      apply(s, { type: 'debug.fillBank' }, now);
      apply(s, { type: 'debug.endRests' }, now);
      apply(s, { type: 'boss.attempt', party: party.slice(0, 1) }, now);
    }
    expect(s.events.recent).toHaveLength(10);
    expect(s.events.recent[9]?.contractId).toBe('event:12');
  });
});
