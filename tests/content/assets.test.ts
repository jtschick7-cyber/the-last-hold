// Technical design §5.1 / §12.1: every asset the game refers to has a manifest
// row, and every row is well-formed.
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AGE_IDS } from '../../src/content/ages';
import {
  assetById,
  assets,
  buildingSpriteId,
  holdSceneId,
  resourceIconId,
} from '../../src/content/assets';
import { BUILDING_IDS } from '../../src/content/buildings';
import { RESOURCE_IDS } from '../../src/content/resources';

describe('asset manifest', () => {
  it('has a row for every asset ID the game refers to', () => {
    const referenced = [
      ...RESOURCE_IDS.map(resourceIconId),
      ...BUILDING_IDS.map(buildingSpriteId),
      ...AGE_IDS.map(holdSceneId),
    ];
    for (const id of referenced) expect(assetById.has(id), id).toBe(true);
  });

  it('IDs are unique and sizes follow GDD §9.12', () => {
    expect(assetById.size).toBe(assets.length);
    const sizes = { icon: 16, building: 32, portrait: 64 } as const;
    for (const a of assets) {
      if (a.kind !== 'scene') expect(a.size, a.id).toEqual([sizes[a.kind], sizes[a.kind]]);
    }
  });

  it('every file a row names exists, and every kind has a placeholder', () => {
    for (const a of assets) {
      if (a.source !== 'placeholder') {
        expect(existsSync(new URL(`../../public/assets/${a.file}`, import.meta.url)), a.file).toBe(
          true,
        );
      }
    }
    for (const kind of ['icon', 'building', 'scene', 'portrait']) {
      expect(
        existsSync(new URL(`../../public/assets/placeholders/${kind}.png`, import.meta.url)),
        kind,
      ).toBe(true);
    }
  });
});
