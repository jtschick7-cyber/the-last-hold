// A scaled preview PNG of sprite strips, for looking at them while drawing. Not committed output.
import { writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { drawHunterSprite, HUNTER_IDS } from './sprite-hunters';
import { drawMonsterSprite, SPRITE_MONSTER_IDS } from './sprite-monsters';
import { framesOf, SPRITE_FRAMES } from './sprite-frames';

const K = 4;
const which = process.argv[3] ?? 'monsters';
const ids: readonly string[] = which === 'hunters' ? HUNTER_IDS : SPRITE_MONSTER_IDS;
const w = SPRITE_FRAMES.length * 32;
const png = new PNG({ width: w * K, height: ids.length * 32 * K });
png.data.fill(0x55);
for (let i = 0; i < png.data.length; i += 4) png.data[i + 3] = 255;
ids.forEach((id, row) => {
  const frames =
    which === 'hunters'
      ? framesOf(drawHunterSprite(id as never), 'right')
      : framesOf(drawMonsterSprite(id as never), 'left');
  SPRITE_FRAMES.forEach((f, col) => {
    for (let y = 0; y < 32; y++)
      for (let x = 0; x < 32; x++) {
        const hex = frames[f].get(x, y);
        if (!hex) continue;
        for (let dy = 0; dy < K; dy++)
          for (let dx = 0; dx < K; dx++) {
            const o = (((row * 32 + y) * K + dy) * png.width + (col * 32 + x) * K + dx) * 4;
            png.data[o] = parseInt(hex.slice(0, 2), 16);
            png.data[o + 1] = parseInt(hex.slice(2, 4), 16);
            png.data[o + 2] = parseInt(hex.slice(4, 6), 16);
          }
      }
  });
});
writeFileSync(process.argv[2] ?? 'preview.png', PNG.sync.write(png));
