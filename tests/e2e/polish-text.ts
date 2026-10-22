import type { Page } from '@playwright/test';

// Plan TV.4a (GDD §9.20): measuring for the Text size checks. `measure` records, for the page or
// the topmost open sheet (plus the two bars), every element with its own text or a picture; the
// pixel font, pictures and bars must not change with the Text size, body text must. `overflow`
// lists what does not fit at the current width.

export interface Measured {
  readonly key: string;
  readonly kind: 'text' | 'pixel' | 'picture' | 'bar';
  readonly fontSize: number;
  readonly width: number;
  readonly height: number;
}

export const measure = (page: Page): Promise<Measured[]> =>
  page.evaluate(() => {
    const dialogs = [...document.querySelectorAll('[role="dialog"]')];
    const top = dialogs[dialogs.length - 1];
    if (top?.getAttribute('aria-label') === 'Debug') return [];
    const scopes: Element[] = top ? [top] : [document.querySelector('main') ?? document.body];
    const bars = [
      ...document.querySelectorAll('nav[aria-label="Screens"]'),
      ...[...document.querySelectorAll('header, div')].filter(
        (e) => getComputedStyle(e).position === 'sticky' && e.getBoundingClientRect().top <= 1,
      ),
    ];
    const out: Measured[] = [];
    const round = (n: number): number => Math.round(n * 10) / 10;
    const seen = new Set<Element>();
    const add = (el: Element, kind: Measured['kind'], i: number): void => {
      if (seen.has(el)) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      seen.add(el);
      const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 24);
      out.push({
        key: `${i}|${el.tagName.toLowerCase()}|${kind === 'picture' ? (el.getAttribute('alt') ?? '') : text}`,
        kind,
        fontSize: round(parseFloat(getComputedStyle(el).fontSize)),
        width: round(r.width),
        height: round(r.height),
      });
    };
    let i = 0;
    for (const scope of [...scopes, ...bars]) {
      const inBar = bars.includes(scope);
      for (const el of [scope, ...scope.querySelectorAll('*')]) {
        const own = [...el.childNodes].some(
          (n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim() !== '',
        );
        const isPicture = el.tagName === 'IMG' || el.tagName === 'CANVAS';
        if (!own && !isPicture) continue;
        if (el.closest('[aria-hidden="true"]')) continue;
        // A picture stretched to its container (scenes) follows the container's width, which
        // moves with the page's padding; only pictures at a fixed size are held to "never scales".
        if (isPicture && (el as HTMLElement).style.width.endsWith('%')) continue;
        const pixel = getComputedStyle(el).fontFamily.includes('Kenney');
        add(el, isPicture ? 'picture' : inBar ? 'bar' : pixel ? 'pixel' : 'text', i++);
      }
    }
    return out;
  });

export interface Overflow {
  readonly page: string | null;
  readonly clipped: string[];
}

export const overflow = (page: Page): Promise<Overflow> =>
  page.evaluate(() => {
    const doc = document.documentElement;
    const pageOver =
      doc.scrollWidth > innerWidth ? `page ${doc.scrollWidth} wide in ${innerWidth}` : null;
    const dialogs = [...document.querySelectorAll('[role="dialog"]')];
    const top = dialogs[dialogs.length - 1];
    if (top?.getAttribute('aria-label') === 'Debug') return { page: null, clipped: [] };
    const scope: ParentNode = top ?? document;
    const clipped: string[] = [];
    for (const el of scope.querySelectorAll('*')) {
      if (el.closest('[aria-hidden="true"]')) continue;
      const nodes = [...el.childNodes].filter(
        (n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim() !== '',
      );
      if (nodes.length === 0) continue;
      const box = el.getBoundingClientRect();
      // The visually hidden labels (1 × 1 px, clipped) are for nothing to read.
      if (box.width <= 1 && box.height <= 1) continue;
      const s = getComputedStyle(el);
      if (s.display === 'contents') continue;
      // Where the element's own text is drawn.
      let left = Infinity;
      let right = -Infinity;
      let topY = Infinity;
      let bottom = -Infinity;
      for (const n of nodes) {
        const range = document.createRange();
        range.selectNodeContents(n);
        for (const r of range.getClientRects()) {
          if (r.width === 0) continue;
          left = Math.min(left, r.left);
          right = Math.max(right, r.right);
          topY = Math.min(topY, r.top);
          bottom = Math.max(bottom, r.bottom);
        }
      }
      if (left === Infinity) continue;
      const scrolls = /(auto|scroll)/.test(s.overflowX + s.overflowY);
      // Text drawn outside its own box (an inline element's box is its text, so it is never outside),
      // or outside the window, or cut off by a box that clips.
      const outOfBox =
        s.display !== 'inline' &&
        !scrolls &&
        (left < box.left - 1 ||
          right > box.right + 1 ||
          topY < box.top - 1 ||
          bottom > box.bottom + 1);
      const outOfWindow = left < -0.5 || right > innerWidth + 0.5;
      const cut =
        !scrolls &&
        /(hidden|clip)/.test(s.overflowX + s.overflowY) &&
        (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
      if (outOfBox || outOfWindow || cut)
        clipped.push(
          `${el.tagName.toLowerCase()} "${(el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40)}" ` +
            `box ${Math.round(box.width)}×${Math.round(box.height)} ` +
            `text x ${Math.round(left)}..${Math.round(right)}${cut ? ' (cut off)' : ''}${outOfWindow ? ' (outside window)' : ''}`,
        );
    }
    return { page: pageOver, clipped };
  });
