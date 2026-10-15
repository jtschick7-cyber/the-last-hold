import { FAMILY_IDS, type FamilyId } from '../../content/damage';
import { RARITIES, type BlessingRuleId } from '../../content/delves/blessing-types';
import { blessingById } from '../../content/delves/blessings';
import { GUARDIAN_IDS, type GuardianId } from '../../content/delves/guardians';
import { PATRON_IDS, type PatronId } from '../../content/delves/patrons';
import { DELVE_RELIC_IDS } from '../../content/delves/relics';
import { COSMETIC_IDS, LATE_HOURS_LEVELS } from '../../content/delves/shop';
import { echoes as echoDefs } from '../../content/delves/echoes';
import type { HunterId } from '../../content/hunters';
import { INGREDIENT_IDS } from '../../content/ingredients';
import { balance } from '../../content/balance';
import type {
  DelveEarned,
  DelveResult,
  DelveRun,
  DelveShop,
  DelveStage,
  DelveState,
} from '../state/delve-state';
import type { SpeciesKnowledge } from '../state/game-state';
import {
  arr,
  bool,
  count,
  finite,
  hunterId,
  Invalid,
  nonNegative,
  obj,
  oneOf,
  orNull,
  sparseCounts,
  str,
} from './guards';

// Technical design §5.2 (v7, plan T7.5): the Delves' part of the save guard. Unknown content
// ids are dropped with a warning, never a crash (§9.4); a run that can't be trusted is
// dropped whole, because a half-read run could not be resumed.

const RULE_IDS: readonly BlessingRuleId[] = [
  'smiths-mark',
  'forge-welded',
  'one-thread',
  'mended-cloth',
  'pack-grows',
  'wolfs-share',
  'price-paid',
  'long-vigil',
  'toll',
  'struck-bronze',
];
const ECHO_IDS = new Set(echoDefs.map((e) => e.id));

const patron = (v: unknown, where: string): PatronId => oneOf(v, PATRON_IDS, where);

const hunterList = (v: unknown, where: string): HunterId[] => {
  const out = arr(v, where).map((x, i) => hunterId(x, `${where}[${i}]`));
  if (new Set(out).size !== out.length) throw new Invalid(`${where} lists one twice.`);
  return out;
};

const knowledge = (v: unknown, where: string): SpeciesKnowledge => {
  const o = obj(v, where);
  return {
    level: Number(oneOf(String(o.level), ['1', '2', '3', '4'], `${where}.level`)) as 1 | 2 | 3 | 4,
    kills: count(o.kills, `${where}.kills`),
  };
};

const earned = (v: unknown, where: string, warnings: string[]): DelveEarned => {
  const o = obj(v, where);
  const reagents: DelveEarned['reagents'] = {};
  for (const [k, x] of Object.entries(obj(o.reagents, `${where}.reagents`))) {
    if (!(INGREDIENT_IDS as readonly string[]).includes(k)) {
      warnings.push(`Dropped unknown ${where}.reagents entry "${k}".`);
      continue;
    }
    reagents[k as (typeof INGREDIENT_IDS)[number]] = count(x, `${where}.reagents.${k}`);
  }
  return {
    floors: count(o.floors, `${where}.floors`),
    riftglass: count(o.riftglass, `${where}.riftglass`),
    reagents,
    echoes: arr(o.echoes, `${where}.echoes`)
      .map((x, i) => str(x, `${where}.echoes[${i}]`))
      .filter((id) => ECHO_IDS.has(id)),
    relics: arr(o.relics, `${where}.relics`).map((x, i) =>
      oneOf(x, DELVE_RELIC_IDS, `${where}.relics[${i}]`),
    ),
    kills: count(o.kills, `${where}.kills`),
    guardianBeaten: bool(o.guardianBeaten, `${where}.guardianBeaten`),
  };
};

const doorsPair = (v: unknown, where: string): [PatronId, PatronId] => {
  const a = arr(v, where);
  if (a.length !== 2) throw new Invalid(`${where} isn't a pair of patrons.`);
  const [x, y] = [patron(a[0], `${where}[0]`), patron(a[1], `${where}[1]`)];
  if (x === y) throw new Invalid(`${where} shows one patron twice.`);
  return [x, y];
};

const stage = (v: unknown, where: string): DelveStage => {
  const o = obj(v, where);
  const kind = oneOf(o.kind, ['doors', 'offer', 'fight'], `${where}.kind`);
  if (kind === 'doors') return { kind, doors: doorsPair(o.doors, `${where}.doors`) };
  if (kind === 'fight') return { kind };
  const p = patron(o.patron, `${where}.patron`);
  const cards = arr(o.cards, `${where}.cards`).map((x, i) => {
    const id = str(x, `${where}.cards[${i}]`);
    if (!blessingById(id)) throw new Invalid(`${where}.cards[${i}] isn't a blessing.`);
    return id;
  });
  return { kind, patron: p, cards };
};

const run = (v: unknown, warnings: string[]): DelveRun => {
  const o = obj(v, 'delve.run');
  const party = hunterList(o.party, 'delve.run.party');
  if (party.length !== balance.delve.partySize.value)
    throw new Invalid('delve.run.party has the wrong number of hunters.');
  const floor = count(o.floor, 'delve.run.floor');
  if (floor < 1 || floor > balance.delve.floors.value + 1)
    throw new Invalid('delve.run.floor is out of range.');
  const healthRaw = obj(o.health, 'delve.run.health');
  const health: DelveRun['health'] = {};
  for (const h of party) health[h] = nonNegative(healthRaw[h], `delve.run.health.${h}`);
  const blessings = arr(o.blessings, 'delve.run.blessings').map((x, i) => {
    const id = str(x, `delve.run.blessings[${i}]`);
    if (!blessingById(id)) throw new Invalid(`delve.run.blessings[${i}] isn't a blessing.`);
    return id;
  });
  if (new Set(blessings).size !== blessings.length)
    throw new Invalid('delve.run.blessings lists one twice (D255).');
  const rulesRaw = obj(o.rules, 'delve.run.rules');
  const rules: DelveRun['rules'] = {};
  for (const [k, x] of Object.entries(rulesRaw)) {
    if (!(RULE_IDS as readonly string[]).includes(k)) {
      warnings.push(`Dropped unknown delve.run.rules entry "${k}".`);
      continue;
    }
    rules[k as BlessingRuleId] = finite(x, `delve.run.rules.${k}`);
  }
  return {
    seed: str(o.seed, 'delve.run.seed'),
    baseTier: count(o.baseTier, 'delve.run.baseTier'),
    floor,
    party,
    health,
    blessings,
    stage: stage(o.stage, 'delve.run.stage'),
    lastDoors: orNull(o.lastDoors, (x) => doorsPair(x, 'delve.run.lastDoors')),
    unlitDoorsUsed: count(o.unlitDoorsUsed, 'delve.run.unlitDoorsUsed'),
    rerollUsed: bool(o.rerollUsed, 'delve.run.rerollUsed'),
    rules,
    earned: earned(o.earned, 'delve.run.earned', warnings),
  };
};

const result = (v: unknown, warnings: string[]): DelveResult => {
  const o = obj(v, 'delve.result');
  return {
    ...earned(o, 'delve.result', warnings),
    outcome: oneOf(o.outcome, ['guardian', 'defeated', 'left'], 'delve.result.outcome'),
    at: finite(o.at, 'delve.result.at'),
    allowanceLeft: nonNegative(o.allowanceLeft, 'delve.result.allowanceLeft'),
    line: count(o.line, 'delve.result.line'),
  };
};

const shop = (v: unknown, warnings: string[]): DelveShop => {
  const o = obj(v, 'delve.shop');
  const lateHours = count(o.lateHours, 'delve.shop.lateHours');
  if (lateHours > LATE_HOURS_LEVELS)
    throw new Invalid('delve.shop.lateHours is past its last level.');
  const uniq = <T>(xs: T[]): T[] => [...new Set(xs)];
  const traitsBought = uniq(hunterList(o.traitsBought, 'delve.shop.traitsBought'));
  const traitsActive = uniq(hunterList(o.traitsActive, 'delve.shop.traitsActive')).filter((h) => {
    const ok = traitsBought.includes(h);
    if (!ok) warnings.push(`delve.shop.traitsActive had "${h}" without the trait bought; dropped.`);
    return ok;
  });
  return {
    lateHours,
    traitsBought,
    traitsActive,
    cosmetics: uniq(
      arr(o.cosmetics, 'delve.shop.cosmetics').map((x, i) =>
        oneOf(x, COSMETIC_IDS, `delve.shop.cosmetics[${i}]`),
      ),
    ),
    chosenStart: bool(o.chosenStart, 'delve.shop.chosenStart'),
    reroll: bool(o.reroll, 'delve.shop.reroll'),
  };
};

/** Technical design §5.2 (v7): the whole Delve state, from plain JSON. */
export const delveFrom = (v: unknown, warnings: string[]): DelveState => {
  const o = obj(v, 'delve');
  const runRaw = o.run;
  let theRun: DelveRun | null = null;
  if (runRaw !== null && runRaw !== undefined) theRun = run(runRaw, warnings);
  const deepRaw = obj(o.deep, 'delve.deep');
  const deep: DelveState['deep'] = {};
  for (const [k, x] of Object.entries(deepRaw)) {
    if (!(GUARDIAN_IDS as readonly string[]).includes(k)) {
      warnings.push(`Dropped unknown delve.deep entry "${k}".`);
      continue;
    }
    deep[k as GuardianId] = knowledge(x, `delve.deep.${k}`);
  }
  const takenRaw = obj(o.taken, 'delve.taken');
  const taken: DelveState['taken'] = {};
  for (const [k, x] of Object.entries(takenRaw)) {
    if (!(PATRON_IDS as readonly string[]).includes(k)) {
      warnings.push(`Dropped unknown delve.taken entry "${k}".`);
      continue;
    }
    taken[k as PatronId] = [
      ...new Set(
        arr(x, `delve.taken.${k}`).map((r, i) => oneOf(r, RARITIES, `delve.taken.${k}[${i}]`)),
      ),
    ];
  }
  const seenEcho = new Set<string>();
  return {
    run: theRun,
    result: o.result === null || o.result === undefined ? null : result(o.result, warnings),
    runs: count(o.runs, 'delve.runs'),
    riftglass: count(o.riftglass, 'delve.riftglass'),
    allowance: nonNegative(o.allowance, 'delve.allowance'),
    allowanceAt: orNull(o.allowanceAt, (x) => finite(x, 'delve.allowanceAt')),
    sceneSeen: bool(o.sceneSeen, 'delve.sceneSeen'),
    unlitOpen: bool(o.unlitOpen, 'delve.unlitOpen'),
    shop: shop(o.shop, warnings),
    deep,
    relics: arr(o.relics, 'delve.relics').flatMap((r, i) => {
      const e = obj(r, `delve.relics[${i}]`);
      return [
        {
          id: oneOf(e.id, DELVE_RELIC_IDS, `delve.relics[${i}].id`),
          cycle: count(e.cycle, `delve.relics[${i}].cycle`),
        },
      ];
    }),
    echoes: arr(o.echoes, 'delve.echoes').flatMap((r, i) => {
      const e = obj(r, `delve.echoes[${i}]`);
      const id = str(e.id, `delve.echoes[${i}].id`);
      if (!ECHO_IDS.has(id)) {
        warnings.push(`Dropped unknown Ember-echo "${id}".`);
        return [];
      }
      if (seenEcho.has(id)) return [];
      seenEcho.add(id);
      return [
        {
          id,
          cycle: count(e.cycle, `delve.echoes[${i}].cycle`),
          at: finite(e.at, `delve.echoes[${i}].at`),
        },
      ];
    }),
    taken,
    kills: sparseCounts<FamilyId | 'deep'>(
      o.kills,
      [...FAMILY_IDS, 'deep'],
      'delve.kills',
      warnings,
    ),
    guardiansBeaten: sparseCounts(
      o.guardiansBeaten,
      GUARDIAN_IDS,
      'delve.guardiansBeaten',
      warnings,
    ),
  };
};
