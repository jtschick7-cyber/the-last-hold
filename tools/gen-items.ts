// Writes the v0.8 art (plan T8.14, D324): gear base icons, item rarity frames, keepsake icons, the
// star, rank badges and the nine older brews' icons. The drawing lives in draw-items.ts so tests
// can redraw and compare. Run: npx vite-node tools/gen-items.ts
import { mkdirSync, writeFileSync } from 'node:fs';
import { GEAR_IDS } from '../src/content/gear';
import { ITEM_RARITY_IDS } from '../src/content/items';
import { LEGENDARY_IDS } from '../src/content/legendaries';
import { HUNTER_RANK_IDS } from '../src/content/ranks';
import {
  drawGearIcon,
  drawItemFrame,
  drawKeepsakeIcon,
  drawOldBrewIcon,
  drawRankBadge,
  drawStarIcon,
  OLD_BREW_IDS,
} from './draw-items';

const root = new URL('../public/assets/', import.meta.url);
const write = (file: string, png: Buffer): void => {
  const url = new URL(file, root);
  mkdirSync(new URL('./', url), { recursive: true });
  writeFileSync(url, png);
  console.log(`public/assets/${file}`);
};

for (const g of GEAR_IDS) write(`icons/item-${g}.png`, drawGearIcon(g).toPng());
for (const r of ITEM_RARITY_IDS) write(`icons/item-frame-${r}.png`, drawItemFrame(r).toPng());
for (const l of LEGENDARY_IDS) write(`icons/keepsake-${l}.png`, drawKeepsakeIcon(l).toPng());
write('icons/star.png', drawStarIcon().toPng());
for (const r of HUNTER_RANK_IDS) write(`icons/rank-${r}.png`, drawRankBadge(r).toPng());
for (const b of OLD_BREW_IDS) write(`icons/brew-${b}.png`, drawOldBrewIcon(b).toPng());
