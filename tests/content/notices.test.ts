// Plan T2.2: contract notices follow setting-primer §6.3 and §6.7.
import { describe, expect, it } from 'vitest';
import { MONSTER_IDS, monsters } from '../../src/content/monsters';
import { notices } from '../../src/content/text/notices';
import { VILLAGE_IDS, villages } from '../../src/content/villages';
import { noticeFor } from '../../src/core/contracts/notice';
import type { ContractInstance } from '../../src/core/state/game-state';

const all = VILLAGE_IDS.flatMap((v) =>
  Object.entries(notices[v]).flatMap(([location, list]) =>
    (list ?? []).map((text) => ({ village: v, location, text })),
  ),
);
const sentences = (t: string): number => (t.match(/[.!?](\s|$)/g) ?? []).length;

describe('notices', () => {
  it('cover every place a village can send a contract from, with at least 3 each', () => {
    for (const v of VILLAGE_IDS) {
      for (const location of villages[v].locations) {
        expect(notices[v][location]?.length ?? 0, `${v} ${location}`).toBeGreaterThanOrEqual(3);
      }
      expect(Object.keys(notices[v]).sort()).toEqual([...villages[v].locations].sort());
    }
  });

  it('are 2–4 sentences each', () => {
    for (const n of all) {
      expect(sentences(n.text), n.text).toBeGreaterThanOrEqual(2);
      expect(sentences(n.text), n.text).toBeLessThanOrEqual(4);
    }
  });

  it('describe symptoms and never name a monster', () => {
    const names = MONSTER_IDS.map((id) => monsters[id].name.toLowerCase());
    for (const n of all) {
      const lower = n.text.toLowerCase();
      for (const name of names)
        expect(lower, `"${name}" in: ${n.text}`).not.toMatch(new RegExp(`\\b${name}\\b`));
    }
  });

  it('carry an early seed in at most 1 in 10, never more than one, and Ravenfell never mentions the Firstblade', () => {
    const seeded = all.filter((n) => /went onward|firstblade|the order/i.test(n.text));
    expect(seeded.length / all.length).toBeLessThanOrEqual(0.1);
    for (const n of seeded) {
      const marks = [/went onward/i, /firstblade/i].filter((r) => r.test(n.text)).length;
      expect(marks).toBeLessThanOrEqual(1);
    }
    for (const n of all.filter((x) => x.village === 'ravenfell')) {
      expect(n.text).not.toMatch(/firstblade|order/i);
    }
  });

  it('hold back the Firstblade until the owner settles Q10 (a Skyrim lore name)', () => {
    for (const n of all) expect(n.text).not.toMatch(/firstblade/i);
  });

  it('are signed by the village head, and a contract always reads the same', () => {
    const c: ContractInstance = {
      id: 'c4',
      village: 'dubno-ford',
      monster: 'rusalka',
      tier: 2,
      location: 'river',
      arrivedAt: 0,
      revealed: 3,
    };
    const a = noticeFor(c, 'seed');
    expect(a).toEqual(noticeFor(c, 'seed'));
    expect(a.signature).toBe('— Marta Dubska, Dubno Ford');
    expect(notices['dubno-ford'].river).toContain(a.text);
    const seen = new Set(
      Array.from({ length: 40 }, (_, i) => noticeFor({ ...c, id: `c${i}` }, 'seed').text),
    );
    expect(seen.size).toBeGreaterThan(1);
  });

  it('colder villages are terser than warmer ones', () => {
    const words = (v: (typeof VILLAGE_IDS)[number]): number => {
      const list = all.filter((n) => n.village === v);
      return list.reduce((s, n) => s + n.text.split(/\s+/).length, 0) / list.length;
    };
    expect(words('kozly-hollow')).toBeLessThan(words('mirograd'));
    expect(words('ravenfell')).toBeLessThan(words('mirograd'));
    expect(words('ravenfell')).toBeLessThan(words('dubno-ford'));
  });
});

import { SCENE_IDS, scenes } from '../../src/content/text/scenes';
import { LINE_TRIGGERS, residentLines } from '../../src/content/text/lines';
describe('scenes and lines (plan T2.2)', () => {
  it('every scene has text, and the vow names the order’s public words', () => {
    for (const id of SCENE_IDS) {
      expect(scenes[id].paragraphs.length).toBeGreaterThan(1);
      expect(scenes[id].id).toBe(id);
    }
    expect(scenes.vow.paragraphs.join(' ')).toContain('The fire for the folk');
    for (const id of SCENE_IDS) {
      for (const p of scenes[id].paragraphs) {
        expect(p.replace(/\{(a|b)\}/g, '')).not.toMatch(/\{/); // only {a} and {b} placeholders
      }
    }
  });

  it('the first-contract-success line is Brana’s, with 3–5 variants', () => {
    const t = residentLines['first-contract-success'];
    expect(LINE_TRIGGERS).toContain('first-contract-success');
    expect(t.speaker).toBe('brana');
    expect(t.variants.length).toBeGreaterThanOrEqual(3);
    expect(t.variants.length).toBeLessThanOrEqual(5);
    expect(t.variants).toContain('Silver. Real silver. Say it again so I believe it.');
  });
});
