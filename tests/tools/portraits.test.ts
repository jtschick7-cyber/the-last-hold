// Plan T2.23/T2.24, v1.6 (D596): the approved v1.6 portraits are 64 px, use only palette colors,
// have Option B chamfered clipped corners with transparent alpha, and match approved hashes;
// every portrait row has a file and every hunter, species, and boss has a row.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import {
  assetById,
  eventCreaturePortraitId,
  hunterPortraitId,
  monsterPortraitId,
  UNLIT_PORTRAIT_ID,
} from '../../src/content/assets';
import { HUNTER_IDS, hunters } from '../../src/content/hunters';
import { EVENT_CREATURE_IDS } from '../../src/content/hunts';
import { MONSTER_IDS } from '../../src/content/monsters';
import { V17_EVENT_CREATURE_IDS } from '../../tools/draw-creatures';
import { drawHunter } from '../../tools/draw-hunter';
import { hasDrawing } from '../../tools/draw-monster';
import { PALETTE_HEX } from '../../tools/pixel';
import { V19_PORTRAIT_IDS } from '../../tools/portraits-v19';

const approvedHashes = JSON.parse(
  readFileSync(new URL('../../art-src/v1.6-portrait-hashes.json', import.meta.url), 'utf8'),
) as Record<string, string>;
const v19Hashes = JSON.parse(
  readFileSync(new URL('../../art-src/v1.9-hashes.json', import.meta.url), 'utf8'),
) as Record<string, string>;

const file = (name: string): Buffer =>
  readFileSync(new URL(`../../public/assets/portraits/${name}`, import.meta.url));

const CLIPPED_CORNERS: readonly (readonly [number, number])[] = [
  [0, 0],
  [1, 0],
  [0, 1],
  [63, 0],
  [62, 0],
  [63, 1],
  [0, 63],
  [1, 63],
  [0, 62],
  [63, 63],
  [62, 63],
  [63, 62],
];

const cases = [
  ...V17_EVENT_CREATURE_IDS.map((id) => ({
    row: eventCreaturePortraitId(id),
    name: `creature-${id}.png`,
  })),
  ...HUNTER_IDS.map((id) => ({
    row: hunterPortraitId(id),
    name: `${id}.png`,
  })),
  ...MONSTER_IDS.filter(hasDrawing).map((id) => ({
    row: monsterPortraitId(id),
    name: `monster-${id}.png`,
  })),
  {
    row: UNLIT_PORTRAIT_ID,
    name: 'monster-unlit.png',
  },
];

describe("Arvid's portrait (GDD §8.5, plan T5.13)", () => {
  const spec = hunters.arvid.portrait;
  it('uses his look: braided beard, knit cap, scarred leather collar, a rune-mark on the haft', () => {
    expect([spec.beard, spec.headgear, spec.collar, spec.mark]).toEqual([
      'braided',
      'knit',
      'scarred-leather',
      'rune',
    ]);
  });

  it('draws each new part: changing any one of them changes the picture', () => {
    const base = drawHunter(spec).toPng();
    for (const change of [
      { beard: 'full' },
      { headgear: 'cap' },
      { collar: 'leather' },
      { mark: 'scar' },
    ] as const)
      expect(
        drawHunter({ ...spec, ...change })
          .toPng()
          .equals(base),
        JSON.stringify(change),
      ).toBe(false);
  });
});

describe('generated portraits', () => {
  it('every species has a drawing, the four Cursed (plan T5.13) included, and none is a placeholder', () => {
    expect(MONSTER_IDS.filter((id) => !hasDrawing(id))).toEqual([]);
    for (const id of ['gloam-moths', 'ribbonshade', 'anvil-wight', 'rimewrought'] as const)
      expect(assetById.get(monsterPortraitId(id))?.source).toBe('generated');
  });

  it('has a manifest row for each hunter and species, pointing at its file', () => {
    expect(cases).toHaveLength(
      V17_EVENT_CREATURE_IDS.length + HUNTER_IDS.length + MONSTER_IDS.length + 1,
    );
    for (const c of cases) {
      const row = assetById.get(c.row);
      expect(row?.source, c.row).toBe('generated');
      if (row?.source === 'generated') expect(row.file).toBe(`portraits/${c.name}`);
    }
  });

  it.each(cases)('$row matches approved v1.6 hash, is 64 px and stays in the palette', (c) => {
    const raw = file(c.name);
    const hash = createHash('sha256').update(raw).digest('hex');
    expect(hash, `${c.name} matches approved v1.6 hash`).toBe(approvedHashes[c.name]);
    const png = PNG.sync.read(raw);
    expect([png.width, png.height]).toEqual([64, 64]);
    // Option B chamfered clipped corners have alpha = 0:
    for (const [x, y] of CLIPPED_CORNERS) {
      const idx = (y * 64 + x) * 4;
      expect(png.data[idx + 3], `${c.name} corner (${x},${y}) is transparent`).toBe(0);
    }
    for (let i = 0; i < png.data.length; i += 4) {
      if ((png.data[i + 3] ?? 0) === 0) continue;
      const hex = [0, 1, 2]
        .map((k) => (png.data[i + k] ?? 0).toString(16).padStart(2, '0'))
        .join('');
      expect(PALETTE_HEX.has(hex), `${c.name} pixel ${i / 4}: ${hex}`).toBe(true);
    }
  });

  it.each(V19_PORTRAIT_IDS)(
    'v1.9 portrait.creature.%s matches approved v1.9 hash, is 64 px Option B, and stays in the palette',
    (id) => {
      const rowId = eventCreaturePortraitId(id);
      const row = assetById.get(rowId);
      expect(row?.source, rowId).toBe('generated');
      if (row?.source === 'generated') expect(row.file).toBe(`portraits/creature-${id}.png`);
      const raw = file(`creature-${id}.png`);
      const hash = createHash('sha256').update(raw).digest('hex');
      expect(hash).toBe(v19Hashes[rowId]);
      const png = PNG.sync.read(raw);
      expect([png.width, png.height]).toEqual([64, 64]);
      for (const [x, y] of CLIPPED_CORNERS) {
        expect(png.data[(y * 64 + x) * 4 + 3]).toBe(0);
      }
      for (let i = 0; i < png.data.length; i += 4) {
        if ((png.data[i + 3] ?? 0) === 0) continue;
        const hex = [0, 1, 2]
          .map((k) => (png.data[i + k] ?? 0).toString(16).padStart(2, '0'))
          .join('');
        expect(PALETTE_HEX.has(hex), `${id} pixel ${i / 4}: ${hex}`).toBe(true);
      }
    },
  );

  it('covers all 8 Great Beasts and Quarries with generated portraits', () => {
    expect(EVENT_CREATURE_IDS).toHaveLength(8);
    for (const id of EVENT_CREATURE_IDS) {
      expect(assetById.get(eventCreaturePortraitId(id))?.source, id).toBe('generated');
    }
  });
});
