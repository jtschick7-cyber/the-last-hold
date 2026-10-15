// Plan T7.13a (GDD §9.15): the Rift card, the entry sheet, the floor playback and the away lines
// are built in core, so the screens only draw them. The playback is the fight `delve.fight`
// works out, replayed from the same seed.
import { describe, expect, it } from 'vitest';
import { RIFT_QUIET_LINE } from '../../src/content/delves/rift-text';
import { createNewGame } from '../../src/core/state/new-game';
import { advance, catchUpNow } from '../../src/core/sim';
import { replayLastFloor } from '../../src/core/delves/run';
import { awayDelveLines, entryView, floorPlayback, riftCardView } from '../../src/core/delves/view';
import { HOUR, T0 } from '../contracts/helpers';
import { cmd, PARTY, strongKeep } from './helpers';

const startToFight = (seed: string, guardian = false) => {
  const s = strongKeep(seed);
  expect(cmd(s, { type: 'delve.start', party: PARTY }).ok).toBe(true);
  const reach = (): void => {
    const run = s.delve.run;
    if (!run) throw new Error('the run ended early');
    if (run.stage.kind === 'doors')
      expect(cmd(s, { type: 'delve.chooseDoor', patron: run.stage.doors[0] }).ok).toBe(true);
    else if (run.stage.kind === 'offer')
      expect(
        cmd(s, { type: 'delve.chooseBlessing', blessing: run.stage.cards[0] as string }).ok,
      ).toBe(true);
    else expect(cmd(s, { type: 'delve.fight' }).ok).toBe(true);
  };
  for (let i = 0; i < 80; i++) {
    const run = s.delve.run;
    if (!run) throw new Error('the run ended before the fight wanted');
    if (run.stage.kind === 'fight' && (!guardian || run.floor === 7)) return s;
    reach();
  }
  throw new Error('never reached the fight');
};

describe('the Rift card (§9.15)', () => {
  it('is not there before the Keep, and is there after', () => {
    expect(riftCardView(createNewGame('hamlet', T0))).toBeNull();
    expect(riftCardView(strongKeep('card'))).not.toBeNull();
  });

  it('says what is waiting and what the allowance banks up to', () => {
    const s = strongKeep('line');
    s.delve.allowance = 40.9;
    const v = riftCardView(s);
    expect(v?.line).toBe('Riftglass: 40 waiting, banks up to 140');
    expect(v?.action).toBe('delve');
    expect(v?.label).toBe('Delve');
    expect(v?.badge).toBe(false);
  });

  it('says the rift is quiet when nothing is waiting', () => {
    const s = strongKeep('quiet');
    s.delve.allowance = 0.4;
    expect(riftCardView(s)?.line).toBe(RIFT_QUIET_LINE);
    expect(riftCardView(s)?.quiet).toBe(true);
  });

  it('badges a full allowance, a paused run and an unread result', () => {
    const s = strongKeep('badge');
    expect(riftCardView(s)?.badge).toBe(true); // strongKeep starts at the full 140
    s.delve.allowance = 10;
    expect(riftCardView(s)?.badge).toBe(false);
    cmd(s, { type: 'delve.start', party: PARTY });
    expect(riftCardView(s)?.badge).toBe(true);
    expect(riftCardView(s)?.label).toBe('Continue (floor 1)');
    expect(riftCardView(s)?.action).toBe('continue');
    cmd(s, { type: 'delve.leave' });
    expect(riftCardView(s)?.action).toBe('result');
    expect(riftCardView(s)?.badge).toBe(true);
    cmd(s, { type: 'delve.ackResult' });
    expect(riftCardView(s)?.badge).toBe(false);
  });

  it('calls the seventh floor the guardian', () => {
    const s = startToFight('guard', true);
    expect(riftCardView(s)?.label).toBe('Continue (the guardian)');
  });

  it("the waiting number's breakdown is the allowance's", () => {
    const s = strongKeep('why');
    expect(riftCardView(s)?.waiting.breakdown.label).toBe('Riftglass waiting');
  });
});

describe('the entry sheet (§9.15)', () => {
  it('shows the depth of the Rank the way the GDD words it', () => {
    expect(entryView(strongKeep('depth')).depth).toBe('Keep: floors tier 2–3, guardian tier 4');
  });

  it('suggests the three, and greys out whoever cannot go with the reason', () => {
    const s = strongKeep('rows');
    const v = entryView(s);
    expect(v.suggested).toEqual(PARTY);
    expect(v.partySize).toBe(3);
    expect(v.rows.find((r) => r.id === 'zora')?.problem).toBeNull();
    s.roster.active = s.roster.active.filter((h) => h !== 'bjarna');
    const z = s.hunters.zora;
    if (z) z.recovery = { kind: 'wounded', until: s.time + 1e6 } as never;
    const w = entryView(s);
    expect(w.rows.find((r) => r.id === 'bjarna')?.problem).toBe('in the reserve');
    expect(w.rows.find((r) => r.id === 'zora')?.problem).toBe('recovering');
  });

  it('knows the allowance and Chosen start', () => {
    const s = strongKeep('start');
    s.delve.allowance = 0;
    s.delve.shop.chosenStart = true;
    const v = entryView(s);
    expect(v.quiet).toBe(true);
    expect(v.chosenStart).toBe(true);
  });
});

describe('the floor playback (§9.15)', () => {
  it('is only there when the run is at a fight', () => {
    const s = strongKeep('none');
    expect(floorPlayback(s)).toBeNull();
    cmd(s, { type: 'delve.start', party: PARTY });
    expect(floorPlayback(s)).toBeNull();
  });

  it('is the fight delve.fight works out: same result, same Health after', () => {
    const s = startToFight('same');
    const pb = floorPlayback(s);
    if (!pb) throw new Error('no playback');
    const before = JSON.stringify(s);
    expect(floorPlayback(s)).toEqual(pb); // deterministic
    expect(JSON.stringify(s)).toBe(before); // changes nothing
    cmd(s, { type: 'delve.fight' });
    expect(s.delve.run?.lastFloor?.result ?? 'loss').toBe(pb.result);
    // The next floor's recovery has been added to the run's Health since, so compare with the fight itself.
    const replay = replayLastFloor(s);
    for (const h of replay?.hunters ?? [])
      expect(pb.end[h.id]).toBeCloseTo(h.downed ? 0 : h.health / h.maxHealth, 9);
    for (const m of replay?.monsters ?? [])
      expect(pb.end[m.id]).toBeCloseTo(m.health / m.maxHealth, 9);
  });

  it('names the floor and the family ahead, with the species', () => {
    const s = startToFight('title');
    const pb = floorPlayback(s);
    expect(pb?.title).toBe('Floor 1 of 6');
    expect(pb?.subtitle).toMatch(/^Ahead: [A-Z][A-Za-z &]+: /);
    expect(pb?.combatants.filter((c) => c.side === 'monster')).toHaveLength(2);
    expect(pb?.combatants.filter((c) => c.side === 'hunter').map((c) => c.id)).toEqual(PARTY);
  });

  it('every step carries every bar, and monster bars only go down', () => {
    const s = startToFight('bars');
    const pb = floorPlayback(s);
    if (!pb) throw new Error('no playback');
    expect(pb.steps.length).toBeGreaterThan(3);
    const ids = pb.combatants.map((c) => c.id);
    let last: Record<string, number> = Object.fromEntries(
      pb.combatants.map((c) => [c.id, c.start]),
    );
    for (const step of pb.steps) {
      expect(Object.keys(step.bars).sort()).toEqual([...ids].sort());
      for (const c of pb.combatants.filter((x) => x.side === 'monster'))
        expect(step.bars[c.id] as number).toBeLessThanOrEqual((last[c.id] as number) + 1e-9);
      last = { ...step.bars };
    }
    expect(pb.log.length).toBe(pb.steps.length);
  });

  it('carries Health in from the floor before', () => {
    const s = startToFight('carry');
    const h = s.delve.run;
    if (!h) throw new Error('no run');
    h.health.halvar = 0.4;
    const pb = floorPlayback(s);
    expect(pb?.combatants.find((c) => c.id === 'halvar')?.start).toBeCloseTo(0.4, 9);
  });

  it("the guardian's floor shows its name and its one line", () => {
    const s = startToFight('boss', true);
    const pb = floorPlayback(s);
    expect(pb?.guardian).toBe(true);
    expect(pb?.subtitle).toMatch(/^What it was: /);
    expect(pb?.combatants.filter((c) => c.side === 'monster')).toHaveLength(1);
    expect(pb?.combatants.find((c) => c.side === 'monster')?.spriteId).toMatch(
      /^sprite\.guardian\./,
    );
  });
});

describe('the away sheet lines (§9.15)', () => {
  it('says a Delve is waiting and how much Riftglass is waiting', () => {
    const s = strongKeep('away');
    cmd(s, { type: 'delve.start', party: PARTY });
    advance(s, s.time + 3 * HOUR);
    expect(awayDelveLines(s)).toEqual([
      'A Delve is waiting on floor 1.',
      'Riftglass waiting: 140 of 140.',
    ]);
  });

  it('is part of what catch-up returns, as it stood on return', () => {
    const s = strongKeep('summary');
    cmd(s, { type: 'delve.start', party: PARTY });
    const back = catchUpNow(s, s.time + 2 * HOUR);
    expect(back.delve).toEqual([
      'A Delve is waiting on floor 1.',
      'Riftglass waiting: 140 of 140.',
    ]);
  });

  it('has nothing to say before the Keep or with nothing waiting', () => {
    expect(awayDelveLines(createNewGame('x', T0))).toEqual([]);
    const s = strongKeep('empty');
    s.delve.allowance = 0.5;
    expect(awayDelveLines(s)).toEqual([]);
  });
});
