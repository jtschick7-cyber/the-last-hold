import type { Migration } from './migrations';

type Plain = Record<string, unknown>;

const asPlain = (v: unknown): Plain | null =>
  typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Plain) : null;

const LEGACY_BOSS_COUNT = 3;
const NEW_BOSS_COUNT = 5;

/**
 * Remaps a v16 3-boss `events.boss.visit` index onto the v17 5-boss ring (`D631`, `TD §26.1`).
 * Stops at 3 when `pool === null` (The Thorn-Stag completed, #4 not started yet); shifts active
 * `visit === 3` and any `visit >= 4` to skip slots #4 and #5 of the first pass.
 */
const remapBossVisit = (visit: number, pool: unknown): number => {
  const hasActivePool = pool !== null && pool !== undefined;
  if (visit < LEGACY_BOSS_COUNT) return visit;
  if (visit === LEGACY_BOSS_COUNT && !hasActivePool) return visit;
  return Math.floor(visit / LEGACY_BOSS_COUNT) * NEW_BOSS_COUNT + (visit % LEGACY_BOSS_COUNT);
};

/**
 * v16 → v17 (plan T19.2, D631, TD §26.1): safely remaps `events.boss.visit` around the two new
 * Great Beasts (#4, #5) and preserves any existing `cosmetics.marks` verbatim.
 */
export const v16ToV17: Migration = (state) => {
  const next: Plain = structuredClone(state);
  const events = asPlain(next.events);
  const boss = events ? asPlain(events.boss) : null;
  if (boss && typeof boss.visit === 'number' && Number.isInteger(boss.visit) && boss.visit >= 0) {
    boss.visit = remapBossVisit(boss.visit, boss.pool);
  }
  return next;
};
