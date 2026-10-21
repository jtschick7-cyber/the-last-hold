// Plan T7.12 (GDD §9.12, D265): the v0.7 art is exactly what its generators draw today, in the
// palette, at the manifest's sizes; every battle sprite has all five frames and they differ.
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import { AGE_IDS } from '../../src/content/ages';
import {
  assetById,
  cosmeticId,
  delveRelicIconId,
  eventCreatureSpriteId,
  guardianSpriteId,
  hunterSpriteId,
  monsterSpriteId,
  rarityFrameId,
  RIFTGLASS_ICON,
  RIME_ICON,
  TOKEN_ICON,
  sigilIconId,
  SPRITE_FRAME_NAMES,
  SPRITE_PX,
} from '../../src/content/assets';
import { RARITIES } from '../../src/content/delves/blessing-types';
import { GUARDIAN_IDS } from '../../src/content/delves/guardians';
import { PATRON_IDS } from '../../src/content/delves/patrons';
import { DELVE_RELIC_IDS } from '../../src/content/delves/relics';
import { COSMETIC_IDS } from '../../src/content/delves/shop';
import { HUNTER_IDS } from '../../src/content/hunters';
import { EVENT_CREATURE_IDS } from '../../src/content/hunts';
import { drawCreatureSprite } from '../../tools/draw-creatures';
import { MONSTER_IDS } from '../../src/content/monsters';
import { drawCosmetic, SCENE_H } from '../../tools/draw-cosmetics';
import {
  drawRarityFrame,
  drawRelicIcon,
  drawRiftglass,
  drawRimeIcon,
  drawSigil,
  drawTokenIcon,
} from '../../tools/draw-icons16';
import { PALETTE_HEX } from '../../tools/pixel';
import { framesOf, stripPng } from '../../tools/sprite-frames';
import { drawHunterSprite } from '../../tools/sprite-hunters';
import { drawMonsterSprite } from '../../tools/sprite-monsters';

const file = (name: string): Buffer =>
  readFileSync(new URL(`../../public/assets/${name}`, import.meta.url));

const cases = [
  ...HUNTER_IDS.map((h) => ({
    row: hunterSpriteId(h),
    drawn: () => stripPng(framesOf(drawHunterSprite(h), 'right')),
  })),
  ...EVENT_CREATURE_IDS.map((c) => ({
    row: eventCreatureSpriteId(c),
    drawn: () => stripPng(framesOf(drawCreatureSprite(c), 'left')),
  })),
  { row: RIME_ICON, drawn: () => drawRimeIcon().toPng() },
  { row: TOKEN_ICON, drawn: () => drawTokenIcon().toPng() },
  ...MONSTER_IDS.map((m) => ({
    row: monsterSpriteId(m),
    drawn: () => stripPng(framesOf(drawMonsterSprite(m), 'left')),
  })),
  ...GUARDIAN_IDS.map((g) => ({
    row: guardianSpriteId(g),
    drawn: () => stripPng(framesOf(drawMonsterSprite(g), 'left')),
  })),
  ...PATRON_IDS.map((p) => ({ row: sigilIconId(p), drawn: () => drawSigil(p).toPng() })),
  { row: RIFTGLASS_ICON, drawn: () => drawRiftglass().toPng() },
  ...DELVE_RELIC_IDS.map((r) => ({
    row: delveRelicIconId(r),
    drawn: () => drawRelicIcon(r).toPng(),
  })),
  ...RARITIES.map((r) => ({ row: rarityFrameId(r), drawn: () => drawRarityFrame(r).toPng() })),
  ...COSMETIC_IDS.flatMap((c) =>
    AGE_IDS.map((a) => ({ row: cosmeticId(c, a), drawn: () => drawCosmetic(c, a).toPng(SCENE_H) })),
  ),
];

const fileOf = (row: string): string => {
  const entry = assetById.get(row);
  if (entry?.source !== 'generated') throw new Error(`${row} is not a generated row`);
  return entry.file;
};

describe('the v0.7 art', () => {
  it('has a row for every sprite, sigil, relic, frame and cosmetic, all generated', () => {
    // 14 hunters (three legendary) + 6 event creatures + the Rime and token icons + 16 species + 3 guardians; 6 sigils; Riftglass; 6 relics; 3 frames; 4 cosmetics × 4 ranks.
    expect(cases).toHaveLength(14 + 6 + 2 + 16 + 3 + 6 + 1 + 6 + 3 + 16);
    for (const c of cases) expect(assetById.get(c.row)?.source, c.row).toBe('generated');
  });

  it.each(cases)(
    '$row matches its generator, is the manifest size and stays in the palette',
    (c) => {
      const name = fileOf(c.row);
      expect(file(name).equals(c.drawn()), `${name} is stale: rerun tools/gen-sprites.ts`).toBe(
        true,
      );
      const png = PNG.sync.read(file(name));
      expect([png.width, png.height], c.row).toEqual([...(assetById.get(c.row)?.size ?? [])]);
      for (let i = 0; i < png.data.length; i += 4) {
        if ((png.data[i + 3] ?? 0) === 0) continue;
        const hex = [0, 1, 2]
          .map((k) => (png.data[i + k] ?? 0).toString(16).padStart(2, '0'))
          .join('');
        expect(PALETTE_HEX.has(hex), `${name} pixel ${i / 4}: ${hex}`).toBe(true);
      }
    },
  );
});

describe('battle sprites (D265)', () => {
  const sprites = [
    ...HUNTER_IDS.map((h) => ({ id: h, base: drawHunterSprite(h), facing: 'right' as const })),
    ...[...MONSTER_IDS, ...GUARDIAN_IDS].map((m) => ({
      id: m,
      base: drawMonsterSprite(m),
      facing: 'left' as const,
    })),
  ];

  it('are 32 px strips of idle, a second idle, a lunge, a hit flash and a downed pose', () => {
    expect(SPRITE_FRAME_NAMES).toEqual(['idle', 'idle2', 'lunge', 'hit', 'downed']);
    expect(SPRITE_PX).toBe(32);
  });

  it.each(sprites)('$id: every frame is drawn, and each differs from the idle', (s) => {
    const frames = framesOf(s.base, s.facing);
    const same = (a: string[], b: string[]) => a.every((v, i) => v === b[i]);
    const px = (f: keyof typeof frames) => frames[f].px.map((v) => v ?? '');
    for (const f of SPRITE_FRAME_NAMES) {
      expect(
        frames[f].px.filter((v) => v !== null).length,
        `${s.id} ${f} is empty`,
      ).toBeGreaterThan(20);
      if (f !== 'idle') expect(same(px(f), px('idle')), `${s.id} ${f} equals idle`).toBe(false);
    }
  });

  it('the hit flash is white on the body and keeps the outline; the downed pose lies on the ground', () => {
    const base = drawHunterSprite('halvar');
    const frames = framesOf(base, 'right');
    const colors = new Set(frames.hit.px.filter((v) => v !== null));
    expect([...colors].sort()).toEqual(['302c2e', 'dff6f5']);
    // The downed pose rests on the ground line and is lower than the standing one.
    const rows = (f: keyof typeof frames) =>
      frames[f].px.flatMap((v, i) => (v === null ? [] : [Math.floor(i / SPRITE_PX)]));
    expect(Math.max(...rows('downed'))).toBe(Math.max(...rows('idle')));
    expect(Math.min(...rows('downed'))).toBeGreaterThan(Math.min(...rows('idle')));
  });

  it('the lunge steps toward the foe and never leaves the frame', () => {
    for (const s of sprites) {
      const lunge = framesOf(s.base, s.facing).lunge;
      const xs = lunge.px.flatMap((v, i) => (v === null ? [] : [i % SPRITE_PX]));
      const bx = framesOf(s.base, s.facing).idle.px.flatMap((v, i) =>
        v === null ? [] : [i % SPRITE_PX],
      );
      if (s.facing === 'left') expect(Math.min(...xs), s.id).toBeLessThan(Math.min(...bx));
      else expect(Math.max(...xs), s.id).toBeGreaterThan(Math.max(...bx));
      expect(xs.length, s.id).toBe(bx.length);
    }
  });
});
