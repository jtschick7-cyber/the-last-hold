// Technical design §12.3: every asset on one page, at 1×, 2× and 4×, for the
// playtest screenshot pass (GDD §9.11). Writes public/contact-sheet.html.
// Run: npx vite-node tools/contact-sheet.ts
import { writeFileSync } from 'node:fs';
import { assets, type AssetEntry } from '../src/content/assets';

const src = (a: AssetEntry): string =>
  a.source === 'placeholder' ? `assets/placeholders/${a.kind}.png` : `assets/${a.file}`;

const cell = (a: AssetEntry): string => {
  const [w, h] = a.size;
  const imgs = [1, 2, 4]
    .map((k) => `<img src="${src(a)}" width="${w * k}" height="${h * k}" alt="">`)
    .join('');
  return `<figure><div class="imgs">${imgs}</div><figcaption><b>${a.label}</b><br><code>${a.id}</code><br>${a.source}</figcaption></figure>`;
};

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Last Hold — contact sheet</title>
<style>
body{margin:0;padding:16px;background:#2a2a2a;color:#eee;font-family:system-ui,sans-serif}
figure{display:inline-block;vertical-align:top;margin:0 12px 16px 0;padding:8px;background:#383838;border-radius:6px}
.imgs{display:flex;align-items:flex-end;gap:6px}img{image-rendering:pixelated;background:#555}
figcaption{font-size:11px;margin-top:6px}code{color:#9cf}
</style></head><body>
<h1>Contact sheet</h1>
<p>${assets.length} assets. Placeholders show their kind's silhouette.</p>
${assets.map(cell).join('\n')}
</body></html>
`;

writeFileSync(new URL('../public/contact-sheet.html', import.meta.url), html);
console.log('wrote public/contact-sheet.html');
