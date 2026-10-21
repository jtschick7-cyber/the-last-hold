// Plan T9.15 (GDD §9.17, §5.12.6–§5.12.8): playback, result sheets, the hunt list, the unlock sheet,
// the Great Beasts shelf, the hunter sheet's rest line and the away sheet's full-bank line, on the
// owner's real save (the v8 fixture, migrated) with events open.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BOSS_IDS } from '../../src/content/great-beasts';
import type { HunterId } from '../../src/content/hunters';
import { hunts } from '../../src/content/hunts';
import { apply } from '../../src/core/commands/apply';
import { runFight } from '../../src/core/combat';
import { seeded } from '../../src/core/rng';
import { loadEnvelope } from '../../src/core/save';
import { catchUpNow } from '../../src/core/sim/offline';
import type { GameState } from '../../src/core/state/game-state';
import { startRests } from '../../src/core/systems/events';
import {
  awayEventsLine,
  greatBeastsShelf,
  hunterEventLines,
  huntListView,
  huntTrackView,
  resultView,
  unlockView,
} from '../../src/core/systems/events-results';
import { eventPlayback, lastPlayback } from '../../src/core/systems/events-playback';
import { freshHunter } from '../../src/core/state/hunters-state';
import { lockedHunters, rosterCap } from '../../src/core/systems/hunters';
import { legalHunters, trackOf } from '../../src/core/systems/hunt';
import {
  computeHuntOdds,
  huntOddsInput,
  huntSuggestInput,
  suggestHuntParty,
} from '../../src/core/systems/hunt-odds';
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

const bossParty = (s: GameState): HunterId[] =>
  (Object.keys(s.hunters) as HunterId[]).filter((h) => s.roster.active.includes(h)).slice(0, 4);

const attemptBoss = (s: GameState): void => {
  apply(s, { type: 'debug.fillBank' }, s.time);
  expect(apply(s, { type: 'boss.attempt', party: bossParty(s) }, s.time).ok).toBe(true);
};

describe('playback', () => {
  it('has no playback before any attempt', () => {
    expect(lastPlayback(owner())).toBeNull();
  });

  it('replays a boss attempt from its seed: same result, steps with bars, and a log', () => {
    const s = owner();
    attemptBoss(s);
    const ref = s.events.recent[s.events.recent.length - 1];
    if (!ref) throw new Error('no fight kept');
    const pb = lastPlayback(s);
    expect(pb).not.toBeNull();
    expect(pb?.result).toBe(ref.result);
    expect(pb?.steps.length).toBeGreaterThan(0);
    expect(pb?.log.length).toBe(pb?.steps.length);
    expect(pb?.combatants.some((c) => c.side === 'monster')).toBe(true);
    // The great beast's sprite is the event creature's, and the hunters' are their own.
    const beast = pb?.combatants.find((c) => c.side === 'monster');
    expect(beast?.spriteId).toBe(`sprite.creature.${ref.event?.id}`);
    // It is the fight the attempt fought: the same seed gives the same end of the pool.
    const again = runFight({
      party: ref.party,
      monster: ref.monster,
      location: null,
      rolls: seeded(ref.seed),
      prep: ref.prep,
      alchemy: ref.alchemy,
    });
    expect(pb?.log.length).toBe(again.log.length);
  });

  it('plays a hunt attempt the same way', () => {
    const s = owner();
    apply(s, { type: 'debug.fillBank' }, s.time);
    const track = trackOf('stoneback-1').track;
    const party = legalHunters(s, track, s.time).slice(0, 4);
    expect(apply(s, { type: 'hunt.attempt', track: 'stoneback-1', party }, s.time).ok).toBe(true);
    const pb = lastPlayback(s);
    expect(pb?.title).toContain('Stoneback');
    expect(pb?.combatants.find((c) => c.side === 'monster')?.spriteId).toBe(
      'sprite.creature.stoneback-fell-troll',
    );
  });

  it('shows the pool as the bar a boss starts with', () => {
    const s = owner();
    attemptBoss(s);
    const ref = s.events.recent[0];
    if (!ref) throw new Error('no fight kept');
    const pb = eventPlayback(ref);
    const beast = pb.combatants.find((c) => c.side === 'monster');
    expect(beast?.start).toBe(1); // the first attempt of a visit begins at a full pool
  });
});

describe('the result sheet', () => {
  it('is empty until something has been fought', () => {
    expect(resultView(owner())).toBeNull();
  });

  it('words a boss attempt: damage, the pool left, milestones, XP, rests; each with a breakdown', () => {
    const s = owner();
    attemptBoss(s);
    const v = resultView(s);
    expect(v?.kind).toBe('boss');
    const labels = v?.lines.map((l) => l.label) ?? [];
    expect(labels).toEqual(expect.arrayContaining(['Damage', 'Pool left', 'XP each', 'Rests for']));
    const damage = v?.lines.find((l) => l.label === 'Damage');
    expect(damage?.why?.children?.length).toBeGreaterThan(0);
    expect(v?.lines.find((l) => l.label === 'XP each')?.why?.key).toBe('boss.xpPerTier');
    expect(v?.unlock).toBeNull();
  });

  it('words a hunt attempt: win or loss, points, XP', () => {
    const s = owner();
    apply(s, { type: 'debug.fillBank' }, s.time);
    const track = trackOf('stoneback-1').track;
    const party = legalHunters(s, track, s.time).slice(0, 4);
    apply(s, { type: 'hunt.attempt', track: 'stoneback-1', party }, s.time);
    const v = resultView(s);
    expect(v?.kind).toBe('hunt');
    expect(v?.headline).toMatch(/^(A win|A loss)\./);
    const points = v?.lines.find((l) => l.label === 'Points');
    expect(points?.text).toMatch(/of 100/);
    expect(points?.why?.key).toBe('hunt.trackPoints');
    expect(v?.lines.find((l) => l.label === 'XP each')?.why?.key).toBe('hunt.xpPerTier');
  });
});

describe('the hunt list and track sheets', () => {
  it('lists three hunts with points, a greyed hunter until unlocked, and three tracks', () => {
    const s = owner();
    const v = huntListView(s, s.time);
    expect(v.map((h) => h.id)).toEqual(['stoneback', 'mara', 'likho']);
    const first = v[0];
    expect(first?.pointsLine).toBe('0 of 100');
    expect(first?.points.breakdown.key).toBe('hunt.unlockPoints');
    expect(first?.hunterGreyed).toBe(true);
    expect(first?.tracks.map((t) => t.tier)).toEqual([3, 4, 5]);
    expect(first?.footer).toBeNull();
    expect(first?.tracks.every((t) => t.restriction.length > 0)).toBe(true);
  });

  it('reads an unlocked hunt as a replay', () => {
    const s = owner();
    s.events.hunts.mara.unlocked = true;
    s.events.hunts.mara.points = 100;
    const mara = huntListView(s, s.time).find((h) => h.id === 'mara');
    expect(mara?.footer).toBe('Unlocked. Replay for XP and a reagent.');
    expect(mara?.hunterGreyed).toBe(false);
    expect(mara?.pointsLine).toBe('100 of 100');
  });

  it('gives a track nobody fits a reason on the list', () => {
    const s = owner();
    apply(s, { type: 'debug.fillBank' }, s.time);
    const t0 = hunts.stoneback.tracks[0];
    startRests(s, legalHunters(s, t0, s.time), s.time);
    const row = huntListView(s, s.time)[0]?.tracks[0];
    expect(row?.fitting).toBe(0);
    expect(row?.lockedReason).toBe('No free hunter fits this track.');
  });

  it('shows a locked track with its restriction and the reason', () => {
    const s = owner();
    const track = hunts.stoneback.tracks[0];
    const t = huntTrackView(s, track.id, s.time);
    expect(t.restriction).toBe(track.restrictionText);
    expect(t.tier).toBe(3);
    expect(t.rows.some((r) => r.reason?.startsWith('Track needs: '))).toBe(true);
    expect(t.rows.some((r) => r.reason === null)).toBe(true);
  });

  it('says a track is out of reach when nobody legal is free', () => {
    const s = owner();
    apply(s, { type: 'debug.fillBank' }, s.time);
    const track = hunts.stoneback.tracks[0];
    startRests(s, legalHunters(s, track, s.time), s.time);
    const t = huntTrackView(s, track.id, s.time);
    expect(t.sendProblem).toMatch(/resting|Nobody|free/i);
  });
});

describe('hunt odds and Suggest', () => {
  it('gives ordinary win odds, no Reckless line, and the unprepared figure', () => {
    const s = owner();
    const track = trackOf('stoneback-1').track;
    const party = legalHunters(s, track, s.time).slice(0, 4);
    const odds = computeHuntOdds({ ...huntOddsInput(s, 'stoneback-1', party), samples: 20 });
    expect(odds.winChance).toBeGreaterThanOrEqual(0);
    expect(odds.unpreparedWinChance).toBe(odds.winChance);
    expect('reckless' in odds).toBe(false);
  });

  it('Suggest fills only legal, free hunters and is the same every time', () => {
    const s = owner();
    apply(s, { type: 'debug.fillBank' }, s.time);
    const input = huntSuggestInput(s, 'stoneback-1', s.time);
    const legal = legalHunters(s, trackOf('stoneback-1').track, s.time);
    expect(input.available.map((h) => h.id).sort()).toEqual([...legal].sort());
    const a = suggestHuntParty(input);
    const b = suggestHuntParty(input);
    expect(a?.party.map((h) => h.id)).toEqual(b?.party.map((h) => h.id));
    expect(a?.party.length).toBeLessThanOrEqual(4);
    for (const h of a?.party ?? []) expect(legal).toContain(h.id);
  });

  it('Suggest returns nothing when nobody is legal and free', () => {
    const s = owner();
    const input = { ...huntSuggestInput(s, 'stoneback-1', s.time), available: [] };
    expect(suggestHuntParty(input)).toBeNull();
  });
});

describe('the unlock sheet', () => {
  const unlocking = (full: boolean): { s: GameState; hunter: HunterId } => {
    const s = owner();
    apply(s, { type: 'debug.fillBank' }, s.time);
    if (full)
      while (s.roster.active.length < rosterCap(s).value)
        s.roster.active.push('nobody' as HunterId);
    s.events.hunts.stoneback.points = 99;
    const track = trackOf('stoneback-1').track;
    const party = legalHunters(s, track, s.time).slice(0, 4);
    expect(apply(s, { type: 'hunt.attempt', track: 'stoneback-1', party }, s.time).ok).toBe(true);
    return { s, hunter: hunts.stoneback.hunter };
  };

  it('says the hunter joins the active roster when there is room', () => {
    const { s } = unlocking(false);
    const u = unlockView(s);
    expect(u?.line).toBe(hunts.stoneback.unlockLine);
    expect(u?.joins).toBe('Joins the active roster');
    expect(resultView(s)?.unlock?.hunterName).toBe('Gest Tall-Torch');
  });

  it('says the hunter joins the reserve when the barracks are full', () => {
    const { s, hunter } = unlocking(true);
    expect(s.roster.active.includes(hunter)).toBe(false);
    const u = unlockView(s);
    expect(u?.joins).toBe('Joins the reserve (the barracks are full)');
  });

  it('is null when the last attempt unlocked nothing', () => {
    const s = owner();
    attemptBoss(s);
    expect(unlockView(s)).toBeNull();
  });
});

describe('the Hunters tab', () => {
  it('hides a legendary hunter until the hunt unlocks them, then lists them', () => {
    const s = owner();
    const id = hunts.stoneback.hunter;
    expect(lockedHunters(s).some((h) => h.id === id)).toBe(false);
    expect(Object.keys(s.hunters)).not.toContain(id);
    apply(s, { type: 'debug.fillBank' }, s.time);
    s.events.hunts.stoneback.points = 99;
    const party = legalHunters(s, trackOf('stoneback-1').track, s.time).slice(0, 4);
    apply(s, { type: 'hunt.attempt', track: 'stoneback-1', party }, s.time);
    const listed = [...s.roster.active, ...Object.keys(s.hunters)];
    expect(listed).toContain(id);
  });
});

describe('the Great Beasts shelf', () => {
  it('reads "Nothing met yet" with nothing fought, and shows six silhouettes', () => {
    const s = owner();
    const v = greatBeastsShelf(s);
    expect(v.emptyLine).toBe('Nothing met yet. The Great Beasts are on the Events card.');
    expect(v.entries).toHaveLength(6);
    expect(v.entries.every((e) => !e.identified)).toBe(true);
  });

  it('identifies a Great Beast on the first fight and shows no levels', () => {
    const s = owner();
    attemptBoss(s);
    const v = greatBeastsShelf(s);
    const lind = v.entries.find((e) => e.id === BOSS_IDS[0]);
    expect(lind?.identified).toBe(true);
    expect(lind?.whatItWas).toContain('grey worm');
    expect(lind?.stats?.length).toBeGreaterThan(0);
    expect(lind?.abilities?.length).toBeGreaterThan(0);
    expect(JSON.stringify(lind)).not.toMatch(/studied|mastered|level/i);
    expect(v.emptyLine).toBeNull();
    expect(v.entries.filter((e) => e.identified)).toHaveLength(1);
  });

  it('identifies a quarry once its hunt has been fought, and a later boss once reached', () => {
    const s = owner();
    s.events.hunts.likho.points = 4;
    s.events.boss.visit = 1; // the Lindworm fell; the Barrow-King is current, not yet fought
    const v = greatBeastsShelf(s);
    expect(v.entries.find((e) => e.id === 'likho-one-eyed')?.identified).toBe(true);
    expect(v.entries.find((e) => e.id === 'stoneback-fell-troll')?.identified).toBe(false);
    expect(v.entries.find((e) => e.id === BOSS_IDS[0])?.identified).toBe(true);
    expect(v.entries.find((e) => e.id === BOSS_IDS[2])?.identified).toBe(false);
  });
});

describe('the hunter sheet and the away sheet', () => {
  it('shows the rest line while resting and nothing after', () => {
    const s = owner();
    const id = Object.keys(s.hunters)[0] as HunterId;
    expect(hunterEventLines(s, id, s.time)).toEqual([]);
    startRests(s, [id], s.time);
    expect(hunterEventLines(s, id, s.time)).toEqual(['Rests for 1d']);
    expect(hunterEventLines(s, id, s.time + 25 * MS_PER_HOUR)).toEqual([]);
  });

  it('says a legendary hunter has no letters', () => {
    const s = owner();
    s.hunters[hunts.mara.hunter] = freshHunter();
    expect(hunterEventLines(s, hunts.mara.hunter, s.time)).toContain('No letters.');
  });

  it('gives the away sheet one full-bank line, only while events are open', () => {
    const s = owner();
    expect(awayEventsLine(s, s.time)).toBeNull();
    apply(s, { type: 'debug.fillBank' }, s.time);
    expect(awayEventsLine(s, s.time)).toBe('The attempt bank is full: 6 of 6.');
    s.cycle.age = 'keep';
    expect(awayEventsLine(s, s.time)).toBeNull();
  });
});
