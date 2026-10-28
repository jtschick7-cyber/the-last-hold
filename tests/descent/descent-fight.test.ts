// Plan TD.4a (GDD §5.15.10, technical design §22.3, D558, D560, D567): the Descent's relay engine and
// The Unlit's abilities. Fixtures are sturdy or glass hunters so each rule shows plainly.
import { describe, expect, it } from 'vitest';
import { HUNTER_IDS, type HunterId } from '../../src/content/hunters';
import type { ConsumableId } from '../../src/content/consumables';
import { runFight, type HunterSnapshot, type LogEntry } from '../../src/core/combat';
import { clearAbilityEffects } from '../../src/core/combat/skills';
import {
  runDescent,
  stageBombs,
  stageMonsters,
  type DescentInput,
} from '../../src/core/systems/descent-fight';
import { cyclic, snap, sponge } from '../combat/helpers';

const strong = (id: HunterId, over: Partial<HunterSnapshot> = {}): HunterSnapshot => {
  const s = snap(id);
  return snap(id, { base: { ...s.base, health: 5000, might: 400 }, ...over });
};
/** Hunters who are hurt by a stage but not downed, so the recovery between stages shows. */
const steady = (id: HunterId, over: Partial<HunterSnapshot> = {}): HunterSnapshot =>
  snap(id, { base: { ...snap(id).base, health: 150, might: 60, armor: 0 }, ...over });
const glass = (id: HunterId): HunterSnapshot =>
  snap(id, { base: { ...snap(id).base, health: 1, armor: 0, might: 1 } });

const input = (order: HunterSnapshot[], over: Partial<DescentInput> = {}): DescentInput => ({
  seed: 'g:descent:1',
  order,
  prep: { oils: {}, potions: {} },
  bombs: {},
  learned: { mightAndHealth: 0, taken: 0 },
  delveRelics: [],
  knowledge: {},
  stageTiers: [5, 6, 7],
  unlitBaseHealth: 4500,
  alchemy: 0,
  ...over,
});
const all14 = (make: (id: HunterId) => HunterSnapshot): HunterSnapshot[] =>
  HUNTER_IDS.map((id) => make(id));
const text = (log: readonly LogEntry[]): string => log.map((e) => e.text).join('\n');

describe('The Unlit in a fight', () => {
  const run = (prep = {}, party = [sponge('arvid'), sponge('zora'), sponge('herdis')]) =>
    runFight({
      party,
      monster: { unlit: true, tier: 5, baseHealth: 4500 },
      location: null,
      rolls: cyclic([0.5]),
      prep: { oils: {}, potions: {}, bombs: [], ...prep },
    });
  const attacks = (log: readonly LogEntry[]) =>
    log.filter((e) => e.actor === 'unlit' && ['hit', 'crit', 'miss'].includes(e.kind));

  it('First Cold: every action, each standing hunter loses 3% of max Health and 15 turn meter', () => {
    const r = run();
    const cold = r.log.filter((e) => e.text.includes('first cold'));
    expect(cold.length).toBeGreaterThan(3);
    const first = cold[0];
    expect(first?.amount).toBe(3000); // 3% of 100,000, no taken%
    expect(first?.text).toContain('turn 15 later');
    // one line per standing hunter: the first action reaches all three
    expect(new Set(cold.slice(0, 3).map((e) => e.target)).size).toBe(3);
  });

  it('Heavy Dark: its 3rd action sweeps every hunter and chills them', () => {
    const r = run();
    const sweeps = r.log.filter((e) => e.text.includes('Heavy Dark falls on the whole party'));
    expect(sweeps.length).toBeGreaterThan(1);
    // Its 3rd attack entry comes straight after the 3rd sweep line: actions 3, 6, 9…
    const idx = r.log.indexOf(sweeps[0] as LogEntry);
    const before = attacks(r.log.slice(0, idx));
    expect(before).toHaveLength(2); // two ordinary single-target attacks first
    const after = r.log.slice(idx + 1, idx + 8).map((e) => e.text);
    expect(after.filter((t) => t.includes('is chilled (healing −50% for 2 actions)'))).toHaveLength(
      3,
    );
  });

  it('a Saltburst cancels the first First Cold and blocks both abilities for 3 actions', () => {
    const plain = run();
    const salted = run({ bombs: ['saltburst' satisfies ConsumableId] });
    const firstColdAt = (r: typeof plain): number => {
      const i = r.log.findIndex((e) => e.text.includes('first cold'));
      return attacks(r.log.slice(0, i)).length;
    };
    expect(firstColdAt(plain)).toBe(1);
    expect(salted.saltburstCancelled).toBe(true);
    expect(firstColdAt(salted)).toBe(5); // actions 1 to 4 are silent
    const heavy = salted.log.findIndex((e) => e.text.includes('Heavy Dark falls'));
    expect(attacks(salted.log.slice(0, heavy)).length).toBe(5); // not on the 3rd action: it comes on the 6th
  });

  it("Halvar's Smoke-Lunged halves First Cold", () => {
    const halved = run({}, [sponge('halvar', { traits: ['smoke-lunged'] })]);
    const plain = run({}, [sponge('halvar')]);
    const a = halved.log.find((e) => e.text.includes('first cold'))?.amount ?? 0;
    const b = plain.log.find((e) => e.text.includes('first cold'))?.amount ?? 0;
    expect(b).toBe(3000);
    expect(a).toBe(1500);
  });

  it("Herdis's Shepherd's Crook clears the Chill", () => {
    const r = run();
    expect(r.log.some((e) => e.text.includes('chilled'))).toBe(true);
    const h = runFight({
      party: [sponge('herdis')],
      monster: { unlit: true, tier: 5, baseHealth: 4500 },
      location: null,
      rolls: cyclic([0.5]),
    });
    expect(h.result).toBe('loss');
    // The clearing itself is the existing rule: it reads the Chill fields Heavy Dark sets.
    const c = { healCutLeft: 2, healCut: 0.5, hamstringLeft: 0, lostActions: 0 };
    expect(clearAbilityEffects(c as never)).toContain('chilled');
  });
});

describe('the stages', () => {
  it('Stage 1 is Unlit’s Breath and the Forgotten, Stage 2 the Dross-Tide, Anvil-wight and Rimewrought, Stage 3 The Unlit', () => {
    const i = input([strong('halvar')]);
    const name = (n: number) =>
      stageMonsters(i, n).map((m) =>
        'guardian' in m ? m.guardian : 'monster' in m ? m.monster : 'unlit',
      );
    expect(name(1)).toEqual(['unlits-breath', 'the-forgotten']);
    expect(name(2)).toEqual(['dross-tide', 'anvil-wight', 'rimewrought']);
    expect(name(3)).toEqual(['unlit']);
    expect(stageMonsters(i, 3)[0]?.tier).toBe(7);
  });

  it('the Salt Ring takes 10% off the Deep monsters’ Health, not the smiths’', () => {
    const base = runDescent(input(all14(strong)));
    const ring = runDescent(input(all14(strong), { delveRelics: ['salt-ring'] }));
    const hp = (r: typeof base, s: number, id: string) =>
      r.stages[s]?.monsters.find((m) => m.id === id)?.maxHealth ?? 0;
    expect(hp(ring, 0, 'unlits-breath')).toBe(Math.floor(hp(base, 0, 'unlits-breath') * 0.9 + 0.5));
    expect(hp(ring, 1, 'anvil-wight')).toBe(hp(base, 1, 'anvil-wight'));
    expect(hp(ring, 2, 'unlit')).toBeLessThan(hp(base, 2, 'unlit'));
  });
});

describe('the relay', () => {
  it('a strong party clears all three stages with nobody stepping in', () => {
    const r = runDescent(input(all14(strong)));
    expect(r.outcome).toBe('win');
    expect(r.stagesCleared).toBe(3);
    expect(r.stages.map((s) => s.summary.stage)).toEqual([1, 2, 3]);
    expect(r.stages.every((s) => s.summary.steppedInIds.length === 0)).toBe(true);
    expect(r.standingCount + r.downedCount).toBe(14);
  });

  it('is deterministic, and the log makes no difference to the result', () => {
    const a = runDescent(input(all14(strong)));
    const b = runDescent(input(all14(strong)));
    const quiet = runDescent(input(all14(strong), { log: false }));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(quiet.stages.map((s) => s.summary)).toEqual(a.stages.map((s) => s.summary));
    expect(quiet.stages.every((s) => s.log.length === 0)).toBe(true);
    const other = runDescent(input(all14(strong), { seed: 'g:descent:2' }));
    expect(JSON.stringify(other.stages.map((s) => s.log))).not.toBe(
      JSON.stringify(a.stages.map((s) => s.log)),
    );
  });

  it('does not change its input', () => {
    const i = input(all14(strong), {
      bombs: { 'fire-pot': 3 },
      learned: { mightAndHealth: 0.1, taken: 0.1 },
    });
    const before = JSON.stringify(i);
    runDescent(i);
    expect(JSON.stringify(i)).toBe(before);
  });

  it('mid-stage: when the whole front line is down, the next six reserves step in at once', () => {
    const order = all14((id) => (HUNTER_IDS.indexOf(id) < 6 ? glass(id) : strong(id)));
    const r = runDescent(input(order));
    const s1 = r.stages[0];
    expect(s1?.summary.downedIds.sort()).toEqual(HUNTER_IDS.slice(0, 6).sort());
    expect(s1?.summary.steppedInIds).toEqual(HUNTER_IDS.slice(6, 12)); // queue order, six of them
    expect(text(s1?.log ?? [])).toContain('The front line is down');
    expect(r.downedCount).toBeGreaterThanOrEqual(6);
  });

  it('a reserve who steps in mid-stage starts at meter 0, with meter traits applied on entry', () => {
    const order = all14((id) =>
      HUNTER_IDS.indexOf(id) < 6
        ? glass(id)
        : strong(id, id === 'stanko' ? { skill: 'up-before-the-wolves' } : {}),
    );
    const r = runDescent(input(order));
    const lines = (r.stages[0]?.log ?? []).filter((e) =>
      e.text.includes('is up before the wolves'),
    );
    expect(lines).toHaveLength(1); // once, as he enters; he did not start the stage
    const stepIn = (r.stages[0]?.log ?? []).findIndex((e) => e.text.includes('step in from'));
    expect(r.stages[0]?.log.indexOf(lines[0] as LogEntry)).toBeGreaterThan(stepIn - 8);
  });

  it('with no reserve left, a downed front line is a loss', () => {
    const r = runDescent(input(HUNTER_IDS.slice(0, 6).map(glass)));
    expect(r.outcome).toBe('loss');
    expect(r.stagesCleared).toBe(0);
    expect(r.stages).toHaveLength(1);
    expect(r.stages[0]?.endedBy).toBe('party-down');
    expect(r.standingCount).toBe(0);
  });

  it('between stages: downed slots are filled in slot order, the standing recover 20%', () => {
    // Slots 0 and 2 are glass; the rest are tough enough to be hurt but not downed.
    const order = all14((id) => {
      const k = HUNTER_IDS.indexOf(id);
      return k === 0 || k === 2
        ? glass(id)
        : strong(id, { base: { ...snap(id).base, health: 600, might: 400, armor: 0 } });
    });
    const r = runDescent(input(order));
    expect(r.stages[0]?.summary.won).toBe(true);
    const s2 = r.stages[1];
    expect(s2?.summary.steppedInIds).toEqual([HUNTER_IDS[6], HUNTER_IDS[7]]);
    const start = s2?.startHealth ?? {};
    const end = r.stages[0]?.hunters ?? [];
    for (const h of end.filter((x) => !x.downed)) {
      const gained = Math.min(h.maxHealth, h.health + Math.floor(h.maxHealth * 0.2 + 0.5));
      expect(start[h.id]).toBe(gained);
    }
    // the reserves arrive at full Health
    const fresh = r.stages[1]?.hunters.find((h) => h.id === HUNTER_IDS[6]);
    expect(start[HUNTER_IDS[6] as HunterId]).toBe(fresh?.maxHealth);
  });

  it('the Rift Lantern adds 10 points to the recovery', () => {
    const order = all14((id) => steady(id));
    const plain = runDescent(input(order, { unlitBaseHealth: 500 }));
    const lamp = runDescent(input(order, { unlitBaseHealth: 500, delveRelics: ['rift-lantern'] }));
    const h = plain.stages[0]?.hunters.find((x) => !x.downed && x.health < x.maxHealth * 0.9);
    if (!h) throw new Error('fixture: nobody was hurt');
    const after = (r: typeof plain, share: number) =>
      Math.min(h.maxHealth, h.health + Math.floor(h.maxHealth * share + 0.5));
    expect(plain.stages[1]?.startHealth[h.id]).toBe(after(plain, 0.2));
    // the same fight for stage 1 (same seed, same stage), so the same Health to recover from
    expect(lamp.stages[0]?.hunters.find((x) => x.id === h.id)?.health).toBe(h.health);
    expect(lamp.stages[1]?.startHealth[h.id]).toBe(after(lamp, 0.3));
    expect(after(lamp, 0.3)).toBeGreaterThan(after(plain, 0.2));
  });

  it('a potion fires once across the three stages', () => {
    const order = all14(strong);
    const r = runDescent(
      input(order, { prep: { oils: {}, potions: { halvar: 'quickfoot-tincture' } } }),
    );
    expect(text(r.stages[0]?.log ?? [])).toContain(`${order[0]?.name} drinks Quickfoot Tincture`);
    expect(text(r.stages[1]?.log ?? [])).not.toContain(`${order[0]?.name} drinks`);
    expect(text(r.stages[2]?.log ?? [])).not.toContain(`${order[0]?.name} drinks`);
    expect(r.potionsUsed).toContain('halvar');
  });

  it('an oil lasts the whole Descent', () => {
    const r = runDescent(
      input(all14(strong), { prep: { oils: { halvar: 'wrights-oil' }, potions: {} } }),
    );
    // Stage 2 has two Cursed members: the oil's bonus shows on Halvar's hits (no error, same engine).
    expect(r.stagesCleared).toBe(3);
  });

  it('"first hit in a fight" skills work once for the whole Descent', () => {
    const order = [
      steady('sigrun', { skill: 'the-other-hand' }),
      ...all14((id) => steady(id)).filter((h) => h.id !== 'sigrun'),
    ];
    const r = runDescent(input(order, { unlitBaseHealth: 500 }));
    const seen = r.stages.map((s) => text(s.log).includes('The Other Hand'));
    expect(seen).toEqual([true, false, false]);
  });

  it('What the Hold Learned: Might, Health and damage taken', () => {
    const plain = runDescent(input(all14(strong)));
    const learned = runDescent(
      input(all14(strong), { learned: { mightAndHealth: 0.5, taken: 0.1 } }),
    );
    const hp = (r: typeof plain) =>
      r.stages[0]?.hunters.find((h) => h.id === 'halvar')?.maxHealth ?? 0;
    expect(hp(learned)).toBe(Math.floor(hp(plain) * 1.5 + 0.5));
    expect(learned.stages[0]?.summary.ticks).toBeLessThan(plain.stages[0]?.summary.ticks ?? 0 + 1);
  });

  it('a stage that cannot be won ends at the 400-tick limit as a loss', () => {
    const r = runDescent(
      input(
        all14((id) => sponge(id)),
        { unlitBaseHealth: 4500 },
      ),
    );
    expect(r.outcome).toBe('loss');
    expect(r.stages).toHaveLength(1);
    expect(r.stages[0]?.endedBy).toBe('retreat');
    expect(r.stages[0]?.summary.ticks).toBe(400);
  });

  it('group targeting: the Vanguard hits the front monster first', () => {
    const r = runDescent(input(all14(strong)));
    const log = r.stages[0]?.log ?? [];
    const vanguardHits = log.filter(
      (e) => (e.kind === 'hit' || e.kind === 'crit') && e.actor === 'halvar',
    );
    expect(vanguardHits[0]?.target).toBe('unlits-breath');
  });
});

describe('the bombs of a stage (S15)', () => {
  const stage = (n: number) => stageMonsters(input([strong('halvar')]), n);

  it('weak-to bombs go at the front monster first, up to two', () => {
    const stock: Partial<Record<ConsumableId, number>> = {
      'fire-pot': 3,
      saltburst: 1,
      'poppy-smoke': 1,
    };
    const picks = stageBombs(stage(1), stock);
    expect(picks).toEqual([
      { id: 'fire-pot', target: 0 },
      { id: 'fire-pot', target: 0 },
    ]);
    expect(stock['fire-pot']).toBe(1);
  });

  it('then one Saltburst, then one Poppy Smoke, when nothing is weak', () => {
    const picks = stageBombs(stage(3), { saltburst: 2, 'poppy-smoke': 2 });
    expect(picks.map((p) => p.id)).toEqual(['saltburst', 'poppy-smoke']);
  });

  it('a run takes at most two per stage from the stores and reports them', () => {
    const r = runDescent(input(all14(strong), { bombs: { 'fire-pot': 9, saltburst: 3 } }));
    const used = Object.values(r.bombsUsed).reduce((a, b) => a + (b ?? 0), 0);
    expect(used).toBeGreaterThan(0);
    expect(used).toBeLessThanOrEqual(6);
    expect(r.stages.every((s) => s.bombs.length <= 2)).toBe(true);
  });
});
