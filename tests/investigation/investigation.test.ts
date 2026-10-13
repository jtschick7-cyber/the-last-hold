// Plan T3.6: unknown-monster contracts. GDD §5.6.2–5.6.3, §8.3.1, §8.4.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CLUE_TAGS, clueTexts } from '../../src/content/clues';
import { hunters } from '../../src/content/hunters';
import { MONSTER_IDS, monsters, type MonsterId } from '../../src/content/monsters';
import type { TraitId } from '../../src/content/traits';
import { num } from '../../src/core/balance-access';
import { advance } from '../../src/core/sim/advance';
import { candidatesFor, generateContract } from '../../src/core/contracts/board';
import {
  clueDraw,
  isIdentified,
  possibleSpecies,
  revealedClues,
} from '../../src/core/investigation/clues';
import { arrivalClues, levelOf, noteArrival } from '../../src/core/investigation/knowledge';
import {
  clueDuration,
  idleTrackers,
  investigationSlots,
  nextClueTime,
} from '../../src/core/investigation/lodge';
import type { ContractInstance, GameState } from '../../src/core/state/game-state';
import { HOUR, T0, give, keepRich, run } from '../contracts/helpers';

const MIN = 60_000;
const must = <T>(v: T | undefined): T => {
  if (v === undefined) throw new Error('expected a value');
  return v;
};
const CLUE_MS = num('clue.time') * 1000;

/**
 * A contract id whose first clue still leaves several species (some draws name the
 * Rusalka at once; this one starts with a tag the Gaunt Wolf shares), so tests can watch
 * investigation take more than one clue.
 */
const ID = (() => {
  for (let i = 0; i < 1000; i++) {
    const id = `a${i}`;
    const c = { id, monster: 'rusalka' as const, tier: 2, location: 'river' as const, revealed: 1 };
    if (possibleSpecies('inv', c).length > 1) return id;
  }
  throw new Error('no ambiguous draw found');
})();

/** A Keep with a Lodge of the given level and one unidentified contract on the board. */
const lodgeKeep = (level = 1, over: Partial<ContractInstance> = {}) => {
  const s = keepRich('inv');
  s.buildings['hunters-lodge'] = level;
  s.board.open = [];
  const c: ContractInstance = {
    id: ID,
    village: 'dubno-ford',
    monster: 'rusalka',
    tier: 2,
    location: 'river',
    arrivedAt: T0,
    revealed: 0,
    ...over,
  };
  s.board.open.push(c);
  return { s, c };
};

const seedOf = (s: GameState): string => s.meta.gameSeed;

describe('clue draws (GDD §8.4, technical design §7.2)', () => {
  it('are fixed by the seed: the same contract always reads the same', () => {
    const { s, c } = lodgeKeep();
    expect(clueDraw(seedOf(s), c)).toEqual(clueDraw(seedOf(s), c));
  });

  it("show exactly the true species' three tags, in some order, each with a text from the library", () => {
    for (const m of MONSTER_IDS) {
      const d = clueDraw('seed', { id: `x-${m}`, monster: m });
      expect([...d.tags].sort()).toEqual([...monsters[m].clueTags].sort());
      d.tags.forEach((t, i) => expect(clueTexts[t]).toContain(d.texts[i]));
    }
  });

  it('vary between contracts: over many ids every tag order and several texts turn up', () => {
    const orders = new Set<string>();
    const texts = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const d = clueDraw('seed', { id: `c${i}`, monster: 'draugr' });
      orders.add(d.tags.join());
      texts.add(d.texts[0]);
    }
    expect(orders.size).toBe(6);
    expect(texts.size).toBeGreaterThan(1);
    for (const t of CLUE_TAGS) expect(clueTexts[t].length).toBeGreaterThanOrEqual(3);
  });

  it('revealedClues gives the first n draws', () => {
    const { s, c } = lodgeKeep(1, { revealed: 2 });
    const d = clueDraw(seedOf(s), c);
    expect(revealedClues(seedOf(s), c)).toEqual([
      { tag: d.tags[0], text: d.texts[0] },
      { tag: d.tags[1], text: d.texts[1] },
    ]);
  });
});

describe('who it could be (GDD §5.6.3)', () => {
  it('starts as the whole pool for its place and tier, and always keeps the true species', () => {
    const { s, c } = lodgeKeep();
    expect(possibleSpecies(seedOf(s), c)).toEqual(candidatesFor('river', 2));
    for (let n = 0; n <= 3; n++)
      expect(possibleSpecies(seedOf(s), { ...c, revealed: n })).toContain('rusalka');
  });

  it('three clues always leave exactly the true species, in every cell the board can generate', () => {
    for (const location of ['forest', 'field', 'river', 'barrow'] as const)
      for (let tier = location === 'barrow' ? 2 : 1; tier <= 5; tier++)
        for (const m of candidatesFor(location, tier)) {
          const c: ContractInstance = {
            id: `${location}${tier}${m}`,
            village: 'dubno-ford',
            monster: m,
            tier,
            location,
            arrivedAt: 0,
            revealed: 3,
          };
          expect(possibleSpecies('seed', c), `${location} T${tier} ${m}`).toEqual([m]);
          expect(isIdentified('seed', c)).toBe(true);
        }
  });

  it('is identified at 3 clues, or earlier when the clues leave one species', () => {
    const { s, c } = lodgeKeep();
    expect(isIdentified(seedOf(s), c)).toBe(false);
    // Find a draw whose first tag already isolates the species (the pool has several).
    let early: ContractInstance | null = null;
    for (let i = 0; i < 500 && !early; i++) {
      const cand = {
        ...c,
        id: `e${i}`,
        location: 'field' as const,
        tier: 3,
        monster: 'upyr' as MonsterId,
        revealed: 1,
      };
      if (possibleSpecies('seed', cand).length === 1) early = cand;
    }
    expect(early).not.toBeNull();
    if (early) expect(isIdentified('seed', early)).toBe(true);
    expect(isIdentified(seedOf(s), { ...c, revealed: 3 })).toBe(true);
  });
});

describe('arrival and knowledge (GDD §5.6.2)', () => {
  it('a contract for a Mastered species arrives with all clues; others arrive with none', () => {
    const s = keepRich('inv');
    expect(arrivalClues(s, 'rusalka')).toBe(0);
    s.bestiary.rusalka = { level: 4, kills: 10 };
    expect(arrivalClues(s, 'rusalka')).toBe(3);
    s.bestiary.rusalka = { level: 3, kills: 3 };
    expect(arrivalClues(s, 'rusalka')).toBe(0);
  });

  it('an unidentified arrival makes every possible species Sighted, never lowering one', () => {
    const { s, c } = lodgeKeep();
    s.bestiary.wolf = { level: 3, kills: 4 };
    noteArrival(s, c);
    for (const m of candidatesFor('river', 2)) expect(levelOf(s, m), m).toBeGreaterThanOrEqual(1);
    expect(levelOf(s, 'wolf')).toBe(3);
    expect(levelOf(s, 'rusalka')).toBe(1);
    expect(levelOf(s, 'leshy')).toBe(0);
  });

  it('an identified arrival makes just its species Identified', () => {
    const { s, c } = lodgeKeep(1, { revealed: 3 });
    noteArrival(s, c);
    expect(levelOf(s, 'rusalka')).toBe(2);
    expect(levelOf(s, 'kikimora')).toBe(0);
  });

  it('a real arrival from the board does this too', () => {
    const s = keepRich('inv');
    const c = generateContract(s, 0, T0);
    noteArrival(s, c);
    expect(levelOf(s, c.monster)).toBeGreaterThanOrEqual(1);
  });
});

describe('the Lodge (GDD §5.6.3)', () => {
  it('gives one investigation slot per level', () => {
    expect(investigationSlots(lodgeKeep(0).s)).toBe(0);
    expect(investigationSlots(lodgeKeep(2).s)).toBe(2);
    expect(investigationSlots(lodgeKeep(3).s)).toBe(3);
  });

  it('refuses without a Lodge, with no free slot, for a missing, identified or already-watched contract', () => {
    const none = lodgeKeep(0);
    expect(run(none.s, { type: 'investigate.assign', contract: ID }).ok).toBe(false);
    const { s } = lodgeKeep(1);
    expect(run(s, { type: 'investigate.assign', contract: 'nope' }).ok).toBe(false);
    expect(run(s, { type: 'investigate.assign', contract: ID }).ok).toBe(true);
    expect(run(s, { type: 'investigate.assign', contract: ID }).ok).toBe(false); // already
    s.board.open.push({ ...must(s.board.open[0]), id: 'c2', revealed: 0 });
    expect(run(s, { type: 'investigate.assign', contract: 'c2' }).ok).toBe(false); // no free slot
    const known = lodgeKeep(2, { revealed: 3 });
    expect(run(known.s, { type: 'investigate.assign', contract: ID }).ok).toBe(false);
  });

  it('a clue takes 30 minutes; the clues keep coming until one species is left, then the slot is freed', () => {
    const { s } = lodgeKeep(1);
    run(s, { type: 'investigate.assign', contract: ID });
    expect(s.queues.investigation).toEqual([{ contractId: ID, nextClueAt: s.time + CLUE_MS }]);
    const t0 = s.time;
    const log = advance(s, t0 + 29 * MIN);
    expect(log.events.filter((e) => e.type === 'clue')).toHaveLength(0);
    expect(s.board.open[0]?.revealed).toBe(0);
    advance(s, t0 + 30 * MIN);
    expect(s.board.open[0]?.revealed).toBe(1);
    expect(isIdentified(seedOf(s), must(s.board.open[0]))).toBe(false);
    expect(s.queues.investigation[0]?.nextClueAt).toBe(t0 + 60 * MIN);
    advance(s, t0 + 3 * HOUR);
    const c = must(s.board.open[0]);
    expect(isIdentified(seedOf(s), c)).toBe(true);
    expect(s.queues.investigation).toEqual([]);
    expect(levelOf(s, 'rusalka')).toBe(2);
    expect(c.revealed).toBeLessThanOrEqual(3);
  });

  it('stops early when the clues leave one species, and the log says it was identified', () => {
    // A field T3 contract: Upyr, Poludnitsa, Bies, Huldra. Find an id whose first clue isolates it.
    let id = '';
    for (let i = 0; i < 500 && !id; i++)
      if (
        possibleSpecies('inv', {
          id: `e${i}`,
          monster: 'upyr',
          tier: 3,
          location: 'field',
          revealed: 1,
        }).length === 1
      )
        id = `e${i}`;
    expect(id).not.toBe('');
    const { s } = lodgeKeep(1, { id, monster: 'upyr', tier: 3, location: 'field' });
    run(s, { type: 'investigate.assign', contract: id });
    const log = advance(s, s.time + 30 * MIN);
    const clue = log.events.find((e) => e.type === 'clue');
    expect(clue).toMatchObject({ type: 'clue', contractId: id, revealed: 1, identified: true });
    expect(s.queues.investigation).toEqual([]);
    expect(levelOf(s, 'upyr')).toBe(2);
  });

  it('a Studied species takes half the time per clue (and Mastered or higher too)', () => {
    const { s, c } = lodgeKeep(1);
    expect(clueDuration(s, c, 0).value).toBe(CLUE_MS);
    s.bestiary.rusalka = { level: 3, kills: 3 };
    expect(clueDuration(s, c, 0).value).toBe(CLUE_MS * num('clue.studiedMult'));
    expect(
      clueDuration(s, c, 0)
        .breakdown.children?.map((x) => x.label)
        .join(),
    ).toContain('Studied');
    run(s, { type: 'investigate.assign', contract: ID });
    expect(s.queues.investigation[0]?.nextClueAt).toBe(s.time + CLUE_MS / 2);
  });

  it('stopping keeps the clues already shown and loses the half-finished one', () => {
    const { s } = lodgeKeep(1);
    run(s, { type: 'investigate.assign', contract: ID });
    advance(s, s.time + 45 * MIN);
    expect(s.board.open[0]?.revealed).toBe(1);
    expect(run(s, { type: 'investigate.stop', contract: ID }).ok).toBe(true);
    expect(s.queues.investigation).toEqual([]);
    advance(s, s.time + 3 * HOUR);
    expect(s.board.open[0]?.revealed).toBe(1);
    expect(run(s, { type: 'investigate.stop', contract: ID }).ok).toBe(false);
  });

  it('launching or declining a contract frees its slot', () => {
    const { s } = lodgeKeep(2);
    s.board.open.push({ ...must(s.board.open[0]), id: 'c2', revealed: 0 });
    run(s, { type: 'investigate.assign', contract: ID });
    run(s, { type: 'investigate.assign', contract: 'c2' });
    expect(run(s, { type: 'contract.decline', contract: 'c2' }).ok).toBe(true);
    expect(s.queues.investigation.map((x) => x.contractId)).toEqual([ID]);
    give(s, 'halvar', 'zora');
    expect(
      run(s, {
        type: 'contract.launch',
        contract: ID,
        party: ['halvar', 'zora'],
        confirmReckless: true,
      }).ok,
    ).toBe(true);
    expect(s.queues.investigation).toEqual([]);
  });

  it('is the same however time is chopped up (one jump, 1 s steps, offline chunks)', () => {
    const make = () => {
      const { s } = lodgeKeep(2);
      s.board.open.push({
        ...must(s.board.open[0]),
        id: 'c2',
        location: 'river',
        monster: 'nix',
        tier: 4,
        revealed: 0,
      });
      run(s, { type: 'investigate.assign', contract: ID });
      run(s, { type: 'investigate.assign', contract: 'c2' });
      return s;
    };
    const a = make();
    const b = make();
    const c = make();
    advance(a, a.time + 4 * HOUR);
    for (let i = 0; i < 4 * 3600; i += 1) advance(b, b.time + 1000);
    for (let i = 0; i < 4 * 60; i += 1) advance(c, c.time + 60_000);
    const pick = (x: GameState) => ({ board: x.board.open, q: x.queues, k: x.bestiary });
    expect(pick(b)).toEqual(pick(a));
    expect(pick(c)).toEqual(pick(a));
  });

  it('nextClueTime is the soonest slot, or null with none', () => {
    const { s } = lodgeKeep(2);
    expect(nextClueTime(s)).toBeNull();
    run(s, { type: 'investigate.assign', contract: ID });
    expect(nextClueTime(s)).toBe(s.time + CLUE_MS);
  });
});

describe('the Tracker trait (GDD §8.5: idle at the hold, one Lodge slot reveals clues faster)', () => {
  const original = hunters.halvar.traits;
  const setTraits = (t: readonly TraitId[]): void => {
    (hunters.halvar as { traits: readonly TraitId[] }).traits = t;
  };
  beforeEach(() => setTraits(['tracker', 'steady']));
  afterEach(() => setTraits(original));

  it('counts a Tracker only while they are on the roster, ready and idle', () => {
    const { s } = lodgeKeep(2);
    expect(idleTrackers(s)).toBe(1);
    s.roster.active = s.roster.active.filter((h) => h !== 'halvar');
    expect(idleTrackers(s)).toBe(0);
    s.roster.active.push('halvar');
    must(s.hunters.halvar).recovery = { kind: 'bruised', until: s.time + HOUR };
    expect(idleTrackers(s)).toBe(0);
  });

  it('speeds up one slot per idle Tracker: the first slot only', () => {
    const { s, c } = lodgeKeep(2);
    const fast = clueDuration(s, c, 0);
    expect(fast.value).toBe(CLUE_MS * 0.75);
    expect(fast.breakdown.children?.map((x) => x.label).join()).toContain('Tracker');
    expect(clueDuration(s, c, 1).value).toBe(CLUE_MS);
  });

  it('stacks with a Studied species', () => {
    const { s, c } = lodgeKeep(1);
    s.bestiary.rusalka = { level: 3, kills: 3 };
    expect(clueDuration(s, c, 0).value).toBe(CLUE_MS * 0.5 * 0.75);
  });
});
