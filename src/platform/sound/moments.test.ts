// GDD §9.22 (D520, D608): the 19 moments, the ten sounds, and the strongest-wins order.
import { describe, expect, it } from 'vitest';
import {
  MOMENT_SOUNDS,
  soundFor,
  SOUND_IDS,
  SOUND_ORDER,
  strongest,
  type Moment,
  type SoundId,
} from './moments';

describe('the 19 moments', () => {
  it('are exactly the ones GDD §9.22 lists, each with its sound', () => {
    const expected: Record<Moment, SoundId> = {
      'hold.buy': 'build',
      'hold.newBuilding': 'build',
      'contract.launch': 'launch',
      'arrange.place': 'place',
      'contract.won': 'win',
      'delve.floorCleared': 'win',
      'contract.lost': 'lose',
      'delve.runLost': 'lose',
      'hunter.rankUp': 'fanfare',
      'hold.rankUp': 'fanfare',
      'beast.milestone': 'fanfare',
      'beast.kill': 'fanfare',
      'legendary.unlocked': 'fanfare',
      'delve.guardianBeaten': 'fanfare',
      'longNight.arrives': 'nightfall',
      'stand.brace': 'brace',
      'arrange.useLayout': 'brace',
      'experiment.discovered': 'discover',
      'combat.strike': 'strike',
    };
    expect(Object.keys(MOMENT_SOUNDS)).toHaveLength(19);
    expect({ ...MOMENT_SOUNDS }).toEqual(expected);
    for (const m of Object.keys(expected) as Moment[]) expect(soundFor(m)).toBe(expected[m]);
  });

  it('use every one of the ten sounds, and only those', () => {
    expect(new Set(Object.values(MOMENT_SOUNDS))).toEqual(new Set(SOUND_IDS));
    expect(SOUND_IDS).toHaveLength(10);
  });
});

describe('strongest', () => {
  it('orders fanfare, nightfall, win, lose, discover, brace, build, launch, place, strike', () => {
    expect(SOUND_ORDER).toEqual([
      'fanfare',
      'nightfall',
      'win',
      'lose',
      'discover',
      'brace',
      'build',
      'launch',
      'place',
      'strike',
    ]);
  });

  it('picks the stronger of every pair, whatever the order they arrive in', () => {
    for (let i = 0; i < SOUND_ORDER.length; i++)
      for (let j = 0; j < SOUND_ORDER.length; j++) {
        const a = SOUND_ORDER[i] as SoundId;
        const b = SOUND_ORDER[j] as SoundId;
        expect(strongest([a, b])).toBe(SOUND_ORDER[Math.min(i, j)]);
      }
  });

  it('is null when nothing is due', () => {
    expect(strongest([])).toBeNull();
  });
});
