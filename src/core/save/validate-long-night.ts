import { AGE_IDS, type AgeId } from '../../content/ages';
import { CONSUMABLE_IDS } from '../../content/consumables';
import { MONSTER_IDS } from '../../content/monsters';
import { RELIC_IDS, type RelicId } from '../../content/relics';
import { UPGRADE_IDS } from '../../content/warden-upgrades';
import type { CycleRecord, GameState, StandRecord } from '../state/game-state';
import {
  arr,
  bool,
  count,
  finite,
  idRecord,
  Invalid,
  knowledgeLevel,
  nonNegative,
  obj,
  oneOf,
  orNull,
  preparation,
  snapshot,
  sparseCounts,
  str,
  type Obj,
} from './guards';
import { wardenName } from './validate-story';

// Technical design §5.2 (v4, D113): the Long Night's part of the save guard.

type LongNight = Pick<
  GameState,
  'threat' | 'embers' | 'upgrades' | 'relics' | 'arrivalDue' | 'cycles'
>;

const relicId = (v: unknown, where: string): RelicId => oneOf<RelicId>(v, RELIC_IDS, where);

const relicList = (v: unknown, where: string): RelicId[] =>
  arr(v, where).map((x, i) => relicId(x, `${where}[${i}]`));

const ranksAt = (v: unknown, where: string): Partial<Record<AgeId, number>> => {
  const out: Partial<Record<AgeId, number>> = {};
  for (const [k, x] of Object.entries(obj(v, where)))
    out[oneOf<AgeId>(k, AGE_IDS, `${where}.${k}`)] = finite(x, `${where}.${k}`);
  return out;
};

const stand = (v: unknown, where: string, warnings: string[]): StandRecord => {
  const o = obj(v, where);
  const defenses = obj(o.defenses, `${where}.defenses`);
  const embers = obj(o.embers, `${where}.embers`);
  const knowledge = sparseCounts(o.knowledge, MONSTER_IDS, `${where}.knowledge`, warnings);
  for (const [k, n] of Object.entries(knowledge)) knowledgeLevel(n, `${where}.knowledge.${k}`);
  return {
    at: finite(o.at, `${where}.at`),
    seed: str(o.seed, `${where}.seed`),
    rank: oneOf<AgeId>(o.rank, AGE_IDS, `${where}.rank`),
    threat: nonNegative(o.threat, `${where}.threat`),
    party: arr(o.party, `${where}.party`).map((x, i) => snapshot(x, `${where}.party[${i}]`)),
    prep: preparation(o.prep, `${where}.prep`),
    bombs: sparseCounts(o.bombs, CONSUMABLE_IDS, `${where}.bombs`, warnings),
    defenses: {
      walls: count(defenses.walls, `${where}.defenses.walls`),
      watchtower: count(defenses.watchtower, `${where}.defenses.watchtower`),
    },
    relics: relicList(o.relics, `${where}.relics`),
    knowledge,
    rulesVersion: count(o.rulesVersion, `${where}.rulesVersion`),
    wavesHeld: count(o.wavesHeld, `${where}.wavesHeld`),
    embers: {
      waves: nonNegative(embers.waves, `${where}.embers.waves`),
      trophies: nonNegative(embers.trophies, `${where}.embers.trophies`),
      total: count(embers.total, `${where}.embers.total`),
    },
    relicsFound: relicList(o.relicsFound, `${where}.relicsFound`),
    arrival: bool(o.arrival, `${where}.arrival`),
    seen: bool(o.seen, `${where}.seen`),
  };
};

const cycleRecord = (v: unknown, where: string, warnings: string[]): CycleRecord => {
  const o = obj(v, where);
  const threat = obj(o.contractThreat, `${where}.contractThreat`);
  return {
    number: count(o.number, `${where}.number`),
    startedAt: finite(o.startedAt, `${where}.startedAt`),
    ranks: ranksAt(o.ranks, `${where}.ranks`),
    contractThreat: {
      added: nonNegative(threat.added, `${where}.contractThreat.added`),
      removed: nonNegative(threat.removed, `${where}.contractThreat.removed`),
    },
    stand: orNull(o.stand, (x) => stand(x, `${where}.stand`, warnings)),
    act: orNull(o.act, (x) => count(x, `${where}.act`)),
    warden: wardenName(o.warden, `${where}.warden`),
  };
};

/** The v4 parts of a save; `cycleNumber` is the save's current cycle. */
export const longNightFrom = (s: Obj, cycleNumber: number, warnings: string[]): LongNight => {
  const relics = arr(s.relics, 'relics').map((x, i) => {
    const r = obj(x, `relics[${i}]`);
    return { id: relicId(r.id, `relics[${i}].id`), cycle: count(r.cycle, `relics[${i}].cycle`) };
  });
  if (new Set(relics.map((r) => r.id)).size !== relics.length)
    throw new Invalid('relics lists a relic twice.');
  const cycles = arr(s.cycles, 'cycles').map((c, i) => cycleRecord(c, `cycles[${i}]`, warnings));
  const last = cycles[cycles.length - 1];
  if (!last || last.number !== cycleNumber)
    throw new Invalid(`cycles must end with the current cycle (${cycleNumber}).`);
  return {
    threat: nonNegative(s.threat, 'threat'),
    embers: count(s.embers, 'embers'),
    upgrades: idRecord(s.upgrades, UPGRADE_IDS, 'upgrades', count, warnings),
    relics,
    arrivalDue: bool(s.arrivalDue, 'arrivalDue'),
    cycles,
  };
};
