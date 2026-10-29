// Plan TB.8b (technical design §23.3, Q61 yes): layout.setDefenses applies a Suggest layout list
// atomically. It moves only walls and towers, lifts front-row defenses not in the list to the Tray,
// and refuses the whole command (changing nothing) when a target is not a free front-row tile or a
// piece is not an unlocked wall or tower.
import { describe, expect, it } from 'vitest';
import type { HoldPieceId } from '../../src/content/hold-layout';
import { apply } from '../../src/core/commands/apply';
import type { GameState } from '../../src/core/state/game-state';
import { createNewGame } from '../../src/core/state/new-game';
import { canonicalLayout } from '../../src/core/systems/layout-catalog';
import { suggestLayout } from '../../src/core/systems/breach';

const isDefense = (id: string): boolean => id.startsWith('wall-') || id.startsWith('watchtower-');
const hold = (): GameState => {
  const s = createNewGame('set-defenses-seed', 0);
  s.cycle.age = 'bastion';
  s.buildings.walls = 15;
  s.buildings.watchtower = 15;
  s.layout = canonicalLayout();
  return s;
};
const move = (pieceId: string, x: number, y: number) => ({ pieceId: pieceId as HoldPieceId, x, y });
const others = (s: GameState): string =>
  JSON.stringify(Object.entries(s.layout.placed).filter(([id]) => !isDefense(id)));

describe('layout.setDefenses', () => {
  it('applies the suggestion: every listed defense is on its target, nothing else moves', () => {
    const s = hold();
    const before = others(s);
    const { moves } = suggestLayout(s);
    expect(moves.length).toBeGreaterThan(0);
    expect(apply(s, { type: 'layout.setDefenses', moves: [...moves] }, s.time).ok).toBe(true);
    for (const m of moves) expect(s.layout.placed[m.pieceId]).toEqual({ x: m.x, y: m.y });
    expect(others(s)).toBe(before);
  });

  it('lifts front-row defenses not in the list to the Tray, and leaves rows 3 to 7 alone', () => {
    const s = hold();
    s.layout.placed['wall-9' as HoldPieceId] = { x: 7, y: 6 };
    const rest = JSON.stringify(s.layout.placed['wall-9' as HoldPieceId]);
    const front = Object.entries(s.layout.placed).filter(([id, at]) => isDefense(id) && at.y < 3);
    expect(front.length).toBeGreaterThan(1);
    expect(apply(s, { type: 'layout.setDefenses', moves: [move('wall-1', 0, 0)] }, s.time).ok).toBe(
      true,
    );
    for (const [id] of front)
      if (id !== 'wall-1') expect(s.layout.placed[id as HoldPieceId]).toBeUndefined();
    expect(JSON.stringify(s.layout.placed['wall-9' as HoldPieceId])).toBe(rest);
  });

  it('an empty list lifts every front-row defense', () => {
    const s = hold();
    expect(apply(s, { type: 'layout.setDefenses', moves: [] }, s.time).ok).toBe(true);
    expect(Object.entries(s.layout.placed).filter(([id, at]) => isDefense(id) && at.y < 3)).toEqual(
      [],
    );
  });

  const refused = (name: string, make: (s: GameState) => unknown): void =>
    it(`refuses and changes nothing: ${name}`, () => {
      const s = hold();
      const before = JSON.stringify(s.layout);
      const r = apply(s, { type: 'layout.setDefenses', moves: make(s) as never }, s.time);
      expect(r.ok).toBe(false);
      expect(JSON.stringify(s.layout)).toBe(before);
    });
  refused('a target outside the front rows', () => [move('wall-1', 0, 3)]);
  refused('a target outside the grid', () => [move('wall-1', 8, 0)]);
  refused('a fractional target', () => [move('wall-1', 0.5, 0)]);
  refused('a target another building holds', (s) => {
    const held = Object.entries(s.layout.placed).find(
      ([k, v]) => !isDefense(k) && k !== 'hearth-hall' && v.y < 3,
    );
    expect(held).toBeDefined();
    return [move('wall-1', held?.[1].x ?? 0, held?.[1].y ?? 0)];
  });
  refused('two pieces on one tile', () => [move('wall-1', 0, 0), move('wall-2', 0, 0)]);
  refused('the same piece twice', () => [move('wall-1', 0, 0), move('wall-1', 1, 0)]);
  refused('a piece that is not a wall or tower', () => [move('hearth-hall', 0, 0)]);
  refused('a piece that does not exist', () => [move('wall-99', 0, 0)]);
  refused('a list that is not a list', () => 'wall-1');

  it('refuses a defense that is not unlocked', () => {
    const s = hold();
    s.buildings.walls = 0;
    const before = JSON.stringify(s.layout);
    expect(
      apply(s, { type: 'layout.setDefenses', moves: [move('wall-15', 0, 0)] }, s.time).ok,
    ).toBe(false);
    expect(JSON.stringify(s.layout)).toBe(before);
  });
});
