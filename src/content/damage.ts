// GDD §5.3.4: the six damage types, and the places and families contracts and
// traits refer to (GDD §5.4.1, §8.3).
export const DAMAGE_TYPES = ['steel', 'silver', 'fire', 'frost', 'rune', 'venom'] as const;
export type DamageType = (typeof DAMAGE_TYPES)[number];

/** GDD §5.4.1 location tags; ruins arrive in v0.5 (D157). */
export const LOCATION_IDS = ['forest', 'river', 'field', 'barrow', 'ruin'] as const;
export type LocationId = (typeof LOCATION_IDS)[number];

export const FAMILY_IDS = [
  'beasts-and-wilds',
  'field-and-forest-spirits',
  'restless-dead',
  'water-spirits',
  'cursed',
] as const;
export type FamilyId = (typeof FAMILY_IDS)[number];

export const families: Readonly<
  Record<FamilyId, { readonly id: FamilyId; readonly name: string }>
> = {
  'beasts-and-wilds': { id: 'beasts-and-wilds', name: 'Beasts & Wilds' },
  'field-and-forest-spirits': {
    id: 'field-and-forest-spirits',
    name: 'Field & Forest Spirits',
  },
  'restless-dead': { id: 'restless-dead', name: 'Restless Dead' },
  'water-spirits': { id: 'water-spirits', name: 'Water Spirits' },
  cursed: { id: 'cursed', name: 'Cursed' }, // v0.5, the ruins (GDD §5.6.1)
};
