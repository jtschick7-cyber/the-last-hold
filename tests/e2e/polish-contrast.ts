import type { Page } from '@playwright/test';

// Plan TV.6 (GDD §9.20): derives (text, background) pairs from the computed colours of what is on
// screen, in the page or the topmost open sheet plus the two bars, and returns those that miss the
// ratio: 4.5:1 for normal text, 3:1 for large text (18 pt, or 14 pt bold, at its rendered size) and
// for UI glyph icons (a symbol with no letters or digits: ⓘ ✕ ▸ − +). Multi-colour art, emoji and
// text over a picture are not measured (the playtest looks at them); disabled controls are exempt.

export interface Pair {
  readonly text: string;
  readonly tag: string;
  readonly fg: string;
  readonly bg: string;
  readonly ratio: number;
  readonly needs: number;
  readonly sizePx: number;
  readonly kind: 'text' | 'large text' | 'glyph';
}

export interface ContrastScan {
  readonly measured: number;
  readonly skipped: number;
  readonly failing: Pair[];
}

export const scanContrast = (page: Page): Promise<ContrastScan> =>
  page.evaluate(() => {
    type RGBA = [number, number, number, number];
    const parse = (v: string): RGBA | null => {
      const m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.%]+))?\s*\)$/.exec(
        v,
      );
      if (!m) return null;
      const a =
        m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
      return [parseFloat(m[1] ?? '0'), parseFloat(m[2] ?? '0'), parseFloat(m[3] ?? '0'), a];
    };
    const over = (top: RGBA, under: RGBA): RGBA => {
      const a = top[3] + under[3] * (1 - top[3]);
      if (a === 0) return [0, 0, 0, 0];
      const mix = (i: 0 | 1 | 2): number =>
        (top[i] * top[3] + under[i] * under[3] * (1 - top[3])) / a;
      return [mix(0), mix(1), mix(2), a];
    };
    const lum = (c: RGBA): number => {
      const f = (v: number): number => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
    };
    const hex = (c: RGBA): string =>
      '#' +
      c
        .slice(0, 3)
        .map((v) => Math.round(v).toString(16).padStart(2, '0'))
        .join('');

    const dialogs = [...document.querySelectorAll('[role="dialog"]')];
    const top = dialogs[dialogs.length - 1];
    if (top?.getAttribute('aria-label') === 'Debug')
      return { measured: 0, skipped: 0, failing: [] };
    const scopes: Element[] = top ? [top] : [document.querySelector('main') ?? document.body];
    const bars = [
      ...document.querySelectorAll('nav[aria-label="Screens"]'),
      ...[...document.querySelectorAll('button, header, div')].filter(
        (e) => getComputedStyle(e).position === 'sticky' && e.getBoundingClientRect().top <= 1,
      ),
    ];

    /** The colour behind an element, or null when a picture or gradient is in the way. */
    const backdrop = (el: Element): RGBA | null => {
      const layers: RGBA[] = [];
      for (let e: Element | null = el; e; e = e.parentElement) {
        const s = getComputedStyle(e);
        if (s.backgroundImage !== 'none') return null;
        const c = parse(s.backgroundColor);
        if (c && c[3] > 0) {
          layers.push(c);
          if (c[3] >= 1) break;
        }
      }
      let acc: RGBA = [255, 255, 255, 1];
      for (const l of layers.reverse()) acc = over(l, acc);
      return acc;
    };
    const opacityOf = (el: Element): number => {
      let o = 1;
      for (let e: Element | null = el; e; e = e.parentElement)
        o *= parseFloat(getComputedStyle(e).opacity);
      return o;
    };

    const failing: Pair[] = [];
    const seen = new Set<string>();
    let measured = 0;
    let skipped = 0;
    for (const scope of [...scopes, ...bars]) {
      for (const el of [scope, ...scope.querySelectorAll('*')]) {
        const own = [...el.childNodes]
          .filter((n) => n.nodeType === Node.TEXT_NODE)
          .map((n) => n.textContent ?? '')
          .join('')
          .trim()
          .replace(/\s+/g, ' ');
        if (own === '') continue;
        const r = el.getBoundingClientRect();
        if (r.width <= 1 || r.height <= 1) continue;
        if (el.closest('[aria-hidden="true"], [disabled], option, script, style')) continue;
        const s = getComputedStyle(el);
        if (s.visibility === 'hidden' || s.display === 'none') continue;
        if (/\p{Extended_Pictographic}/u.test(own) && !/[\p{L}\p{N}]/u.test(own)) {
          skipped++;
          continue;
        }
        const bg = backdrop(el);
        const fg0 = parse(s.color);
        if (!bg || !fg0) {
          skipped++;
          continue;
        }
        const fg = over([fg0[0], fg0[1], fg0[2], fg0[3] * opacityOf(el)], bg);
        const hi = Math.max(lum(fg), lum(bg));
        const lo = Math.min(lum(fg), lum(bg));
        const ratio = (hi + 0.05) / (lo + 0.05);
        const sizePx = parseFloat(s.fontSize);
        const bold = parseInt(s.fontWeight, 10) >= 700;
        const glyph = !/[\p{L}\p{N}]/u.test(own);
        const large = sizePx >= 24 || (bold && sizePx >= 18.66);
        const kind = glyph ? 'glyph' : large ? 'large text' : 'text';
        const needs = glyph || large ? 3 : 4.5;
        measured++;
        if (ratio + 0.005 >= needs) continue;
        const key = `${hex(fg)}|${hex(bg)}|${own.slice(0, 30)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        failing.push({
          text: own.slice(0, 40),
          tag: el.tagName.toLowerCase(),
          fg: hex(fg),
          bg: hex(bg),
          ratio: Math.round(ratio * 100) / 100,
          needs,
          sizePx: Math.round(sizePx * 10) / 10,
          kind,
        });
      }
    }
    return { measured, skipped, failing };
  });
