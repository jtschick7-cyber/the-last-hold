// Plan T8.11 (GDD §5.10.7, D316): hunter XP per floor and for the guardian, and the guardian's item,
// all only while the run pays Riftglass. The Command XP line waits for Q26 and is not tested here.
import { describe, expect, it } from 'vitest';
import { floorTier } from '../../src/core/delves/generate';
import type { GameState } from '../../src/core/state/game-state';
import { encodeSaveFile, loadEnvelope, makeEnvelope } from '../../src/core/save';
import { xpToNext } from '../../src/core/systems/hunters';
import { cmd, PARTY, playRun, strongKeep } from './helpers';

/** All the XP a hunter has ever put in, level by level plus what is on the bar. */
const totalXp = (s: GameState, id: (typeof PARTY)[number]): number => {
  const h = s.hunters[id];
  if (!h) return 0;
  let sum = h.xp;
  for (let l = 1; l < h.level; l++) sum += xpToNext(l);
  return sum;
};

/** Starts a run, then drops the three to level 1 (the fights use the frozen snapshots), and plays it out. */
const play = (s: GameState): void => {
  expect(cmd(s, { type: 'delve.start', party: PARTY }).ok).toBe(true);
  for (const id of PARTY) {
    const h = s.hunters[id];
    if (h) Object.assign(h, { level: 1, xp: 0 });
  }
  playRun(s);
};

const expectedXp = (s: GameState, floors: number, beaten: boolean, base: number): number => {
  let xp = 0;
  for (let f = 1; f <= floors; f++) if (f <= 6) xp += 10 * floorTier(base, f);
  if (beaten) xp += 20 * floorTier(base, 7);
  return xp;
};

describe('a run that pays Riftglass pays the hunters too (D316)', () => {
  it('each of the three earns 10 × tier per floor cleared and 20 × tier for the guardian', () => {
    const s = strongKeep('rewards-xp');
    play(s);
    const result = s.delve.result;
    expect(result?.guardianBeaten).toBe(true);
    const want = expectedXp(s, 6, true, 3); // Keep: base tier 3 → 3×30 + 3×40 + 100
    expect(want).toBe(310);
    expect(result?.xp).toBe(want);
    for (const id of PARTY) expect(totalXp(s, id)).toBe(want);
  });

  it('a run that stops early pays only the floors it cleared', () => {
    const s = strongKeep('rewards-left');
    expect(cmd(s, { type: 'delve.start', party: PARTY }).ok).toBe(true);
    for (const id of PARTY) Object.assign(s.hunters[id] ?? {}, { level: 1, xp: 0 });
    // Fight floors 1 and 2, then leave.
    let fights = 0;
    for (let guard = 0; guard < 40 && s.delve.run && fights < 2; guard++) {
      const stage = s.delve.run.stage;
      if (stage.kind === 'start')
        cmd(
          s,
          stage.patron
            ? { type: 'delve.chooseBlessing', blessing: stage.cards[0] as string }
            : { type: 'delve.chooseStart', patron: 'wolf' },
        );
      else if (stage.kind === 'doors') cmd(s, { type: 'delve.chooseDoor', patron: stage.doors[0] });
      else if (stage.kind === 'offer')
        cmd(s, { type: 'delve.chooseBlessing', blessing: stage.cards[0] as string });
      else {
        cmd(s, { type: 'delve.fight' });
        fights += 1;
      }
    }
    if (s.delve.run) expect(cmd(s, { type: 'delve.leave' }).ok).toBe(true);
    expect(s.delve.result?.xp).toBe(2 * 10 * 3);
    expect(s.delve.result?.item).toBeUndefined();
  });

  it('the guardian also drops one item: a Silvered Blade or an Emberwright Plate', () => {
    const s = strongKeep('rewards-item');
    const before = s.items.length;
    play(s);
    const key = s.delve.result?.item ?? '';
    expect(key).toMatch(/^loot:(fine|rare|heroic):(silvered-blade|emberwright-plate)$/);
    expect(s.items.length).toBe(before + 1);
    const [, rarity, base] = key.split(':');
    const made = s.items[s.items.length - 1];
    expect(made).toMatchObject({ rarity, base, where: null });
    expect(made?.lines.length).toBeGreaterThan(0);
  });

  it('the item is fixed by the run’s seed', () => {
    const a = strongKeep('rewards-seed');
    const b = strongKeep('rewards-seed');
    play(a);
    play(b);
    expect(a.delve.result?.item).toBe(b.delve.result?.item);
    expect(a.items.at(-1)).toEqual(b.items.at(-1));
  });
});

describe('Command skill XP per floor (D316, Q26 (a))', () => {
  it('is 1 for each of the six floors cleared, and nothing for the guardian', () => {
    const s = strongKeep('rewards-command');
    const before = s.skills.command;
    play(s);
    expect(s.delve.result?.guardianBeaten).toBe(true);
    expect(s.skills.command - before).toBe(6);
  });

  it('is paid only on floors that pay Riftglass', () => {
    const s = strongKeep('rewards-command-two');
    s.delve.allowance = 2;
    const before = s.skills.command;
    play(s);
    expect(s.skills.command - before).toBe(1);
    const q = strongKeep('rewards-command-quiet');
    q.delve.allowance = 0;
    const was = q.skills.command;
    play(q);
    expect(q.skills.command).toBe(was);
  });
});

describe('a quiet night pays none of it (D316)', () => {
  it('with no Riftglass waiting, a full clear gives no XP and no item', () => {
    const s = strongKeep('rewards-quiet');
    s.delve.allowance = 0;
    const before = s.items.length;
    play(s);
    expect(s.delve.result?.guardianBeaten).toBe(true);
    expect(s.delve.result?.riftglass).toBe(0);
    expect(s.delve.result?.xp).toBeUndefined();
    expect(s.delve.result?.item).toBeUndefined();
    expect(s.items.length).toBe(before);
    for (const id of PARTY) expect(totalXp(s, id)).toBe(0);
  });

  it('with only 2 Riftglass waiting, only the first floor pays', () => {
    const s = strongKeep('rewards-two');
    s.delve.allowance = 2;
    play(s);
    expect(s.delve.result?.riftglass).toBe(2);
    expect(s.delve.result?.xp).toBe(10 * 3);
    expect(s.delve.result?.item).toBeUndefined();
  });
});

describe('what a Delve never gives (D316)', () => {
  it('no trophies and no yard XP', () => {
    const s = strongKeep('rewards-none');
    const trophies = s.stats.trophies;
    play(s);
    expect(s.stats.trophies).toBe(trophies);
    expect(s.hunters.bjarna?.xp).toBe(0);
    expect(s.hunters.vesna?.xp).toBe(0);
  });
});

describe('the saved result', () => {
  it('keeps the XP and the item through save and load, and a save from before loads too', () => {
    const s = strongKeep('rewards-save');
    play(s);
    const back = loadEnvelope(JSON.parse(encodeSaveFile(makeEnvelope(s, 0))));
    if (!back.ok) throw new Error(back.error);
    expect(back.value.warnings).toEqual([]);
    expect(back.value.state.delve.result?.xp).toBe(310);
    expect(back.value.state.delve.result?.item).toBe(s.delve.result?.item);
    // The older shape has neither field.
    const plain = JSON.parse(encodeSaveFile(makeEnvelope(s, 0)));
    delete plain.state.delve.result.xp;
    delete plain.state.delve.result.item;
    const old = loadEnvelope(plain);
    expect(old.ok).toBe(true);
  });
});
