// Writes the v0.7 art (plan T7.12, D265): battle sprite strips, patron sigils, the Riftglass and
// Delve relic icons, rarity frames and the hold cosmetics. The drawing lives in the sprite-*,
// draw-icons16 and draw-cosmetics modules so tests can redraw and compare.
// Run: npx vite-node tools/gen-sprites.ts
import { mkdirSync, writeFileSync } from 'node:fs';
import { AGE_IDS } from '../src/content/ages';
import { GUARDIAN_IDS } from '../src/content/delves/guardians';
import { PATRON_IDS } from '../src/content/delves/patrons';
import { DELVE_RELIC_IDS } from '../src/content/delves/relics';
import { COSMETIC_IDS } from '../src/content/delves/shop';
import { RARITIES } from '../src/content/delves/blessing-types';
import { MONSTER_IDS } from '../src/content/monsters';
import { HUNTER_IDS } from '../src/content/hunters';
import { EVENT_CREATURE_IDS } from '../src/content/hunts';
import { drawCreaturePortrait, drawCreatureSprite } from './draw-creatures';
import { drawCosmetic, SCENE_H } from './draw-cosmetics';
import {
  drawRarityFrame,
  drawRelicIcon,
  drawRiftglass,
  drawRimeIcon,
  drawSigil,
  drawTokenIcon,
} from './draw-icons16';
import { drawOrderMark, drawOrderScene, drawOrdersIcon, ORDER_SCENE_H } from './draw-orders';
import { ORDER_IDS } from '../src/content/orders';
import { framesOf, stripPng } from './sprite-frames';
import { drawHunterSprite } from './sprite-hunters';
import { drawMonsterSprite } from './sprite-monsters';

const root = new URL('../public/assets/', import.meta.url);
const write = (file: string, png: Buffer): void => {
  const url = new URL(file, root);
  mkdirSync(new URL('./', url), { recursive: true });
  writeFileSync(url, png);
  console.log(`public/assets/${file}`);
};

for (const h of HUNTER_IDS)
  write(`sprites/hunter-${h}.png`, stripPng(framesOf(drawHunterSprite(h), 'right')));
for (const m of MONSTER_IDS)
  write(`sprites/monster-${m}.png`, stripPng(framesOf(drawMonsterSprite(m), 'left')));
for (const g of GUARDIAN_IDS)
  write(`sprites/guardian-${g}.png`, stripPng(framesOf(drawMonsterSprite(g), 'left')));
for (const p of PATRON_IDS) write(`icons/sigil-${p}.png`, drawSigil(p).toPng());
for (const c of EVENT_CREATURE_IDS) {
  write(`sprites/creature-${c}.png`, stripPng(framesOf(drawCreatureSprite(c), 'left')));
  write(`portraits/creature-${c}.png`, drawCreaturePortrait(c).toPng());
}
write('icons/rime.png', drawRimeIcon().toPng());
write('icons/token.png', drawTokenIcon().toPng());
write('icons/riftglass.png', drawRiftglass().toPng());
for (const r of DELVE_RELIC_IDS) write(`icons/delve-relic-${r}.png`, drawRelicIcon(r).toPng());
for (const r of RARITIES) write(`icons/rarity-${r}.png`, drawRarityFrame(r).toPng());
for (const c of COSMETIC_IDS)
  for (const a of AGE_IDS)
    write(`scenes/cosmetics/${a}-${c}.png`, drawCosmetic(c, a).toPng(SCENE_H));
// v0.10 (plan T10.15, Q36 (a)): the Orders' marks, the card's icon and the opening-scene placeholders.
write('icons/orders.png', drawOrdersIcon().toPng());
for (const id of ORDER_IDS) {
  write(`icons/order-${id}.png`, drawOrderMark(id).toPng());
  write(`scenes/orders/${id}.png`, drawOrderScene(id).toPng(ORDER_SCENE_H));
}
