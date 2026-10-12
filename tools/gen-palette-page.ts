// Plan T1.28: writes public/palettes.html, a swatch page for choosing the
// palette. Each candidate shows its 32 colors and a small Hold mock-up in that
// palette. Run: npx vite-node tools/gen-palette-page.ts
import { writeFileSync } from 'node:fs';
import { paletteCandidates, type PaletteCandidate } from '../src/content/palette-candidates';

const swatch = (hex: string): string =>
  `<div class="sw"><div class="chip" style="background:#${hex}"></div><code>${hex}</code></div>`;

const mock = (p: PaletteCandidate): string => {
  const u = p.ui;
  return `<div class="mock" style="background:#${u.bg};color:#${u.text};border-color:#${u.border}">
  <div class="bar" style="border-color:#${u.border}">🌾 1.23K &nbsp; 🪵 860 &nbsp; ⛏️ 310 &nbsp; ⚪ 42</div>
  <div class="card" style="background:#${u.surface};border-color:#${u.border}">
    <div class="title" style="color:#${u.ember}">STANHOLM — HAMLET</div>
    <div style="color:#${u.dim};font-size:13px">Brana: “That's one. I'll start a list.”</div>
  </div>
  <div class="card" style="background:#${u.surface};border-color:#${u.border}">
    <div class="row"><span><b>Cottage</b> <span style="color:#${u.dim}">×3</span><br><small style="color:#${u.dim}">+2 housing</small></span>
      <span class="btn" style="background:#${u.ember};color:#${u.bg}">Buy</span></div>
    <div class="row"><span><b>Mill</b> <span style="color:#${u.dim}">Lv 2/5</span><br><small style="color:#${u.dim}">+25% food</small></span>
      <span class="btn" style="background:#${u.raised};color:#${u.text};border:1px solid #${u.border}">Upgrade</span></div>
    <div style="font-size:13px"><span style="color:#${u.warn}">idle 1 ⚠️</span> &nbsp; <span style="color:#${u.good}">✔ Mill level 3/3</span></div>
  </div>
</div>`;
};

const section = (p: PaletteCandidate, i: number): string => `<section>
  <h2>${String.fromCharCode(65 + i)}. ${p.name}</h2>
  <p class="by">by ${p.author}, free to use · <a href="${p.source}">source</a></p>
  ${mock(p)}
  <div class="grid">${p.colors.map(swatch).join('')}</div>
</section>`;

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Last Hold — palette candidates</title>
<style>
body{margin:0;padding:16px;font-family:system-ui,sans-serif;background:#1b1b1b;color:#eee;max-width:720px;margin:auto}
h1{font-size:20px} h2{font-size:18px;margin:28px 0 4px} .by{margin:0 0 10px;color:#aaa;font-size:13px} a{color:#9cf}
.grid{display:grid;grid-template-columns:repeat(8,1fr);gap:4px;margin-top:10px}
.sw{font-size:9px;text-align:center}.chip{aspect-ratio:1;border-radius:3px;border:1px solid #0004}
.mock{border:1px solid;border-radius:10px;padding:8px;max-width:360px}
.bar{padding:4px 2px 8px;border-bottom:1px solid;margin-bottom:8px;font-family:ui-monospace,monospace;font-size:14px}
.card{border:1px solid;border-radius:8px;padding:8px;margin-bottom:8px}.title{font-family:ui-monospace,monospace;font-weight:700;letter-spacing:.05em}
.row{display:flex;justify-content:space-between;align-items:center;margin:6px 0}.btn{padding:8px 14px;border-radius:6px;font-weight:700}
</style></head><body>
<h1>Pick a palette for The Last Hold</h1>
<p>Every piece of art (packs and generated) gets recolored to one 32-color palette, so mixed sources look like one game (GDD §9.12). Each candidate shows a small Hold mock-up and its 32 colors. The mock-up's color choices are a starting point and can be tuned; the question is which set of 32 feels right. Reply with A, B or C.</p>
${paletteCandidates.map(section).join('\n')}
</body></html>
`;

writeFileSync(new URL('../public/palettes.html', import.meta.url), html);
console.log('wrote public/palettes.html');
