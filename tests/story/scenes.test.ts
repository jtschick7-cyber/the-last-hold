// Plan T5.11b1 (GDD §5.14.3, §9.14): the story's scenes are real scenes: they can be
// remembered, saved and loaded, and each has its text.
import { describe, expect, it } from 'vitest';
import { storyScenes, STORY_SCENE_IDS } from '../../src/content/text/scenes';
import { ilseArrival, sigrunVow } from '../../src/content/story/scenes';
import { apply } from '../../src/core/commands';
import { encodeSaveFile, loadEnvelope, makeEnvelope } from '../../src/core/save';
import { createNewGame } from '../../src/core/state/new-game';

const T0 = Date.UTC(2026, 9, 14, 8);

describe('the story scenes', () => {
  it('have their text word for word from the story content', () => {
    expect(storyScenes.ilse.paragraphs).toEqual([ilseArrival]);
    expect(storyScenes['sigrun-vow'].paragraphs).toEqual([sigrunVow]);
    expect(storyScenes['sigrun-door'].paragraphs.length).toBeGreaterThan(3);
    for (const id of STORY_SCENE_IDS) expect(storyScenes[id].id).toBe(id);
  });

  it('are remembered once and survive a save', () => {
    const s = createNewGame('scenes', T0);
    for (const id of STORY_SCENE_IDS)
      expect(apply(s, { type: 'scene.seen', scene: id }, T0).ok).toBe(true);
    const r = loadEnvelope(JSON.parse(encodeSaveFile(makeEnvelope(s, 0))));
    if (!r.ok) throw new Error(r.error);
    expect(r.value.warnings).toEqual([]);
    expect(r.value.state.scenes).toEqual([...STORY_SCENE_IDS]);
  });
});
