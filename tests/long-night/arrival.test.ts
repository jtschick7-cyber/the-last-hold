// Plan T4.10 (GDD §5.9.8, D112): the v0.4 arrival, on the owner's real v0.3 save
// (tests/saves/fixtures/v3-owner.json): migration, the arrival stand, the reset.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { apply } from '../../src/core/commands';
import { standProblem } from '../../src/core/commands/stand';
import { num } from '../../src/core/balance-access';
import { loadEnvelope } from '../../src/core/save';
import { embersPayout } from '../../src/core/stand/embers';
import { arrivalCapValue, previewInputFor } from '../../src/core/stand/from-state';
import { suggestSix } from '../../src/core/stand/suggest';
import { standKit } from '../../src/core/policies/long-night';
import { createNewGame } from '../../src/core/state/new-game';
import type { GameState } from '../../src/core/state/game-state';
import { keepRich } from '../contracts/helpers';

const owner = (): GameState => {
  const raw = JSON.parse(
    readFileSync(new URL('../saves/fixtures/v3-owner.json', import.meta.url), 'utf8'),
  ) as unknown;
  const r = loadEnvelope(raw);
  if (!r.ok) throw new Error(r.error);
  return r.value.state;
};

describe('the v0.4 arrival (GDD §5.9.8)', () => {
  it('the cap is 1.2 × the tuned cycle-1 median (D138)', () => {
    expect(num('longNightArrival.cycle1MedianEmbers')).toBe(193);
    expect(arrivalCapValue()).toBeCloseTo(1.2 * 193);
  });

  it("takes the owner's v0.3 save through migration, the arrival stand and the reset", () => {
    const s = owner();
    expect(s.arrivalDue).toBe(true);
    const rank = s.cycle.age;
    expect(rank).not.toBe('bastion'); // a v0.3 save is at most a Keep
    // The stand is open at the save's own Rank, with Threat 0 and no defenses.
    expect(standProblem(s)).toBeNull();
    expect(s.threat).toBe(0);
    expect(s.buildings.walls + s.buildings.watchtower).toBe(0);
    const party = suggestSix(s);
    expect(party.length).toBeGreaterThan(0);
    const kit = standKit(s, party);
    // The preview carries the same cap.
    expect(previewInputFor(s, party, kit, 5).trophyCap).toBeCloseTo(arrivalCapValue());
    const trophies = s.stats.trophies;
    const running = s.running.length;
    const won = s.stats.contractsWon + s.stats.contractsLost;
    expect(apply(s, { type: 'stand.make', party, prep: kit }, s.time).ok).toBe(true);
    const stand = s.cycles[0]?.stand;
    if (!stand) throw new Error('no stand recorded');
    expect(stand.arrival).toBe(true);
    expect(stand.rank).toBe(rank);
    expect(stand.threat).toBe(0);
    expect(stand.defenses).toEqual({ walls: 0, watchtower: 0 });
    // Running contracts finished first, with their real result.
    expect(s.stats.contractsWon + s.stats.contractsLost).toBe(won + running);
    // Only the trophies part is capped; the waves part (× the save's Rank) is on top.
    // The owner's save has 2 trophies and nothing running: well under the cap.
    expect(running).toBe(0);
    expect(stand.embers.trophies).toBe(trophies * num('embers.perTrophy'));
    expect(stand.embers.total).toBe(Math.floor(stand.embers.waves + stand.embers.trophies));
    // The reset: cycle 2 in the Hamlet, the arrival done, Threat counting from now.
    expect(s.arrivalDue).toBe(false);
    expect(s.cycle).toEqual({ number: 2, age: 'hamlet' });
    expect(s.embers).toBeGreaterThanOrEqual(stand.embers.total);
    expect(standProblem(s)).toBe('The Last Stand opens at Bastion.');
    // v5 (D149): the cycle after the v0.4 arrival begins Act I.
    expect(s.cycles.map((c) => c.act)).toEqual([null, 1]);
    expect(s.story.acts.map((a) => [a.act, a.cycle])).toEqual([[1, 2]]);
  });

  it('caps the trophies part when it is over the cap, and says so in the breakdown', () => {
    const p = embersPayout({
      rank: 'keep',
      waves: 3,
      threat: 0,
      trophies: 500,
      trophyCap: arrivalCapValue(),
    });
    expect(p.trophies).toBeCloseTo(arrivalCapValue());
    expect(JSON.stringify(p.breakdown)).toContain('capped at');
    // The result sheet shows the saved, already-capped part with the same note.
    const again = embersPayout({
      rank: 'keep',
      waves: 3,
      threat: 0,
      trophies: p.trophies,
      trophyCap: arrivalCapValue(),
    });
    expect(again.value).toBe(p.value);
    expect(JSON.stringify(again.breakdown)).toContain('capped at');
  });

  it('a new game never faces it; the debug action makes any save face it', () => {
    const s = createNewGame('arrival-debug', Date.UTC(2024, 0, 1));
    expect(s.arrivalDue).toBe(false);
    expect(standProblem(s)).toBe('The Last Stand opens at Bastion.');
    expect(apply(s, { type: 'debug.runArrival' }, s.time).ok).toBe(true);
    expect(s.arrivalDue).toBe(true);
    expect(s.meta.debugUsed).toBe(true);
    expect(standProblem(s)).toBeNull();
    expect(apply(s, { type: 'debug.runArrival' }, s.time).ok).toBe(false);
  });

  it('a stand with more trophies than the cap pays exactly the cap for them', () => {
    const s = keepRich('arrival-cap');
    expect(apply(s, { type: 'debug.runArrival' }, s.time).ok).toBe(true);
    s.stats.trophies = 500;
    const party = suggestSix(s);
    expect(apply(s, { type: 'stand.make', party, prep: standKit(s, party) }, s.time).ok).toBe(true);
    const stand = s.cycles[0]?.stand;
    expect(stand?.arrival).toBe(true);
    expect(stand?.embers.trophies).toBeCloseTo(arrivalCapValue());
  });
});
