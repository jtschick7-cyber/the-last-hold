// GDD §5.12.6, §8.14 (D362): the three Legendary Hunts. Only the ids are here so far (plan T9.1,
// the save); the quarries, tracks and legendary hunters come with T9.4.
export const HUNT_IDS = ['stoneback', 'mara', 'likho'] as const;
export type HuntId = (typeof HUNT_IDS)[number];
