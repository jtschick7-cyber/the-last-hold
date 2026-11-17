import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { balance } from '../../src/content/balance';
import { apply } from '../../src/core/commands/apply';
import { RULES_VERSION } from '../../src/core/rules-version';
import { loadEnvelope } from '../../src/core/save/load';
import { runStand } from '../../src/core/stand/engine';
import { standInputFor } from '../../src/core/stand/from-state';
import { replayStand } from '../../src/core/stand/replay';
import type { GameState, StandRecord } from '../../src/core/state/game-state';
import { noPreparation } from '../../src/core/state/game-state';
import { createNewGame } from '../../src/core/state/new-game';
import { V18_TEXT } from '../../src/content/v18-text';
import { laneTableFor, laneView, volley, wallCut } from '../../src/core/systems/breach';
import { evaluateHoldTactics } from '../../src/core/systems/layout-tactics';

const NOW = 1_700_000_000_000;

const bastionState = (seed = 'v7-breach-seed'): GameState => {
  const s = createNewGame(seed, NOW);
  expect(apply(s, { type: 'debug.layoutFillBastion' }, NOW).ok).toBe(true);
  expect(apply(s, { type: 'layout.clear' }, NOW).ok).toBe(true);
  // Park Hearth Hall at the very bottom corner so rows 0..9 stay clear for tests.
  expect(apply(s, { type: 'layout.place', pieceId: 'hearth-hall', x: 6, y: 10 }, NOW).ok).toBe(
    true,
  );
  return s;
};

describe('v7 Breach rules (rulesVersion 7)', () => {
  it('bumps RULES_VERSION to 7 and wires v7 breach tunables', () => {
    expect(RULES_VERSION).toBe(8);
    expect(balance.breach.frontRows.value).toBe(5);
    expect(balance.breach.rampartBonus.value).toBe(0.15);
    expect(balance.breach.screenedBonus.value).toBe(0.25);
    expect(balance.breach.sectorBonus.value).toBe(0.05);
  });

  it('Connected Ramparts boost lane wallCut only when a front wall is connected', () => {
    const isolated = bastionState();
    isolated.buildings.walls = 5;
    isolated.buildings.watchtower = 0;
    expect(apply(isolated, { type: 'layout.place', pieceId: 'wall-1', x: 2, y: 0 }, NOW).ok).toBe(
      true,
    );
    expect(apply(isolated, { type: 'layout.place', pieceId: 'wall-2', x: 3, y: 2 }, NOW).ok).toBe(
      true,
    );

    const tIso = laneTableFor(isolated);
    expect(tIso.pieces[2]).toBe(1);
    expect(tIso.pieces[3]).toBe(1);
    expect(tIso.rampartCols?.[2]).toBe(false);
    expect(tIso.rampartCols?.[3]).toBe(false);
    const isoCut = wallCut(tIso, 5, 2).value;

    const connected = bastionState();
    connected.buildings.walls = 5;
    connected.buildings.watchtower = 0;
    expect(apply(connected, { type: 'layout.place', pieceId: 'wall-1', x: 2, y: 0 }, NOW).ok).toBe(
      true,
    );
    expect(apply(connected, { type: 'layout.place', pieceId: 'wall-2', x: 3, y: 0 }, NOW).ok).toBe(
      true,
    );

    const tConn = laneTableFor(connected);
    expect(tConn.pieces[2]).toBe(1);
    expect(tConn.pieces[3]).toBe(1);
    expect(tConn.rampartCols?.[2]).toBe(true);
    expect(tConn.rampartCols?.[3]).toBe(true);
    const connCut = wallCut(tConn, 5, 2);
    expect(connCut.value).toBeCloseTo(isoCut * (1 + balance.breach.rampartBonus.value), 12);
    expect(connCut.breakdown.children?.some((c) => c.key === 'breach.rampartBonus')).toBe(true);
  });

  it('ignores walls in row 5+ for rampartCols while still letting them connect to row 4', () => {
    const deepOnly = bastionState();
    deepOnly.buildings.walls = 5;
    expect(apply(deepOnly, { type: 'layout.place', pieceId: 'wall-1', x: 4, y: 5 }, NOW).ok).toBe(
      true,
    );
    expect(apply(deepOnly, { type: 'layout.place', pieceId: 'wall-2', x: 5, y: 5 }, NOW).ok).toBe(
      true,
    );
    const tDeep = laneTableFor(deepOnly);
    expect(tDeep.pieces[4]).toBe(0);
    expect(tDeep.rampartCols?.[4]).toBe(false);

    const bridged = bastionState();
    bridged.buildings.walls = 5;
    expect(apply(bridged, { type: 'layout.place', pieceId: 'wall-1', x: 4, y: 4 }, NOW).ok).toBe(
      true,
    );
    expect(apply(bridged, { type: 'layout.place', pieceId: 'wall-2', x: 4, y: 5 }, NOW).ok).toBe(
      true,
    );
    const tBridged = laneTableFor(bridged);
    expect(tBridged.pieces[4]).toBe(1);
    expect(tBridged.rampartCols?.[4]).toBe(true);
  });

  it('Screened Volley requires an active connected wall directly north (y - 1) in rows 0..4', () => {
    const unscreened = bastionState();
    unscreened.buildings.walls = 5;
    unscreened.buildings.watchtower = 6;
    expect(apply(unscreened, { type: 'layout.place', pieceId: 'wall-1', x: 2, y: 0 }, NOW).ok).toBe(
      true,
    );
    expect(apply(unscreened, { type: 'layout.place', pieceId: 'wall-2', x: 3, y: 0 }, NOW).ok).toBe(
      true,
    );
    // Gap at (3, 1), so watchtower at (3, 2) is NOT screened despite connected wall in col 3.
    expect(
      apply(unscreened, { type: 'layout.place', pieceId: 'watchtower-1', x: 3, y: 2 }, NOW).ok,
    ).toBe(true);

    const tUn = laneTableFor(unscreened);
    expect(tUn.towerCols).toEqual([3]);
    expect(tUn.screened).toEqual([false]);
    expect(evaluateHoldTactics(unscreened).screenedTowers.has('watchtower-1')).toBe(false);

    const screened = bastionState();
    screened.buildings.walls = 5;
    screened.buildings.watchtower = 6;
    expect(apply(screened, { type: 'layout.place', pieceId: 'wall-1', x: 2, y: 0 }, NOW).ok).toBe(
      true,
    );
    expect(apply(screened, { type: 'layout.place', pieceId: 'wall-2', x: 3, y: 0 }, NOW).ok).toBe(
      true,
    );
    // Directly south of connected north wall at (3, 0).
    expect(
      apply(screened, { type: 'layout.place', pieceId: 'watchtower-1', x: 3, y: 1 }, NOW).ok,
    ).toBe(true);

    const tSc = laneTableFor(screened);
    expect(tSc.towerCols).toEqual([3]);
    expect(tSc.screened).toEqual([true]);
    expect(evaluateHoldTactics(screened).screenedTowers.has('watchtower-1')).toBe(true);

    // Exact whole-number math: floor(20 * 6 * 300 * (100 * 125) * 100 / (100 * 100 * 1 * 100 * 100)) = 450
    const unVolley = volley(tUn, 6, 3).value;
    const scVolley = volley(tSc, 6, 3).value;
    expect(unVolley).toBe(360);
    expect(scVolley).toBe(450);

    // Watchtower at y = 5 does not count even behind a connected wall at (3, 4).
    const behindFront = bastionState();
    behindFront.buildings.walls = 5;
    behindFront.buildings.watchtower = 6;
    expect(
      apply(behindFront, { type: 'layout.place', pieceId: 'wall-1', x: 3, y: 3 }, NOW).ok,
    ).toBe(true);
    expect(
      apply(behindFront, { type: 'layout.place', pieceId: 'wall-2', x: 3, y: 4 }, NOW).ok,
    ).toBe(true);
    expect(
      apply(behindFront, { type: 'layout.place', pieceId: 'watchtower-1', x: 3, y: 5 }, NOW).ok,
    ).toBe(true);
    const tOut = laneTableFor(behindFront);
    expect(tOut.towerCols).toEqual([]);
    expect(tOut.screened).toEqual([]);
    expect(evaluateHoldTactics(behindFront).screenedTowers.has('watchtower-1')).toBe(false);
  });

  it('Sector Support from active barracks and lodge stacks 0..2 across x +/- 1 and bolsters volley & stand survival', () => {
    const bare = bastionState();
    bare.buildings.watchtower = 5;
    bare.buildings.walls = 0;
    expect(apply(bare, { type: 'layout.place', pieceId: 'watchtower-1', x: 2, y: 1 }, NOW).ok).toBe(
      true,
    );
    const tBare = laneTableFor(bare);
    expect(tBare.sectorCols).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);

    const one = bastionState();
    one.buildings.watchtower = 5;
    one.buildings.walls = 0;
    expect(apply(one, { type: 'layout.place', pieceId: 'watchtower-1', x: 2, y: 1 }, NOW).ok).toBe(
      true,
    );
    expect(apply(one, { type: 'layout.place', pieceId: 'barracks', x: 2, y: 7 }, NOW).ok).toBe(
      true,
    );
    const tOne = laneTableFor(one);
    expect(tOne.sectorCols).toEqual([0, 1, 1, 1, 0, 0, 0, 0]);
    expect(evaluateHoldTactics(one).sectorSupport).toEqual([0, 1, 1, 1, 0, 0, 0, 0]);

    const two = bastionState();
    two.buildings.watchtower = 5;
    two.buildings.walls = 0;
    expect(apply(two, { type: 'layout.place', pieceId: 'watchtower-1', x: 2, y: 1 }, NOW).ok).toBe(
      true,
    );
    expect(apply(two, { type: 'layout.place', pieceId: 'barracks', x: 2, y: 7 }, NOW).ok).toBe(
      true,
    );
    expect(apply(two, { type: 'layout.place', pieceId: 'lodge', x: 3, y: 7 }, NOW).ok).toBe(true);
    const tTwo = laneTableFor(two);
    expect(tTwo.sectorCols).toEqual([0, 1, 2, 2, 1, 0, 0, 0]);

    const vBare = volley(tBare, 5, 2).value; // floor(20 * 5 * 300 * 100 * 100 / 1000000) = 300
    const vOne = volley(tOne, 5, 2).value; // floor(300 * 1.05) = 315
    const vTwo = volley(tTwo, 5, 2).value; // floor(300 * 1.10) = 330
    expect(vBare).toBe(300);
    expect(vOne).toBe(315);
    expect(vTwo).toBe(330);

    // Even with 0 walls and 0 watchtowers, Sector Support reduces damage taken in covered lanes (1.0x floor: never worsens).
    const noWallBare = bastionState('sector-empty-lane');
    noWallBare.buildings.walls = 0;
    noWallBare.buildings.watchtower = 0;
    noWallBare.threat = 1500;

    const noWallSupported = bastionState('sector-empty-lane');
    noWallSupported.buildings.walls = 0;
    noWallSupported.buildings.watchtower = 0;
    noWallSupported.threat = 1500;
    expect(
      apply(noWallSupported, { type: 'layout.place', pieceId: 'barracks', x: 1, y: 8 }, NOW).ok,
    ).toBe(true);
    expect(
      apply(noWallSupported, { type: 'layout.place', pieceId: 'lodge', x: 1, y: 9 }, NOW).ok,
    ).toBe(true);
    // Cover cols 0..7 so whichever lane waves draw, at least barracks/lodge cover some waves cleanly; add barracks+lodge at x=3 and x=6?
    // Even simpler: compare a wave seeded to hit lane 1 via direct runStand on frozen tables.
    const tNoWall = laneTableFor(noWallBare);
    const tSupAll: typeof tNoWall = {
      ...tNoWall,
      sectorCols: [2, 2, 2, 2, 2, 2, 2, 2],
    };
    const inNoWall = standInputFor(noWallBare, noWallBare.roster.active, noPreparation());
    const resBare = runStand({ ...inNoWall, lanes: tNoWall, rulesVersion: 7, log: false });
    const resSup = runStand({ ...inNoWall, lanes: tSupAll, rulesVersion: 7, log: false });
    expect(resSup.wavesHeld).toBeGreaterThanOrEqual(resBare.wavesHeld);
    // Wave 1 surviving hunters should take no more total damage with Sector Support than without.
    const sumHp = (w: (typeof resBare.waves)[number]): number =>
      w.fight.hunters.reduce((sum, h) => sum + h.health, 0);
    if (resBare.waves[0] && resSup.waves[0]) {
      expect(sumHp(resSup.waves[0])).toBeGreaterThanOrEqual(sumHp(resBare.waves[0]));
    }
  });

  it('freezes v7 Bastion stands and ignores later layout edits or balance tweaks', () => {
    const s = bastionState('v7-freeze-check');
    expect(apply(s, { type: 'layout.autoArrange', mode: 'fortress' }, NOW).ok).toBe(true);
    const res = apply(
      s,
      { type: 'stand.make', party: [...s.roster.active], prep: { oils: {}, potions: {} } },
      NOW,
    );
    expect(res.ok).toBe(true);
    const rec = s.cycles[0]?.stand;
    if (!rec) throw new Error('expected frozen Bastion stand record');
    expect(rec.rulesVersion).toBe(8);
    expect(rec.lanes?.rampartCols).toBeDefined();
    expect(rec.lanes?.screened).toBeDefined();
    expect(rec.lanes?.sectorCols).toBeDefined();
    expect(rec.lanes?.k.rampartBonus).toBe(0.15);
    expect(rec.lanes?.k.screenedBonus).toBe(0.25);
    expect(rec.lanes?.k.sectorBonus).toBe(0.05);

    const before = replayStand(rec);
    expect(before.wavesHeld).toBe(rec.wavesHeld);

    // Clear the Hold grid & perturb live breach tunables: frozen v7 replay must not budge.
    expect(apply(s, { type: 'layout.clear' }, NOW).ok).toBe(true);
    const b = balance.breach as unknown as Record<string, { value: unknown }>;
    const saved = {
      rampartBonus: b.rampartBonus?.value,
      screenedBonus: b.screenedBonus?.value,
      sectorBonus: b.sectorBonus?.value,
    };
    try {
      (b.rampartBonus as { value: unknown }).value = 0.99;
      (b.screenedBonus as { value: unknown }).value = 0.99;
      (b.sectorBonus as { value: unknown }).value = 0.4;
      const after = replayStand(rec);
      expect(after).toEqual(before);
    } finally {
      (b.rampartBonus as { value: unknown }).value = saved.rampartBonus;
      (b.screenedBonus as { value: unknown }).value = saved.screenedBonus;
      (b.sectorBonus as { value: unknown }).value = saved.sectorBonus;
    }
  });

  it('keeps v5, v6, v16-played, golden v6 stands, and Arrival stands below Bastion bit-identical', () => {
    // 1. Existing v6 golden stand replays identically under rulesVersion 6.
    const golden = JSON.parse(
      readFileSync(new URL('../golden/stands-v6/auto-arrange.json', import.meta.url), 'utf8'),
    ) as { record: StandRecord; wavesHeld: number };
    expect(golden.record.rulesVersion).toBe(6);
    expect(replayStand(golden.record).wavesHeld).toBe(golden.wavesHeld);

    // 2. Existing v16-played.json stands replay cleanly with their frozen rulesVersion (5 / 6).
    const rawV16 = JSON.parse(
      readFileSync(new URL('../saves/fixtures/v16-played.json', import.meta.url), 'utf8'),
    ) as unknown;
    const loadedV16 = loadEnvelope(rawV16);
    expect(loadedV16.ok).toBe(true);
    if (loadedV16.ok) {
      const stand = loadedV16.value.state.cycles.find((c) => c.stand && c.stand.lanes)?.stand;
      if (stand) {
        expect(stand.rulesVersion).toBe(6);
        expect(replayStand(stand).wavesHeld).toBe(stand.wavesHeld);
      }
      const anyStand = loadedV16.value.state.cycles.find((c) => c.stand)?.stand;
      if (anyStand) expect(replayStand(anyStand).wavesHeld).toBe(anyStand.wavesHeld);
    }

    // 3. Explicit v5 (no lanes) and v6 (v6 lanes) replay identically regardless of v7 rules.
    const s = bastionState('v5-v6-compat');
    const input = standInputFor(s, s.roster.active, noPreparation());
    const v5Res = runStand({ ...input, lanes: undefined, rulesVersion: 5, log: true });
    expect(v5Res.waves.every((w) => w.breach === undefined)).toBe(true);

    const v6Lanes = {
      pieces: [1, 1, 1, 1, 1, 1, 1, 1],
      towerCols: [2],
      k: {
        coverOwn: 0.5,
        coverNeighbour: 0.25,
        depthStep: 0.25,
        depthMax: 2,
        towerReach: [1, 0.5, 0.25],
        volleyScale: 3,
      },
    };
    const v6A = runStand({ ...input, lanes: v6Lanes, rulesVersion: 6, log: true });
    const v6B = runStand({ ...input, lanes: v6Lanes, rulesVersion: 6, log: true });
    expect(v6A).toEqual(v6B);

    // 4. Arrival stand below Bastion freezes no lanes even at RULES_VERSION === 7.
    const arr = createNewGame('arrival-v7-check', NOW);
    arr.arrivalDue = true;
    arr.cycle.age = 'hamlet';
    arr.buildings.barracks = 1;
    arr.buildings['hunters-lodge'] = 1;
    const arrInputBefore = standInputFor(arr, arr.roster.active, noPreparation(), true);
    const arrRes = apply(
      arr,
      { type: 'stand.make', party: [...arr.roster.active], prep: { oils: {}, potions: {} } },
      NOW,
    );
    expect(arrRes.ok).toBe(true);
    const arrRec = arr.cycles[0]?.stand;
    if (!arrRec) throw new Error('expected frozen Arrival stand record');
    expect(arrRec.rulesVersion).toBe(8);
    expect(arrRec.lanes).toBeUndefined();
    const arrReplay = replayStand(arrRec);
    const arrAsV5 = runStand({
      ...arrInputBefore,
      rulesVersion: 5,
      log: true,
    });
    expect(arrReplay.wavesHeld).toBe(arrRec.wavesHeld);
    expect(arrReplay.waves.map((w) => w.fight.result)).toEqual(
      arrAsV5.waves.map((w) => w.fight.result),
    );
  });

  it('exposes nested Screened watchtower breakdown, v7 LaneView fields, and WaveOutcome.breach v7 lines', () => {
    const s = bastionState('v7-breakdowns');
    s.buildings.barracks = 1;
    s.buildings['hunters-lodge'] = 1;
    expect(apply(s, { type: 'layout.place', pieceId: 'wall-1', x: 2, y: 1 }, NOW).ok).toBe(true);
    expect(apply(s, { type: 'layout.place', pieceId: 'wall-2', x: 3, y: 1 }, NOW).ok).toBe(true);
    expect(apply(s, { type: 'layout.place', pieceId: 'watchtower-1', x: 2, y: 2 }, NOW).ok).toBe(
      true,
    );
    expect(apply(s, { type: 'layout.place', pieceId: 'barracks', x: 2, y: 5 }, NOW).ok).toBe(true);
    expect(apply(s, { type: 'layout.place', pieceId: 'lodge', x: 2, y: 6 }, NOW).ok).toBe(true);

    const table = laneTableFor(s);
    const v = volley(table, s.buildings.watchtower, 2);
    const towerChild = v.breakdown.children?.find((c) => c.key === 'breach.screenedBonus');
    expect(towerChild?.children).toEqual([
      { label: V18_TEXT.screenedBonus(25), value: 0.25, key: 'breach.screenedBonus' },
    ]);
    expect(v.breakdown.children?.some((c) => c.label === V18_TEXT.sectorSupport(10))).toBe(true);
    const wc = wallCut(table, s.buildings.walls, 2);
    expect(wc.breakdown.children?.some((c) => c.label === V18_TEXT.connectedRampart(15))).toBe(
      true,
    );

    const lv = laneView(s);
    expect(lv.screenedCount).toBe(1);
    expect(lv.lanes[2]).toMatchObject({
      rampartPercent: 15,
      screenedTowers: 1,
      sectorPercent: 10,
    });

    const v7Stand = runStand({
      ...standInputFor(s, s.roster.active, noPreparation()),
      rulesVersion: 7,
      log: true,
    });
    const waveInLane2 = v7Stand.waves.find((w) => w.breach?.lane === 2);
    if (waveInLane2?.breach) {
      expect(
        waveInLane2.breach.wallCut.breakdown.children?.some(
          (c) => c.label === V18_TEXT.connectedRampart(15),
        ),
      ).toBe(true);
      expect(
        waveInLane2.breach.volley.breakdown.children?.some(
          (c) => c.label === V18_TEXT.sectorSupport(10),
        ),
      ).toBe(true);
    }
  });
});
