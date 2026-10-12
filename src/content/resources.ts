// GDD §5.1.1: the four basic resources. No storage caps (D24.3).
export const RESOURCE_IDS = ['food', 'wood', 'iron', 'silver'] as const;
export type ResourceId = (typeof RESOURCE_IDS)[number];

export interface ResourceDef {
  readonly id: ResourceId;
  readonly name: string;
}

export const resources: Readonly<Record<ResourceId, ResourceDef>> = {
  food: { id: 'food', name: 'Food' },
  wood: { id: 'wood', name: 'Wood' },
  iron: { id: 'iron', name: 'Iron' },
  silver: { id: 'silver', name: 'Silver' },
};

/** An amount of each of some resources, e.g. a cost. */
export type ResourceBundle = Readonly<Partial<Record<ResourceId, number>>>;
