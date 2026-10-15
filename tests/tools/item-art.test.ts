// Plan T8.14 (GDD §9.12, §9.16, D324): the v0.8 art is exactly what its generators draw today, in
// the palette, at the manifest's sizes; the item frames differ from each other and from the Delve
// frames; every brew now has an icon.
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import {
  assetById,
  brewIconId,
  gearIconId,
  itemFrameId,
  keepsakeIconId,
  OLD_BREW_ICON_IDS,
  rankBadgeId,
  STAR_ICON,
} from '../../src/content/assets';
import { CONSUMABLE_IDS } from '../../src/content/consumables';
import { GEAR_IDS } from '../../src/content/gear';
import { ITEM_RARITY_IDS } from '../../src/content/items';
import { LEGENDARY_IDS } from '../../src/content/legendaries';
import { HUNTER_RANK_IDS } from '../../src/content/ranks';
import { RARITIES } from '../../src/content/delves/blessing-types';
import { drawRarityFrame } from '../../tools/draw-icons16';
import {
  drawGearIcon,
  drawItemFrame,
  drawKeepsakeIcon,
  drawOldBrewIcon,
  drawRankBadge,
  drawStarIcon,
} from '../../tools/draw-items';
import { PALETTE_HEX } from '../../tools/pixel';
import { rarityFrameId } from '../../src/content/assets';

const file = (name: string): Buffer =>
  readFileSync(new URL(`../../public/assets/${name}`, import.meta.url));

const cases = [
  ...GEAR_IDS.map((g) => ({ row: gearIconId(g), drawn: () => drawGearIcon(g).toPng() })),
  ...ITEM_RARITY_IDS.map((r) => ({ row: itemFrameId(r), drawn: () => drawItemFrame(r).toPng() })),
  ...LEGENDARY_IDS.map((l) => ({
    row: keepsakeIconId(l),
    drawn: () => drawKeepsakeIcon(l).toPng(),
  })),
  { row: STAR_ICON, drawn: () => drawStarIcon().toPng() },
  ...HUNTER_RANK_IDS.map((r) => ({ row: rankBadgeId(r), drawn: () => drawRankBadge(r).toPng() })),
  ...OLD_BREW_ICON_IDS.map((b) => ({
    row: brewIconId(b),
    drawn: () => drawOldBrewIcon(b as Parameters<typeof drawOldBrewIcon>[0]).toPng(),
  })),
];

describe('the v0.8 art', () => {
  it('has a generated row for every piece, frame, keepsake, star, rank badge and older brew', () => {
    // 7 pieces; 4 frames; 6 keepsakes; the star; 3 rank badges; 9 older brews.
    expect(cases).toHaveLength(7 + 4 + 6 + 1 + 3 + 9);
    for (const c of cases) expect(assetById.get(c.row)?.source, c.row).toBe('generated');
  });

  it.each(cases)(
    '$row matches its generator, is the manifest size and stays in the palette',
    (c) => {
      const entry = assetById.get(c.row);
      if (entry?.source !== 'generated') throw new Error(`${c.row} is not generated`);
      expect(
        file(entry.file).equals(c.drawn()),
        `${entry.file} is stale: rerun tools/gen-items.ts`,
      ).toBe(true);
      const png = PNG.sync.read(file(entry.file));
      expect([png.width, png.height], c.row).toEqual([...entry.size]);
      for (let i = 0; i < png.data.length; i += 4) {
        if ((png.data[i + 3] ?? 0) === 0) continue;
        const hex = [0, 1, 2]
          .map((k) => (png.data[i + k] ?? 0).toString(16).padStart(2, '0'))
          .join('');
        expect(PALETTE_HEX.has(hex), `${entry.file} pixel ${i / 4}: ${hex}`).toBe(true);
      }
    },
  );

  it('every brew has an icon now (the nine older ones too, D323)', () => {
    for (const b of CONSUMABLE_IDS) expect(assetById.has(brewIconId(b)), b).toBe(true);
  });

  it('the four item frames differ from each other and from the three Delve frames (D324)', () => {
    const item = ITEM_RARITY_IDS.map((r) => drawItemFrame(r).toPng().toString('base64'));
    const delve = RARITIES.map((r) => drawRarityFrame(r).toPng().toString('base64'));
    expect(new Set([...item, ...delve]).size).toBe(item.length + delve.length);
    for (const r of RARITIES) expect(assetById.get(rarityFrameId(r))?.size).toEqual([20, 20]);
  });

  it('each piece and each rank badge looks different from the others', () => {
    const pieces = GEAR_IDS.map((g) => drawGearIcon(g).toPng().toString('base64'));
    expect(new Set(pieces).size).toBe(GEAR_IDS.length);
    const badges = HUNTER_RANK_IDS.map((r) => drawRankBadge(r).toPng().toString('base64'));
    expect(new Set(badges).size).toBe(HUNTER_RANK_IDS.length);
  });
});
