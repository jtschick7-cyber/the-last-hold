// Technical design §12.3: every asset on one page, for the playtest screenshot pass
// (GDD §9.11). Writes public/contact-sheet.html. v0.7 (plan T7.12, D265): the battle sprites are
// shown frame by frame, and the hold cosmetics are shown on their scenes, in their own sections.
// Run: npx vite-node tools/contact-sheet.ts
// v1.0 (plan TV.2): add --sheets to also write the numbered Keep/Redraw sheets (tools/contact-sheet-numbered.ts).
import { writeFileSync } from 'node:fs';
import { AGE_IDS } from '../src/content/ages';
import {
  assets,
  gearIconId,
  itemFrameId,
  OLD_BREW_ICON_IDS,
  SPRITE_FRAME_NAMES,
  SPRITE_PX,
  type AssetEntry,
} from '../src/content/assets';
import { GEAR_IDS } from '../src/content/gear';
import { ITEM_RARITY_IDS } from '../src/content/items';
import { COSMETIC_IDS } from '../src/content/delves/shop';

const src = (a: AssetEntry): string =>
  a.source === 'placeholder' ? `assets/placeholders/${a.kind}.png` : `assets/${a.file}`;

const cell = (a: AssetEntry): string => {
  const [w, h] = a.size;
  const imgs = [1, 2, 4]
    .map((k) => `<img src="${src(a)}" width="${w * k}" height="${h * k}" alt="">`)
    .join('');
  return `<figure><div class="imgs">${imgs}</div><figcaption><b>${a.label}</b><br><code>${a.id}</code><br>${a.source}</figcaption></figure>`;
};

const K = 2;
const spriteRow = (a: AssetEntry): string => {
  const frames = SPRITE_FRAME_NAMES.map(
    (name, i) =>
      `<span class="frame" title="${name}" style="background-image:url(${src(a)});background-size:${SPRITE_PX * SPRITE_FRAME_NAMES.length * K}px ${SPRITE_PX * K}px;background-position:-${i * SPRITE_PX * K}px 0"></span>`,
  ).join('');
  return `<figure class="sprite"><div class="frames">${frames}</div><figcaption><b>${a.label}</b><br><code>${a.id}</code></figcaption></figure>`;
};

const sceneFor = (age: string): string => {
  const layers = COSMETIC_IDS.map(
    (c) =>
      `<img src="assets/scenes/cosmetics/${age}-${c}.png" width="${160 * 2}" height="${64 * 2}" alt="${c}">`,
  ).join('');
  return `<figure class="scene"><div class="stack" style="width:320px;height:128px"><img src="assets/scenes/hold-${age}.png" width="320" height="128" alt="">${layers}</div><figcaption><b>The hold at ${age}, all four cosmetics</b></figcaption></figure>`;
};

const isSprite = (a: AssetEntry): boolean => a.kind === 'sprite';
const isCosmetic = (a: AssetEntry): boolean => a.id.startsWith('scene.cosmetic.');
// v0.8 (plan T8.14, D324): the item art has its own section, with each gear piece on each frame.
const isV08 = (a: AssetEntry): boolean =>
  a.id.startsWith('icon.item.') ||
  a.id.startsWith('icon.item-frame.') ||
  a.id.startsWith('icon.keepsake.') ||
  a.id.startsWith('icon.rank.') ||
  a.id === 'icon.star' ||
  OLD_BREW_ICON_IDS.some((b) => a.id === `icon.brew.${b}`);
// v0.10 (plan T10.15): the Orders' marks, the card icon and the opening-scene placeholders.
const isV10 = (a: AssetEntry): boolean =>
  a.id === 'icon.orders' || /^(icon|scene)\.order\./.test(a.id);
const rest = assets.filter((a) => !isSprite(a) && !isCosmetic(a) && !isV08(a) && !isV10(a));

const fileOf = (id: string): string => {
  const a = assets.find((x) => x.id === id);
  return a && a.source !== 'placeholder' ? a.file : '';
};

/** One gear icon (16 px) centred in an item frame (20 px), both at 4×. */
const framed = (gear: string, frame: string): string =>
  `<span class="framed"><img src="assets/${fileOf(frame)}" width="80" height="80" alt=""><img class="over" src="assets/${fileOf(gear)}" width="64" height="64" alt=""></span>`;
const itemRows = ITEM_RARITY_IDS.map(
  (r) => `<div>${r}: ${GEAR_IDS.map((g) => framed(gearIconId(g), itemFrameId(r))).join('')}</div>`,
).join('\n');

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Last Hold — contact sheet</title>
<style>
body{margin:0;padding:16px;background:#2a2a2a;color:#eee;font-family:system-ui,sans-serif}
figure{display:inline-block;vertical-align:top;margin:0 12px 16px 0;padding:8px;background:#383838;border-radius:6px}
.imgs{display:flex;align-items:flex-end;gap:6px}img{image-rendering:pixelated;background:#555}
figcaption{font-size:11px;margin-top:6px}code{color:#9cf}
.frames{display:flex;gap:4px}.frame{display:inline-block;width:${SPRITE_PX * K}px;height:${SPRITE_PX * K}px;background-color:#555;image-rendering:pixelated;background-repeat:no-repeat}
.stack{position:relative}.stack img{position:absolute;left:0;top:0;background:none}.stack img:first-child{background:#555}
h2{margin:24px 0 4px}
.framed{position:relative;display:inline-block;width:80px;height:80px;margin:0 4px 4px 0}.framed img{image-rendering:pixelated;position:absolute;left:0;top:0;background:none}.framed .over{left:8px;top:8px}
</style></head><body>
<h1>Contact sheet</h1>
<p>${assets.length} assets. Placeholders show their kind's silhouette.</p>
<h2>Battle sprites (v0.7)</h2>
<p>Each row: idle, idle (second frame), lunge, hit flash, downed. Hunters face right, monsters left.</p>
${assets.filter(isSprite).map(spriteRow).join('\n')}
<h2>Hold cosmetics (v0.7)</h2>
<p>The four cosmetics on each Rank's hold scene.</p>
${AGE_IDS.map(sceneFor).join('\n')}
<h2>Items, keepsakes, ranks and the older brews (v0.8)</h2>
<p>Each gear piece on each rarity frame (Common, Fine, Rare, Heroic), then every new asset on its own.</p>
${itemRows}
${assets.filter(isV08).map(cell).join('\n')}
<h2>The Orders (v0.10)</h2>
<p>The card's icon, each Order's mark and each opening scene's placeholder, for the owner to approve.</p>
${assets.filter(isV10).map(cell).join('\n')}
<h2>Everything else</h2>
${rest.map(cell).join('\n')}
</body></html>
`;

writeFileSync(new URL('../public/contact-sheet.html', import.meta.url), html);
console.log('wrote public/contact-sheet.html');

if (process.argv.includes('--sheets')) await import('./contact-sheet-numbered');
