// Plan T2.23/T2.24: the generated portraits are the files the generators would write
// today, 64 px, and use only palette colors; every portrait row has a file and every
// hunter and species has a row.
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import { assetById, hunterPortraitId, monsterPortraitId } from '../../src/content/assets';
import { HUNTER_IDS, hunters } from '../../src/content/hunters';
import { MONSTER_IDS } from '../../src/content/monsters';
import { drawHunter } from '../../tools/draw-hunter';
import { drawMonster, hasDrawing } from '../../tools/draw-monster';
import { PALETTE_HEX } from '../../tools/pixel';

const file = (name: string): Buffer =>
  readFileSync(new URL(`../../public/assets/portraits/${name}`, import.meta.url));

const cases = [
  ...HUNTER_IDS.map((id) => ({
    row: hunterPortraitId(id),
    name: `${id}.png`,
    drawn: () => drawHunter(hunters[id].portrait).toPng(),
  })),
  ...MONSTER_IDS.filter(hasDrawing).map((id) => ({
    row: monsterPortraitId(id),
    name: `monster-${id}.png`,
    drawn: () => drawMonster(id).toPng(),
  })),
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
    expect(cases).toHaveLength(HUNTER_IDS.length + MONSTER_IDS.length);
    for (const c of cases) {
      const row = assetById.get(c.row);
      expect(row?.source, c.row).toBe('generated');
      if (row?.source === 'generated') expect(row.file).toBe(`portraits/${c.name}`);
    }
  });

  it.each(cases)('$row matches its generator, is 64 px and stays in the palette', (c) => {
    expect(file(c.name).equals(c.drawn()), `${c.name} is stale: rerun the generator`).toBe(true);
    const png = PNG.sync.read(file(c.name));
    expect([png.width, png.height]).toEqual([64, 64]);
    for (let i = 0; i < png.data.length; i += 4) {
      if ((png.data[i + 3] ?? 0) === 0) continue;
      const hex = [0, 1, 2]
        .map((k) => (png.data[i + k] ?? 0).toString(16).padStart(2, '0'))
        .join('');
      expect(PALETTE_HEX.has(hex), `${c.name} pixel ${i / 4}: ${hex}`).toBe(true);
    }
  });
});
