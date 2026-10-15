// Plan T8.16 (GDD §6.1, D321, D352): the simulated player's v0.8 rules: the fixed item score, equipping
// loot and salvaging past 30, ranks as soon as they qualify, stars from leftover Embers (cheapest first,
// the highest level breaks ties), the fixed talent order, the Legendary table, and the Delver's Re-roll.
import { describe, expect, it } from 'vitest';
import { blessingById } from '../../src/content/delves/blessings';
import { gear } from '../../src/content/gear';
import { HUNTER_IDS, hunters } from '../../src/content/hunters';
import { talentsOf } from '../../src/content/talents';
import { apply, type Command } from '../../src/core/commands';
import {
  itemMoves,
  itemScore,
  keepsakeMoves,
  KEEPSAKE_TABLE,
  rankMoves,
  starMoves,
  talentMoves,
  talentOrder,
} from '../../src/core/policies/depth';
import { delveSession } from '../../src/core/policies/delver';
import type { GameState } from '../../src/core/state/game-state';
import type { ItemLine } from '../../src/core/state/item-state';
import { makeItem } from '../../src/core/systems/items';
import { stepsPaid } from '../../src/core/systems/loot';
import { unspentTalentPoints } from '../../src/core/systems/ranks';
import { strongKeep } from '../delves/helpers';
import { keepRich, wear } from '../contracts/helpers';

const act =
  (s: GameState) =>
  (cmd: Command): boolean =>
    apply(s, cmd, s.time).ok;

const item = (
  s: GameState,
  base: keyof typeof gear,
  rarity: 'common' | 'fine' | 'rare' | 'heroic',
  lines: ItemLine[] = [],
) => makeItem(s, gear[base], rarity, lines, stepsPaid(base));

describe('the fixed item score (D352)', () => {
  it('rises with the tier, counts special effects and weights the bonus lines', () => {
    const s = keepRich('score');
    const common = (b: keyof typeof gear) => itemScore(item(s, b, 'common'));
    expect(common('iron-blade')).toBeLessThan(common('steel-blade'));
    expect(common('steel-blade')).toBeLessThan(common('silvered-blade'));
    expect(common('silvered-blade')).toBeLessThan(common('wrights-blade'));
    expect(common('hide-armor')).toBeLessThan(common('mail'));
    expect(common('mail')).toBeLessThan(common('emberwright-plate'));
    const plain = itemScore(item(s, 'iron-blade', 'common'));
    // A 6% Might line is worth 9; a point of flat Armor 2; 4 points of crit 6.
    expect(
      itemScore(item(s, 'iron-blade', 'fine', [{ kind: 'might', size: 0.06 }])) - plain,
    ).toBeCloseTo(9, 9);
    expect(
      itemScore(item(s, 'iron-blade', 'fine', [{ kind: 'armor', size: 2 }])) - plain,
    ).toBeCloseTo(4, 9);
    expect(
      itemScore(item(s, 'iron-blade', 'fine', [{ kind: 'crit', size: 0.04 }])) - plain,
    ).toBeCloseTo(6, 9);
  });
});

describe('items (GDD §6.1, D321)', () => {
  it('equips loot that scores higher, and sends what was worn to Stores', () => {
    const s = keepRich('equip');
    s.roster.active = ['zora'];
    wear(s, 'zora', 'iron-blade');
    const better = item(s, 'iron-blade', 'rare', [
      { kind: 'might', size: 0.06 },
      { kind: 'crit', size: 0.04 },
    ]);
    itemMoves(s, act(s));
    expect(s.hunters.zora?.weapon).toBe(better.id);
    expect(s.items.filter((i) => i.where === null)).toHaveLength(1); // the old Common blade
  });

  it('never swaps for something that scores the same or lower', () => {
    const s = keepRich('keep');
    s.roster.active = ['zora'];
    wear(s, 'zora', 'steel-blade');
    const worn = s.hunters.zora?.weapon;
    item(s, 'iron-blade', 'fine', [{ kind: 'speed', size: 1 }]); // 4 + 2 = 6, below the Steel Blade
    item(s, 'iron-blade', 'common');
    itemMoves(s, act(s));
    expect(s.hunters.zora?.weapon).toBe(worn);
  });

  it('gives each slot the right piece: a weapon never goes in the armor slot', () => {
    const s = keepRich('slots');
    s.roster.active = ['zora'];
    const mail = item(s, 'mail', 'common');
    itemMoves(s, act(s));
    expect(s.hunters.zora?.armor).toBe(mail.id);
    expect(s.hunters.zora?.weapon).toBeNull();
  });

  it('salvages the lowest scorers once Stores holds more than 30', () => {
    const s = keepRich('salvage');
    s.roster.active = [];
    const lows = Array.from({ length: 3 }, () => item(s, 'iron-blade', 'common'));
    for (let i = 0; i < 28; i++) item(s, 'emberwright-plate', 'common');
    item(s, 'mail', 'common'); // 32 in all
    itemMoves(s, act(s));
    expect(s.items.filter((i) => i.where === null)).toHaveLength(30);
    for (const low of lows.slice(0, 2)) expect(s.items.some((i) => i.id === low.id)).toBe(false);
    expect(s.items.some((i) => i.id === lows[2]?.id)).toBe(true); // 32 − 2 = 30
  });

  it('leaves Stores alone at exactly 30', () => {
    const s = keepRich('thirty');
    s.roster.active = [];
    for (let i = 0; i < 30; i++) item(s, 'iron-blade', 'common');
    itemMoves(s, act(s));
    expect(s.items).toHaveLength(30);
  });
});

describe('ranks and stars (GDD §6.1, D321)', () => {
  it('ranks up everyone who qualifies, the highest peak level first when trophies are short', () => {
    const s = keepRich('ranks');
    s.stats.trophies = 20; // one Wright's worth
    s.story.peakLevels.zora = 6;
    s.story.peakLevels.halvar = 9;
    rankMoves(s, act(s));
    expect(s.hunters.halvar?.rank).toBe('wright');
    expect(s.hunters.zora?.rank).toBe('apprentice');
    expect(s.stats.trophiesSpent).toBe(20);
  });

  it('does nothing below the level or without the trophies', () => {
    const s = keepRich('none');
    s.stats.trophies = 500;
    rankMoves(s, act(s));
    expect(Object.values(s.hunters).every((h) => h?.rank === 'apprentice')).toBe(true);
  });

  it('buys the cheapest star with the Embers left, the highest-level hunter first on a tie', () => {
    const s = keepRich('stars');
    s.stats.trophies = 100;
    s.embers = 20; // one first star
    const h = (id: 'zora' | 'halvar' | 'ostap') => s.hunters[id];
    for (const [id, level] of [
      ['zora', 3],
      ['halvar', 5],
      ['ostap', 4],
    ] as const) {
      const hunter = h(id);
      if (hunter) hunter.level = level;
    }
    starMoves(s, act(s));
    expect(h('halvar')?.stars).toBe(1);
    expect(h('zora')?.stars).toBe(0);
    expect(s.embers).toBe(0);
  });

  it('spreads stars: with Embers for several, a first star everywhere is cheaper than a second', () => {
    const s = keepRich('spread');
    s.stats.trophies = 1000;
    s.embers = 20 * 3; // three first stars (20 each)
    starMoves(s, act(s));
    const stars = Object.values(s.hunters).map((h) => h?.stars ?? 0);
    expect(Math.max(...stars)).toBe(1);
    expect(stars.reduce((a, b) => a + b, 0)).toBe(3);
  });
});

describe('talents (GDD §6.1, D352)', () => {
  it('the order is the lowest tier first, and the role’s branches in a fixed order within a tier', () => {
    expect(talentOrder('vanguard').slice(0, 3)).toEqual([
      'vanguard-wall-1',
      'vanguard-retort-1',
      'vanguard-warden-1',
    ]);
    expect(talentOrder('striker').slice(0, 3)).toEqual([
      'striker-edge-1',
      'striker-hunt-1',
      'striker-pace-1',
    ]);
    expect(talentOrder('mender').slice(0, 3)).toEqual([
      'mender-hands-1',
      'mender-watch-1',
      'mender-herbs-1',
    ]);
    for (const role of ['vanguard', 'striker', 'mender'] as const)
      expect([...talentOrder(role)].sort()).toEqual(
        talentsOf(role)
          .map((t) => t.id)
          .sort(),
      );
  });

  it('spends every point, skipping a tier the hunter has no stars for', () => {
    const s = keepRich('talents');
    const zora = s.hunters.zora;
    if (!zora) throw new Error('no zora');
    zora.rank = 'wright'; // 3 points
    talentMoves(s, act(s));
    expect(zora.talents).toEqual(['striker-edge-1', 'striker-hunt-1', 'striker-pace-1']);
    expect(unspentTalentPoints(zora)).toBe(0);
    zora.rank = 'masterWright'; // 5 points: two more, but tier 2 needs 2 stars
    talentMoves(s, act(s));
    expect(zora.talents).toHaveLength(3);
    zora.stars = 2;
    talentMoves(s, act(s));
    expect(zora.talents).toEqual([
      'striker-edge-1',
      'striker-hunt-1',
      'striker-pace-1',
      'striker-edge-2',
      'striker-hunt-2',
    ]);
  });
});

describe('Legendaries (GDD §6.1, the fixed table)', () => {
  it('lists each of the six once', () => {
    expect(KEEPSAKE_TABLE.map(([l]) => l).sort()).toEqual(
      [
        'barley-knot',
        'coffin-silver',
        'ferrymans-coin',
        'rune-nail',
        'wolf-tooth-string',
        'yrsas-thole',
      ].sort(),
    );
  });

  it('gives each found Legendary to the highest-level active hunter of its role with a free slot', () => {
    const s = keepRich('table');
    s.legendaries.push({ id: 'rune-nail', cycle: 1 }, { id: 'coffin-silver', cycle: 1 });
    const strikers = HUNTER_IDS.filter((h) => s.hunters[h] && hunters[h].role === 'striker');
    expect(strikers.length).toBeGreaterThanOrEqual(2);
    for (const [i, id] of strikers.entries()) {
      const h = s.hunters[id];
      if (h) h.level = 10 - i;
    }
    keepsakeMoves(s, act(s));
    expect(s.hunters[strikers[0] ?? 'zora']?.keepsake).toBe('rune-nail');
    expect(s.hunters[strikers[1] ?? 'zora']?.keepsake).toBe('coffin-silver');
  });

  it('keeps one in Stores when nobody of its role has a free slot, and wears nothing it has not found', () => {
    const s = keepRich('none-free');
    s.legendaries.push({ id: 'yrsas-thole', cycle: 1 });
    for (const id of HUNTER_IDS)
      if (s.hunters[id] && hunters[id].role === 'mender')
        s.roster.active = s.roster.active.filter((h) => h !== id);
    keepsakeMoves(s, act(s));
    expect(Object.values(s.hunters).every((h) => h?.keepsake === null)).toBe(true);
  });
});

describe('the Delver’s Re-roll (D321)', () => {
  const allFaint = (cards: readonly string[]): boolean =>
    cards.length > 0 && cards.every((c) => blessingById(c)?.rarity === 'faint');

  it('re-rolls once a run, and only on an offer where every card is Faint', () => {
    let rerolls = 0;
    for (const seed of ['rr-1', 'rr-2', 'rr-3', 'rr-4', 'rr-5', 'rr-6']) {
      const s = strongKeep(seed);
      s.delve.shop.reroll = true;
      s.delve.allowance = 70;
      const before = structuredClone(s);
      const rec = delveSession(s, s.time);
      // Replay the commands on the untouched copy and check every Re-roll and every pick.
      for (const cmd of rec.commands) {
        const stage = before.delve.run?.stage;
        const run = before.delve.run;
        if (cmd.type === 'delve.reroll') {
          rerolls += 1;
          expect(stage?.kind).toBe('offer');
          expect(run?.rerollUsed).toBe(false);
          expect(stage && 'cards' in stage && allFaint(stage.cards)).toBe(true);
        }
        if (cmd.type === 'delve.chooseBlessing' && stage?.kind === 'offer' && run) {
          // A pick on an all-Faint offer is only made once the Re-roll has been used.
          if (allFaint(stage.cards)) expect(run.rerollUsed).toBe(true);
        }
        expect(apply(before, cmd, before.time).ok).toBe(true);
      }
    }
    expect(rerolls).toBeGreaterThan(0);
  });

  it('never re-rolls without the Re-roll upgrade', () => {
    const s = strongKeep('rr-none');
    s.delve.shop.reroll = false;
    s.delve.riftglass = 0;
    const rec = delveSession(s, s.time);
    expect(rec.commands.some((c) => c.type === 'delve.reroll')).toBe(false);
  });
});
