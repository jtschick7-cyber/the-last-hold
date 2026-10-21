import { mootGreyWivesScenes, type OrderScene } from './orders-scenes';
import { bellQuenchersScenes } from './orders-scenes-b';

/** Every Orders scene (lore §33 Parts C and D): the four openings, then the sixteen chapters. */
export const orderScenes: readonly OrderScene[] = [
  ...mootGreyWivesScenes.filter((s) => s.kind === 'opening'),
  ...bellQuenchersScenes.filter((s) => s.kind === 'opening'),
  ...mootGreyWivesScenes.filter((s) => s.kind === 'chapter'),
  ...bellQuenchersScenes.filter((s) => s.kind === 'chapter'),
];

export const sceneOf = (id: string): OrderScene | undefined => orderScenes.find((s) => s.id === id);
