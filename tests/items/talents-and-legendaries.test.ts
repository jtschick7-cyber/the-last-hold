// Plan T8.9 (GDD §5.11.5, §5.11.6, §8.11, §8.12, D313, D306, D328): the talent pick and free respec,
// the keepsake slot, finding the Legendaries at their milestones, and that none of it reaches a
// fight until it is used.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LEGENDARY_IDS, legendaries } from '../../src/content/legendaries';
import { FAMILY_IDS } from '../../src/content/damage';
import { MONSTER_IDS, monsters } from '../../src/content/monsters';
import type { GameState } from '../../src/core/state/game-state';
import { snapshotOf } from '../../src/core/systems/hunters';
import { grantLegendaries, wornBy } from '../../src/core/systems/legendaries';
import { talentSheet } from '../../src/core/systems/talents';
import { unspentTalentPoints } from '../../src/core/systems/ranks';
import { encodeSaveFile, loadEnvelope, makeEnvelope } from '../../src/core/save';
import { foundLines } from '../../src/core/story/found-lines';
import { freshCycleRecord } from '../../src/core/state/new-game';
import { freshAct } from '../../src/core/state/story-state';
import { advance } from '../../src/core/sim';
import { HOUR, keepRich, run } from '../contracts/helpers';

const reason = (r: ReturnType<typeof run>): string => (r.ok ? '' : r.reason);
const ZORA = 'zora' as const; // a Striker
const zora = (s: GameState) => {
  const h = s.hunters[ZORA];
  if (!h) throw new Error('no zora');
  return h;
};
const master = (s: GameState, stars = 0): void => {
  zora(s).rank = 'masterWright'; // 5 points
  zora(s).stars = stars;
};
const pick = (s: GameState, talent: string, hunter: string = ZORA) =>
  run(s, { type: 'talent.pick', hunter, talent });

describe('picking talents (D313)', () => {
  it('an Apprentice has 1 point; a pick spends it; a second is refused', () => {
    const s = keepRich('t-pick');
    expect(unspentTalentPoints(zora(s))).toBe(1);
    expect(pick(s, 'striker-edge-1').ok).toBe(true);
    expect(zora(s).talents).toEqual(['striker-edge-1']);
    expect(unspentTalentPoints(zora(s))).toBe(0);
    expect(reason(pick(s, 'striker-pace-1'))).toMatch(/No talent points left/);
  });

  it('a tier opens only with enough stars: tier 2 at 2, tier 3 at 4', () => {
    const s = keepRich('t-tier');
    master(s, 0);
    expect(pick(s, 'striker-edge-1').ok).toBe(true);
    expect(reason(pick(s, 'striker-edge-2'))).toBe('Zora: needs 2 stars (has 0)');
    zora(s).stars = 2;
    expect(pick(s, 'striker-edge-2').ok).toBe(true);
    expect(reason(pick(s, 'striker-edge-3'))).toBe('Zora: needs 4 stars (has 2)');
    zora(s).stars = 4;
    expect(pick(s, 'striker-edge-3').ok).toBe(true);
  });

  it('refuses another role’s talent, a repeat, an unknown talent and an unknown hunter', () => {
    const s = keepRich('t-refuse');
    master(s, 4);
    expect(reason(pick(s, 'vanguard-wall-1'))).toMatch(/cannot learn a vanguard/);
    expect(pick(s, 'striker-hunt-1').ok).toBe(true);
    expect(reason(pick(s, 'striker-hunt-1'))).toMatch(/Already picked/);
    expect(reason(pick(s, 'striker-nope-1'))).toMatch(/does not exist/);
    expect(reason(pick(s, 'striker-hunt-2', 'nobody'))).toMatch(/not on your roster/);
  });

  it('the talent sheet shows each cell’s reason and the Herbs note for a Mender', () => {
    const s = keepRich('t-sheet');
    const sheet = talentSheet(s, ZORA);
    expect(sheet?.branches.map((b) => b.name)).toEqual(['Edge', 'Hunt', 'Pace']);
    expect(sheet?.branches[0]?.cells.map((c) => c.problem)).toEqual([
      null,
      'needs 2 stars (has 0)',
      'needs 4 stars (has 0)',
    ]);
    expect(sheet?.delveNote).toBe('');
    expect(talentSheet(s, 'ostap')?.delveNote).toMatch(/Herbs does nothing in a Delve/);
  });

  it('respec is free, gives every point back, and is refused with nothing to take back', () => {
    const s = keepRich('t-respec');
    master(s, 2);
    expect(reason(run(s, { type: 'talent.respec', hunter: ZORA }))).toMatch(/No talents/);
    for (const t of ['striker-edge-1', 'striker-hunt-1', 'striker-hunt-2']) pick(s, t);
    expect(unspentTalentPoints(zora(s))).toBe(2);
    const silver = s.resources.silver;
    expect(run(s, { type: 'talent.respec', hunter: ZORA }).ok).toBe(true);
    expect(zora(s).talents).toEqual([]);
    expect(unspentTalentPoints(zora(s))).toBe(5);
    expect(s.resources.silver).toBe(silver);
  });

  it('is refused for a hunter on a contract or in a Delve, like the trait switch', () => {
    const s = keepRich('t-busy');
    pick(s, 'striker-edge-1');
    s.running.push({ party: [ZORA] } as unknown as GameState['running'][number]);
    for (const cmd of [
      { type: 'talent.pick', hunter: ZORA, talent: 'striker-pace-1' },
      { type: 'talent.respec', hunter: ZORA },
    ] as const) {
      const r = run(s, cmd);
      expect(r.ok, cmd.type).toBe(false);
      expect(reason(r)).toMatch(/contract/);
    }
    s.running.length = 0;
    s.delve.run = { party: [ZORA] } as unknown as GameState['delve']['run'];
    expect(reason(run(s, { type: 'talent.respec', hunter: ZORA }))).toMatch(/Delve/);
  });
});

describe('talents reach the snapshot only when picked', () => {
  it('an unchanged hunter’s snapshot has no talents or keepsake key', () => {
    const s = keepRich('t-snap');
    const snap = snapshotOf(s, ZORA);
    expect('talents' in snap).toBe(false);
    expect('keepsake' in snap).toBe(false);
    pick(s, 'striker-edge-1');
    expect(snapshotOf(s, ZORA).talents).toEqual(['striker-edge-1']);
  });

  it('talents and a keepsake survive save and load', () => {
    const s = keepRich('t-save');
    master(s, 2);
    pick(s, 'striker-edge-1');
    pick(s, 'striker-edge-2');
    s.legendaries.push({ id: 'rune-nail', cycle: 1 });
    expect(run(s, { type: 'keepsake.equip', hunter: ZORA, legendary: 'rune-nail' }).ok).toBe(true);
    const back = loadEnvelope(JSON.parse(encodeSaveFile(makeEnvelope(s, 0))));
    if (!back.ok) throw new Error(back.error);
    expect(back.value.warnings).toEqual([]);
    expect(back.value.state.hunters[ZORA]?.talents).toEqual(['striker-edge-1', 'striker-edge-2']);
    expect(back.value.state.hunters[ZORA]?.keepsake).toBe('rune-nail');
  });
});

describe('the keepsake slot (D306, D328 (6))', () => {
  const withLegendary = (seed: string): GameState => {
    const s = keepRich(seed);
    s.legendaries.push({ id: 'wolf-tooth-string', cycle: 1 }, { id: 'coffin-silver', cycle: 1 });
    return s;
  };

  it('equips a found Legendary, swaps the one worn, and takes it off', () => {
    const s = withLegendary('k-equip');
    expect(
      run(s, { type: 'keepsake.equip', hunter: ZORA, legendary: 'wolf-tooth-string' }).ok,
    ).toBe(true);
    expect(snapshotOf(s, ZORA).keepsake).toBe('wolf-tooth-string');
    expect(wornBy(s, 'wolf-tooth-string')).toBe(ZORA);
    // A swap: the string goes back to waiting, the silver is worn.
    expect(run(s, { type: 'keepsake.equip', hunter: ZORA, legendary: 'coffin-silver' }).ok).toBe(
      true,
    );
    expect(wornBy(s, 'wolf-tooth-string')).toBeNull();
    expect(zora(s).keepsake).toBe('coffin-silver');
    expect(run(s, { type: 'keepsake.unequip', hunter: ZORA }).ok).toBe(true);
    expect(zora(s).keepsake).toBeNull();
    expect(reason(run(s, { type: 'keepsake.unequip', hunter: ZORA }))).toMatch(/Nothing is kept/);
  });

  it('refuses one not found, one already worn by another, an unknown one, and a busy hunter', () => {
    const s = withLegendary('k-refuse');
    expect(
      reason(run(s, { type: 'keepsake.equip', hunter: ZORA, legendary: 'rune-nail' })),
    ).toMatch(/has not been found/);
    expect(reason(run(s, { type: 'keepsake.equip', hunter: ZORA, legendary: 'nope' }))).toMatch(
      /does not exist/,
    );
    expect(
      run(s, { type: 'keepsake.equip', hunter: 'halvar', legendary: 'coffin-silver' }).ok,
    ).toBe(true);
    expect(
      reason(run(s, { type: 'keepsake.equip', hunter: ZORA, legendary: 'coffin-silver' })),
    ).toMatch(/worn by Halvar/);
    s.running.push({ party: [ZORA] } as unknown as GameState['running'][number]);
    expect(
      reason(run(s, { type: 'keepsake.equip', hunter: ZORA, legendary: 'wolf-tooth-string' })),
    ).toMatch(/contract/);
  });
});

describe('finding the Legendaries (D306, D314, D328 (5))', () => {
  const master4 = (s: GameState, family: string): void => {
    for (const m of MONSTER_IDS)
      if (monsters[m].family === family) s.bestiary[m] = { level: 4, kills: 10 };
  };

  it('there is one per Castle family milestone; five families are mapped, the sixth is the Act V stand', () => {
    expect(LEGENDARY_IDS).toHaveLength(6);
    const fams = LEGENDARY_IDS.map((l) => legendaries[l].milestone).filter(
      (m) => m.kind === 'familyMastered',
    );
    expect(fams).toHaveLength(5);
    expect(new Set(fams.map((m) => (m.kind === 'familyMastered' ? m.family : ''))).size).toBe(5);
    for (const m of fams) expect(FAMILY_IDS).toContain(m.kind === 'familyMastered' ? m.family : '');
  });

  it.each(
    LEGENDARY_IDS.filter((l) => legendaries[l].milestone.kind === 'familyMastered').map(
      (l) => [l] as const,
    ),
  )('%s is found when every species of its family is Mastered, not before', (id) => {
    const m = legendaries[id].milestone;
    if (m.kind !== 'familyMastered') throw new Error();
    const s = keepRich(`find-${id}`);
    expect(grantLegendaries(s)).toEqual([]);
    // All but one species Mastered: not yet.
    const species = MONSTER_IDS.filter((x) => monsters[x].family === m.family);
    for (const x of species.slice(1)) s.bestiary[x] = { level: 4, kills: 10 };
    expect(grantLegendaries(s)).toEqual([]);
    master4(s, m.family);
    expect(grantLegendaries(s)).toEqual([id]);
    expect(s.legendaries).toEqual([{ id, cycle: 1 }]);
    // Idempotent: found once.
    expect(grantLegendaries(s)).toEqual([]);
    // Studied is not enough.
    const t = keepRich(`studied-${id}`);
    for (const x of species) t.bestiary[x] = { level: 3, kills: 3 };
    expect(grantLegendaries(t)).toEqual([]);
  });

  it('the result line names a Legendary found by a contract', () => {
    const lines = foundLines(keepRich('line'), ['legendary:barley-knot']);
    expect(lines).toEqual(['Legendary found: The Barley Knot. A hunter can keep it.']);
  });

  it('a won contract that Masters the last species finds it, with a result key and a line', () => {
    const s = keepRich('contract-find');
    master4(s, 'field-and-forest-spirits');
    s.bestiary.kikimora = { level: 3, kills: 9 }; // one win from Mastered (10 kills)
    expect(s.legendaries).toHaveLength(0);
    for (let k = 0; k < 6 && s.legendaries.length === 0; k++) {
      s.board.open.push({
        id: `c${k}`,
        village: 'mirograd',
        monster: 'kikimora',
        tier: 1,
        location: 'field',
        arrivedAt: s.time,
        revealed: 3,
      });
      run(s, { type: 'contract.launch', contract: `c${k}`, party: ['zora', 'halvar', 'ostap'] });
      advance(s, s.time + 24 * HOUR);
    }
    expect(s.legendaries.map((l) => l.id)).toEqual(['barley-knot']);
    const result = s.results.find((r) => (r.found ?? []).includes('legendary:barley-knot'));
    expect(result?.success).toBe(true);
    expect(foundLines(s, result?.found ?? [])).toContain(
      'Legendary found: The Barley Knot. A hunter can keep it.',
    );
  });

  it('Yrsa’s Thole is found with D5-06 at the end of Act V’s Last Stand, and is kept', () => {
    const s = keepRich('thole-find');
    s.cycle = { number: 5, age: 'bastion' };
    for (let c = 2; c <= 5; c++) {
      s.cycles.push(freshCycleRecord(c, s.time, c));
      s.story.acts.push(freshAct(c, c, s.time));
    }
    s.story.ilseAt = s.time;
    expect(s.legendaries).toHaveLength(0);
    expect(run(s, { type: 'stand.make', party: ['halvar'] }).ok).toBe(true);
    expect(s.story.documents.some((d) => d.id === 'D5-06')).toBe(true);
    expect(s.legendaries.map((l) => l.id)).toEqual(['yrsas-thole']);
  });
});

describe('the Long Night keeps them (GDD §5.9.7)', () => {
  it('talents, the keepsake slot and the Legendaries all survive the reset', () => {
    const s = keepRich('long-night');
    s.cycle = { number: 2, age: 'bastion' };
    s.cycles.push(freshCycleRecord(2, s.time, 2));
    s.story.acts.push(freshAct(2, 2, s.time));
    s.story.ilseAt = s.time;
    master(s, 2);
    pick(s, 'striker-edge-1');
    pick(s, 'striker-edge-2');
    s.legendaries.push({ id: 'coffin-silver', cycle: 1 });
    run(s, { type: 'keepsake.equip', hunter: ZORA, legendary: 'coffin-silver' });
    expect(run(s, { type: 'stand.make', party: ['halvar'] }).ok).toBe(true);
    expect(s.cycle.number).toBe(3);
    expect(zora(s).talents).toEqual(['striker-edge-1', 'striker-edge-2']);
    expect(zora(s).keepsake).toBe('coffin-silver');
    expect(zora(s).rank).toBe('masterWright');
    expect(s.legendaries.map((l) => l.id)).toEqual(['coffin-silver']);
  });
});

describe('recorded fights with talents (the save guard)', () => {
  const fixture = (): {
    state: { log: { recentFights: { party: Record<string, unknown>[] }[] } };
  } => JSON.parse(readFileSync(new URL('../saves/fixtures/v8.json', import.meta.url), 'utf8'));

  it('loads a recorded fight whose hunter had talents and a keepsake', () => {
    const f = fixture();
    const first = f.state.log.recentFights[0]?.party[0];
    if (!first) throw new Error('no recorded fight');
    first.talents = ['vanguard-wall-1'];
    first.keepsake = 'rune-nail';
    const r = loadEnvelope(f);
    expect(r.ok).toBe(true);
    if (r.ok)
      expect(r.value.state.log.recentFights[0]?.party[0]?.talents).toEqual(['vanguard-wall-1']);
  });

  it('refuses a recorded fight naming a talent or Legendary that does not exist', () => {
    for (const bad of [{ talents: ['nonsense'] }, { keepsake: 'nonsense' }]) {
      const f = fixture();
      Object.assign(f.state.log.recentFights[0]?.party[0] ?? {}, bad);
      expect(loadEnvelope(f).ok).toBe(false);
    }
  });
});
