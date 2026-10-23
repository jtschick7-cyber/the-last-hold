// The audition page (SF.4, D524 (2)): preview build only. It lists the candidates in
// docs/flesh-out/v1.2/sound-marks.md, grouped by sound, so the owner can listen and pick one per
// sound. Labels here are exempt from the string rule (GDD §9.22). Plain Web Audio, like the game.
import type { Candidate, SoundMarks } from './sound-marks';
import { SOUND_IDS } from './sound-marks';

/** All sounds together, at most (D523 (2)); the real room is worked out in SF.9. */
export const SOUND_CAP_BYTES = 30 * 1024;
/** The files are 48 kbps constant bit rate, so size gives length: 6,000 bytes per second. */
export const BYTES_PER_SECOND = 6000;

export const candidateAudioFile = (n: number): string => `${String(n).padStart(2, '0')}.mp3`;

const SLOT_LABEL: Record<(typeof SOUND_IDS)[number], string> = {
  build: 'Build',
  launch: 'Launch',
  place: 'Place',
  win: 'Win',
  lose: 'Lose',
  fanfare: 'Fanfare',
  nightfall: 'Nightfall',
};

const esc = (s: string): string =>
  s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const row = (c: Candidate, bytes: number): string => {
  const seconds = (bytes / BYTES_PER_SECOND).toFixed(2);
  const name = c.file.split('/').pop() ?? c.file;
  return `<li class="clip" data-n="${c.n}" data-bytes="${bytes}">
  <button type="button" class="play" data-file="audition/${candidateAudioFile(c.n)}" aria-label="Play ${c.n}">▶ ${c.n}</button>
  <span class="meta"><b>${c.n}</b> ${esc(c.pack)} · ${esc(name)}<br>${seconds} s · ${(bytes / 1024).toFixed(1)} KB</span>
  <label class="pick"><input type="radio" name="${c.slot}" value="${c.n}"> Pick</label>
</li>`;
};

export const renderAuditionPage = (marks: SoundMarks, sizes: Record<number, number>): string => {
  const sections = SOUND_IDS.map((slot) => {
    const items = marks.candidates.filter((c) => c.slot === slot);
    return `<section data-slot="${slot}"><h2>${SLOT_LABEL[slot]}</h2><ul>
${items.map((c) => row(c, sizes[c.n] ?? 0)).join('\n')}
</ul></section>`;
  }).join('\n');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Sound audition</title>
<style>
:root{color-scheme:dark light;--bg:#16120f;--fg:#ece3d6;--card:#2a241f;--line:#4a4038;--accent:#e08a3c}
@media (prefers-color-scheme:light){:root{--bg:#f6efe4;--fg:#2b2118;--card:#ebe0d0;--line:#c9b9a4;--accent:#9a4f0b}}
body{margin:0;padding:16px;background:var(--bg);color:var(--fg);font:16px/1.4 system-ui,sans-serif}
h1{font-size:1.25rem;margin:0 0 .5rem} h2{font-size:1.1rem;margin:1.25rem 0 .5rem}
ul{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.clip{display:flex;align-items:center;gap:12px;background:var(--card);border:1px solid var(--line);border-radius:8px;padding:8px}
.play{min-width:64px;min-height:48px;font:inherit;font-weight:700;color:var(--fg);background:transparent;border:2px solid var(--accent);border-radius:8px}
.meta{flex:1;font-size:.9rem;overflow-wrap:anywhere}
.pick{display:flex;align-items:center;gap:6px;min-width:64px;min-height:48px;padding:0 4px}
.pick input{width:24px;height:24px}
.total{position:sticky;bottom:0;background:var(--bg);border-top:2px solid var(--accent);padding:12px 0;margin-top:1rem}
.over{color:#d4543c;font-weight:700} pre{white-space:pre-wrap;margin:.5rem 0 0}
</style></head><body>
<h1>Sound audition (preview build only)</h1>
<p>Tap a number to hear it, then tap Pick under the one you want for each sound. If you hear nothing, check the phone's silent switch and volume. Then send the picks line at the bottom to Claude Code.</p>
${sections}
<div class="total"><div id="total"></div><pre id="picks"></pre></div>
<script>
(function(){
  var cap=${SOUND_CAP_BYTES}, ctx=null, cache={};
  function ac(){ if(!ctx){ var C=window.AudioContext||window.webkitAudioContext; ctx=new C(); } return ctx; }
  function load(file){
    if(cache[file]) return cache[file];
    cache[file]=fetch(file).then(function(r){return r.arrayBuffer();}).then(function(b){
      return new Promise(function(ok,bad){ ac().decodeAudioData(b,ok,bad); });
    });
    return cache[file];
  }
  function play(btn){
    var c=ac(); var go=function(){ load(btn.dataset.file).then(function(buf){
      var s=c.createBufferSource(); s.buffer=buf; s.connect(c.destination); s.start();
    }).catch(function(){ btn.textContent='✕ '+btn.getAttribute('aria-label').slice(5); }); };
    if(c.state==='running') go(); else c.resume().then(go,go);
  }
  document.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('.play'); if(b) play(b);
  });
  function sum(){
    var total=0, lines=[], secs=0;
    document.querySelectorAll('section').forEach(function(sec){
      var r=sec.querySelector('input:checked'), name=sec.querySelector('h2').textContent;
      if(r){ var li=r.closest('li'); total+=Number(li.dataset.bytes); lines.push(name+': '+r.value); }
      else lines.push(name+': -');
    });
    var t=document.getElementById('total');
    t.textContent='Picked so far: '+(total/1024).toFixed(1)+' KB of '+(cap/1024)+' KB allowed';
    t.className=total>cap?'over':'';
    document.getElementById('picks').textContent='My picks: '+lines.join(', ');
  }
  document.addEventListener('change',sum); sum();
})();
</script></body></html>
`;
};
