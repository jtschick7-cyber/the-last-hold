// Plan T18.3 (GDD §5.1.5, §7.16; TD §25.2; D619, D625): pure tactical layout analyzer,
// orthogonal AoE district adjacency, Hearth/Bell warmth, North-Reach Warded flood, and Breakdown parity.
import { describe, expect, it } from 'vitest';
import { BUILDING_IDS } from '../../src/content/buildings';
import { CANONICAL_LAYOUT } from '../../src/content/hold-layout';
import { createNewGame } from '../../src/core/state/new-game';
import { productionRate, foodCapacity } from '../../src/core/systems/production';
import { threatRate } from '../../src/core/threat/threat';
import type { Breakdown } from '../../src/core/breakdown/breakdown';
import type { GameState } from '../../src/core/state/game-state';
import { num } from '../../src/core/balance-access';
import {
  brewDuration,
  brewMs,
  experimentDuration,
  experimentMs,
} from '../../src/core/alchemy/brewing';
import { V18_TEXT } from '../../src/content/v18-text';
import { syncGarden } from '../../src/core/alchemy/garden';
import { housing } from '../../src/core/systems/housing';
import {
  evaluateHoldTactics,
  tacticalBrewCut,
  tacticalBrewFactor,
  tacticalProductionFactor,
  tacticalThreatFactor,
} from '../../src/core/systems/layout-tactics';

const bastionGame = (): GameState => {
  const s = createNewGame('tactics', 0);
  s.cycle.age = 'bastion';
  for (const id of BUILDING_IDS) s.buildings[id] = 1;
  s.buildings.farm = 15;
  s.buildings['woodcutters-camp'] = 15;
  s.buildings.mine = 15;
  s.buildings['herb-garden'] = 15;
  s.buildings.cottage = 15;
  s.buildings['silver-seam'] = 2;
  s.buildings.walls = 15;
  s.buildings.watchtower = 15;
  s.peasants.jobs = { farmer: 4, woodcutter: 4, miner: 4, 'silver-digger': 2 };
  s.peasants.total = 14;
  s.layout.placed = { 'hearth-hall': { x: 3, y: 6 } };
  return s;
};

const clearDefensePieces = (s: GameState): void => {
  s.layout.placed = Object.fromEntries(
    Object.entries(s.layout.placed).filter(
      ([id]) => !id.startsWith('wall-') && !id.startsWith('watchtower-'),
    ),
  );
};

const keysIn = (b: Breakdown): string[] => [
  ...(b.key ? [b.key] : []),
  ...(b.children ?? []).flatMap(keysIn),
];

describe('layout-tactics: baseline floor & gating', () => {
  it('empty / unlinked layouts enforce a clean 1.0x baseline floor (zero penalties)', () => {
    const s = bastionGame();
    // Spread pieces cleanly apart with no orthogonal or Bell-ring contacts and no walls.
    s.layout.placed = {
      'hearth-hall': { x: 3, y: 9 },
      mill: { x: 0, y: 0 },
      'farm-1': { x: 0, y: 2 },
      sawpit: { x: 2, y: 0 },
      'woodcutter-1': { x: 2, y: 2 },
      smithy: { x: 4, y: 0 },
      'mine-1': { x: 4, y: 2 },
      'silver-seam-1': { x: 6, y: 2 },
      alchemist: { x: 6, y: 4 },
      'herb-garden-1': { x: 0, y: 4 },
      'cottage-1': { x: 0, y: 6 },
      'trophy-hall': { x: 6, y: 6 },
      barracks: { x: 6, y: 9 },
      'bell-tower': { x: 0, y: 11 },
    };

    const summary = evaluateHoldTactics(s);
    expect(summary.links).toEqual([]);
    expect(summary.hearthWarded).toBe(false);
    expect(summary.wardedThreatCut).toBe(0);
    expect(summary.brewCut).toBe(0);
    expect(summary.productionBonus).toEqual({ food: 0, wood: 0, iron: 0, silver: 0 });
    expect(tacticalProductionFactor(s, 'food')).toBeNull();
    expect(tacticalThreatFactor(s)).toBeNull();
    expect(tacticalBrewCut(s)).toBe(0);

    // Identical to having nothing placed in the tray.
    const trayOnly = bastionGame();
    trayOnly.layout.placed = {};
    for (const r of ['food', 'wood', 'iron', 'silver'] as const) {
      expect(productionRate(s, r).value).toBe(productionRate(trayOnly, r).value);
    }
    expect(threatRate(s).value).toBe(threatRate(trayOnly).value);
    expect(brewMs(s)).toBe(brewMs(trayOnly));
    expect(experimentMs(s)).toBe(experimentMs(trayOnly));
  });

  it('ignores tray, locked, and dormant-ring pieces for links and walls', () => {
    const s = createNewGame('dormant', 0);
    // Still in Hamlet (clearing x = 1..6, y = 4..9): piece at (0, 6) or (3, 1) is dormant-ring!
    s.buildings.mill = 1;
    s.buildings.farm = 5; // farm-1, farm-2 unlocked; farm-3 still locked!
    s.buildings.walls = 15;
    s.buildings.watchtower = 15;
    s.layout.placed = {
      'hearth-hall': { x: 3, y: 6 },
      mill: { x: 0, y: 5 }, // outside Hamlet x >= 1 -> dormant-ring!
      'farm-1': { x: 1, y: 5 }, // orthogonally touches dormant mill -> 0 bonus
      'farm-3': { x: 2, y: 5 }, // locked at farm=5 (<15)
      // Complete Citadel-row wall across y = 1: all dormant in Hamlet!
      'wall-1': { x: 0, y: 1 },
      'wall-2': { x: 1, y: 1 },
      'watchtower-1': { x: 2, y: 1 },
      'wall-3': { x: 3, y: 1 },
      'wall-4': { x: 4, y: 1 },
      'watchtower-2': { x: 5, y: 1 },
      'wall-5': { x: 6, y: 1 },
      'wall-6': { x: 7, y: 1 },
    };
    const summary = evaluateHoldTactics(s);
    expect(summary.foodLinked).toEqual([]);
    expect(summary.hearthWarded).toBe(false);
    expect(summary.wardedPieces.size).toBe(0);

    // Move mill inside Hamlet clearing next to farm-1, and lock farm=1 -> still locked mill check:
    s.buildings.mill = 0; // locked
    s.layout.placed.mill = { x: 2, y: 5 };
    expect(evaluateHoldTactics(s).foodLinked).toEqual([]);
  });
});

describe('layout-tactics: orthogonal district adjacency & warmth', () => {
  it('links farms to mill, woodcutters to sawpit, and mines to smithy (orthogonal only)', () => {
    const s = bastionGame();
    s.layout.placed = {
      'hearth-hall': { x: 5, y: 9 },
      mill: { x: 2, y: 3 },
      'farm-1': { x: 2, y: 2 }, // N
      'farm-2': { x: 3, y: 3 }, // E
      'farm-3': { x: 3, y: 4 }, // diagonal from mill -> not linked
      sawpit: { x: 2, y: 6 },
      'woodcutter-1': { x: 1, y: 6 }, // W
      'woodcutter-2': { x: 2, y: 7 }, // S
      'woodcutter-3': { x: 1, y: 7 }, // diagonal -> not linked
      smithy: { x: 5, y: 3 },
      'mine-1': { x: 5, y: 2 }, // N
      'mine-2': { x: 6, y: 3 }, // E
      'mine-3': { x: 5, y: 4 }, // S
    };
    const t = evaluateHoldTactics(s);
    expect(t.foodLinked).toEqual(['farm-1', 'farm-2']);
    expect(t.woodLinked).toEqual(['woodcutter-1', 'woodcutter-2']);
    expect(t.ironLinked).toEqual(['mine-1', 'mine-2', 'mine-3']);

    const adjFood = num('layout.adjFood');
    const adjWood = num('layout.adjWood');
    const adjIron = num('layout.adjIron');
    expect(t.productionBonus.food).toBeCloseTo(2 * adjFood, 12);
    expect(t.productionBonus.wood).toBeCloseTo(2 * adjWood, 12);
    expect(t.productionBonus.iron).toBeCloseTo(3 * adjIron, 12);

    const base = bastionGame();
    base.layout.placed = { 'hearth-hall': { x: 5, y: 9 } };
    expect(productionRate(s, 'food').value).toBeCloseTo(
      productionRate(base, 'food').value * (1 + 2 * adjFood),
      10,
    );
    expect(productionRate(s, 'wood').value).toBeCloseTo(
      productionRate(base, 'wood').value * (1 + 2 * adjWood),
      10,
    );
    expect(productionRate(s, 'iron').value).toBeCloseTo(
      productionRate(base, 'iron').value * (1 + 3 * adjIron),
      10,
    );
  });

  it('lifts silver via smithy + Warded silver-seams only (Q68: D30 SILVER_BUCKETS intact)', () => {
    const base = bastionGame();
    base.layout.placed = { 'hearth-hall': { x: 3, y: 9 } };
    // Add non-silver tactical bonuses (warm cottages + linked trophy hall + Keep/Bastion buckets already present):
    const nonSilverTactical = bastionGame();
    nonSilverTactical.layout.placed = {
      'hearth-hall': { x: 3, y: 9 },
      'cottage-1': { x: 2, y: 9 },
      'trophy-hall': { x: 5, y: 9 },
      mill: { x: 0, y: 5 },
      'farm-1': { x: 0, y: 6 },
    };
    // Warm cottage & trophy hall & farm do NOT affect silver:
    expect(productionRate(nonSilverTactical, 'silver').value).toBe(
      productionRate(base, 'silver').value,
    );

    // Link silver-seam-1 & silver-seam-2 beside smithy:
    const linked = bastionGame();
    linked.layout.placed = {
      'hearth-hall': { x: 3, y: 9 },
      smithy: { x: 3, y: 4 },
      'silver-seam-1': { x: 2, y: 4 },
      'silver-seam-2': { x: 4, y: 4 },
    };
    const adjSilver = num('layout.adjSilver');
    expect(evaluateHoldTactics(linked).silverLinked).toEqual(['silver-seam-1', 'silver-seam-2']);
    expect(productionRate(linked, 'silver').value).toBeCloseTo(
      productionRate(base, 'silver').value * (1 + 2 * adjSilver),
      10,
    );
    const silverRate = productionRate(linked, 'silver');
    expect(silverRate.breakdown.value).toBe(silverRate.value);
    expect(keysIn(silverRate.breakdown)).toContain('layout.adjSilver');
    // Relic, age, building, and trophy buckets still never alter silver (D30): only adjSilver applies.
    linked.relics = [{ id: 'plough-share', cycle: 1 }];
    base.relics = [{ id: 'plough-share', cycle: 1 }];
    linked.stats.trophies = 40;
    base.stats.trophies = 40;
    expect(productionRate(linked, 'silver').value).toBeCloseTo(
      productionRate(base, 'silver').value * (1 + 2 * adjSilver),
      10,
    );
  });

  it('speeds brewMs & experimentMs per herb-garden beside alchemist while leaving herbGarden interval unchanged (Q69)', () => {
    const base = bastionGame();
    base.layout.placed = { 'hearth-hall': { x: 3, y: 9 }, alchemist: { x: 1, y: 5 } };
    const linked = bastionGame();
    linked.layout.placed = {
      'hearth-hall': { x: 3, y: 9 },
      alchemist: { x: 1, y: 5 },
      'herb-garden-1': { x: 1, y: 4 }, // N
      'herb-garden-2': { x: 2, y: 5 }, // E
      'herb-garden-3': { x: 0, y: 6 }, // diagonal -> excluded
    };
    const cut = 2 * num('layout.adjBrew');
    expect(tacticalBrewCut(linked)).toBeCloseTo(cut, 12);
    expect(brewMs(linked)).toBeCloseTo(brewMs(base) * (1 - cut), 10);
    expect(experimentMs(linked)).toBeCloseTo(experimentMs(base) * (1 - cut), 10);
    // Copper still scales proportionally on top:
    linked.relics = [{ id: 'copper-still', cycle: 1 }];
    base.relics = [{ id: 'copper-still', cycle: 1 }];
    expect(brewMs(linked)).toBeCloseTo(brewMs(base) * (1 - cut), 10);
    // Herb garden interval stays fixed at 10 min even with linked gardens:
    syncGarden(linked);
    expect(linked.garden.nextAt).toBe(linked.time + num('herbGarden.interval') * 1000);
  });

  it('counts warm cottages at most once across hearth-hall edge or bell-tower 3x3 ring, and caps trophy link at 1x (Q69)', () => {
    const base = bastionGame();
    base.layout.placed = { 'hearth-hall': { x: 3, y: 6 } };
    const beforeHousing = housing(base).value;

    const s = bastionGame();
    s.layout.placed = {
      'hearth-hall': { x: 3, y: 6 }, // 2x2: (3,6),(4,6),(3,7),(4,7)
      'bell-tower': { x: 2, y: 9 }, // 3x3 ring covers x=1..3, y=8..10
      'cottage-1': { x: 2, y: 8 }, // diagonal from hearth (3,7) -> not hearth-adjacent, YES bell-tower ring
      'cottage-2': { x: 3, y: 8 }, // touches hearth (3,7) AND inside bell-tower ring -> counted ONCE!
      'cottage-3': { x: 5, y: 6 }, // touches hearth (4,6) -> YES hearth-adjacent
      barracks: { x: 4, y: 9 },
      // trophy-hall touches BOTH hearth-hall (3,7) -> no, put trophy-hall at (3,8)? taken.
      // Put barracks at (1,6) and trophy-hall at (2,6) so trophy touches BOTH hearth (3,6) AND barracks (1,6):
      'trophy-hall': { x: 2, y: 6 },
    };
    s.layout.placed.barracks = { x: 1, y: 6 };

    const t = evaluateHoldTactics(s);
    expect(t.warmCottages).toEqual(['cottage-1', 'cottage-2', 'cottage-3']);
    expect(t.trophyLinked).toBe(true);

    const expectedUplift = 3 * num('layout.adjCottage') + num('layout.adjTrophy');
    expect(t.productionBonus.food).toBeCloseTo(expectedUplift, 12);
    expect(t.productionBonus.wood).toBeCloseTo(expectedUplift, 12);
    expect(t.productionBonus.iron).toBeCloseTo(expectedUplift, 12);
    expect(t.productionBonus.silver).toBe(0);
    // Housing stays exact integer:
    expect(housing(s).value).toBe(beforeHousing);
  });
});

describe('layout-tactics: North-Reach Warded flood (O(8x12) BFS)', () => {
  it('seals behind a continuous wall+watchtower curtain across row 1', () => {
    const s = bastionGame();
    s.layout.placed = {
      'hearth-hall': { x: 3, y: 6 },
      'farm-1': { x: 2, y: 7 },
      'woodcutter-1': { x: 5, y: 7 },
      'mine-1': { x: 5, y: 5 },
      'silver-seam-1': { x: 4, y: 5 },
      // Continuous seam at y = 1:
      'wall-1': { x: 0, y: 1 },
      'wall-2': { x: 1, y: 1 },
      'watchtower-1': { x: 2, y: 1 },
      'wall-3': { x: 3, y: 1 },
      'wall-4': { x: 4, y: 1 },
      'watchtower-2': { x: 5, y: 1 },
      'wall-5': { x: 6, y: 1 },
      'wall-6': { x: 7, y: 1 },
    };
    const t = evaluateHoldTactics(s);
    expect(t.hearthWarded).toBe(true);
    expect(t.wardedThreatCut).toBeCloseTo(num('layout.wardedThreatCut'), 12);
    expect(t.wardedPlots).toEqual({
      food: ['farm-1'],
      wood: ['woodcutter-1'],
      iron: ['mine-1'],
      silver: ['silver-seam-1'],
    });
    const wb = num('layout.wardedBonus');
    expect(t.productionBonus.food).toBeCloseTo(wb, 12);
    expect(t.productionBonus.silver).toBeCloseTo(wb, 12);

    const open = bastionGame();
    open.layout.placed = { ...s.layout.placed };
    clearDefensePieces(open);
    expect(threatRate(s).value).toBeCloseTo(
      threatRate(open).value * (1 - num('layout.wardedThreatCut')),
      10,
    );
  });

  it('breaches through a 1-tile seam gap while 4-way diagonal steps stay sealed', () => {
    const s = bastionGame();
    s.layout.placed = {
      'hearth-hall': { x: 3, y: 6 },
      'farm-1': { x: 2, y: 7 },
      // Missing x=7! Flood enters at (7,0)->(7,1)->(7,2)... and reaches everything south of y=1:
      'wall-1': { x: 0, y: 1 },
      'wall-2': { x: 1, y: 1 },
      'watchtower-1': { x: 2, y: 1 },
      'wall-3': { x: 3, y: 1 },
      'wall-4': { x: 4, y: 1 },
      'watchtower-2': { x: 5, y: 1 },
      'wall-5': { x: 6, y: 1 },
    };
    expect(evaluateHoldTactics(s).hearthWarded).toBe(false);
    expect(evaluateHoldTactics(s).wardedPlots.food).toEqual([]);

    // Diagonal step at x=3..4: (0..3, 1) and (4..7, 2) share no orthogonal gap -> 4-way BFS seals:
    s.layout.placed = {
      'hearth-hall': { x: 3, y: 6 },
      'wall-1': { x: 0, y: 1 },
      'wall-2': { x: 1, y: 1 },
      'wall-3': { x: 2, y: 1 },
      'wall-4': { x: 3, y: 1 },
      'wall-5': { x: 4, y: 2 },
      'wall-6': { x: 5, y: 2 },
      'wall-7': { x: 6, y: 2 },
      'wall-8': { x: 7, y: 2 },
    };
    expect(evaluateHoldTactics(s).hearthWarded).toBe(true);

    // Drop wall-5 at (4,2) -> orthogonal gap down column 4 leaks south into hearth-hall:
    delete s.layout.placed['wall-5'];
    expect(evaluateHoldTactics(s).hearthWarded).toBe(false);

    // Partial hearth enclosure leaving (4,7) exposed: hearthWarded requires ALL 4 tiles unreached:
    s.layout.placed = {
      'hearth-hall': { x: 3, y: 6 }, // tiles: (3,6),(4,6),(3,7),(4,7)
      'wall-1': { x: 3, y: 5 },
      'wall-2': { x: 4, y: 5 },
      'wall-3': { x: 2, y: 6 },
      'wall-4': { x: 2, y: 7 },
      'wall-5': { x: 3, y: 8 },
      'wall-6': { x: 5, y: 6 },
      // East of (4,7) at (5,7) and south at (4,8) are open -> flood reaches hearth-hall.
    };
    const partial = evaluateHoldTactics(s);
    expect(partial.hearthWarded).toBe(false);

    // Seal all orthogonal perimeter tiles around a small pocket containing farm-1 at (2,9):
    s.layout.placed = {
      'hearth-hall': { x: 3, y: 6 },
      'farm-1': { x: 2, y: 9 },
      'farm-2': { x: 5, y: 9 }, // exposed
      'wall-1': { x: 2, y: 8 },
      'wall-2': { x: 2, y: 10 },
      'wall-3': { x: 1, y: 9 },
      'watchtower-1': { x: 3, y: 9 },
    };
    const pocket = evaluateHoldTactics(s);
    expect(pocket.hearthWarded).toBe(false);
    expect(pocket.wardedPlots.food).toEqual(['farm-1']);
  });

  it('allows walls along y = 0 to block flood seeding on those tiles while open y = 0 tiles still seed', () => {
    const s = bastionGame();
    s.layout.placed = {
      'hearth-hall': { x: 3, y: 6 },
      'wall-1': { x: 0, y: 0 },
      'wall-2': { x: 1, y: 0 },
      'wall-3': { x: 2, y: 0 },
      'wall-4': { x: 3, y: 0 },
      'wall-5': { x: 4, y: 0 },
      'wall-6': { x: 5, y: 0 },
      'wall-7': { x: 6, y: 0 },
      'wall-8': { x: 7, y: 0 },
    };
    // Full y=0 wall blocks every north entry tile:
    expect(evaluateHoldTactics(s).hearthWarded).toBe(true);

    // Remove just (7,0) -> unblocked y=0 tile floods the entire grid south:
    delete s.layout.placed['wall-8'];
    expect(evaluateHoldTactics(s).hearthWarded).toBe(false);
  });

  it('CANONICAL_LAYOUT at Bastion wards Hearth Hall and links expected districts cleanly', () => {
    const s = bastionGame();
    s.layout.placed = structuredClone(CANONICAL_LAYOUT);
    const t = evaluateHoldTactics(s);
    expect(t.hearthWarded).toBe(true);
    expect(t.foodLinked).toEqual(['farm-1']);
    expect(t.woodLinked).toEqual(['woodcutter-1']);
    expect(t.ironLinked).toEqual([]);
    expect(t.silverLinked).toEqual(['silver-seam-1', 'silver-seam-2']);
    expect(t.brewLinked).toEqual(['herb-garden-1']);
    expect(t.warmCottages).toEqual(['cottage-1', 'cottage-2', 'cottage-3']);
    expect(t.trophyLinked).toBe(false);
    expect(t.wardedPlots.food).toEqual(['farm-1', 'farm-2', 'farm-3']);
  });
});

describe('Breakdown parity & D624 budget', () => {
  it('productionRate, foodCapacity, and threatRate maintain exact breakdown.value === value with layout keys', () => {
    const s = bastionGame();
    s.layout.placed = structuredClone(CANONICAL_LAYOUT);
    for (const r of ['food', 'wood', 'iron', 'silver'] as const) {
      const rate = productionRate(s, r);
      expect(rate.breakdown.value).toBe(rate.value);
      expect(keysIn(rate.breakdown).some((k) => k.startsWith('layout.'))).toBe(true);
    }
    const cap = foodCapacity(s);
    expect(cap.breakdown.value).toBe(cap.value);
    const threat = threatRate(s);
    expect(threat.breakdown.value).toBe(threat.value);
    expect(keysIn(threat.breakdown)).toContain('layout.wardedThreatCut');
    expect(threat.breakdown.children?.some((c) => c.label === V18_TEXT.wardedHearthHall)).toBe(
      true,
    );

    const food = productionRate(s, 'food');
    const holdNode = food.breakdown.children?.find((c) => c.label === V18_TEXT.holdTactics);
    expect(holdNode?.children?.map((c) => c.label)).toEqual([
      V18_TEXT.millLinks(1),
      V18_TEXT.warmCottages(3),
      V18_TEXT.wardedPlots(3),
    ]);
  });

  it('tacticalBrewFactor, brewDuration, and experimentDuration preserve single-source breakdown parity', () => {
    const s = bastionGame();
    s.layout.placed = {
      'hearth-hall': { x: 3, y: 6 },
      alchemist: { x: 3, y: 8 },
    };
    expect(tacticalBrewFactor(s)).toBeNull();
    const baseBrew = brewDuration(s);
    const baseExp = experimentDuration(s);
    expect(baseBrew.value).toBe(brewMs(s) / 1000);
    expect(baseBrew.breakdown.value).toBe(baseBrew.value);
    expect(baseBrew.breakdown.label).toBe(V18_TEXT.brewTime);
    expect(baseExp.value).toBe(experimentMs(s) / 1000);
    expect(baseExp.breakdown.value).toBe(baseExp.value);
    expect(baseExp.breakdown.label).toBe(V18_TEXT.experimentTime);

    s.layout.placed['herb-garden-1'] = { x: 4, y: 8 };
    const factor = tacticalBrewFactor(s);
    expect(factor?.value).toBeCloseTo(1 - num('layout.adjBrew'), 12);
    expect(factor?.breakdown.label).toBe(V18_TEXT.holdTactics);
    expect(factor?.breakdown.children?.map((c) => c.label)).toEqual([V18_TEXT.alchemistLinks(1)]);

    const linkedBrew = brewDuration(s);
    const linkedExp = experimentDuration(s);
    expect(linkedBrew.value).toBeCloseTo(brewMs(s) / 1000, 12);
    expect(linkedBrew.breakdown.value).toBe(linkedBrew.value);
    expect(linkedExp.value).toBeCloseTo(experimentMs(s) / 1000, 12);
    expect(linkedExp.breakdown.value).toBe(linkedExp.value);
    expect(keysIn(linkedBrew.breakdown)).toContain('layout.adjBrew');
    const brewHold = linkedBrew.breakdown.children?.find((c) => c.label === V18_TEXT.holdTactics);
    expect(brewHold?.children?.map((c) => c.label)).toEqual([V18_TEXT.alchemistLinks(1)]);
  });

  it('evaluates North-Reach + links well within D624 <= 5 ms budget across varied layouts', () => {
    const s = bastionGame();
    const start = performance.now();
    for (let i = 0; i < 20; i++) {
      s.layout.placed = {
        ...structuredClone(CANONICAL_LAYOUT),
        'wall-1': { x: i % 8, y: 2 },
      };
      evaluateHoldTactics(s);
    }
    const perEval = (performance.now() - start) / 20;
    expect(perEval).toBeLessThan(5);
  });
});
