// Plan T8.12 (D319): "recorded with an older rules version" shows only when a replay comes out
// different from the record: for contract fights, stand waves and Delve floors. Both ways.
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { runFight } from '../../src/core/combat';
import { seeded } from '../../src/core/rng';
import { loadEnvelope } from '../../src/core/save';
import {
  fightReplayDiffers,
  floorReplayDiffers,
  standReplayDiffers,
} from '../../src/core/replay-check';
import { replayStand } from '../../src/core/stand/replay';
import type { FightRef, GameState } from '../../src/core/state/game-state';
import { cmd, PARTY, strongKeep } from '../delves/helpers';

const DIR = new URL('../saves/fixtures/', import.meta.url);
const load = (f: string): GameState => {
  const r = loadEnvelope(JSON.parse(readFileSync(new URL(f, DIR), 'utf8')));
  if (!r.ok) throw new Error(r.error);
  return r.value.state;
};
const replay = (ref: FightRef) =>
  runFight({
    party: ref.party,
    monster: ref.monster,
    location: ref.location,
    rolls: seeded(ref.seed),
    prep: ref.prep,
    alchemy: ref.alchemy,
  });
const fixtures = readdirSync(DIR).filter((f) => f.endsWith('.json'));

describe('no note when the replay matches, even if the version is older', () => {
  it.each(fixtures)(
    '%s: matching contract fights and stands (from rules version 4) get no note',
    (f) => {
      const s = load(f);
      for (const ref of s.log.recentFights)
        expect(fightReplayDiffers(ref, replay(ref))).toBe(false);
      for (const c of s.cycles)
        if (c.stand && c.stand.rulesVersion >= 4)
          expect(standReplayDiffers(c.stand, replayStand(c.stand))).toBe(false);
    },
  );

  it('some of those records are older than the current rules, and still get no note', () => {
    let older = 0;
    for (const f of fixtures)
      for (const ref of load(f).log.recentFights)
        if (ref.rulesVersion < 5) {
          older += 1;
          expect(fightReplayDiffers(ref, replay(ref))).toBe(false);
        }
    expect(older).toBeGreaterThan(0);
  });
});

describe('a note when the replay comes out different', () => {
  it('a contract fight whose record says the other result', () => {
    const ref = load(fixtures[fixtures.length - 1] ?? '').log.recentFights[0];
    if (!ref) throw new Error('no recorded fight');
    const flipped: FightRef = { ...ref, result: ref.result === 'win' ? 'loss' : 'win' };
    expect(fightReplayDiffers(flipped, replay(flipped))).toBe(true);
  });

  it('a stand whose record says it held another number of waves', () => {
    for (const f of fixtures) {
      const stand = load(f).cycles.find((c) => c.stand && c.stand.rulesVersion >= 4)?.stand;
      if (!stand) continue;
      expect(
        standReplayDiffers({ ...stand, wavesHeld: stand.wavesHeld + 1 }, replayStand(stand)),
      ).toBe(true);
      return;
    }
    throw new Error('no stand in any fixture');
  });

  it('a Delve floor whose record says the other result; none when there is no floor', () => {
    const s = strongKeep('older-floor');
    expect(floorReplayDiffers(s)).toBe(false); // no run in progress
    expect(cmd(s, { type: 'delve.start', party: PARTY }).ok).toBe(true);
    for (let guard = 0; guard < 10 && !s.delve.run?.lastFloor; guard++) {
      const stage = s.delve.run?.stage;
      if (stage?.kind === 'start')
        cmd(
          s,
          stage.patron
            ? { type: 'delve.chooseBlessing', blessing: stage.cards[0] as string }
            : { type: 'delve.chooseStart', patron: 'wolf' },
        );
      else if (stage?.kind === 'doors')
        cmd(s, { type: 'delve.chooseDoor', patron: stage.doors[0] });
      else if (stage?.kind === 'offer')
        cmd(s, { type: 'delve.chooseBlessing', blessing: stage.cards[0] as string });
      else cmd(s, { type: 'delve.fight' });
    }
    const last = s.delve.run?.lastFloor;
    if (!last) throw new Error('no floor was fought');
    expect(floorReplayDiffers(s)).toBe(false); // an honest record
    last.result = last.result === 'win' ? 'loss' : 'win';
    expect(floorReplayDiffers(s)).toBe(true);
  });
});
