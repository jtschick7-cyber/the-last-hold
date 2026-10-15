import type { FamilyId } from './damage';

// GDD §5.11.6, §8.12 (v0.8, D306, D314): six Legendaries. Never random and never from Delves:
// each is found once, at a fixed milestone, and kept forever, worn in the keepsake slot, which
// holds only the named effect (no base stats). Core reads `effect` in fights (plan T8.9) and
// `milestone` for the finding; the sheets show `text`, the GDD's wording word for word. Numbers
// are tunable, here in content. Content outside the saved-state id lists until T8.5 (D171).

export const LEGENDARY_IDS = [
  'barley-knot',
  'wolf-tooth-string',
  'coffin-silver',
  'ferrymans-coin',
  'rune-nail',
  'yrsas-thole',
] as const;
export type LegendaryId = (typeof LEGENDARY_IDS)[number];

/** When it is found: a whole family Mastered (bestiary kills from contracts), or a story document. */
export type LegendaryMilestone =
  | { readonly kind: 'familyMastered'; readonly family: FamilyId }
  /** The document is found (D5-06 is found on the Act V stand's result sheet). */
  | { readonly kind: 'documentFound'; readonly id: string };

export type LegendaryEffect =
  /** Once per fight, the first time a monster's ability would cost the holder an action, it doesn't. */
  | { readonly kind: 'steadfastOnce' }
  /** Might (status%, stacking) for each monster downed this fight, up to a cap. */
  | { readonly kind: 'mightPerMonsterDowned'; readonly each: number; readonly max: number }
  /** Each of the holder's direct hits adds a Silver sub-hit of `mightShare` × Might (no Armor, own log line). */
  | { readonly kind: 'silverSubHit'; readonly mightShare: number }
  /** Once per fight, the first time the holder drops below `below` of Health and is still standing, they recover `heal` of max Health. */
  | { readonly kind: 'healOnceBelow'; readonly below: number; readonly heal: number }
  /** The holder's direct attacks ignore this share of the target's Armor. */
  | { readonly kind: 'armorPierce'; readonly share: number }
  /** The holder's meter starts each fight at `meter`, and they gain `speed` Speed. */
  | { readonly kind: 'startMeter'; readonly meter: number; readonly speed: number };

export interface LegendaryDef {
  readonly id: LegendaryId;
  readonly name: string;
  readonly milestone: LegendaryMilestone;
  /** "Found when…" as GDD §8.12 words it. */
  readonly foundText: string;
  readonly effect: LegendaryEffect;
  /** The effect as GDD §8.12 words it. */
  readonly text: string;
}

export const legendaries: Readonly<Record<LegendaryId, LegendaryDef>> = {
  'barley-knot': {
    id: 'barley-knot',
    name: 'The Barley Knot',
    milestone: { kind: 'familyMastered', family: 'field-and-forest-spirits' },
    foundText: 'Every Field & Forest species Mastered',
    effect: { kind: 'steadfastOnce' },
    text: "Once per fight, the first time a monster's ability would cost the holder an action, it doesn't (Steadfast's rule)",
  },
  'wolf-tooth-string': {
    id: 'wolf-tooth-string',
    name: 'Wolf-Tooth String',
    milestone: { kind: 'familyMastered', family: 'beasts-and-wilds' },
    foundText: 'Every Beasts & Wilds species Mastered',
    effect: { kind: 'mightPerMonsterDowned', each: 0.03, max: 0.15 },
    text: '+3% Might (status%, stacking) for each monster downed this fight, up to +15%',
  },
  'coffin-silver': {
    id: 'coffin-silver',
    name: 'Coffin Silver',
    milestone: { kind: 'familyMastered', family: 'restless-dead' },
    foundText: 'Every Restless Dead species Mastered',
    effect: { kind: 'silverSubHit', mightShare: 0.15 },
    text: "Each of the holder's direct hits adds a Silver sub-hit of 0.15 × Might (no Armor, its own log line; stacks with the blade's)",
  },
  'ferrymans-coin': {
    id: 'ferrymans-coin',
    name: "Ferryman's Coin",
    milestone: { kind: 'familyMastered', family: 'water-spirits' },
    foundText: 'Every Water Spirit species Mastered',
    effect: { kind: 'healOnceBelow', below: 0.25, heal: 0.3 },
    text: 'Once per fight, the first time the holder drops below 25% Health and is still standing, they recover 30% of max Health',
  },
  'rune-nail': {
    id: 'rune-nail',
    name: 'Rune Nail',
    milestone: { kind: 'familyMastered', family: 'cursed' },
    foundText: 'Every Cursed species Mastered',
    effect: { kind: 'armorPierce', share: 0.25 },
    text: "The holder's direct attacks ignore 25% of the target's Armor",
  },
  'yrsas-thole': {
    id: 'yrsas-thole',
    name: "Yrsa's Thole",
    milestone: { kind: 'documentFound', id: 'D5-06' },
    foundText: "Act V's Last Stand (with D5-06)",
    effect: { kind: 'startMeter', meter: 50, speed: 2 },
    text: "The holder's meter starts each fight at 50, and +2 Speed",
  },
};
