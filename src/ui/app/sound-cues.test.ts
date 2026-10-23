// GDD §9.22 (D520): which commands and live events are a moment, and the silent list.
import { describe, expect, it } from 'vitest';
import type { Command } from '../../core/commands';
import type { AdvanceLog } from '../../core/sim/advance';
import { momentForCommand, momentsForLiveTick } from './sound-cues';

/** Commands are built loosely here: only their type matters to the cue. */
const cmd = (o: Record<string, unknown> & { type: string }): Command => o as unknown as Command;
const none = (): number => 0;
const some = (): number => 3;

describe('momentForCommand', () => {
  it('buying a building level or a copy: Build; the first one of a building: also Build', () => {
    const buy = cmd({ type: 'build.buy', building: 'farm', count: 1 });
    const up = cmd({ type: 'build.upgrade', building: 'smithy' });
    expect(momentForCommand(buy, some)).toBe('hold.buy');
    expect(momentForCommand(up, some)).toBe('hold.buy');
    expect(momentForCommand(buy, none)).toBe('hold.newBuilding');
    expect(momentForCommand(up, none)).toBe('hold.newBuilding');
  });

  it('a launch, a placed piece, the Hold Rank-up and a hunter rank-up', () => {
    expect(momentForCommand(cmd({ type: 'contract.launch' }), none)).toBe('contract.launch');
    expect(momentForCommand(cmd({ type: 'layout.place' }), none)).toBe('arrange.place');
    expect(momentForCommand(cmd({ type: 'age.up' }), none)).toBe('hold.rankUp');
    expect(momentForCommand(cmd({ type: 'hunter.rankUp', hunter: 'x' }), none)).toBe(
      'hunter.rankUp',
    );
  });

  it('is silent for taps that are not on the list', () => {
    const silent: Command[] = [
      cmd({ type: 'peasants.add', job: 'farmer' }),
      cmd({ type: 'peasants.settle' }),
      cmd({ type: 'hunter.recruit', hunter: 'x' }),
      cmd({ type: 'upgrade.buy', upgrade: 'late-lantern' }),
      cmd({ type: 'riftglass.buy', item: 'reroll' }),
      cmd({ type: 'layout.unplace', pieceId: 'p' }),
      cmd({ type: 'layout.autoArrange' }),
      cmd({ type: 'layout.clear' }),
      cmd({ type: 'layout.setShowGhosts', showGhosts: true }),
      cmd({ type: 'contract.decline', contract: 'c' }),
      cmd({ type: 'results.collect' }),
      cmd({ type: 'stand.make' }),
      cmd({ type: 'delve.leave' }),
      cmd({ type: 'orders.seat', order: 'moot' }),
      cmd({ type: 'settings.set', patch: {} }),
      cmd({ type: 'debug.skip', ms: 1000 }),
      cmd({ type: 'debug.layoutAutoArrange' }),
    ];
    for (const c of silent) expect(momentForCommand(c, none), c.type).toBeNull();
  });
});

describe('momentsForLiveTick', () => {
  const log = (events: AdvanceLog['events']): AdvanceLog => ({
    from: 0,
    to: 1,
    events,
    produced: {} as AdvanceLog['produced'],
  });
  const done = (success: boolean) =>
    ({ type: 'contract', at: 1, result: { success } }) as AdvanceLog['events'][number];

  it('is one moment per finished contract: won or lost', () => {
    expect(momentsForLiveTick(log([done(true), done(false)]))).toEqual([
      'contract.won',
      'contract.lost',
    ]);
  });

  it('ignores everything else that happens in a tick', () => {
    const other = [
      { type: 'settle', at: 1, job: null },
      { type: 'recovered', at: 1, hunter: 'h' },
      { type: 'arrival', at: 1, contractId: 'c' },
      { type: 'brew', at: 1, item: 'i' },
      { type: 'harvest', at: 1, each: 1 },
    ] as AdvanceLog['events'];
    expect(momentsForLiveTick(log(other))).toEqual([]);
  });
});
