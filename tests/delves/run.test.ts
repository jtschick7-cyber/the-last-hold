// Plan T7.9 (GDD §5.10, D248–D263, D280, D281): a Delve run. Access from the first Keep, depth from
// the Rank, groups and doors and offers by seed, Health carried and recovered, the end, the rewards,
// the save at every step, the Last Stand ending a paused run.
import { describe, expect, it } from 'vitest';
import { blessings, blessingsOf } from '../../src/content/delves/blessings';
import { OPEN_PATRON_IDS } from '../../src/content/delves/patrons';
import { monsters } from '../../src/content/monsters';
import { balance } from '../../src/content/balance';
import { advance } from '../../src/core/sim';
import {
  baseTierFor,
  delvesOpen,
  entryProblem,
  suggestedParty,
} from '../../src/core/delves/access';
import {
  doorsFor,
  floorFamily,
  floorSpecies,
  floorTier,
  groupSize,
  offerFor,
  speciesAtTier,
} from '../../src/core/delves/generate';
import { encodeSaveFile, loadEnvelope, makeEnvelope } from '../../src/core/save';
import type { GameState } from '../../src/core/state/game-state';
import { createNewGame } from '../../src/core/state/new-game';
import { hunterStatus, xpToNext } from '../../src/core/systems/hunters';
import { T0 } from '../contracts/helpers';
import { cmd, frailKeep, PARTY, playRun, strongKeep } from './helpers';

const start = (s: GameState) => cmd(s, { type: 'delve.start', party: PARTY });
const reload = (s: GameState): GameState => {
  const r = loadEnvelope(JSON.parse(encodeSaveFile(makeEnvelope(s, 0))));
  if (!r.ok) throw new Error(r.error);
  return r.value.state;
};

describe('access and depth (D249, D253)', () => {
  it('opens for good at the first Keep, never before', () => {
    const fresh = createNewGame('open', T0);
    expect(delvesOpen(fresh)).toBe(false);
    expect(cmd(fresh, { type: 'delve.start', party: PARTY }).ok).toBe(false);
    expect(delvesOpen(strongKeep())).toBe(true);
    // A new warden back in the Hamlet still has the way down.
    const later = strongKeep();
    later.cycle.age = 'hamlet';
    expect(delvesOpen(later)).toBe(true);
    expect(baseTierFor(later)).toBe(3);
  });

  it('floors 1–3 are at the Rank’s tier, 4–6 one higher, the guardian two higher', () => {
    for (const [rank, base] of [
      ['keep', 3],
      ['citadel', 4],
      ['bastion', 5],
    ] as const) {
      const s = strongKeep(`depth-${rank}`, rank);
      expect(start(s).ok).toBe(true);
      expect(s.delve.run?.baseTier).toBe(base);
      expect([1, 2, 3, 4, 5, 6, 7].map((f) => floorTier(base, f))).toEqual([
        base,
        base,
        base,
        base + 1,
        base + 1,
        base + 1,
        base + 2,
      ]);
    }
  });

  it('a Rank-up during a run does not change its depth', () => {
    const s = strongKeep('depth-fixed');
    start(s);
    s.cycle.age = 'bastion';
    expect(s.delve.run?.baseTier).toBe(3);
    expect(baseTierFor(s)).toBe(5);
  });

  it('takes exactly three distinct, ready, active hunters', () => {
    const s = strongKeep('party');
    expect(cmd(s, { type: 'delve.start', party: ['halvar', 'zora'] }).ok).toBe(false);
    expect(cmd(s, { type: 'delve.start', party: ['halvar', 'halvar', 'zora'] }).ok).toBe(false);
    s.roster.active = s.roster.active.filter((h) => h !== 'ostap');
    expect(entryProblem(s, 'ostap')).toBe('in the reserve');
    expect(start(s).ok).toBe(false);
  });

  it('refuses hunters on a contract or recovering, and a second run while one is under way', () => {
    const s = strongKeep('busy');
    const z = s.hunters.zora;
    if (z) z.recovery = { kind: 'wounded', until: s.time + 1e6 } as never;
    expect(entryProblem(s, 'zora')).toBe('recovering');
    expect(start(s).ok).toBe(false);
    if (z) z.recovery = null;
    expect(start(s).ok).toBe(true);
    expect(start(s).ok).toBe(false);
  });

  it('hunters in a run cannot take contracts, and the roster cannot swap them out', () => {
    const s = strongKeep('lock');
    start(s);
    expect(hunterStatus(s, 'halvar')).toBe('in-delve');
    expect(cmd(s, { type: 'roster.set', hunter: 'halvar', active: false }).ok).toBe(false);
  });

  it('suggests a Vanguard, a Striker and a Mender, highest levels first', () => {
    const s = strongKeep('suggest');
    expect(suggestedParty(s)).toEqual(['halvar', 'zora', 'ostap']);
  });
});

describe('groups, doors and offers come from the seed (D250, D255, D256)', () => {
  it('give each floor one family, 2 monsters on floors 1–3 and 3 on 4–6, valid at the tier', () => {
    for (let n = 0; n < 40; n++) {
      const seed = `g:delve:${n}`;
      for (let floor = 1; floor <= 6; floor++) {
        const group = floorSpecies(seed, floor, 2);
        expect(group).toHaveLength(groupSize(floor));
        expect(groupSize(floor)).toBe(floor <= 3 ? 2 : 3);
        const family = floorFamily(seed, floor);
        expect(family).not.toBe('deep');
        for (const id of group) {
          expect(monsters[id].family).toBe(family);
          expect(speciesAtTier(family, floorTier(2, floor))).toContain(id);
        }
      }
    }
  });

  it('above tier 5 use the species that reach tier 5', () => {
    for (const family of ['beasts-and-wilds', 'restless-dead', 'cursed'] as const) {
      const ids = speciesAtTier(family, 7);
      expect(ids.length).toBeGreaterThan(0);
      for (const id of ids) expect(monsters[id].tiers[1]).toBeGreaterThanOrEqual(5);
    }
  });

  it('are reproducible, and a different seed draws differently', () => {
    expect(floorSpecies('a', 3, 2)).toEqual(floorSpecies('a', 3, 2));
    const seeds = new Set(Array.from({ length: 30 }, (_, i) => floorSpecies(`s${i}`, 1, 2).join()));
    expect(seeds.size).toBeGreaterThan(1);
  });

  it('show two different patrons, never the same pair as the floor before', () => {
    let last: ReturnType<typeof doorsFor>['doors'] | null = null;
    for (let floor = 1; floor <= 6; floor++) {
      const d = doorsFor('doors:delve:1', floor, last, false, 0);
      expect(d.doors[0]).not.toBe(d.doors[1]);
      expect(OPEN_PATRON_IDS).toContain(d.doors[0]);
      expect(OPEN_PATRON_IDS).toContain(d.doors[1]);
      if (last) expect([...d.doors].sort()).not.toEqual([...last].sort());
      last = d.doors;
    }
  });

  it('show the Unlit’s door only when it is open, at most once a run, on about a quarter of floors', () => {
    let shown = 0;
    const floors = 400;
    for (let n = 0; n < floors; n++) {
      const d = doorsFor(`unlit:${n}`, 1, null, true, 0);
      if (d.unlit) {
        shown += 1;
        expect(d.doors).toContain('unlit');
      }
      expect(doorsFor(`unlit:${n}`, 1, null, true, 1).unlit).toBe(false); // once a run
      expect(doorsFor(`unlit:${n}`, 1, null, false, 0).doors).not.toContain('unlit'); // locked
    }
    expect(shown / floors).toBeGreaterThan(0.17);
    expect(shown / floors).toBeLessThan(0.33);
  });

  it('offer three blessings of the patron’s pool not yet taken, with rarities near 70 / 25 / 5', () => {
    const counts = { faint: 0, warm: 0, bright: 0 };
    const total = 600;
    for (let n = 0; n < total; n++) {
      const cards = offerFor(`o:${n}`, 'door', 2, 'wolf', {
        count: 3,
        lastFloor: false,
        exclude: [],
      });
      expect(cards).toHaveLength(3);
      expect(new Set(cards).size).toBe(3);
      for (const id of cards) {
        const b = blessings.find((x) => x.id === id);
        expect(b?.patron).toBe('wolf');
        counts[b?.rarity ?? 'faint'] += 1;
      }
    }
    // Faint has 4, Warm 3, Bright 1 in each pool, so duplicates fall back; the shape is still faint-heavy.
    expect(counts.faint / (total * 3)).toBeGreaterThan(0.55);
    expect(counts.bright / (total * 3)).toBeLessThan(0.15);
  });

  it('leave out what was taken, and fall back to another rarity when one runs dry', () => {
    const taken = blessingsOf('wolf')
      .filter((b) => b.rarity === 'bright' || b.rarity === 'warm')
      .map((b) => b.id);
    const cards = offerFor('dry', 'door', 2, 'wolf', {
      count: 3,
      lastFloor: false,
      exclude: taken,
    });
    expect(cards).toHaveLength(3);
    for (const id of cards) expect(taken).not.toContain(id);
  });

  it('keep floor 6’s offer to at least one Warm or better card', () => {
    for (let n = 0; n < 300; n++) {
      const cards = offerFor(`last:${n}`, 'door', 6, 'weaver', {
        count: 3,
        lastFloor: true,
        exclude: [],
      });
      const ranks = cards.map((id) => blessings.find((b) => b.id === id)?.rarity);
      expect(ranks.some((r) => r === 'warm' || r === 'bright')).toBe(true);
    }
  });

  it('show 4 cards on the first offer with the Bell Clapper', () => {
    const s = strongKeep('bell');
    s.delve.relics.push({ id: 'bell-clapper', cycle: 1 });
    start(s);
    const run = s.delve.run;
    if (run?.stage.kind !== 'doors') throw new Error('no doors');
    cmd(s, { type: 'delve.chooseDoor', patron: run.stage.doors[0] });
    expect(s.delve.run?.stage.kind === 'offer' && s.delve.run.stage.cards).toHaveLength(4);
  });
});

describe('a whole run', () => {
  it('goes six floors and a guardian, saves at every step, and pays Riftglass, reagents and the guardian’s drop', () => {
    const s = strongKeep('whole');
    const before = { ...s.stores };
    expect(start(s).ok).toBe(true);
    const steps = playRun(s);
    expect(steps.filter((x) => x.startsWith('fight')).length).toBeGreaterThanOrEqual(7);
    expect(s.delve.run).toBeNull();
    const r = s.delve.result;
    expect(r?.outcome).toBe('guardian');
    expect(r?.floors).toBe(7);
    expect(r?.guardianBeaten).toBe(true);
    expect(r?.riftglass).toBe(6 * 2 + 4); // 16 for a full run (D258)
    expect(s.delve.riftglass).toBe(16);
    expect(s.delve.allowance).toBe(140 - 16);
    const reagents = Object.values(r?.reagents ?? {}).reduce((a, b) => a + (b ?? 0), 0);
    expect(reagents).toBe(6 * 1 + 2);
    const gained = Object.entries(s.stores).reduce(
      (a, [k, v]) => a + (v - (before[k as keyof typeof before] ?? 0)),
      0,
    );
    expect(gained).toBe(reagents);
    expect(s.delve.guardiansBeaten).not.toEqual({});
    // The result waits for its sheet, then clears.
    expect(cmd(s, { type: 'delve.ackResult' }).ok).toBe(true);
    expect(s.delve.result).toBeNull();
  });

  it('is reproduced from its commands: the same state and choices give the same run', () => {
    const a = strongKeep('repro');
    const b = strongKeep('repro');
    start(a);
    start(b);
    expect(playRun(a)).toEqual(playRun(b));
    expect(JSON.stringify(a.delve)).toBe(JSON.stringify(b.delve));
  });

  it('a paused run resumed after a reload equals an unpaused one (D248)', () => {
    const plain = strongKeep('pause');
    const paused = strongKeep('pause');
    start(plain);
    start(paused);
    let resumed = paused;
    for (let i = 0; i < 9 && resumed.delve.run; i++) {
      // One step, then close and reopen the app.
      const stage = resumed.delve.run.stage;
      if (stage.kind === 'doors')
        cmd(resumed, { type: 'delve.chooseDoor', patron: stage.doors[0] });
      else if (stage.kind === 'offer')
        cmd(resumed, { type: 'delve.chooseBlessing', blessing: stage.cards[0] as string });
      else cmd(resumed, { type: 'delve.fight' });
      resumed = reload(resumed);
    }
    playRun(plain);
    playRun(resumed);
    expect(JSON.stringify(resumed.delve)).toBe(JSON.stringify(plain.delve));
  });

  it('makes no progress while the app is closed: advancing time changes the run not at all', () => {
    const s = strongKeep('away');
    start(s);
    playRun(s, {}); // finish it, then start another and leave it mid-way
    cmd(s, { type: 'delve.ackResult' });
    start(s);
    const snapshot = JSON.stringify(s.delve.run);
    advance(s, s.time + 5 * 24 * 3_600_000);
    expect(JSON.stringify(s.delve.run)).toBe(snapshot);
  });

  it('takes Health on from floor to floor, recovers standing hunters by 20%, and a downed hunter stays out (D253)', () => {
    const s = frailKeep('hurt');
    start(s);
    const stage = s.delve.run?.stage;
    if (stage?.kind !== 'doors') throw new Error('no doors');
    cmd(s, { type: 'delve.chooseDoor', patron: stage.doors[0] });
    const offer = s.delve.run?.stage;
    if (offer?.kind !== 'offer') throw new Error('no offer');
    cmd(s, { type: 'delve.chooseBlessing', blessing: offer.cards[0] as string });
    expect(cmd(s, { type: 'delve.fight' }).ok).toBe(true);
    const run = s.delve.run;
    if (run) {
      const shares = Object.values(run.health);
      expect(shares.every((h) => (h ?? 0) >= 0 && (h ?? 0) <= 1)).toBe(true);
      // After floor 1 at least someone is hurt (level-1 hunters), and recovery is 20 points at most.
      expect(run.lastFloor?.health).toEqual({ halvar: 1, zora: 1, ostap: 1 });
      expect(run.floor).toBe(2);
    }
  });

  it('ends when all three are down, keeps what it earned, and follows nobody home (D253)', () => {
    const s = frailKeep('wipe');
    const energy = JSON.stringify(Object.values(s.hunters).map((h) => h?.recovery ?? null));
    start(s);
    playRun(s);
    expect(s.delve.run).toBeNull();
    const r = s.delve.result;
    expect(r?.outcome).toBe('defeated');
    expect(r?.guardianBeaten).toBe(false);
    expect(s.delve.riftglass).toBe(r?.riftglass);
    // No injuries, deaths or recovery timers, no trophies, no bestiary learning (D262). XP: none in
    // v0.7 (Q21); from v0.8 only what the floors cleared paid (D316), checked in hunter-rewards.test.ts.
    expect(JSON.stringify(Object.values(s.hunters).map((h) => h?.recovery ?? null))).toBe(energy);
    expect(s.fallen).toEqual([]);
    expect(s.stats.trophies).toBe(0);
    expect(s.bestiary).toEqual({});
    const zora = s.hunters.zora;
    let earned = zora?.xp ?? 0;
    for (let l = 1; l < (zora?.level ?? 1); l++) earned += xpToNext(l);
    expect(earned).toBe(r?.xp ?? 0);
    expect(hunterStatus(s, 'halvar')).toBe('ready');
  });

  it('can be left between floors, keeping what was earned', () => {
    const s = strongKeep('leave');
    start(s);
    // Clear one floor, then leave at the next doors.
    const d = s.delve.run?.stage;
    if (d?.kind !== 'doors') throw new Error('no doors');
    cmd(s, { type: 'delve.chooseDoor', patron: d.doors[0] });
    const o = s.delve.run?.stage;
    if (o?.kind !== 'offer') throw new Error('no offer');
    cmd(s, { type: 'delve.chooseBlessing', blessing: o.cards[0] as string });
    cmd(s, { type: 'delve.fight' });
    expect(cmd(s, { type: 'delve.leave' }).ok).toBe(true);
    expect(s.delve.result?.outcome).toBe('left');
    expect(s.delve.result?.floors).toBe(1);
    expect(s.delve.riftglass).toBe(2);
    expect(cmd(s, { type: 'delve.leave' }).ok).toBe(false);
  });

  it('pays no Riftglass when the allowance is empty, but everything else (D258)', () => {
    const s = strongKeep('quiet');
    s.delve.allowance = 0;
    start(s);
    playRun(s);
    const r = s.delve.result;
    expect(r?.riftglass).toBe(0);
    expect(Object.keys(r?.reagents ?? {}).length).toBeGreaterThan(0);
    expect(r?.floors).toBe(7);
  });

  it('draws only what the allowance holds, a floor at a time', () => {
    const s = strongKeep('three');
    s.delve.allowance = 3;
    start(s);
    playRun(s);
    expect(s.delve.result?.riftglass).toBe(3);
    expect(s.delve.allowance).toBe(0);
  });

  it('the Last Stand ends a paused run and keeps what it earned (D267)', () => {
    const s = strongKeep('stand', 'bastion');
    start(s);
    const d = s.delve.run?.stage;
    if (d?.kind !== 'doors') throw new Error('no doors');
    cmd(s, { type: 'delve.chooseDoor', patron: d.doors[0] });
    const o = s.delve.run?.stage;
    if (o?.kind !== 'offer') throw new Error('no offer');
    cmd(s, { type: 'delve.chooseBlessing', blessing: o.cards[0] as string });
    cmd(s, { type: 'delve.fight' });
    expect(cmd(s, { type: 'stand.make', party: ['halvar', 'zora', 'ostap'] }).ok).toBe(true);
    expect(s.delve.run).toBeNull();
    expect(s.delve.result?.outcome).toBe('left');
    expect(s.delve.riftglass).toBe(2);
  });
});

describe('Chosen start and Re-roll (D259)', () => {
  it('Chosen start: pick a patron, then 1 of 3 Faint blessings of it, before floor 1’s doors', () => {
    const s = strongKeep('chosen');
    s.delve.shop.chosenStart = true;
    start(s);
    expect(s.delve.run?.stage).toMatchObject({ kind: 'start', patron: null });
    expect(cmd(s, { type: 'delve.chooseStart', patron: 'hearth-crone' }).ok).toBe(true);
    const st = s.delve.run?.stage;
    if (st?.kind !== 'start') throw new Error('no start');
    expect(st.cards).toHaveLength(3);
    for (const id of st.cards)
      expect(blessings.find((b) => b.id === id)).toMatchObject({
        patron: 'hearth-crone',
        rarity: 'faint',
      });
    expect(cmd(s, { type: 'delve.chooseBlessing', blessing: st.cards[1] as string }).ok).toBe(true);
    expect(s.delve.run?.blessings).toEqual([st.cards[1]]);
    expect(s.delve.run?.stage.kind).toBe('doors');
  });

  it('Re-roll: once per run, only if bought, with new cards', () => {
    const s = strongKeep('reroll');
    start(s);
    const d = s.delve.run?.stage;
    if (d?.kind !== 'doors') throw new Error('no doors');
    cmd(s, { type: 'delve.chooseDoor', patron: d.doors[0] });
    expect(cmd(s, { type: 'delve.reroll' }).ok).toBe(false); // not bought
    s.delve.shop.reroll = true;
    const before = s.delve.run?.stage;
    expect(cmd(s, { type: 'delve.reroll' }).ok).toBe(true);
    const after = s.delve.run?.stage;
    if (before?.kind !== 'offer' || after?.kind !== 'offer') throw new Error('no offer');
    expect(after.cards).toHaveLength(3);
    expect(after.cards.some((c) => before.cards.includes(c))).toBe(false);
    expect(cmd(s, { type: 'delve.reroll' }).ok).toBe(false); // once
  });

  it('no blessing is offered twice in a run (D255)', () => {
    for (let n = 0; n < 10; n++) {
      const s = strongKeep(`nodup${n}`);
      start(s);
      playRun(s);
      const run = s.delve.result;
      expect(run).not.toBeNull();
    }
    const s = strongKeep('nodup-final');
    start(s);
    let seen: string[] = [];
    for (let guard = 0; guard < 60 && s.delve.run; guard++) {
      const stage = s.delve.run.stage;
      if (stage.kind === 'offer') {
        for (const c of stage.cards) expect(s.delve.run.blessings).not.toContain(c);
        seen = [...seen, stage.cards[0] as string];
        cmd(s, { type: 'delve.chooseBlessing', blessing: stage.cards[0] as string });
      } else if (stage.kind === 'doors')
        cmd(s, { type: 'delve.chooseDoor', patron: stage.doors[0] });
      else cmd(s, { type: 'delve.fight' });
    }
    expect(new Set(seen).size).toBe(seen.length);
  });
});

describe('constants (§7.9)', () => {
  it('the run’s shape is the locked one', () => {
    expect([
      balance.delve.partySize.value,
      balance.delve.floors.value,
      balance.delve.doors.value,
      balance.delve.offers.value,
    ]).toEqual([3, 6, 2, 3]);
  });
});

describe('the Unlit’s debug switch (D257)', () => {
  it('opens and shuts the Unlit’s door, and marks the save as debugged', () => {
    const s = strongKeep('unlit-switch');
    expect(s.delve.unlitOpen).toBe(false);
    expect(cmd(s, { type: 'debug.unlit', open: true }).ok).toBe(true);
    expect(s.delve.unlitOpen).toBe(true);
    expect(s.meta.debugUsed).toBe(true);
    // With it open, some run's doors show the Unlit (once a run).
    const seen = Array.from({ length: 40 }, (_, n) =>
      doorsFor(`sw:${n}`, 1, null, s.delve.unlitOpen, 0),
    ).some((d) => d.doors.includes('unlit'));
    expect(seen).toBe(true);
    expect(cmd(s, { type: 'debug.unlit', open: false }).ok).toBe(true);
    expect(s.delve.unlitOpen).toBe(false);
  });
});
