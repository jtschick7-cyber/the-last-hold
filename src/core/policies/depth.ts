import { gear } from '../../content/gear';
import { HUNTER_IDS, hunters, type HunterId, type RoleId } from '../../content/hunters';
import type { BonusLineId } from '../../content/items';
import type { LegendaryId } from '../../content/legendaries';
import { TALENT_BRANCHES, talentsOf } from '../../content/talents';
import type { Command } from '../commands';
import type { GameState } from '../state/game-state';
import type { ItemState } from '../state/item-state';
import { wornItem } from '../systems/items';
import { owned, wornBy } from '../systems/legendaries';
import { storesCount } from '../systems/loot';
import { peakLevel, rankUpView, starView, unspentTalentPoints } from '../systems/ranks';
import { busyReason, pickProblem } from '../systems/talents';

// GDD §6.1 (v0.8, D321, D352): what the simulated player does with the v0.8 systems: items, ranks,
// stars, talents and Legendaries. The same for Standard, Light, Heavy and the Delver. Every choice
// is a Command, like a tap. None of these moves counts as a "meaningful action" for the engagement
// checks of GDD §6.3 (those keep their v0.1 meaning), so they return nothing.

type Act = (cmd: Command) => boolean;

/** The weights of the fixed item score (GDD §6.1, D352): what one unit of each thing is worth, in Might. */
const SCORE = {
  armor: 1,
  /** A Silver or Rune sub-hit, or the Fire-taken cut, on the base piece. */
  special: 6,
  /** Per 1.0 of a percentage line (so a 6% Might line scores 9), and per point of a flat line. */
  line: { might: 150, health: 100, armor: 2, speed: 2, crit: 150, bane: 60 } satisfies Record<
    BonusLineId,
    number
  >,
} as const;

/** Stores holds more than this and the lowest scorers are salvaged (GDD §6.1, D321). */
const STORES_KEEP = 30;

/** The fixed item score: base Might and Armor, a point for each special effect, and the bonus lines. */
export const itemScore = (item: ItemState): number => {
  const g = gear[item.base];
  let score = g.might + g.armor * SCORE.armor;
  for (const special of [g.silverSubHit, g.runeSubHit, g.fireTakenReduction > 0])
    if (special) score += SCORE.special;
  for (const l of item.lines) score += l.size * SCORE.line[l.kind];
  return score;
};

const idKey = (id: string): number => Number(id.slice(1));

/** Items in Stores, lowest score first (ties: the older item first). */
const storesByScore = (s: GameState): ItemState[] =>
  s.items
    .filter((i) => i.where === null)
    .sort((a, b) => itemScore(a) - itemScore(b) || idKey(a.id) - idKey(b.id));

/**
 * Equips loot that scores higher than what an active hunter wears, the biggest gain first, until
 * nothing scores higher; then salvages the lowest scorers while Stores holds more than 30.
 */
export const itemMoves = (s: GameState, act: Act): void => {
  for (let guard = 0; guard < s.items.length + HUNTER_IDS.length; guard++) {
    let best: { item: string; hunter: HunterId; gain: number } | null = null;
    for (const hunter of s.roster.active) {
      const h = s.hunters[hunter];
      if (!h || busyReason(s, hunter)) continue;
      for (const slot of ['weapon', 'armor'] as const) {
        const worn = wornItem(s, h, slot);
        const have = worn ? itemScore(worn) : 0;
        for (const item of storesByScore(s)) {
          if (gear[item.base].slot !== slot) continue;
          const gain = itemScore(item) - have;
          if (gain > (best?.gain ?? 0)) best = { item: item.id, hunter, gain };
        }
      }
    }
    if (!best || !act({ type: 'item.equip', item: best.item, hunter: best.hunter })) break;
  }
  for (const item of storesByScore(s)) {
    if (storesCount(s) <= STORES_KEEP) break;
    act({ type: 'item.salvage', item: item.id });
  }
};

/** Ranks up every hunter who qualifies, the highest peak level first, as soon as the trophies are on hand. */
export const rankMoves = (s: GameState, act: Act): void => {
  const order = HUNTER_IDS.filter((id) => s.hunters[id]).sort(
    (a, b) => peakLevel(s, b) - peakLevel(s, a),
  );
  for (const id of order)
    while (rankUpView(s, id)?.available && act({ type: 'hunter.rankUp', hunter: id }));
};

/**
 * Embers left after The Hearth (the caller spends those first) buy the cheapest star; ties go to
 * the highest-level hunter, then the roster's order (GDD §6.1, D321).
 */
export const starMoves = (s: GameState, act: Act): void => {
  for (;;) {
    let best: { id: HunterId; cost: number; level: number } | null = null;
    for (const id of HUNTER_IDS) {
      const view = starView(s, id);
      const h = s.hunters[id];
      if (!h || !view?.available || !view.embers) continue;
      const cost = view.embers.value;
      if (!best || cost < best.cost || (cost === best.cost && h.level > best.level))
        best = { id, cost, level: h.level };
    }
    if (!best || !act({ type: 'hunter.addStar', hunter: best.id })) return;
  }
};

/**
 * The fixed talent order (GDD §6.1): the lowest tier first, and within a tier the role's branches
 * in this order. A tier that needs more stars is skipped until the hunter has them.
 */
const BRANCH_ORDER: Readonly<Record<RoleId, readonly string[]>> = {
  vanguard: ['wall', 'retort', 'warden'],
  striker: ['edge', 'hunt', 'pace'],
  mender: ['hands', 'watch', 'herbs'],
};

export const talentOrder = (role: RoleId): string[] => {
  const branches = BRANCH_ORDER[role].map((id) => TALENT_BRANCHES[role].find((b) => b.id === id));
  const all = talentsOf(role);
  return [1, 2, 3].flatMap((tier) =>
    branches.flatMap((b) =>
      all.filter((t) => t.branch === b?.id && t.tier === tier).map((t) => t.id),
    ),
  );
};

/** Spends every unspent talent point, in the fixed order, for every hunter at the hold. */
export const talentMoves = (s: GameState, act: Act): void => {
  for (const id of HUNTER_IDS) {
    const h = s.hunters[id];
    if (!h) continue;
    const byId = new Map(talentsOf(hunters[id].role).map((t) => [t.id, t]));
    for (const talentId of talentOrder(hunters[id].role)) {
      const talent = byId.get(talentId);
      if (unspentTalentPoints(h) <= 0) break;
      if (talent && pickProblem(s, id, talent) === null)
        act({ type: 'talent.pick', hunter: id, talent: talentId });
    }
  }
};

/** Who wears which Legendary (GDD §6.1, the fixed table), in the order they are handed out. */
export const KEEPSAKE_TABLE: readonly (readonly [LegendaryId, RoleId])[] = [
  ['rune-nail', 'striker'],
  ['coffin-silver', 'striker'],
  ['wolf-tooth-string', 'striker'],
  ['barley-knot', 'vanguard'],
  ['ferrymans-coin', 'vanguard'],
  ['yrsas-thole', 'mender'],
];

/** Each Legendary found and not yet worn goes to the highest-level active hunter of its role with a free keepsake slot. */
export const keepsakeMoves = (s: GameState, act: Act): void => {
  for (const [legendary, role] of KEEPSAKE_TABLE) {
    if (!owned(s, legendary) || wornBy(s, legendary) !== null) continue;
    const wearer = s.roster.active
      .filter(
        (id) => hunters[id].role === role && s.hunters[id]?.keepsake === null && !busyReason(s, id),
      )
      .sort((a, b) => (s.hunters[b]?.level ?? 0) - (s.hunters[a]?.level ?? 0))[0];
    if (wearer) act({ type: 'keepsake.equip', hunter: wearer, legendary });
  }
};

/** All of it, in the order a player would: ranks, stars (after The Hearth), talents, Legendaries, items. */
export const depthMoves = (s: GameState, act: Act): void => {
  rankMoves(s, act);
  starMoves(s, act);
  talentMoves(s, act);
  keepsakeMoves(s, act);
  itemMoves(s, act);
};
