// Plan T1.1: golden values pin the generator, the seeding hash, and seeded streams,
// so an accidental change to any of them fails here (technical design §7.1).
// Values were recorded once on 2026-10-11 and must never be edited to make a test pass.
import { describe, expect, it } from 'vitest';
import { cyrb128, scripted, seeded, sfc32, stream, streamSeed } from './index';

const take = (n: number, next: () => number): number[] => Array.from({ length: n }, next);

const GOLDEN_HASH: [string, number[]][] = [
  ['', [41608494, 3485963809, 1435736333, 1262568316]],
  ['the-last-hold', [1626563931, 360716953, 2732849550, 3122736512]],
  ['seed:board:0', [1064540817, 2674570978, 3501894461, 1966521555]],
];

const GOLDEN_SFC32_1234 = [
  1.6298145055770874e-9, 7.916241884231567e-9, 0.01318361610174179, 0.043977586552500725,
  0.7988984857220203, 0.0929916170425713, 0.1829525358043611, 0.8949336421210319,
  0.49462389084510505, 0.9407999631948769,
];

const GOLDEN_SEEDED: [string, number[]][] = [
  [
    'alpha',
    [
      0.014147388283163309, 0.6759659391827881, 0.06830035033635795, 0.07109731389209628,
      0.20083573902957141, 0.863306401995942, 0.607891206163913, 0.03483415185473859,
      0.3338502028491348, 0.4290693460498005,
    ],
  ],
  [
    'the-last-hold:fight:c1:h1,h2:none',
    [
      0.6721015919465572, 0.9915053329896182, 0.815332526806742, 0.41242446820251644,
      0.07171094440855086, 0.5794430857058614, 0.35496199899353087, 0.4800960572902113,
      0.9173242561519146, 0.7916368234436959,
    ],
  ],
  [
    'sim:42',
    [
      0.5742504205554724, 0.7626043062191457, 0.15272855968214571, 0.6449688230641186,
      0.8874710598029196, 0.12297152238897979, 0.8361669024452567, 0.9719191256444901,
      0.8690247633494437, 0.08849121513776481,
    ],
  ],
];

describe('cyrb128', () => {
  it.each(GOLDEN_HASH)('hashes %j to its golden state', (input, expected) => {
    expect(cyrb128(input)).toEqual(expected);
  });
});

describe('sfc32', () => {
  it('produces the golden sequence from a raw state', () => {
    expect(take(10, sfc32([1, 2, 3, 4]).next)).toEqual(GOLDEN_SFC32_1234);
  });

  it('resumes exactly from a saved state', () => {
    const a = sfc32(cyrb128('resume'));
    take(7, a.next);
    const b = sfc32(a.state());
    expect(take(20, b.next)).toEqual(take(20, a.next));
  });

  it('stays in [0, 1)', () => {
    const g = sfc32(cyrb128('range'));
    for (let i = 0; i < 10000; i++) {
      const r = g.next();
      expect(r >= 0 && r < 1).toBe(true);
    }
  });
});

describe('seeded', () => {
  it.each(GOLDEN_SEEDED)('produces the golden first 10 rolls for %j', (seed, expected) => {
    expect(take(10, seeded(seed).next)).toEqual(expected);
  });

  it('gives the same rolls for the same seed and different rolls for different seeds', () => {
    expect(take(5, seeded('x').next)).toEqual(take(5, seeded('x').next));
    expect(take(5, seeded('x').next)).not.toEqual(take(5, seeded('y').next));
  });
});

describe('streams', () => {
  it('joins seed parts with colons (technical design §7.2)', () => {
    expect(streamSeed('g', 'board', 3)).toBe('g:board:3');
    expect(streamSeed('g', 'fight', 'c1', 'h1,h2', 'none')).toBe('g:fight:c1:h1,h2:none');
  });

  it('is the seeded source for the joined seed', () => {
    expect(take(5, stream('g', 'board', 3).next)).toEqual(take(5, seeded('g:board:3').next));
  });

  it('keeps streams independent', () => {
    expect(take(5, stream('g', 'board', 0).next)).not.toEqual(
      take(5, stream('g', 'board', 1).next),
    );
  });
});

describe('scripted', () => {
  it('returns the scripted rolls in order', () => {
    const r = scripted([0.4, 0.5, 0.99]);
    expect([r.next(), r.next(), r.next()]).toEqual([0.4, 0.5, 0.99]);
    expect(() => r.assertConsumed()).not.toThrow();
  });

  it('throws when it runs out', () => {
    const r = scripted([0.1]);
    r.next();
    expect(() => r.next()).toThrow(/ran out/);
  });

  it('throws when not fully consumed', () => {
    const r = scripted([0.1, 0.2]);
    r.next();
    expect(() => r.assertConsumed()).toThrow(/used 1 of 2/);
  });

  it('rejects rolls outside [0, 1)', () => {
    expect(() => scripted([1])).toThrow(RangeError);
    expect(() => scripted([-0.1])).toThrow(RangeError);
    expect(() => scripted([Number.NaN])).toThrow(RangeError);
  });
});
