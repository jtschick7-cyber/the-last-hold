// setting-primer §6.6: the short scenes that mark a first. Each shows once, as a
// sheet, then is remembered (`scenes` in the saved game). Plain, specific, human,
// and one wrongness at a time (primer §8); nothing here explains a secret.

import { allDocuments } from '../story/acts';
import { ilseArrival, sigrunVow } from '../story/scenes';

export const SCENE_IDS = ['first-contract', 'vow'] as const;
/** The story's scenes (v0.5, GDD §5.14): they carry a `heading`, not a `title`, like documents. */
export const STORY_SCENE_IDS = ['opening', 'ilse', 'sigrun-door', 'sigrun-vow'] as const;
export const ALL_SCENE_IDS = [...SCENE_IDS, ...STORY_SCENE_IDS] as const;
export type FirstSceneId = (typeof SCENE_IDS)[number];
export type StorySceneId = (typeof STORY_SCENE_IDS)[number];
export type SceneId = FirstSceneId | StorySceneId;

export interface SceneDef {
  readonly id: FirstSceneId;
  readonly title: string;
  /** Paragraphs. "{a}" and "{b}" are the two hunters who lead the vow. */
  readonly paragraphs: readonly string[];
}

// Proper nouns used only inside text (technical design §14 name check).
export const properNouns: readonly string[] = ['Emberwrights'];

export const scenes: Readonly<Record<FirstSceneId, SceneDef>> = {
  'first-contract': {
    id: 'first-contract',
    title: 'Through the gate',
    paragraphs: [
      'The hunters check their straps twice, which is how you can tell they are thinking. One of them tests a weapon against the gatepost. Brana counts the provisions into the cart and writes the number down.',
      '"Back by dark," she says, to nobody in particular.',
      'The gate swings shut behind them. The road beyond is quieter than it should be.',
    ],
  },
  vow: {
    id: 'vow',
    title: 'The fire for the folk',
    paragraphs: [
      'Under the restored gatehouse, {a} and {b} stand in front of the hunters. The words are old, and everyone knows them anyway.',
      '"The fire for the folk," says {a}. The hunters say it back, a little ragged and a little loud.',
      'Someone laughs and calls them Emberwrights. It is half a joke. It sticks.',
    ],
  },
};

export interface StorySceneDef {
  readonly id: StorySceneId;
  readonly heading: string;
  readonly paragraphs: readonly string[];
}

export const storyScenes: Readonly<Record<StorySceneId, StorySceneDef>> = {
  // A new game names its first warden here (GDD §5.14.5, D152); the sheet is the form.
  opening: { id: 'opening', heading: 'Who keeps the hearth?', paragraphs: [] },
  // GDD §5.14.3: Ilse walks up with the first document (lore-secrets §21.4).
  ilse: { id: 'ilse', heading: 'Ilse Marrow', paragraphs: [ilseArrival] },
  // D2-08 is a scene-type document (lore-secrets §22); it plays as a scene, then stays in the Library.
  'sigrun-door': {
    id: 'sigrun-door',
    heading: 'What waits below',
    paragraphs: allDocuments.find((d) => d.id === 'D2-08')?.body ?? [],
  },
  'sigrun-vow': { id: 'sigrun-vow', heading: 'The vow', paragraphs: [sigrunVow] },
};
