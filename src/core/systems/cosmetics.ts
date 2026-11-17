import { BOSS_IDS, bosses, type BossId } from '../../content/great-beasts';
import { HUNT_IDS, hunts, quarries, type HuntId } from '../../content/hunts';
import { COSMETIC_IDS, shopItems, type CosmeticId } from '../../content/delves/shop';
import {
  COURTYARD_MARK_IDS,
  courtyardMarkDef,
  markForBoss,
  markForHunt,
  type CourtyardMarkId,
} from '../../content/courtyard-marks';
import type { GameState } from '../state/game-state';
import type { CosmeticsState, HoldCosmeticId } from '../state/cosmetics-state';

type BackfillTarget = {
  cosmetics: CosmeticsState;
  events?: {
    boss?: { visit?: number };
    hunts?: Partial<Record<HuntId, { unlocked?: boolean }>>;
  };
};

const isCourtyardMarkId = (id: string): id is CourtyardMarkId =>
  (COURTYARD_MARK_IDS as readonly string[]).includes(id);

const isShopCosmeticId = (id: string): id is CosmeticId =>
  (COSMETIC_IDS as readonly string[]).includes(id);

export const isHoldCosmeticId = (id: string): id is HoldCosmeticId =>
  isCourtyardMarkId(id) || isShopCosmeticId(id);

/** Unlocks a Courtyard Mark visibly the first time; preserves an explicit hidden flag. */
export const unlockCourtyardMark = (
  state: Pick<GameState, 'cosmetics'>,
  id: CourtyardMarkId,
): void => {
  if (state.cosmetics.marks[id] === undefined) {
    state.cosmetics.marks[id] = true;
  }
};

export const unlockBossMark = (state: Pick<GameState, 'cosmetics'>, bossId: BossId): void => {
  unlockCourtyardMark(state, markForBoss(bossId));
};

export const unlockHuntMark = (state: Pick<GameState, 'cosmetics'>, huntId: HuntId): void => {
  unlockCourtyardMark(state, markForHunt(huntId));
};

/** Original 3 Great Beasts eligible for historical mark backfill on legacy saves (D631, TD §26.1). */
const LEGACY_BACKFILL_BOSS_IDS: readonly BossId[] = [
  'lindworm-of-velk-fjord',
  'barrow-king',
  'mother-of-the-river',
];

/** Idempotently awards missing Courtyard Marks matching past boss kills and unlocked hunts. */
export const backfillCosmetics = (state: BackfillTarget): void => {
  const visit = state.events?.boss?.visit;
  const kills = Math.min(
    typeof visit === 'number' ? visit : 0,
    LEGACY_BACKFILL_BOSS_IDS.length,
    BOSS_IDS.length,
  );
  for (let i = 0; i < kills; i += 1) {
    const bossId = LEGACY_BACKFILL_BOSS_IDS[i];
    if (bossId && BOSS_IDS.includes(bossId)) unlockBossMark(state, bossId);
  }
  const huntsRecord = state.events?.hunts;
  if (!huntsRecord) return;
  for (const huntId of HUNT_IDS) {
    if (huntsRecord[huntId]?.unlocked) unlockHuntMark(state, huntId);
  }
};

export const isCosmeticOwned = (state: GameState, id: HoldCosmeticId): boolean =>
  isCourtyardMarkId(id)
    ? state.cosmetics.marks[id] !== undefined
    : state.delve.shop.cosmetics.includes(id);

export const isCosmeticVisible = (state: GameState, id: HoldCosmeticId): boolean =>
  isCourtyardMarkId(id)
    ? state.cosmetics.marks[id] === true
    : state.delve.shop.cosmetics.includes(id) && !state.cosmetics.hidden.includes(id);

export const visibleCourtyardMarks = (state: GameState): CourtyardMarkId[] =>
  COURTYARD_MARK_IDS.filter((id) => state.cosmetics.marks[id] === true);

export const visibleShopCosmetics = (state: GameState): CosmeticId[] =>
  state.delve.shop.cosmetics.filter((id) => !state.cosmetics.hidden.includes(id));

export type ToggleCosmeticResult = { ok: true; visible: boolean } | { ok: false; reason: string };

/** Toggles (or explicitly sets) visibility of an unlocked Courtyard Mark or bought cosmetic. */
export const toggleCosmetic = (
  state: GameState,
  id: string,
  visible?: boolean,
): ToggleCosmeticResult => {
  if (!isHoldCosmeticId(id)) return { ok: false, reason: `Hold Look: unknown item "${id}"` };
  if (!isCosmeticOwned(state, id)) {
    return { ok: false, reason: `Hold Look: "${id}" is not unlocked yet` };
  }
  const next = visible ?? !isCosmeticVisible(state, id);
  if (isCourtyardMarkId(id)) {
    state.cosmetics.marks[id] = next;
  } else if (next) {
    state.cosmetics.hidden = state.cosmetics.hidden.filter((c) => c !== id);
  } else if (!state.cosmetics.hidden.includes(id)) {
    state.cosmetics.hidden.push(id);
  }
  return { ok: true, visible: next };
};

export interface HoldLookEntry {
  id: HoldCosmeticId;
  kind: 'cosmetic' | 'mark';
  name: string;
  source: string;
  unlocked: boolean;
  visible: boolean;
}

export interface HoldLookView {
  marks: HoldLookEntry[];
  shop: HoldLookEntry[];
  visibleMarks: CourtyardMarkId[];
  visibleCosmetics: CosmeticId[];
  unlockedCount: number;
}

const shopCosmeticName = (id: CosmeticId): string =>
  shopItems.find((item) => item.id === id)?.name ?? id;

const courtyardMarkSource = (id: CourtyardMarkId): string => {
  const src = courtyardMarkDef(id).source;
  return src.kind === 'boss' ? bosses[src.bossId].name : quarries[hunts[src.huntId].quarry].name;
};

/** Projects the Hold Look drawer entries and visible cosmetic/mark lists from GameState. */
export const holdLookView = (state: GameState): HoldLookView => {
  const shop: HoldLookEntry[] = COSMETIC_IDS.map((id) => ({
    id,
    kind: 'cosmetic',
    name: shopCosmeticName(id),
    source: 'Riftglass shop',
    unlocked: isCosmeticOwned(state, id),
    visible: isCosmeticVisible(state, id),
  }));
  const marks: HoldLookEntry[] = COURTYARD_MARK_IDS.map((id) => ({
    id,
    kind: 'mark',
    name: courtyardMarkDef(id).name,
    source: courtyardMarkSource(id),
    unlocked: isCosmeticOwned(state, id),
    visible: isCosmeticVisible(state, id),
  }));
  return {
    marks,
    shop,
    visibleMarks: visibleCourtyardMarks(state),
    visibleCosmetics: visibleShopCosmetics(state),
    unlockedCount: [...shop, ...marks].filter((e) => e.unlocked).length,
  };
};
