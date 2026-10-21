// Plan T9.9 (GDD §5.9.3, §5.12.9, D363, D386): the Dross-Tide in the Last Stand.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { apply } from '../../src/core/commands/apply';
import { runStand } from '../../src/core/stand/engine';
import { previewInputFor, standInputFor } from '../../src/core/stand/from-state';
import { actSixBegun, fixStandPool, standPoolOf } from '../../src/core/stand/pool';
import { replayStand } from '../../src/core/stand/replay';
import { speciesForTier, waveAt, waveList, waveTier } from '../../src/core/stand/waves';
import { encodeSaveFile, loadEnvelope, makeEnvelope } from '../../src/core/save';
import { catchUpNow } from '../../src/core/sim/offline';
import type { GameState } from '../../src/core/state/game-state';
import { freshAct } from '../../src/core/state/story-state';
import { snap } from '../combat/helpers';

const owner = (): GameState => {
  const env = JSON.parse(
    readFileSync(new URL('../saves/fixtures/v8-owner.json', import.meta.url), 'utf8'),
  );
  const r = loadEnvelope(env);
  if (!r.ok) throw new Error(r.error);
  catchUpNow(r.value.state, r.value.state.time);
  return r.value.state;
};

const beginActSix = (s: GameState): void => {
  s.story.acts.push(freshAct(6, s.cycle.number, s.time));
};

const SIX = (['halvar', 'zora', 'ostap', 'bjarna', 'vesna', 'radek'] as const).map((id) =>
  snap(id, { level: 8, weapon: 'iron-blade' }),
);

const input = (pool?: 'base' | 'dross') => ({
  seed: 'test:stand:1',
  threat: 0,
  party: SIX,
  prep: { oils: {}, potions: {}, bombs: [] },
  bombs: {},
  defenses: { walls: 0, watchtower: 0 },
  relics: [],
  knowledge: {},
  ...(pool ? { pool } : {}),
});

describe('the wave list by pool', () => {
  it('a base pool is exactly the old list', () => {
    for (let k = 0; k < 20; k++) {
      const seed = `g:stand:${k}`;
      expect(waveList(seed, 30, 'base')).toEqual(waveList(seed, 30));
      for (const w of waveList(seed, 30)) expect(w.monster).not.toBe('dross-tide');
    }
  });

  it('a dross pool differs from base only by the Dross-Tide', () => {
    let dross = 0;
    for (let k = 0; k < 40; k++) {
      const seed = `g:stand:${k}`;
      const base = waveList(seed, 30);
      waveList(seed, 30, 'dross').forEach((w, i) => {
        if (w.monster === 'dross-tide') dross += 1;
        else expect(w).toEqual(base[i]);
        expect(w.tier).toBe(base[i]?.tier);
      });
    }
    expect(dross).toBeGreaterThan(0);
  });

  it('the Dross-Tide is as likely as any one species, and no wave is guaranteed', () => {
    // Tier 2: how many species reach it, plus the Dross-Tide.
    const per = 1 / (speciesForTier(waveTier(1)).length + 1);
    let hit = 0;
    const seeds = 3000;
    let seedsWithNone = 0;
    for (let k = 0; k < seeds; k++) {
      if (waveAt(`s${k}`, 1, 'dross').monster === 'dross-tide') hit += 1;
      if (!waveList(`s${k}`, 12, 'dross').some((w) => w.monster === 'dross-tide'))
        seedsWithNone += 1;
    }
    expect(Math.abs(hit / seeds - per)).toBeLessThan(0.03);
    expect(seedsWithNone).toBeGreaterThan(0);
  });
});

describe('the engine', () => {
  it('a stand with no pool named is what it always was', () => {
    expect(runStand(input())).toEqual(runStand(input('base')));
  });

  it('a dross stand fights the Dross-Tide with its tier-scaled Health, and can be replayed', () => {
    let found = false;
    for (let k = 0; k < 40 && !found; k++) {
      const r = runStand({ ...input('dross'), seed: `d:stand:${k}` });
      const w = r.waves.find((x) => x.wave.monster === 'dross-tide');
      if (w) {
        found = true;
        const m = w.fight.monsters[0];
        expect(m?.name).toBe('The Dross-Tide');
        // 320 Health at tier 2, no Delve guardian multiplier (D363, D369).
        if (w.wave.tier === 2) expect(m?.maxHealth).toBe(320);
      }
    }
    expect(found).toBe(true);
  });
});

describe('which pool a cycle uses', () => {
  it('fixes `base` at Bastion when Act VI has not begun, `dross` when it has', () => {
    const a = owner();
    const rec = a.cycles[a.cycles.length - 1];
    if (!rec) throw new Error('no cycle');
    rec.standPool = null;
    fixStandPool(a);
    expect(rec.standPool).toBe('base');

    const b = owner();
    beginActSix(b);
    const recB = b.cycles[b.cycles.length - 1];
    if (!recB) throw new Error('no cycle');
    recB.standPool = null;
    expect(actSixBegun(b)).toBe(true);
    fixStandPool(b);
    expect(recB.standPool).toBe('dross');
  });

  it('keeps `base` when Act VI begins after the pool was fixed', () => {
    const s = owner();
    const rec = s.cycles[s.cycles.length - 1];
    if (!rec) throw new Error('no cycle');
    rec.standPool = 'base';
    beginActSix(s);
    expect(standPoolOf(s)).toBe('base');
    expect(standInputFor(s, ['halvar'], { oils: {}, potions: {} }).pool).toBeUndefined();
  });

  it('is fixed by the Rank-up to Bastion', () => {
    const s = owner();
    const rec = s.cycles[s.cycles.length - 1];
    if (!rec) throw new Error('no cycle');
    rec.standPool = null;
    s.cycle.age = 'citadel';
    beginActSix(s);
    apply(s, { type: 'debug.unlockAge', age: 'bastion' }, s.time);
    expect(rec.standPool).toBe('dross');
  });

  it('the preview uses the same pool as the real stand', () => {
    const s = owner();
    beginActSix(s);
    const rec = s.cycles[s.cycles.length - 1];
    if (rec) rec.standPool = 'dross';
    const party = s.roster.active.slice(0, 6);
    const kit = { oils: {}, potions: {} };
    expect(previewInputFor(s, party, kit).stand.pool).toBe('dross');
    expect(standInputFor(s, party, kit).pool).toBe('dross');
  });
});

describe('making a dross stand', () => {
  const make = () => {
    const s = owner();
    s.cycle.age = 'bastion';
    beginActSix(s);
    const rec = s.cycles[s.cycles.length - 1];
    if (!rec) throw new Error('no cycle');
    rec.standPool = 'dross';
    rec.stand = null;
    const party = s.roster.active.slice(0, 6);
    return { s, party, rec };
  };

  it('counts nowhere: no bestiary entry, knowledge level or kill from it', () => {
    const { s, party } = make();
    const before = JSON.stringify(s.bestiary);
    const kills = JSON.stringify(s.stats.kills);
    const r = apply(s, { type: 'stand.make', party, prep: { oils: {}, potions: {} } }, s.time);
    expect(r.ok).toBe(true);
    // The bestiary and the kill counts are untouched by any stand (the Long Night keeps them).
    expect(JSON.stringify(s.bestiary)).toBe(before);
    expect(JSON.stringify(s.stats.kills)).toBe(kills);
  });

  it('records the pool, replays line for line, and survives a save', () => {
    const { s, party, rec } = make();
    apply(s, { type: 'stand.make', party, prep: { oils: {}, potions: {} } }, s.time);
    expect(rec.stand?.pool).toBe('dross');
    if (!rec.stand) throw new Error('no stand');
    expect(replayStand(rec.stand).wavesHeld).toBe(rec.stand.wavesHeld);
    const back = loadEnvelope(JSON.parse(encodeSaveFile(makeEnvelope(s, 0))));
    if (!back.ok) throw new Error(back.error);
    const saved = back.value.state.cycles.find((c) => c.number === rec.number)?.stand;
    expect(saved?.pool).toBe('dross');
    if (saved) expect(replayStand(saved).wavesHeld).toBe(rec.stand.wavesHeld);
  });

  it('a base stand records no pool at all', () => {
    const s = owner();
    s.cycle.age = 'bastion';
    const rec = s.cycles[s.cycles.length - 1];
    if (!rec) throw new Error('no cycle');
    rec.standPool = 'base';
    rec.stand = null;
    apply(
      s,
      { type: 'stand.make', party: s.roster.active.slice(0, 6), prep: { oils: {}, potions: {} } },
      s.time,
    );
    expect(s.cycles.find((c) => c.number === rec.number)?.stand?.pool).toBeUndefined();
  });
});
