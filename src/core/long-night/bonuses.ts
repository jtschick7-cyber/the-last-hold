import type { ResourceId } from '../../content/resources';
import { RELIC_IDS, relics, type RelicEffect } from '../../content/relics';
import { UPGRADE_IDS, upgrades, type UpgradeEffect } from '../../content/warden-upgrades';
import type { Breakdown, Explained } from '../breakdown/breakdown';
import type { GameState } from '../state/game-state';
import type { Bonus } from '../systems/buckets';

// GDD §5.9.5–5.9.6 and §8.9–8.10 (D111): what warden upgrades and relics do, read
// from the hold. Upgrade production goes in the ember bucket, relic production in the
// relic bucket; no upgrade or relic touches silver (G1). Every formula that uses one
// of these shows it in its breakdown.

type UpgradeKind = UpgradeEffect['kind'];
type RelicKind = RelicEffect['kind'];

/** Each bought upgrade of one kind, as breakdown lines (perLevel × level). */
const upgradeLines = (state: GameState, kind: UpgradeKind): Breakdown[] =>
  UPGRADE_IDS.flatMap((id) => {
    const e = upgrades[id].effect;
    const level = state.upgrades[id];
    if (e.kind !== kind || level === 0 || !('perLevel' in e) || typeof e.perLevel !== 'number')
      return [];
    return [
      {
        label: `${upgrades[id].name} ${level}`,
        value: e.perLevel * level,
        formula: `${e.perLevel} × ${level}`,
      },
    ];
  });

const owned = (state: GameState): readonly (typeof RELIC_IDS)[number][] =>
  state.relics.map((r) => r.id);

/** Each owned relic of one kind, as breakdown lines. */
const relicLines = (state: GameState, kind: RelicKind): Breakdown[] =>
  owned(state).flatMap((id) => {
    const e = relics[id].effect;
    return e.kind === kind && e.kind !== 'production'
      ? [{ label: relics[id].name, value: e.amount }]
      : [];
  });

const sum = (lines: readonly Breakdown[]): number => lines.reduce((s, l) => s + l.value, 0);

const explained = (label: string, lines: readonly Breakdown[]): Explained => {
  const value = sum(lines);
  return { value, breakdown: { label, value, children: [...lines] } };
};

/** Kept Coals: all production except silver, in the ember bucket. */
export const emberBonuses = (state: GameState): Bonus[] =>
  upgradeLines(state, 'allProduction').map((l) => ({
    bucket: 'ember',
    label: l.label,
    value: l.value,
  }));

/** Plough-Share and Mason's Plumb: their resources, in the relic bucket (never silver). */
export const relicBonuses = (state: GameState, resource: ResourceId): Bonus[] =>
  owned(state).flatMap((id) => {
    const e = relics[id].effect;
    return e.kind === 'production' && (e.resources as readonly string[]).includes(resource)
      ? [{ bucket: 'relic' as const, label: relics[id].name, value: e.amount }]
      : [];
  });

/** Contract XP: Drill Yard and the Tally Stick. */
export const contractXpBonus = (state: GameState): Explained =>
  explained('Contract XP bonus', [
    ...upgradeLines(state, 'contractXp'),
    ...relicLines(state, 'contractXp'),
  ]);

/** Bounty silver: Village Goodwill (bounties only; seams untouched, G1). */
export const bountyBonus = (state: GameState): Explained =>
  explained('Bounty bonus', upgradeLines(state, 'bounty'));

/** Contracts take this share less time: Swift Roads. */
export const durationCut = (state: GameState): Explained =>
  explained('Contracts take less time', upgradeLines(state, 'contractDuration'));

/** Clues take this share less time: the Bone Whistle. */
export const clueCut = (state: GameState): Explained =>
  explained('Clues take less time', relicLines(state, 'clueTime'));

/** Brewing takes this share less time: the Copper Still. */
export const brewCut = (state: GameState): Explained =>
  explained('Brewing takes less time', relicLines(state, 'brewTime'));

/** Late Lantern: offline-cap extensions in seconds (the ceiling still applies). */
export const offlineExtensions = (state: GameState): Breakdown[] =>
  upgradeLines(state, 'offlineCap');
