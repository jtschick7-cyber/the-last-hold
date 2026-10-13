// setting-primer §6.6: the short scenes that mark a first. Each shows once, as a
// sheet, then is remembered (`scenes` in the saved game). Plain, specific, human,
// and one wrongness at a time (primer §8); nothing here explains a secret.

export const SCENE_IDS = ['first-contract', 'vow'] as const;
export type SceneId = (typeof SCENE_IDS)[number];

export interface SceneDef {
  readonly id: SceneId;
  readonly title: string;
  /** Paragraphs. "{a}" and "{b}" are the two hunters who lead the vow. */
  readonly paragraphs: readonly string[];
}

// Proper nouns used only inside text (technical design §14 name check).
export const properNouns: readonly string[] = ['Emberwrights'];

export const scenes: Readonly<Record<SceneId, SceneDef>> = {
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
