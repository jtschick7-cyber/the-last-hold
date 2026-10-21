// Plan T9.14 (GDD §9.17): the Events card, the boss sheet and the party rows, worked out in the core.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { HUNTER_IDS, type HunterId } from '../../src/content/hunters';
import { hunts } from '../../src/content/hunts';
import { apply } from '../../src/core/commands/apply';
import { loadEnvelope } from '../../src/core/save';
import { catchUpNow } from '../../src/core/sim/offline';
import { createNewGame } from '../../src/core/state/new-game';
import type { GameState } from '../../src/core/state/game-state';
import { startRests } from '../../src/core/systems/events';
import {
  bossPreviewLines,
  bossSheetView,
  eventsCardView,
  partyRows,
} from '../../src/core/systems/events-view';
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

describe('the Events card', () => {
  it('does not exist before events have opened', () => {
    const s = createNewGame('seed', 0);
    expect(eventsCardView(s, 0)).toBeNull();
  });

  it('reads tokens, the boss and the hunts once open', () => {
    const s = owner();
    const v = eventsCardView(s, s.time);
    expect(v?.locked).toBe(false);
    expect(v?.tokensLine).toBe('Tokens 0 of 6 · next in 8h');
    expect(v?.bossLine).toBe('The Lindworm of Velk Fjord · tier 5 · 100% left');
    expect(v?.huntLine).toBe('Legendary Hunts: 3 of 3 to unlock');
    expect(v?.badge).toBe(false);
    expect(v?.tokens.breakdown.children?.length).toBeGreaterThan(0);
  });

  it('shows the full bank and the badge only while events are open', () => {
    const s = owner();
    apply(s, { type: 'debug.fillBank' }, s.time);
    const open = eventsCardView(s, s.time);
    expect(open?.tokensLine).toBe('Tokens: 6 of 6, full');
    expect(open?.badge).toBe(true);
    s.cycle.age = 'keep'; // a new cycle before the Citadel
    const locked = eventsCardView(s, s.time);
    expect(locked?.locked).toBe(true);
    expect(locked?.lockedLine).toBe('Events wait for the Citadel.');
    expect(locked?.badge).toBe(false);
    expect(locked?.bossLine).toBeNull();
    expect(locked?.tokensLine).toBe('Tokens: 6 of 6, full'); // the tokens keep counting
  });

  it('counts the hunts still to unlock', () => {
    const s = owner();
    s.events.hunts.mara.unlocked = true;
    expect(eventsCardView(s, s.time)?.huntLine).toBe('Legendary Hunts: 2 of 3 to unlock');
  });

  it('has the scene due once, until it is seen', () => {
    const s = owner();
    expect(eventsCardView(s, s.time)?.sceneDue).toBe(true);
    expect(apply(s, { type: 'events.seeScene' }, s.time).ok).toBe(true);
    expect(eventsCardView(s, s.time)?.sceneDue).toBe(false);
    expect(apply(createNewGame('x', 0), { type: 'events.seeScene' }, 0).ok).toBe(false);
  });
});

describe('the boss sheet', () => {
  it('has the tier, the pool, four marks with their pay, and breakdowns', () => {
    const s = owner();
    const v = bossSheetView(s, s.time);
    expect(v.name).toBe('The Lindworm of Velk Fjord');
    expect(v.tier.value).toBe(5); // the owner's save is at the Bastion;
    expect(v.tier.breakdown.children?.map((c) => c.key)).toContain('boss.baseTier');
    expect(v.pool.breakdown.children?.map((c) => c.key)).toContain('boss.poolBase');
    expect(v.marks.map((m) => m.label)).toEqual(['25%', '50%', '75%', 'The kill']);
    expect(v.marks.every((m) => !m.paid)).toBe(true);
    expect(v.marks[3]?.pays).toContain('an item');
    expect(v.lines.weak).toContain('Fire');
    expect(v.fractionLeft).toBe(1);
  });

  it('says why a party cannot be sent: an empty bank, then a full one', () => {
    const s = owner();
    expect(bossSheetView(s, s.time).sendProblem).toBe('No attempt token in the bank.');
    apply(s, { type: 'debug.fillBank' }, s.time);
    expect(bossSheetView(s, s.time).sendProblem).toBeNull();
  });

  it('reads "Everyone is resting" with the time until the first is ready', () => {
    const s = owner();
    apply(s, { type: 'debug.fillBank' }, s.time);
    startRests(s, Object.keys(s.hunters) as HunterId[], s.time);
    const v = bossSheetView(s, s.time);
    expect(v.emptyLine).toBe('Everyone is resting. The next is ready in 1d.');
    expect(v.sendProblem).toBe(v.emptyLine);
    // Part-way through the rest the time shortens.
    const later = s.time + 15 * MS_PER_HOUR;
    expect(bossSheetView(s, later).emptyLine).toBe('Everyone is resting. The next is ready in 9h.');
  });

  it('keeps the pool bar honest after an attempt', () => {
    const s = owner();
    apply(s, { type: 'debug.fillBank' }, s.time);
    const party = partyRows(s, s.time)
      .filter((r) => r.reason === null)
      .slice(0, 4)
      .map((r) => r.id);
    expect(apply(s, { type: 'boss.attempt', party }, s.time).ok).toBe(true);
    const v = bossSheetView(s, s.time);
    expect(v.poolLeft).toBe(s.events.boss.pool);
    expect(v.fractionLeft).toBeLessThan(1);
    expect(v.tier.breakdown.formula).toBe('fixed when the visit began');
    expect(v.lastLine).toMatch(/^Last attempt: .* damage, \d+% of what was left\.$/);
  });
});

describe('the party rows', () => {
  it('lists every owned hunter with a reason beside those who cannot go', () => {
    const s = owner();
    apply(s, { type: 'debug.fillBank' }, s.time);
    startRests(s, [HUNTER_IDS.find((h) => s.hunters[h]) as HunterId], s.time);
    const rows = partyRows(s, s.time);
    expect(rows.map((r) => r.id).sort()).toEqual((Object.keys(s.hunters) as HunterId[]).sort());
    const resting = rows.find((r) => r.reason?.startsWith('Rests for'));
    expect(resting?.reason).toBe('Rests for 1d');
    expect(rows.every((r) => r.rank.length > 0 && r.role.length > 0)).toBe(true);
  });

  it('adds the track restriction for a hunt', () => {
    const s = owner();
    const track = hunts.stoneback.tracks[0];
    const rows = partyRows(s, s.time, track);
    expect(rows.some((r) => r.reason?.startsWith('Track needs: '))).toBe(true);
  });
});

describe('the preview words', () => {
  it('says expected damage, the range and the next milestone', () => {
    const lines = bossPreviewLines({
      samples: 100,
      boss: 'lindworm-of-velk-fjord',
      tier: 4,
      poolBefore: 32400,
      median: 4800,
      p10: 3900,
      p90: 5700,
      share: { median: 0.148, p10: 0.12, p90: 0.176 },
      wouldPay: [0.25],
      nextMark: 0.25,
      why: { label: 'x', value: 1 },
    });
    expect(lines.expected).toBe(
      'Expected damage: 4.80K, 15% of what is left. Likely 3.90K to 5.70K.',
    );
    expect(lines.next).toBe('Would bring the next milestone: 25%');
  });
});
