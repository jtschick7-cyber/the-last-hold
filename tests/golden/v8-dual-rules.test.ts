// Plan T19.8 (D632, D636): Dual-rules regression tests proving all historical rulesVersion 1-7
// golden fights, recorded contract fights, stands, Delve floors, and Descents replay identically
// under RULES_VERSION = 8 while rulesVersion 8 isolates v1.9 combat changes.
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { hunters } from '../../src/content/hunters';
import { runFight, type FightInput } from '../../src/core/combat';
import { fightInputOf, replayFight } from '../../src/core/contracts/playback';
import { replayLastFloor } from '../../src/core/delves/run';
import {
  fightReplayDiffers,
  floorReplayDiffers,
  standReplayDiffers,
} from '../../src/core/replay-check';
import { scripted, stream } from '../../src/core/rng';
import { cyrb128 } from '../../src/core/rng/cyrb128';
import { RULES_VERSION } from '../../src/core/rules-version';
import { loadEnvelope } from '../../src/core/save';
import { runStand } from '../../src/core/stand/engine';
import { replayStand } from '../../src/core/stand/replay';
import type { GameState, StandRecord } from '../../src/core/state/game-state';
import { rebuildDescentLogs, rebuildMatches } from '../../src/core/systems/descent-record';
import { eventFightInput, eventPlayback } from '../../src/core/systems/events-playback';
import { snap } from '../combat/helpers';
import { standLines } from './stands-v6/lines';

const FIXTURES_DIR = new URL('../saves/fixtures/', import.meta.url);
const STANDS_V6_DIR = new URL('./stands-v6/', import.meta.url);

const loadState = (file: string): GameState => {
  const res = loadEnvelope(JSON.parse(readFileSync(new URL(file, FIXTURES_DIR), 'utf8')));
  if (!res.ok) throw new Error(`${file}: ${res.error}`);
  return res.value.state;
};

const hashLines = (lines: readonly string[]): string =>
  ((cyrb128(lines.join('\n'))[0] ?? 0) >>> 0).toString(16);

const GDD_ROLLS = [
  0.4, 0.5, 0.7, 0.2, 0.6, 0.95, 0.95, 0.1, 0.3, 0.5, 0.3, 0.9, 0.1, 0.5, 0.2, 0.8, 0.6, 0.5, 0.4,
  0.7, 0.8, 0.3, 0.2, 0.4, 0.6, 0.1, 0.5, 0.15, 0.8, 0.6, 0.3, 0.3, 0.7, 0.9,
];

const SEEDED_GOLDENS = [
  {
    key: 'a',
    party: ['halvar', 'zora', 'ostap'],
    monster: 'upyr',
    tier: 2,
    location: 'field',
    hash: 'ea4496aa',
  },
  {
    key: 'b',
    party: ['zora', 'bjarna', 'vesna'],
    monster: 'rusalka',
    tier: 2,
    location: 'river',
    hash: '9032398e',
  },
  {
    key: 'c',
    party: ['halvar', 'radek', 'ostap'],
    monster: 'draugr',
    tier: 3,
    location: 'barrow',
    hash: 'd3a686c3',
  },
  {
    key: 'd',
    party: ['halvar', 'toma', 'bjarna', 'ostap'],
    monster: 'leshy',
    tier: 5,
    location: 'forest',
    hash: 'a06f958d',
  },
  {
    key: 'e',
    party: ['sigrun', 'zora', 'ostap'],
    monster: 'strzyga',
    tier: 4,
    location: 'barrow',
    hash: '867de6fc',
  },
] as const;

const VERSIONS_1_TO_8 = [1, 2, 3, 4, 5, 6, 7, 8] as const;

describe('dual rulesVersion 1-7 legacy stability under RULES_VERSION = 8 (D632)', () => {
  it('reproduces the GDD §5.5.1 golden fight identically across rulesVersion 1..8', () => {
    const baseline = runFight({
      party: [
        {
          id: 'zora',
          name: hunters.zora.name,
          role: hunters.zora.role,
          damage: hunters.zora.damage,
          level: 1,
          base: hunters.zora.stats,
          traits: hunters.zora.traits,
          weapon: null,
          armorGear: null,
        },
      ],
      monster: { monster: 'kikimora', tier: 1 },
      location: 'field',
      rolls: scripted(GDD_ROLLS),
      rulesVersion: 1,
    });
    const baseTexts = baseline.log.map((e) => e.text);

    for (const rv of VERSIONS_1_TO_8) {
      const r = runFight({
        party: [
          {
            id: 'zora',
            name: hunters.zora.name,
            role: hunters.zora.role,
            damage: hunters.zora.damage,
            level: 1,
            base: hunters.zora.stats,
            traits: hunters.zora.traits,
            weapon: null,
            armorGear: null,
          },
        ],
        monster: { monster: 'kikimora', tier: 1 },
        location: 'field',
        rolls: scripted(GDD_ROLLS),
        rulesVersion: rv,
      });
      expect(r.result).toBe('win');
      expect(r.ticks).toBe(44);
      expect(r.hunters).toEqual([{ id: 'zora', health: 56, maxHealth: 100, downed: false }]);
      expect(r.log.map((e) => e.text)).toEqual(baseTexts);
    }
  });

  it('reproduces all 5 locked seeded golden fights with identical hashes across rulesVersion 1..8', () => {
    for (const c of SEEDED_GOLDENS) {
      const party = c.party.map((id, i) =>
        snap(id, {
          level: i === 0 ? 3 : 2,
          weapon: id === 'zora' ? 'iron-blade' : null,
          armorGear: id === 'halvar' ? 'hide-armor' : null,
        }),
      );
      for (const rv of VERSIONS_1_TO_8) {
        const r = runFight({
          party,
          monster: { monster: c.monster, tier: c.tier },
          location: c.location,
          rolls: stream('golden', 'fight', c.key),
          rulesVersion: rv,
        });
        expect(hashLines(r.log.map((e) => e.text)), `${c.key} rv=${rv}`).toBe(c.hash);
      }
    }
  });

  it('replays all 5 frozen v6 stand goldens line-for-line under RULES_VERSION = 8', () => {
    const files = readdirSync(STANDS_V6_DIR).filter((f) => f.endsWith('.json'));
    expect(files).toHaveLength(5);
    for (const file of files) {
      const golden = JSON.parse(readFileSync(new URL(file, STANDS_V6_DIR), 'utf8')) as {
        record: StandRecord;
        wavesHeld: number;
        lines: string[];
      };
      expect(golden.record.rulesVersion).toBe(6);
      const replayed = replayStand(golden.record);
      expect(replayed.wavesHeld).toBe(golden.wavesHeld);
      expect(standLines(replayed)).toEqual(golden.lines);
    }
  });

  it('covers all recorded rulesVersions 1..7 across save fixtures and replays them deterministically', () => {
    const fixtureFiles = readdirSync(FIXTURES_DIR).filter((f) => f.endsWith('.json'));
    const seenFightVersions = new Set<number>();
    const seenEventVersions = new Set<number>();
    const seenStandVersions = new Set<number>();

    for (const file of fixtureFiles) {
      const s = loadState(file);
      for (const ref of s.log.recentFights) {
        seenFightVersions.add(ref.rulesVersion);
        const first = replayFight(ref);
        const second = replayFight(ref);
        expect(fightReplayDiffers(ref, first), `${file} ${ref.contractId}`).toBe(false);
        expect(first.log.map((e) => e.text)).toEqual(second.log.map((e) => e.text));
      }
      for (const ref of s.events.recent) {
        seenEventVersions.add(ref.rulesVersion);
        const rawFirst = runFight(eventFightInput(ref));
        const first = eventPlayback(ref);
        const second = eventPlayback(ref);
        expect(fightReplayDiffers(ref, rawFirst), `${file} ${ref.contractId}`).toBe(false);
        expect(first.result).toBe(ref.result);
        expect(first.log.map((e) => e.text)).toEqual(second.log.map((e) => e.text));
      }
      for (const c of s.cycles) {
        if (!c.stand) continue;
        seenStandVersions.add(c.stand.rulesVersion);
        if (c.stand.rulesVersion < 4) continue;
        const first = replayStand(c.stand);
        const second = replayStand(c.stand);
        expect(standReplayDiffers(c.stand, first), `${file} cycle ${c.number}`).toBe(false);
        expect(standLines(first)).toEqual(standLines(second));
      }
    }

    for (const rv of [1, 2, 3, 4, 5, 6, 7]) expect(seenFightVersions.has(rv)).toBe(true);
    for (const rv of [5, 6, 7]) expect(seenEventVersions.has(rv)).toBe(true);
    for (const rv of [2, 3, 4, 5, 6]) expect(seenStandVersions.has(rv)).toBe(true);

    const delveV7 = loadState('v7-owner.json');
    expect(floorReplayDiffers(delveV7)).toBe(false);
    expect(replayLastFloor(delveV7)?.result).toBe(delveV7.delve.run?.lastFloor?.result);

    const descentV14 = loadState('v14-played.json');
    if (!descentV14.descent.last) throw new Error('Expected descent.last');
    expect(
      rebuildMatches(descentV14.descent.last, rebuildDescentLogs(descentV14.descent.last)),
    ).toBe(true);
  });

  it('isolates rulesVersion <= 7 recorded v16-owner fights from rulesVersion 8 math changes', () => {
    expect(RULES_VERSION).toBe(8);
    const v16 = loadState('v16-owner.json');
    const affected = v16.events.recent.filter(
      (r) => r.contractId === 'event:33' || r.contractId === 'event:41',
    );
    expect(affected).toHaveLength(2);

    for (const ref of affected) {
      const legacyInput: FightInput = fightInputOf(ref);
      const legacy = runFight(legacyInput);
      const asV8 = runFight({ ...legacyInput, rulesVersion: 8 });
      expect(legacy.result).toBe(ref.result);
      expect(legacy.log.map((e) => e.text)).not.toEqual(asV8.log.map((e) => e.text));
    }
  });

  it('stamps target on rulesVersion 8 stand bomb/burn/Saltburst logs while omitting target on rulesVersion 7', () => {
    const party = (['halvar', 'zora', 'ostap', 'bjarna', 'vesna', 'radek'] as const).map((id) =>
      snap(id, { level: 8, weapon: 'iron-blade' }),
    );
    const base = {
      seed: 'dual:stand:v8',
      threat: 7,
      party,
      prep: { oils: {}, potions: {}, bombs: [] },
      bombs: { 'fire-pot': 10, saltburst: 10 },
      defenses: { walls: 0, watchtower: 0 },
      relics: [] as const,
      knowledge: {},
      log: true,
    };
    const v7 = runStand({ ...base, rulesVersion: 7 });
    const v8 = runStand({ ...base, rulesVersion: 8 });

    // Wave 1 (Rusalka) throws Saltburst; Wave 2 (Gaunt Wolf, weak to Fire) throws Fire Pot.
    const v7Salt = v7.waves[0]?.fight.log.find((e) => e.text.includes('Saltburst goes off'));
    const v8Salt = v8.waves[0]?.fight.log.find((e) => e.text.includes('Saltburst goes off'));
    expect(v7Salt?.target).toBeUndefined();
    expect(v7Salt?.amount).toBeUndefined();
    expect(v8Salt).toMatchObject({ target: 'rusalka', amount: 25 });

    const v7Fire = v7.waves[1]?.fight.log.find(
      (e) => e.kind === 'bomb' && e.text.includes('Fire Pot'),
    );
    const v7Burn = v7.waves[1]?.fight.log.find((e) => e.kind === 'burn');
    const v8Fire = v8.waves[1]?.fight.log.find(
      (e) => e.kind === 'bomb' && e.text.includes('Fire Pot'),
    );
    const v8Burn = v8.waves[1]?.fight.log.find((e) => e.kind === 'burn');
    expect(v7Fire?.target).toBeUndefined();
    expect(v7Burn?.target).toBeUndefined();
    expect(v8Fire).toMatchObject({ target: 'wolf', amount: 50 });
    expect(v8Burn).toMatchObject({ target: 'wolf', amount: 13 });

    // Replaying a frozen rulesVersion 7 Bastion Breach stand record under RULES_VERSION = 8 preserves v7 line-for-line.
    const v7Lanes = {
      pieces: [2, 2, 1, 1, 1, 1, 2, 1],
      towerCols: [0, 6],
      rampartCols: [true, true, false, false, false, false, true, false],
      screened: [true, false],
      sectorCols: [1, 2, 1, 0, 0, 1, 1, 1],
      k: {
        coverOwn: 0.5,
        coverNeighbour: 0.25,
        depthStep: 0.25,
        depthMax: 2,
        towerReach: [1, 0.5, 0.25],
        volleyScale: 3,
        rampartBonus: 0.15,
        screenedBonus: 0.25,
        sectorBonus: 0.05,
      },
    };
    const v7Breach = runStand({
      ...base,
      lanes: v7Lanes,
      defenses: { walls: 10, watchtower: 10 },
      rulesVersion: 7,
    });
    const v7Record: StandRecord = {
      at: 0,
      seed: base.seed,
      rank: 'bastion',
      threat: base.threat,
      party: [...base.party],
      prep: base.prep,
      bombs: base.bombs,
      defenses: { walls: 10, watchtower: 10 },
      relics: [...base.relics],
      knowledge: base.knowledge,
      lanes: v7Lanes,
      rulesVersion: 7,
      wavesHeld: v7Breach.wavesHeld,
      embers: { waves: 0, trophies: 0, total: 0 },
      relicsFound: [],
      arrival: false,
      trustSteps: [],
      band: 'held',
      alchemy: 0,
      seen: true,
    };
    expect(standLines(replayStand(v7Record))).toEqual(standLines(v7Breach));
  });
});
