// Plan T5.6: every Act I and Act II document arrives on its condition, row by row
// against lore-secrets §21–§22 (D148), and Act III's (§26, T6.1b; T6.7 finishes them), and stays obtainable in later cycles.
import { describe, expect, it } from 'vitest';
import { allDocuments, UNWRITTEN_ACT_LINE } from '../../src/content/story/acts';
import { kamenfellNoticeEnd } from '../../src/content/story/scenes';
import type { VillageId } from '../../src/content/villages';
import type { LocationId } from '../../src/content/damage';
import { noticeFor } from '../../src/core/contracts/notice';
import { advance } from '../../src/core/sim';
import { HOUR, keepRich, run } from '../contracts/helpers';
import { freshCycleRecord } from '../../src/core/state/new-game';
import { freshAct } from '../../src/core/state/story-state';
import { createNewGame } from '../../src/core/state/new-game';
import type { ContractInstance, GameState } from '../../src/core/state/game-state';
import {
  actClosing,
  isFound,
  recordWin,
  standDocuments,
  sweepDocuments,
  wardenDocuments,
} from '../../src/core/story/documents';

const T0 = Date.UTC(2026, 9, 14, 8);
let n = 0;
const contract = (village: VillageId, location: LocationId = 'field'): ContractInstance => ({
  id: `c${(n += 1)}`,
  village,
  monster: 'wolf',
  tier: 2,
  location,
  arrivedAt: T0,
  revealed: 3,
});
const win = (s: GameState, village: VillageId, location?: LocationId): string[] =>
  recordWin(s, contract(village, location));
const found = (s: GameState): string[] => s.story.documents.map((d) => d.id).sort();

/** Starts the next cycle and its act, as the Long Night does. */
const nextCycle = (s: GameState): void => {
  const act = (s.cycles[s.cycles.length - 1]?.act ?? 0) + 1;
  s.cycle = { number: s.cycle.number + 1, age: 'hamlet' };
  s.cycles.push(freshCycleRecord(s.cycle.number, s.time, act));
  s.story.acts.push(freshAct(act, s.cycle.number, s.time));
};
const reach = (s: GameState, age: 'keep' | 'citadel' | 'bastion'): void => {
  s.cycle.age = age;
  const rec = s.cycles[s.cycles.length - 1];
  if (rec) rec.ranks[age] = s.time;
};

const tested = new Set<string>();
const mark = (...ids: string[]) => ids.forEach((id) => tested.add(id));

describe('Act I (lore-secrets §21)', () => {
  it('D1-01: the first contract won after Act I begins, and Ilse arrives with it (D151)', () => {
    const s = createNewGame('act1', T0);
    expect(s.story.ilseAt).toBeNull();
    expect(win(s, 'dubno-ford')).toEqual(['doc:D1-01']);
    expect(s.story.documents[0]).toMatchObject({ id: 'D1-01', cycle: 1, via: 'contract' });
    expect(s.story.ilseAt).toBe(T0);
    expect(s.story.unread).toContain('doc:D1-01');
    mark('D1-01');
  });

  it('D1-04: the 2nd Mirograd contract won, not the 1st', () => {
    const s = createNewGame('act1', T0);
    win(s, 'mirograd');
    expect(isFound(s, 'D1-04')).toBe(false);
    win(s, 'dubno-ford');
    expect(isFound(s, 'D1-04')).toBe(false);
    expect(win(s, 'mirograd')).toContain('doc:D1-04');
    mark('D1-04');
  });

  it('D1-03: the first ruin contract won, bringing four Mirograd names', () => {
    const s = createNewGame('act1', T0);
    win(s, 'velkvik', 'river');
    expect(isFound(s, 'D1-03')).toBe(false);
    const keys = win(s, 'velkvik', 'ruin');
    expect(keys).toEqual(['doc:D1-03', 'name:8', 'name:13', 'name:18', 'name:23']);
    expect(s.story.names.map((x) => x.n)).toEqual([8, 13, 18, 23]);
    mark('D1-03');
  });

  it('D1-09 at the Citadel and D1-10 at Bastion, on the Rank-up', () => {
    const s = createNewGame('act1', T0);
    reach(s, 'keep');
    expect(sweepDocuments(s)).toEqual([]);
    reach(s, 'citadel');
    expect(sweepDocuments(s)).toEqual(['doc:D1-09']);
    reach(s, 'bastion');
    expect(sweepDocuments(s)).toEqual(['doc:D1-10']);
    expect(s.story.documents.map((d) => d.via)).toEqual(['rank', 'rank']);
    mark('D1-09', 'D1-10');
  });

  it('D1-02: a Kozly Hollow win while Kozly Hollow is at least Wary (D147)', () => {
    const s = createNewGame('act1', T0);
    expect(s.story.trust['kozly-hollow'].level).toBe('cold');
    win(s, 'kozly-hollow');
    win(s, 'kozly-hollow');
    expect(isFound(s, 'D1-02')).toBe(false);
    s.story.trust['kozly-hollow'].level = 'wary';
    expect(sweepDocuments(s)).not.toContain('doc:D1-02'); // only a win brings it
    win(s, 'dubno-ford');
    expect(isFound(s, 'D1-02')).toBe(false);
    expect(win(s, 'kozly-hollow')).toContain('doc:D1-02');
    mark('D1-02');
  });

  it('D1-05: the Upyr reaches Mastered', () => {
    const s = createNewGame('act1', T0);
    s.bestiary.upyr = { level: 3, kills: 9 };
    expect(sweepDocuments(s)).toEqual([]);
    s.bestiary.upyr = { level: 4, kills: 10 };
    expect(sweepDocuments(s)).toEqual(['doc:D1-05']);
    expect(s.story.documents[0]?.via).toBe('knowledge');
    mark('D1-05');
  });

  it('D1-06 on the Act I stand; D1-07 when the next warden arrives', () => {
    const s = createNewGame('act1', T0);
    expect(wardenDocuments(s)).toEqual([]);
    expect(standDocuments(s)).toEqual(['doc:D1-06']);
    nextCycle(s);
    expect(wardenDocuments(s)).toEqual(['doc:D1-07']);
    mark('D1-06', 'D1-07');
  });
});

describe('Act II (lore-secrets §22)', () => {
  /** A save whose Act I is behind it: cycle 2, Act II. */
  const act2 = (): GameState => {
    const s = createNewGame('act2', T0);
    win(s, 'kozly-hollow'); // an Act I win for Kozly Hollow
    win(s, 'ravenfell', 'ruin'); // and an Act I ruin win
    reach(s, 'citadel');
    sweepDocuments(s);
    nextCycle(s);
    return s;
  };

  it('D2-01: the first Kozly Hollow win in Act II (Act I wins do not count)', () => {
    const s = act2();
    expect(isFound(s, 'D2-01')).toBe(false);
    win(s, 'mirograd');
    expect(isFound(s, 'D2-01')).toBe(false);
    expect(win(s, 'kozly-hollow')).toContain('doc:D2-01');
    mark('D2-01');
  });

  it("D2-02 to D2-06: the 1st to 5th ruin wins in Act II, with the beam's five names and Tomek's", () => {
    const s = act2();
    const pages = ['D2-02', 'D2-03', 'D2-04', 'D2-05', 'D2-06'];
    pages.forEach((id, i) => {
      const keys = win(s, 'velkvik', 'ruin');
      expect(keys[0], `ruin win ${i + 1}`).toBe(`doc:${id}`);
    });
    expect(
      s.story.names.map((x) => x.n).filter((x) => x !== 8 && x !== 13 && x !== 18 && x !== 23),
    ).toEqual([9, 10, 11, 12, 14, 35]);
    mark(...pages);
  });

  it('D2-07: the Citadel reached in Act II (the Act I Citadel does not count)', () => {
    const s = act2();
    expect(isFound(s, 'D2-07')).toBe(false);
    reach(s, 'citadel');
    expect(sweepDocuments(s)).toEqual(['doc:D2-07']);
    mark('D2-07');
  });

  it('D2-08: Bastion in Act II with Sigrun, or later when she is recruited; carries her name', () => {
    const s = act2();
    reach(s, 'bastion');
    expect(sweepDocuments(s)).not.toContain('doc:D2-08');
    nextCycle(s); // Act III's cycle: she's recruited at the Keep
    s.hunters.sigrun = {
      level: 1,
      xp: 0,
      weapon: null,
      armor: null,
      recovery: null,
      record: { won: 0, lost: 0 },
    };
    expect(sweepDocuments(s)).toEqual(['doc:D2-08', 'name:40']);
    expect(s.story.documents.find((d) => d.id === 'D2-08')?.via).toBe('roster');
    mark('D2-08');
  });

  it('D2-09 on the Act II stand; D2-10 when the next warden arrives', () => {
    const s = act2();
    standDocuments(s); // the Act I testament was never found here, so it comes too
    expect(isFound(s, 'D2-09')).toBe(true);
    expect(isFound(s, 'D1-06')).toBe(true);
    nextCycle(s);
    expect(wardenDocuments(s)).toEqual(expect.arrayContaining(['doc:D2-10']));
    mark('D2-09', 'D2-10');
  });
});

describe('Act III (lore-secrets §26)', () => {
  /** A save in Act III's cycle: cycle 3, with Act I and Act II behind it. */
  const act3 = (): GameState => {
    const s = createNewGame('act3', T0);
    win(s, 'velkvik'); // an Act I win for Velkvik
    nextCycle(s);
    win(s, 'velkvik'); // and an Act II one
    nextCycle(s);
    return s;
  };

  it('D3-02 and D3-03: the 1st and 2nd Velkvik wins in Act III (earlier acts do not count)', () => {
    const s = act3();
    expect(isFound(s, 'D3-02')).toBe(false);
    win(s, 'mirograd');
    expect(isFound(s, 'D3-02')).toBe(false);
    expect(win(s, 'velkvik')).toContain('doc:D3-02');
    expect(isFound(s, 'D3-03')).toBe(false);
    expect(win(s, 'velkvik')).toContain('doc:D3-03');
    mark('D3-02', 'D3-03');
  });

  it("D3-04: the Citadel reached in Act III, with Arvid's four names", () => {
    const s = act3();
    expect(isFound(s, 'D3-04')).toBe(false);
    reach(s, 'citadel');
    const keys = sweepDocuments(s);
    expect(keys).toEqual(
      expect.arrayContaining(['doc:D3-04', 'name:30', 'name:32', 'name:33', 'name:36']),
    );
    mark('D3-04');
  });

  it('D3-05: Bastion reached in Act III, with Eirik’s name', () => {
    const s = act3();
    expect(isFound(s, 'D3-05')).toBe(false);
    reach(s, 'bastion');
    expect(sweepDocuments(s)).toEqual(expect.arrayContaining(['doc:D3-05', 'name:37']));
    mark('D3-05');
  });

  it('D3-06 on the Act III stand; D3-07 when the next warden arrives', () => {
    const s = act3();
    standDocuments(s);
    expect(isFound(s, 'D3-06')).toBe(true);
    nextCycle(s);
    expect(wardenDocuments(s)).toEqual(expect.arrayContaining(['doc:D3-07']));
    mark('D3-06', 'D3-07');
  });
});

describe('acts (GDD §5.14.1)', () => {
  it('documents stay obtainable in later cycles', () => {
    const s = createNewGame('later', T0);
    nextCycle(s);
    nextCycle(s);
    s.bestiary.upyr = { level: 4, kills: 10 };
    expect(sweepDocuments(s)).toContain('doc:D1-05');
    expect(win(s, 'mirograd')).toContain('doc:D1-01');
  });

  it('an act that has not begun brings nothing', () => {
    const s = createNewGame('none', T0);
    reach(s, 'citadel');
    sweepDocuments(s);
    expect(found(s)).toEqual(['D1-09']); // D2-07 waits for Act II
    s.story.acts = [];
    s.cycles[0] = { ...s.cycles[0], act: null } as GameState['cycles'][number];
    const t = structuredClone(s);
    t.story.documents = [];
    expect(win(t, 'dubno-ford')).toEqual([]);
  });

  it('an unwritten act closes with "The story continues in a later version."', () => {
    expect(actClosing(1)).toMatchObject({ id: 'D1-06' });
    expect(actClosing(2)).toMatchObject({ id: 'D2-09' });
    expect(actClosing(3)).toMatchObject({ id: 'D3-06' });
    expect(actClosing(4)).toBe(UNWRITTEN_ACT_LINE);
    expect(actClosing(null)).toBeNull();
    expect(allDocuments.some((d) => d.act >= 4)).toBe(false);
  });

  it('in Act II, a fell village’s ruin notice names Kamenfell; never in Act I or the lowlands', () => {
    const fell = { ...contract('velkvik', 'ruin') };
    const low = { ...contract('kozly-hollow', 'ruin') };
    expect(noticeFor(fell, 'seed', 2).text.endsWith(kamenfellNoticeEnd)).toBe(true);
    expect(noticeFor(fell, 'seed', 2, 'trusting').text).toContain(kamenfellNoticeEnd);
    expect(noticeFor(fell, 'seed', 1).text).not.toContain('Kamenfell');
    expect(noticeFor(low, 'seed', 2).text).not.toContain('Kamenfell');
  });

  it('every document has a condition test above', () => {
    // D3-01 (Arvid's arrival) and D3-08 (Arvid and Sigrun) have no machinery until T6.7;
    // their tests join then.
    const later = ['D3-01', 'D3-08'];
    expect([...tested].sort()).toEqual(
      allDocuments
        .map((d) => d.id)
        .filter((id) => !later.includes(id))
        .sort(),
    );
  });
});

describe('delivery with the contract result (GDD §5.14.2)', () => {
  it("a won contract's result lists the document it brought", () => {
    const s = keepRich('deliver');
    s.board.open = [{ ...contract('dubno-ford'), id: 'd1', monster: 'kikimora', tier: 1 }];
    expect(run(s, { type: 'contract.launch', contract: 'd1', party: ['sigrun'] }).ok).toBe(true);
    advance(s, s.time + 24 * HOUR);
    const r = s.results.find((x) => x.contractId === 'd1');
    expect(r?.success).toBe(true);
    expect(r?.found).toEqual(['doc:D1-01']);
  });
});
