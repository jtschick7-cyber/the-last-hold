// Plan T9.7 (GDD §5.12.4, §6.5, technical design §7.2, D391): the boss preview and Suggest for
// events, on the owner's real save (the v8 fixture, migrated) with events open.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { bosses } from '../../src/content/great-beasts';
import { runFight } from '../../src/core/combat';
import { apply } from '../../src/core/commands/apply';
import { eventSeed } from '../../src/core/contracts/seeds';
import { seeded } from '../../src/core/rng';
import { loadEnvelope } from '../../src/core/save';
import { catchUpNow } from '../../src/core/sim/offline';
import type { GameState } from '../../src/core/state/game-state';
import { noPreparation } from '../../src/core/state/game-state';
import {
  bossPreviewInput,
  bossSuggestInput,
  previewBoss,
  suggestBossParty,
} from '../../src/core/systems/boss-odds';
import { bossOfVisit, poolAtTier } from '../../src/core/systems/boss';
import { eligibleHunters } from '../../src/core/systems/events';
import { snapshotOf } from '../../src/core/systems/hunters';
import type { HunterId } from '../../src/content/hunters';

const owner = (): GameState => {
  const env = JSON.parse(
    readFileSync(new URL('../saves/fixtures/v8-owner.json', import.meta.url), 'utf8'),
  );
  const r = loadEnvelope(env);
  if (!r.ok) throw new Error(r.error);
  catchUpNow(r.value.state, r.value.state.time);
  return r.value.state;
};

const ready = (): { s: GameState; now: number; party: HunterId[] } => {
  const s = owner();
  const now = s.time;
  apply(s, { type: 'debug.fillBank' }, now);
  return { s, now, party: eligibleHunters(s, now).slice(0, 4) };
};

describe('the boss preview', () => {
  it('is deterministic and gives an ordered range inside the pool', () => {
    const { s, party } = ready();
    const input = bossPreviewInput(s, party, noPreparation());
    const a = previewBoss(input);
    const b = previewBoss(input);
    expect(b).toEqual(a);
    expect(a.samples).toBe(100);
    expect(a.p10).toBeLessThanOrEqual(a.median);
    expect(a.median).toBeLessThanOrEqual(a.p90);
    expect(a.p90).toBeLessThanOrEqual(a.poolBefore);
    expect(a.median).toBeGreaterThan(0);
    expect(a.share.median).toBeCloseTo(a.median / a.poolBefore, 10);
    expect(a.boss).toBe(bossOfVisit(0));
  });

  it('shows the tier the visit would have, and the starting pool of a visit not begun', () => {
    const { s, party } = ready();
    const a = previewBoss(bossPreviewInput(s, party, noPreparation()));
    expect(a.poolBefore).toBe(poolAtTier(a.tier));
    expect(a.tier).toBe(s.cycle.age === 'bastion' ? 5 : 4);
  });

  it('never uses the real attempt dice, and the real result is not changed by asking', () => {
    const { s, now, party } = ready();
    const before = JSON.stringify(s);
    previewBoss(bossPreviewInput(s, party, noPreparation()));
    expect(JSON.stringify(s)).toBe(before);
    const real = eventSeed(s.meta.gameSeed, 'boss', 1, party);
    const input = bossPreviewInput(s, party, noPreparation());
    expect(input.gameSeed).toBe(s.meta.gameSeed);
    const r = apply(s, { type: 'boss.attempt', party }, now);
    expect(r.ok).toBe(true);
    expect(s.events.last?.boss?.damage).toBeGreaterThan(0);
    expect(real).toContain(':event:');
  });

  it('holds the real result about as often as it says (the 10th to 90th range, about 80%)', () => {
    const { s, party } = ready();
    const input = bossPreviewInput(s, party, noPreparation());
    const p = previewBoss(input);
    const snaps = party.map((id) => snapshotOf(s, id));
    const n = 120;
    let inside = 0;
    for (let k = 1; k <= n; k++) {
      const f = runFight({
        party: snaps,
        monster: { event: input.boss, tier: input.tier, healthOverride: input.pool },
        location: null,
        rolls: seeded(eventSeed(s.meta.gameSeed, 'boss', 1000 + k, party)),
        log: false,
      });
      const dealt = input.pool - Math.min(input.pool, f.monsterHealth);
      if (dealt >= p.p10 && dealt <= p.p90) inside += 1;
    }
    expect(inside / n).toBeGreaterThan(0.65);
    expect(inside / n).toBeLessThan(0.95);
  });

  it('says which milestone the typical attempt would bring', () => {
    const { s, party } = ready();
    const input = bossPreviewInput(s, party, noPreparation());
    // A pool the party empties: the typical attempt kills, so it brings every unpaid mark.
    const small = previewBoss({ ...input, poolStart: 2000, pool: 2000, paid: 0 });
    expect(small.wouldPay).toEqual([0.25, 0.5, 0.75, 1]);
    expect(small.nextMark).toBe(0.25);
    // Two marks already paid: only the rest can still be brought.
    const part = previewBoss({ ...input, poolStart: 2000, pool: 1000, paid: 2 });
    expect(part.wouldPay).toEqual([0.75, 1]);
    expect(part.nextMark).toBe(0.75);
    // A full pool the typical attempt cannot empty brings at most the early marks.
    const big = previewBoss(input);
    expect(big.wouldPay).not.toContain(1);
  });

  it('has a Why? whose top number is the one shown', () => {
    const { s, party } = ready();
    const p = previewBoss(bossPreviewInput(s, party, noPreparation()));
    expect(p.why.value).toBe(p.median);
    expect(p.why.children?.length).toBeGreaterThan(2);
  });
});

describe('Suggest for events', () => {
  it('never picks a hunter who cannot attend', () => {
    const { s, now } = ready();
    const all = eligibleHunters(s, now);
    // Two hunters rest: they must not appear even though they are the strongest.
    const resting = all.slice(0, 2);
    for (const id of resting) s.events.rest[id] = s.events.clock.value + 3_600_000;
    const input = bossSuggestInput(s, now);
    const pick = suggestBossParty(input);
    expect(pick).not.toBeNull();
    const ok = eligibleHunters(s, now);
    expect(pick?.party.length).toBeLessThanOrEqual(4);
    for (const h of pick?.party ?? []) {
      expect(ok).toContain(h.id);
      expect(resting).not.toContain(h.id);
    }
  });

  it('returns null when nobody can attend', () => {
    const { s, now } = ready();
    for (const id of eligibleHunters(s, now)) s.events.rest[id] = s.events.clock.value + 3_600_000;
    expect(suggestBossParty(bossSuggestInput(s, now))).toBeNull();
  });

  it('is deterministic', () => {
    const { s, now } = ready();
    const input = bossSuggestInput(s, now);
    expect(suggestBossParty(input)).toEqual(suggestBossParty(input));
  });

  it('stops at the first party that clears the floor, and tries them all when none does', () => {
    const { s, now } = ready();
    const input = bossSuggestInput(s, now);
    const easy = suggestBossParty({ ...input, floor: 1 });
    expect(easy?.considered).toBe(1);
    expect(easy?.stoppedEarly).toBe(true);
    // Seven hunters keep the full search short: 35 parties of four.
    const seven = { ...input, available: input.available.slice(0, 7) };
    const none = suggestBossParty({ ...seven, floor: Number.MAX_SAFE_INTEGER, tries: 1000 });
    expect(none?.stoppedEarly).toBe(false);
    const n = seven.available.length;
    expect(none?.considered).toBe((n * (n - 1) * (n - 2) * (n - 3)) / 24);
  });

  it('stops after events.suggestTries parties when none clears the floor, taking the best seen', () => {
    const { s, now } = ready();
    const input = bossSuggestInput(s, now);
    expect(input.tries).toBe(10);
    const capped = suggestBossParty({ ...input, floor: Number.MAX_SAFE_INTEGER });
    expect(capped?.considered).toBe(10);
    expect(capped?.stoppedEarly).toBe(false);
    const three = suggestBossParty({ ...input, floor: Number.MAX_SAFE_INTEGER, tries: 3 });
    expect(three?.considered).toBe(3);
  });

  it('reads the floor from events.suggestFloor against the starting pool', () => {
    const { s, now } = ready();
    const input = bossSuggestInput(s, now);
    expect(input.floor).toBe(Math.round(0.08 * input.poolStart));
    expect(bosses[input.boss]).toBeDefined();
  });

  it('the party it picks does at least the damage of the first party in its order', () => {
    const { s, now } = ready();
    const input = bossSuggestInput(s, now);
    const first = suggestBossParty({ ...input, floor: 1 });
    const best = suggestBossParty({
      ...input,
      available: input.available.slice(0, 7),
      floor: Number.MAX_SAFE_INTEGER,
      tries: 1000,
    });
    expect(best?.stage1Median ?? 0).toBeGreaterThanOrEqual(first?.stage1Median ?? 0);
  });
});
