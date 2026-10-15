// Plan T5.7: names and Ribbonshades (GDD §5.14.4), and the true-ending gate test
// (lore-secrets §8): all 40 names have exactly one source, and none is Delve-only,
// event-only or missable.
import { describe, expect, it } from 'vitest';
import { hunters } from '../../src/content/hunters';
import { monsters } from '../../src/content/monsters';
import { allDocuments, LAST_WRITTEN_ACT } from '../../src/content/story/acts';
import { letters } from '../../src/content/story/letters';
import { roll, ROLL_SIZE } from '../../src/content/story/roll';
import { RUIN_VILLAGES, villages } from '../../src/content/villages';
import { balance } from '../../src/content/balance';
import { advance } from '../../src/core/sim';
import { createNewGame } from '../../src/core/state/new-game';
import { HOUR, keepRich, run } from '../contracts/helpers';
import { defeatRibbonshade, ribbonName } from '../../src/core/story/names';

const T0 = Date.UTC(2026, 9, 14, 8);

describe('Ribbonshades (GDD §5.14.4)', () => {
  it('carry the six names in a fixed order, Jaro’s first, then a ribbon with no name', () => {
    const s = createNewGame('ribbons', T0);
    const keys = Array.from({ length: 8 }, () => defeatRibbonshade(s));
    expect(keys[0]).toEqual(['ribbon:1', 'name:39']);
    expect(keys.slice(1, 6).map((k) => k[1])).toEqual([
      'name:15',
      'name:16',
      'name:17',
      'name:19',
      'name:20',
    ]);
    expect(keys[6]).toEqual(['ribbon:7']);
    expect(keys[7]).toEqual(['ribbon:8']);
    expect(s.story.ribbonshades).toBe(8);
    expect(s.story.names.map((x) => x.n)).toEqual([39, 15, 16, 17, 19, 20]);
    expect(s.story.unread).toContain('name:39');
    expect(ribbonName(7)).toBeNull();
  });

  it('a name already found is kept, never found twice', () => {
    const s = createNewGame('ribbons', T0);
    s.story.names.push({ n: 39, cycle: 1, at: T0 });
    expect(defeatRibbonshade(s)).toEqual(['ribbon:1']);
    expect(s.story.names.filter((x) => x.n === 39)).toHaveLength(1);
  });
});

describe('the true-ending gate (lore-secrets §8)', () => {
  const sources = roll.map((r) => r.source);

  it('every one of the 40 names has exactly one source', () => {
    expect(roll.map((r) => r.n)).toEqual(Array.from({ length: ROLL_SIZE }, (_, i) => i + 1));
    // Each name is carried once: by its source, and by nothing else.
    for (const r of roll) {
      const carriers = [
        ...allDocuments.filter((d) => d.names.includes(r.n)).map((d) => `doc:${d.id}`),
        ...letters.filter((l) => l.name === r.n).map((l) => `letter:${l.hunter}:${l.slot}`),
        ...(r.source.kind === 'ribbonshade' ? [`ribbon:${r.source.order}`] : []),
        ...(r.source.kind === 'laterAct' ? [`act:${r.source.act}`] : []),
      ];
      expect(carriers, `#${r.n}`).toHaveLength(1);
    }
  });

  it('no name is Delve-only or event-only: every source is a contract, a Rank, the roster or a letter', () => {
    const allowed = ['document', 'ribbonshade', 'letter', 'confession', 'laterAct'];
    for (const s of sources) expect(allowed).toContain(s.kind);
    // Documents that carry names arrive on conditions that recur in every cycle.
    for (const d of allDocuments.filter((x) => x.names.length > 0))
      expect(
        ['contractWon', 'familyWon', 'rankReached', 'knowledge', 'hunterAtRank'],
        d.id,
      ).toContain(d.condition.kind);
  });

  it('none is missable: letters are story hunters’, who never die, at levels a hunter can reach', () => {
    const levels = balance.letters.levels.value;
    for (const s of sources) {
      if (s.kind !== 'letter') continue;
      expect(hunters[s.hunter].story, s.hunter).toBe(true);
      expect(levels[s.slot]).toBeLessThanOrEqual(balance.hunter.levelCap.value.keep);
    }
    // D2-08 waits for Sigrun, a story hunter; trust gates carry no names (D147).
    const sigrun = allDocuments.find((d) => d.id === 'D2-08');
    expect(sigrun?.condition).toMatchObject({ hunter: 'sigrun' });
    expect(hunters.sigrun.story).toBe(true);
    for (const d of allDocuments)
      if (d.condition.kind === 'contractWon' && d.condition.minTrust) expect(d.names).toEqual([]);
  });

  it('Ribbonshades can always be met again: ruins recur from the Keep, with Ribbonshades at tiers 2–4', () => {
    expect(RUIN_VILLAGES.every((v) => villages[v].locations.includes('ruin'))).toBe(true);
    expect(monsters.ribbonshade.locations).toContain('ruin');
    expect(monsters.ribbonshade.tiers).toEqual([2, 4]);
    const order = Object.fromEntries(
      roll.flatMap((r) => (r.source.kind === 'ribbonshade' ? [[r.n, r.source.order]] : [])),
    );
    expect(order).toEqual({ 39: 1, 15: 2, 16: 3, 17: 4, 19: 5, 20: 6 });
  });

  it('names from acts not yet written wait for them, and are counted (28 from act documents)', () => {
    const later = sources.filter((s) => s.kind === 'laterAct');
    for (const s of later)
      if (s.kind === 'laterAct') expect(s.act).toBeGreaterThan(LAST_WRITTEN_ACT);
    const docNames = allDocuments.flatMap((d) => d.names);
    const confession = roll.filter((r) => r.source.kind === 'confession').map((r) => r.n);
    expect(docNames.filter((n) => !confession.includes(n)).length + later.length).toBe(28);
  });
});

describe('Ribbonshades in play', () => {
  it("a won ruin contract against one brings Jaro's ribbon with its result", () => {
    const s = keepRich('ribbon-play');
    s.board.open = [
      {
        id: 'r1',
        village: 'velkvik',
        monster: 'ribbonshade',
        tier: 2,
        location: 'ruin',
        arrivedAt: s.time,
        revealed: 3,
      },
    ];
    const party = ['bjarna', 'halvar', 'ostap'] as const;
    expect(run(s, { type: 'contract.launch', contract: 'r1', party: [...party] }).ok).toBe(true);
    advance(s, s.time + 24 * HOUR);
    const r = s.results.find((x) => x.contractId === 'r1');
    expect(r?.success).toBe(true);
    expect(r?.found).toEqual(expect.arrayContaining(['ribbon:1', 'name:39']));
  });
});
