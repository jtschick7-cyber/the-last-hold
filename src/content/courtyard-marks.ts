import type { BossId } from './great-beasts';
import type { HuntId } from './hunts';

export const COURTYARD_MARK_IDS = [
  'fjord-bone-standard',
  'barrow-brazier',
  'river-reed-basin',
  'stoneback-cairn',
  'kettle-barrow-wreath',
  'watch-fire-sconce',
] as const;

export type CourtyardMarkId = (typeof COURTYARD_MARK_IDS)[number];

export type CourtyardMarkSource =
  { kind: 'boss'; bossId: BossId } | { kind: 'hunt'; huntId: HuntId };

export interface CourtyardMarkDef {
  id: CourtyardMarkId;
  name: string;
  source: CourtyardMarkSource;
}

export const COURTYARD_MARKS: readonly CourtyardMarkDef[] = [
  {
    id: 'fjord-bone-standard',
    name: 'Fjord-Bone Standard',
    source: { kind: 'boss', bossId: 'lindworm-of-velk-fjord' },
  },
  {
    id: 'barrow-brazier',
    name: 'Barrow Brazier',
    source: { kind: 'boss', bossId: 'barrow-king' },
  },
  {
    id: 'river-reed-basin',
    name: 'River-Reed Basin',
    source: { kind: 'boss', bossId: 'mother-of-the-river' },
  },
  {
    id: 'stoneback-cairn',
    name: 'Stoneback Cairn',
    source: { kind: 'hunt', huntId: 'stoneback' },
  },
  {
    id: 'kettle-barrow-wreath',
    name: 'Kettle-Barrow Wreath',
    source: { kind: 'hunt', huntId: 'mara' },
  },
  {
    id: 'watch-fire-sconce',
    name: 'Watch-Fire Sconce',
    source: { kind: 'hunt', huntId: 'likho' },
  },
];

const BY_ID = Object.fromEntries(COURTYARD_MARKS.map((m) => [m.id, m])) as Record<
  CourtyardMarkId,
  CourtyardMarkDef
>;

const BY_BOSS: Record<BossId, CourtyardMarkId> = {
  'lindworm-of-velk-fjord': 'fjord-bone-standard',
  'barrow-king': 'barrow-brazier',
  'mother-of-the-river': 'river-reed-basin',
};

const BY_HUNT: Record<HuntId, CourtyardMarkId> = {
  stoneback: 'stoneback-cairn',
  mara: 'kettle-barrow-wreath',
  likho: 'watch-fire-sconce',
};

export const courtyardMarkDef = (id: CourtyardMarkId): CourtyardMarkDef => BY_ID[id];
export const markForBoss = (bossId: BossId): CourtyardMarkId => BY_BOSS[bossId];
export const markForHunt = (huntId: HuntId): CourtyardMarkId => BY_HUNT[huntId];
