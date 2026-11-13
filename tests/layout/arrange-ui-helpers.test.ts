import { describe, expect, it } from 'vitest';
import { evaluateHoldTactics } from '../../src/core/systems/layout-tactics';
import { createNewGame } from '../../src/core/state/new-game';
import { apply } from '../../src/core/commands/apply';
import { countPieceLinks, selectedTacticsLine } from '../../src/ui/sheets/arrange-tactics';

const NOW = 1_700_000_000_000;

describe('Arrange Hold tactical overlay helpers', () => {
  it('counts AoE adjacency endpoints per piece and builds concise approved tactical summaries', () => {
    const s = createNewGame('ui-tactics-helper', NOW);
    expect(apply(s, { type: 'debug.layoutFillBastion' }, NOW).ok).toBe(true);
    expect(apply(s, { type: 'layout.autoArrange', mode: 'fortress' }, NOW).ok).toBe(true);

    const tactics = evaluateHoldTactics(s);
    const counts = countPieceLinks(tactics.links);

    expect(tactics.links.length).toBeGreaterThan(0);
    for (const link of tactics.links) {
      expect(counts.get(link.from) ?? 0).toBeGreaterThanOrEqual(1);
      expect(counts.get(link.to) ?? 0).toBeGreaterThanOrEqual(1);
    }

    const hallNote = selectedTacticsLine('hearth-hall', tactics, counts.get('hearth-hall') ?? 0);
    expect(hallNote).toContain('Warded');

    const [firstScreened] = [...tactics.screenedTowers];
    expect(firstScreened).toBeDefined();
    if (firstScreened) {
      const towerNote = selectedTacticsLine(firstScreened, tactics, counts.get(firstScreened) ?? 0);
      expect(towerNote).toContain('Screened');
    }

    expect(apply(s, { type: 'layout.clear' }, NOW).ok).toBe(true);
    const cleared = evaluateHoldTactics(s);
    const clearedCounts = countPieceLinks(cleared.links);
    expect(clearedCounts.size).toBe(0);
    expect(selectedTacticsLine('hearth-hall', cleared, 0)).toBe('Exposed');
    expect(selectedTacticsLine('mill', cleared, 0)).toBeNull();
  });
});
