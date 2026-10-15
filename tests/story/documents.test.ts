// Plan T5.6: every Act I and Act II document arrives on its condition, row by row
// against lore-secrets §21–§22 (D148) and Act III's (§26), and stays obtainable in later cycles.
import { describe, expect, it } from 'vitest';
import { allDocuments, UNWRITTEN_ACT_LINE } from '../../src/content/story/acts';
import { yrsaTholeLine } from '../../src/content/story/act5';
import { kamenfellNoticeEnd } from '../../src/content/story/scenes';
import type { MonsterId } from '../../src/content/monsters';
import type { VillageId } from '../../src/content/villages';
import type { LocationId } from '../../src/content/damage';
import { noticeFor } from '../../src/core/contracts/notice';
import { advance } from '../../src/core/sim';
import { HOUR, keepRich, run } from '../contracts/helpers';
import { freshCycleRecord } from '../../src/core/state/new-game';
import { freshHunter } from '../../src/core/state/hunters-state';
import { freshAct } from '../../src/core/state/story-state';
import { arriveArvid } from '../../src/core/story/act3';
import { createNewGame } from '../../src/core/state/new-game';
import type { ContractInstance, GameState } from '../../src/core/state/game-state';
import {
  actClosing,
  actClosingNote,
  beginAct,
  isFound,
  recordWin,
  standDocuments,
  sweepDocuments,
  wardenDocuments,
} from '../../src/core/story/documents';

const T0 = Date.UTC(2026, 9, 14, 8);
let n = 0;
const contract = (
  village: VillageId,
  location: LocationId = 'field',
  monster: MonsterId = 'wolf',
): ContractInstance => ({
  id: `c${(n += 1)}`,
  village,
  monster,
  tier: 2,
  location,
  arrivedAt: T0,
  revealed: 3,
});
const win = (
  s: GameState,
  village: VillageId,
  location?: LocationId,
  monster?: MonsterId,
): string[] => recordWin(s, contract(village, location, monster));
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

  it('D3-01: Arvid arrives with Ilse, on the new-warden sheet or on load (D211, D214)', () => {
    const s = act3();
    expect(isFound(s, 'D3-01')).toBe(false);
    expect(sweepDocuments(s)).not.toContain('doc:D3-01'); // never by a sweep: only by his arrival
    expect(arriveArvid(s, 'warden')).toContain('doc:D3-01');
    expect(s.story.documents.find((d) => d.id === 'D3-01')?.via).toBe('warden');
    expect(arriveArvid(s, 'warden')).toEqual([]); // once
    mark('D3-01');
  });

  it('D3-08: Arvid and Sigrun both at the hold in Act III, after D2-08 (D213)', () => {
    const s = act3();
    arriveArvid(s, 'warden');
    s.hunters.sigrun = freshHunter();
    expect(sweepDocuments(s)).not.toContain('doc:D3-08'); // D2-08 not found yet
    s.story.documents.push({ id: 'D2-08', cycle: 2, at: s.time, via: 'roster' });
    expect(sweepDocuments(s)).toContain('doc:D3-08');
    mark('D3-08');
  });

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

describe('Act IV (lore-secrets §28, D245)', () => {
  /** A save in Act IV's cycle (cycle 4): Acts I to III behind it, with a family win in each earlier one. */
  const act4 = (): GameState => {
    const s = createNewGame('act4', T0);
    win(s, 'mirograd', 'field', 'kikimora'); // Act I wins: none of them counts in Act IV
    win(s, 'mirograd', 'field', 'wolf');
    win(s, 'mirograd', 'field', 'wolf');
    nextCycle(s);
    win(s, 'mirograd', 'field', 'huldra');
    nextCycle(s);
    nextCycle(s);
    return s;
  };

  it('D4-01: the act beginning, on the new-warden sheet or on load; never by a sweep', () => {
    const s = act4();
    expect(isFound(s, 'D4-01')).toBe(false);
    expect(sweepDocuments(s)).not.toContain('doc:D4-01');
    expect(beginAct(s, 4, 'warden')).toContain('doc:D4-01');
    expect(s.story.documents.find((d) => d.id === 'D4-01')).toMatchObject({
      cycle: 4,
      via: 'warden',
    });
    expect(beginAct(s, 4, 'warden')).toEqual([]); // once
    const t = act4();
    expect(beginAct(t, 4, 'arrival')).toContain('doc:D4-01');
    expect(t.story.documents.find((d) => d.id === 'D4-01')?.via).toBe('arrival');
    const none = createNewGame('no-act-4', T0); // an act not begun has no scene
    expect(beginAct(none, 4, 'warden')).toEqual([]);
    mark('D4-01');
  });

  it('D4-02: the 1st Field & Forest Spirits contract won in Act IV, with three names', () => {
    const s = act4();
    expect(isFound(s, 'D4-02')).toBe(false); // the Kikimora and the Huldra of earlier acts do not count
    expect(win(s, 'dubno-ford', 'field', 'wolf')).not.toContain('doc:D4-02'); // another family
    expect(win(s, 'dubno-ford', 'ruin', 'wolf')).not.toContain('doc:D4-02');
    expect(win(s, 'dubno-ford', 'field', 'leshy')).toEqual(
      expect.arrayContaining(['doc:D4-02', 'name:21', 'name:22', 'name:24']),
    );
    expect(s.story.documents.find((d) => d.id === 'D4-02')?.via).toBe('contract');
    expect(win(s, 'dubno-ford', 'field', 'kikimora')).not.toContain('doc:D4-02'); // once
    mark('D4-02');
  });

  it('D4-03: the 2nd Beasts & Wilds contract won in Act IV, not the 1st, with three names', () => {
    const s = act4();
    expect(win(s, 'kozly-hollow', 'field', 'wolf')).not.toContain('doc:D4-03');
    expect(win(s, 'kozly-hollow', 'field', 'bies')).toEqual(
      expect.arrayContaining(['doc:D4-03', 'name:25', 'name:26', 'name:27']),
    );
    mark('D4-03');
  });

  it('D4-02 and D4-03 stay obtainable in a later cycle (counts run on until met)', () => {
    const s = act4();
    nextCycle(s);
    expect(win(s, 'mirograd', 'field', 'poludnitsa')).toContain('doc:D4-02');
  });

  it('D4-04 and D4-05: the Citadel and Bastion reached in Act IV’s cycle or later', () => {
    const s = act4();
    reach(s, 'citadel');
    expect(sweepDocuments(s)).toContain('doc:D4-04');
    expect(isFound(s, 'D4-05')).toBe(false);
    reach(s, 'bastion');
    expect(sweepDocuments(s)).toContain('doc:D4-05');
    mark('D4-04', 'D4-05');
  });

  it('D4-06 on the Act IV stand; D4-07 when the next warden arrives', () => {
    const s = act4();
    standDocuments(s);
    expect(isFound(s, 'D4-06')).toBe(true);
    expect(isFound(s, 'D4-07')).toBe(false);
    nextCycle(s);
    expect(wardenDocuments(s)).toContain('doc:D4-07');
    mark('D4-06', 'D4-07');
  });

  it('D4-08: the 2nd Mirograd contract won in Act IV, not the 1st', () => {
    const s = act4();
    expect(win(s, 'mirograd')).not.toContain('doc:D4-08'); // Act I and III wins do not count
    expect(win(s, 'mirograd')).toContain('doc:D4-08');
    mark('D4-08');
  });
});

describe('Act V (lore-secrets §30, D302)', () => {
  /** A save in Act V's cycle (cycle 5): Acts I to IV behind it, with wins in each earlier one. */
  const act5 = (): GameState => {
    const s = createNewGame('act5', T0);
    win(s, 'ravenfell', 'field', 'wolf'); // Act I wins: none of them counts in Act V
    win(s, 'kozly-hollow', 'field', 'wolf');
    win(s, 'kozly-hollow', 'field', 'wolf');
    nextCycle(s);
    win(s, 'ravenfell');
    nextCycle(s);
    nextCycle(s);
    nextCycle(s);
    return s;
  };

  it('D5-01: the act beginning, on the new-warden sheet or on load; never by a sweep', () => {
    const s = act5();
    expect(isFound(s, 'D5-01')).toBe(false);
    expect(sweepDocuments(s)).not.toContain('doc:D5-01');
    expect(beginAct(s, 5, 'warden')).toContain('doc:D5-01');
    expect(s.story.documents.find((d) => d.id === 'D5-01')).toMatchObject({
      cycle: 5,
      via: 'warden',
    });
    expect(beginAct(s, 5, 'warden')).toEqual([]); // once
    const t = act5();
    expect(beginAct(t, 5, 'arrival')).toContain('doc:D5-01');
    expect(t.story.documents.find((d) => d.id === 'D5-01')?.via).toBe('arrival');
    mark('D5-01');
  });

  it('D5-02: the 1st contract won in Act V, not an earlier act’s', () => {
    const s = act5();
    expect(isFound(s, 'D5-02')).toBe(false);
    expect(win(s, 'dubno-ford')).toContain('doc:D5-02');
    expect(s.story.documents.find((d) => d.id === 'D5-02')?.via).toBe('contract');
    mark('D5-02');
  });

  it('D5-03: the 1st Ravenfell contract won in Act V, with four names (#4–#7)', () => {
    const s = act5();
    expect(win(s, 'mirograd')).not.toContain('doc:D5-03'); // another village
    expect(win(s, 'ravenfell')).toEqual(
      expect.arrayContaining(['doc:D5-03', 'name:4', 'name:5', 'name:6', 'name:7']),
    );
    expect(win(s, 'ravenfell')).not.toContain('doc:D5-03'); // once
    mark('D5-03');
  });

  it('D5-03 counts the first Ravenfell win of Act V even when the earlier acts had one', () => {
    const s = act5(); // Act I and Act II each won at Ravenfell
    expect(isFound(s, 'D5-03')).toBe(false);
    expect(win(s, 'ravenfell', 'ruin', 'wolf')).toContain('doc:D5-03'); // any location
  });

  it('D5-04 and D5-05: the Citadel and Bastion reached in Act V’s cycle or later', () => {
    const s = act5();
    reach(s, 'citadel');
    expect(sweepDocuments(s)).toContain('doc:D5-04');
    expect(isFound(s, 'D5-05')).toBe(false);
    reach(s, 'bastion');
    expect(sweepDocuments(s)).toContain('doc:D5-05');
    mark('D5-04', 'D5-05');
  });

  it('D5-06 on the Act V stand; D5-07 when the next warden arrives', () => {
    const s = act5();
    standDocuments(s);
    expect(isFound(s, 'D5-06')).toBe(true);
    expect(isFound(s, 'D5-07')).toBe(false);
    nextCycle(s);
    expect(wardenDocuments(s)).toContain('doc:D5-07');
    mark('D5-06', 'D5-07');
  });

  it('D5-08: the 2nd Kozly Hollow contract won in Act V, not the 1st', () => {
    const s = act5(); // Act I had two Kozly Hollow wins: they do not count
    expect(win(s, 'kozly-hollow')).not.toContain('doc:D5-08');
    expect(win(s, 'kozly-hollow')).toContain('doc:D5-08');
    mark('D5-08');
  });

  it('uses no ruin, family or Delve condition, so the family counter cannot touch it (D318)', () => {
    for (const d of allDocuments.filter((x) => x.act === 5)) {
      expect(['familyWon', 'huntersTogether', 'knowledge']).not.toContain(d.condition.kind);
      if (d.condition.kind === 'contractWon') expect(d.condition.location).toBeUndefined();
    }
  });

  it('the Last Stand of Act V closes with D5-06 and Yrsa’s Thole’s line (D314)', () => {
    const s = act5();
    expect(actClosingNote(s, 5)).toBeNull(); // the testament isn't found yet
    standDocuments(s);
    expect(actClosingNote(s, 5)).toBe(yrsaTholeLine);
    expect(actClosingNote(s, 4)).toBeNull();
    expect(actClosing(5)).toMatchObject({ id: 'D5-06' });
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
    expect(actClosing(4)).toMatchObject({ id: 'D4-06' });
    expect(actClosing(5)).toMatchObject({ id: 'D5-06' });
    expect(actClosing(6)).toBe(UNWRITTEN_ACT_LINE);
    expect(actClosing(null)).toBeNull();
    expect(allDocuments.some((d) => d.act >= 6)).toBe(false);
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
    expect([...tested].sort()).toEqual(allDocuments.map((d) => d.id).sort());
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
