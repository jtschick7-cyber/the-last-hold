// Technical design §23.2 (D588, D590): the placement rule behind Suggest, kept free of the hold's
// grid so only `breach.ts` reads it. Given the defenses owned, the free front-row tiles and a score
// for a set of placements, it adds pieces one at a time: each step takes the (piece, tile) pair that
// raises the score most (ties: the smaller row, then the smaller column), a tower whose placement would
// only lower the score waits for the end, and it stops when every piece is placed or no tile is left.

export interface SuggestTile {
  readonly x: number;
  readonly y: number;
}

export interface SuggestPiece {
  readonly id: string;
  readonly tower: boolean;
}

export interface Placement extends SuggestTile {
  readonly id: string;
  readonly tower: boolean;
}

/** `free` must be sorted by row, then column; `owned` in the order the pieces are unlocked. */
export const greedyPlacement = (
  owned: readonly SuggestPiece[],
  free: readonly SuggestTile[],
  score: (placed: readonly Placement[]) => number,
): Placement[] => {
  const placed: Placement[] = [];
  const left = [...owned];
  const open = [...free];
  while (left.length > 0 && open.length > 0) {
    const base = score(placed);
    // Pieces of one kind are interchangeable, so only the first wall and the first tower are tried.
    const tries = [left.find((p) => !p.tower), left.find((p) => p.tower)].flatMap((p) =>
      p ? [p] : [],
    );
    let best: { piece: SuggestPiece; tile: number; delta: number } | null = null;
    let waiting: { piece: SuggestPiece; tile: number; delta: number } | null = null;
    for (const piece of tries) {
      for (let i = 0; i < open.length; i++) {
        const tile = open[i] as SuggestTile;
        const delta =
          score([...placed, { id: piece.id, tower: piece.tower, x: tile.x, y: tile.y }]) - base;
        const found = { piece, tile: i, delta };
        // A tower that would only lower the score is held back for the end.
        if (piece.tower && delta < 0) {
          if (!waiting || delta > waiting.delta) waiting = found;
          continue;
        }
        if (!best || delta > best.delta) best = found;
      }
    }
    const pick = best ?? waiting;
    if (!pick) break;
    const tile = open.splice(pick.tile, 1)[0] as SuggestTile;
    left.splice(left.indexOf(pick.piece), 1);
    placed.push({ id: pick.piece.id, tower: pick.piece.tower, x: tile.x, y: tile.y });
  }
  return placed;
};
