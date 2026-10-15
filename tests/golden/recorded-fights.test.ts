// Plan T8.8 (D308): rulesVersion 5 changed no old fight. Every contract fight, stand and Delve
// floor recorded in the owner's real saves replays to the result it was recorded with. (The
// seeded goldens and the GDD §5.5.1 fight, line for line, are in this folder's other tests.)
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { runFight } from '../../src/core/combat';
import { seeded } from '../../src/core/rng';
import { loadEnvelope } from '../../src/core/save';
import { replayLastFloor } from '../../src/core/delves/run';
import { replayStand } from '../../src/core/stand/replay';
import type { FightRef, GameState } from '../../src/core/state/game-state';

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

describe('recorded fights replay to what was recorded (rulesVersion 5)', () => {
  let fights = 0;
  let stands = 0;
  it.each(fixtures)('%s: every contract fight, stand and Delve floor', (f) => {
    const s = load(f);
    for (const ref of s.log.recentFights) {
      expect(replay(ref).result, `${f} ${ref.contractId}`).toBe(ref.result);
      fights += 1;
    }
    for (const c of s.cycles) {
      // A stand recorded under rules version 3 or earlier replays with other monsters by design (D175):
      // the app shows "recorded with an older rules version". From version 4 on it must match.
      if (!c.stand || c.stand.rulesVersion < 4) continue;
      expect(replayStand(c.stand).wavesHeld, `${f} cycle ${c.number}`).toBe(c.stand.wavesHeld);
      stands += 1;
    }
    const floor = replayLastFloor(s);
    if (floor) expect(floor.result).toBe(s.delve.run?.lastFloor?.result);
  });

  it('replayed a real number of fights and stands', () => {
    expect(fights).toBeGreaterThan(50);
    expect(stands).toBeGreaterThan(0);
  });
});
