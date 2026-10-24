// Plan KV.8 (GDD §6.1, D546 (2), Q58): the Vigilant's two extra moves, and only those.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { apply, type Command } from '../../src/core/commands';
import { loadEnvelope } from '../../src/core/save';
import { catchUpNow } from '../../src/core/sim/offline';
import type { GameState } from '../../src/core/state/game-state';
import { POLICY_IDS } from '../../src/core/policies';
import { vigilantMoves, VIGILANT_LEVELS } from '../../src/core/policies/vigilant';
import { endingChoosable } from '../../src/core/story/remembering';
import { vigilView } from '../../src/core/systems/vigil';

const load = (f: string): GameState => {
  const r = loadEnvelope(
    JSON.parse(readFileSync(new URL(`../saves/fixtures/${f}`, import.meta.url), 'utf8')),
  );
  if (!r.ok) throw new Error(r.error);
  catchUpNow(r.value.state, r.value.state.time);
  return r.value.state;
};
const actOn = (s: GameState, seen: Command[]) => (cmd: Command) => {
  seen.push(cmd);
  return apply(s, cmd, s.time).ok;
};

describe('the Vigilant', () => {
  it('is a policy of its own', () => {
    expect(POLICY_IDS).toContain('vigilant');
    expect(VIGILANT_LEVELS).toBe(3);
  });

  it('does nothing before the gate is open and Act VI has been stood', () => {
    const s = load('v12.json');
    const seen: Command[] = [];
    expect(vigilantMoves(s, actOn(s, seen))).toEqual({ openedGate: false, switchedOn: false });
    expect(seen).toEqual([]);
  });

  it('with Act VI stood, opens the gate with the debug shortcut, then switches the vigil On', () => {
    const s = load('v13-played.json');
    s.vigil.on = false;
    s.vigil.stands = 0;
    // The played save already has the gate open; close it the way a Standard run leaves it.
    s.story.names = s.story.names.slice(0, 5);
    expect(endingChoosable(s)).toBe(false);
    const seen: Command[] = [];
    const moves = vigilantMoves(s, actOn(s, seen));
    expect(moves).toEqual({ openedGate: true, switchedOn: true });
    expect(seen.map((c) => c.type)).toEqual(['debug.rememberingOpenGate', 'vigil.set']);
    expect(s.meta.debugUsed).toBe(true);
    expect(vigilView(s).on).toBe(true);
  });

  it('switches On nothing more once its levels are made', () => {
    const s = load('v13-played.json');
    s.vigil.on = false;
    s.vigil.stands = VIGILANT_LEVELS;
    const seen: Command[] = [];
    expect(vigilantMoves(s, actOn(s, seen)).switchedOn).toBe(false);
  });
});
