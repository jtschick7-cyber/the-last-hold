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
      const own = [...el.childNodes].some(
        (n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim() !== '',
      );
      if (!own || el.closest('[aria-hidden="true"]')) continue;
      const s = getComputedStyle(el);
      if (s.display === 'inline' || s.display === 'contents') continue;
      // An element that is meant to scroll (a table in a scroller, a <pre>) is not a finding.
      if (/(auto|scroll)/.test(s.overflowX + s.overflowY)) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0) continue;
      const bad =
        el.scrollWidth > el.clientWidth + 1 ||
        el.scrollHeight > el.clientHeight + 1 ||
        r.left < -0.5 ||
        r.right > innerWidth + 0.5;
      if (bad)
        clipped.push(
          `${el.tagName.toLowerCase()} "${(el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40)}" ` +
            `scroll ${el.scrollWidth}×${el.scrollHeight} box ${el.clientWidth}×${el.clientHeight} ` +
            `x ${Math.round(r.left)}..${Math.round(r.right)}`,
        );
    }
    return { page: pageOver, clipped };
  });
