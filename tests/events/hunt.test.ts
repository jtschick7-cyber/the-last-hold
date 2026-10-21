// Plan T9.8 (GDD §5.12.6–§5.12.7, §8.14, D362, D386, D387): Legendary Hunts on the owner's real save
// (the v8 fixture, migrated) with events open.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { gear } from '../../src/content/gear';
import { HUNTER_IDS, hunters, type HunterId } from '../../src/content/hunters';
import { hunts, TRACK_IDS, type TrackId } from '../../src/content/hunts';
import { runFight } from '../../src/core/combat';
import { apply } from '../../src/core/commands/apply';
import { huntSeed } from '../../src/core/contracts/seeds';
import { seeded } from '../../src/core/rng';
import { resetForNewCycle } from '../../src/core/long-night/reset';
import { encodeSaveFile, loadEnvelope, makeEnvelope } from '../../src/core/save';
import { catchUpNow } from '../../src/core/sim/offline';
import type { GameState } from '../../src/core/state/game-state';
import { arriveLegendary, legalHunters, trackBlock, trackOf } from '../../src/core/systems/hunt';
import { computeHuntOdds, huntOddsInput } from '../../src/core/systems/hunt-odds';
import { eligibleHunters, tokenBank } from '../../src/core/systems/events';
import { snapshotOf } from '../../src/core/systems/hunters';
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

const ready = (track: TrackId = 'stoneback-1') => {
  const s = owner();
  const now = s.time;
  apply(s, { type: 'debug.fillBank' }, now);
  const t = trackOf(track).track;
  const party = legalHunters(s, t, now).slice(0, 4);
  return { s, now, party, track };
};

describe('a track admits exactly the legal hunters', () => {
  for (const id of TRACK_IDS) {
    it(`${id}`, () => {
      const s = owner();
      const { track } = trackOf(id);
      const r = track.restriction;
      const expected = HUNTER_IDS.filter((h) => {
        const d = hunters[h];
        return r.kind === 'roles'
          ? r.roles.includes(d.role)
          : r.kind === 'damage'
            ? r.types.includes(d.damage)
            : d.traits.some((t) => r.traits.includes(t));
      });
      const got = HUNTER_IDS.filter((h) => trackBlock(s, h, track) === null);
      expect(got).toEqual(expected);
    });
  }

  it('refuses a hunter outside the track and gives the reason', () => {
    const { s, now, track } = ready('stoneback-1');
    const t = trackOf(track).track;
    const outsider = eligibleHunters(s, now).find((h) => trackBlock(s, h, t) !== null);
    expect(outsider).toBeDefined();
    const r = apply(s, { type: 'hunt.attempt', track, party: [outsider as HunterId] }, now);
    expect(r.ok).toBe(false);
    expect(JSON.stringify(r)).toContain('Track needs');
  });
});

describe('hunt.attempt', () => {
  it('spends a token, rests the party 24 h and pays win or loss points', () => {
    const { s, now, party, track } = ready();
    const r = apply(s, { type: 'hunt.attempt', track, party }, now);
    expect(r.ok).toBe(true);
    expect(tokenBank(s, now).value.count).toBe(5);
    const rep = s.events.last?.hunt;
    expect(rep?.points).toBe(rep?.result === 'win' ? 10 : 4);
    expect(s.events.hunts.stoneback.points).toBe(rep?.points);
    for (const id of party) expect(s.events.rest[id]).toBe(s.events.clock.value + 24 * MS_PER_HOUR);
    expect(rep?.tier).toBe(3);
  });

  it('refuses with no token, and changes nothing', () => {
    const { s, now, party, track } = ready();
    apply(s, { type: 'debug.fillBank' }, now);
    s.events.tokens = { count: 0, at: s.events.clock.value };
    const before = JSON.stringify(s);
    const r = apply(s, { type: 'hunt.attempt', track, party }, now);
    expect(r.ok).toBe(false);
    expect(JSON.stringify(s)).toBe(before);
  });

  it('is a seeded fight that replays', () => {
    const { s, now, party, track } = ready();
    apply(s, { type: 'hunt.attempt', track, party }, now);
    const ref = s.events.recent[0];
    expect(ref?.event).toEqual({ kind: 'hunt', attempt: 1, id: 'stoneback-1' });
    expect(ref?.location).toBeNull();
    const f = runFight({
      party: ref?.party ?? [],
      monster: ref?.monster as never,
      location: null,
      rolls: seeded(ref?.seed ?? ''),
      prep: ref?.prep,
      alchemy: ref?.alchemy,
    });
    expect(f.result).toBe(ref?.result);
    expect(ref?.seed).toBe(huntSeed(s.meta.gameSeed, 1, 'stoneback', 1, party));
  });

  it('pays hunter XP, a loss half, and touches no contract counter, Embers or trophies', () => {
    const { s, now, party, track } = ready();
    const stats = JSON.stringify(s.stats);
    const embers = s.embers;
    const silver = s.resources.silver;
    apply(s, { type: 'hunt.attempt', track, party }, now);
    const rep = s.events.last?.hunt;
    const full = 15 * 3;
    expect(rep?.xp).toBe(rep?.result === 'win' ? full : Math.round(full / 2));
    expect(JSON.stringify(s.stats)).toBe(stats);
    expect(s.embers).toBe(embers);
    expect(s.resources.silver).toBe(silver);
  });
});

describe('points and the unlock', () => {
  it('caps the points at the total and unlocks once, with the hunter arriving', () => {
    const { s, now, party, track } = ready();
    s.events.hunts.stoneback.points = 97;
    apply(s, { type: 'hunt.attempt', track, party }, now);
    expect(s.events.hunts.stoneback).toEqual({ points: 100, unlocked: true });
    const rep = s.events.last?.hunt;
    expect(rep?.unlocked).toBe(true);
    expect(rep?.points).toBe(3);
    expect(s.hunters['gest-tall-torch']).toBeDefined();
    expect(rep?.arrival?.hunter).toBe('gest-tall-torch');
    // A second attempt: a replay, no points, no second arrival.
    apply(s, { type: 'debug.endRests' }, now);
    const again = apply(s, { type: 'hunt.attempt', track, party }, now);
    expect(again.ok).toBe(true);
    expect(s.events.last?.hunt?.replay).toBe(true);
    expect(s.events.last?.hunt?.points).toBe(0);
    expect(s.events.last?.hunt?.unlocked).toBe(false);
    expect(s.events.hunts.stoneback.points).toBe(100);
  });

  it('pays a replay win one reagent of the quarry, and no points or item', () => {
    const { s, now, party, track } = ready();
    s.events.hunts.stoneback = { points: 100, unlocked: true };
    s.hunters['gest-tall-torch'] = structuredClone(s.hunters[party[0] as HunterId]) as never;
    const fangs = s.stores['wolf-fang'];
    const items = s.items.length;
    // Attempt until a win: each attempt is a new seed.
    let won = false;
    for (let i = 0; i < 12 && !won; i++) {
      apply(s, { type: 'debug.fillBank' }, now);
      apply(s, { type: 'debug.endRests' }, now);
      apply(s, { type: 'hunt.attempt', track, party }, now);
      won = s.events.last?.hunt?.result === 'win';
    }
    expect(won).toBe(true);
    expect(s.stores['wolf-fang']).toBeGreaterThan(fangs);
    expect(s.items.length).toBe(items);
    expect(s.events.hunts.stoneback.points).toBe(100);
  });

  it('a Long Night keeps points and unlocked hunts', () => {
    const { s, now, party, track } = ready();
    s.events.hunts.stoneback.points = 97;
    apply(s, { type: 'hunt.attempt', track, party }, now);
    s.events.hunts.likho.points = 40;
    const keep = structuredClone(s.events.hunts);
    resetForNewCycle(s);
    expect(s.events.hunts).toEqual(keep);
    expect(s.hunters['gest-tall-torch']).toBeDefined();
  });

  it('saves and loads a hunt result unchanged', () => {
    const { s, now, party, track } = ready();
    s.events.hunts.stoneback.points = 97;
    apply(s, { type: 'hunt.attempt', track, party }, now);
    const back = loadEnvelope(JSON.parse(encodeSaveFile(makeEnvelope(s, 0))));
    if (!back.ok) throw new Error(back.error);
    expect(back.value.state.events).toEqual(s.events);
  });
});

describe('the legendary hunter arrives (GDD §5.12.7, D386)', () => {
  const arriveAt = (level: number) => {
    const s = owner();
    for (const h of Object.values(s.hunters)) if (h) h.level = Math.min(h.level, level);
    const top = Object.values(s.hunters).find(Boolean);
    if (top) top.level = level;
    return { s, arrival: arriveLegendary(s, 'stoneback') };
  };

  it('at level 4 an Apprentice, at level 5 a Wright', () => {
    expect(arriveAt(4).arrival).toMatchObject({ level: 4, rank: 'apprentice' });
    expect(arriveAt(5).arrival).toMatchObject({ level: 5, rank: 'wright' });
  });

  it('is at the highest level within the cap, with no stars or talents, wearing first-tier Common pieces made for them', () => {
    const { s } = arriveAt(5);
    const h = s.hunters['gest-tall-torch'];
    expect(h).toMatchObject({ level: 5, stars: 0, talents: [], keepsake: null });
    const stores = s.items.filter((i) => i.where === null).length;
    for (const id of [h?.weapon, h?.armor]) {
      const item = s.items.find((i) => i.id === id);
      expect(item?.rarity).toBe('common');
      expect(gear[item?.base ?? 'iron-blade'].tier).toBe(1);
      expect(item?.paid).toEqual({ iron: 0, silver: 0 });
    }
    expect(stores).toBe(s.items.filter((i) => i.where === null).length);
    expect(snapshotOf(s, 'gest-tall-torch').skill).toBeDefined();
  });

  it('joins the reserve when the active roster is full', () => {
    const s = owner();
    s.roster.active = [...s.roster.active];
    const cap = s.roster.active.length;
    arriveLegendary(s, 'mara');
    const inActive = s.roster.active.includes('radmila-of-the-reeds');
    expect(inActive || s.roster.active.length === cap).toBe(true);
    expect(s.hunters['radmila-of-the-reeds']).toBeDefined();
  });
});

describe('the odds panel', () => {
  it('matches the real win rate within its margin, and shows the unprepared figure', () => {
    const { s, party, track } = ready('stoneback-1');
    const input = huntOddsInput(s, track, party);
    const odds = computeHuntOdds(input);
    expect(computeHuntOdds(input)).toEqual(odds);
    expect(odds.unpreparedWinChance).toBe(odds.winChance);
    const n = 300;
    let wins = 0;
    const snaps = party.map((id) => snapshotOf(s, id));
    for (let k = 0; k < n; k++) {
      const f = runFight({
        party: snaps,
        monster: { event: hunts.stoneback.quarry, tier: 3 },
        location: null,
        rolls: seeded(huntSeed(s.meta.gameSeed, 5000 + k, 'stoneback', 1, party)),
        log: false,
      });
      if (f.result === 'win') wins += 1;
    }
    const real = wins / n;
    const tolerance = odds.margin + 1.96 * Math.sqrt((real * (1 - real)) / n) + 0.02;
    expect(Math.abs(real - odds.winChance)).toBeLessThanOrEqual(tolerance);
  });
});
