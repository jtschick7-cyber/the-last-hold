import type { Page } from '@playwright/test';

// Plan TV.3a (GDD §9.20, CLAUDE.md "Phone and accessibility"): finds every tappable thing under
// 44 × 44 px on the page, or in the topmost open sheet. Exceptions (WCAG 2.5.5): inline text links in
// prose, the debug panel, and numbers that only respond to a long press. The ⓘ icons are not exempt.

export interface SmallTarget {
  readonly tag: string;
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly disabled: boolean;
}

export const MIN_TAP_PX = 44;

export interface TapScan {
  /** How many tappable things were looked at (zero means the screen was not reached). */
  readonly scanned: number;
  readonly small: SmallTarget[];
  /** Tappable things whose centre another element covers (a tap would land elsewhere). */
  readonly covered: string[];
  /** Tappable things that reach past the left or right edge of the window. */
  readonly outside: string[];
}

export const scanTappables = (page: Page, min = MIN_TAP_PX): Promise<TapScan> =>
  page.evaluate((limit) => {
    const dialogs = [...document.querySelectorAll('[role="dialog"]')];
    const scope: ParentNode = dialogs.length ? (dialogs[dialogs.length - 1] as Element) : document;
    if (dialogs.length && dialogs[dialogs.length - 1]?.getAttribute('aria-label') === 'Debug')
      return { scanned: 0, small: [], covered: [], outside: [] };
    const SELECTOR =
      'button, a[href], [role="button"], [role="tab"], [role="switch"], [role="checkbox"], summary, select, textarea, input:not([type="hidden"])';
    const out: SmallTarget[] = [];
    let scanned = 0;
    const fixedOrSticky = (el: Element): boolean => {
      for (let e: Element | null = el; e; e = e.parentElement) {
        const pos = getComputedStyle(e).position;
        if (pos === 'fixed' || pos === 'sticky') return true;
      }
      return false;
    };
    const covered: string[] = [];
    const outside: string[] = [];
    const label = (el: Element): string =>
      (el.getAttribute('aria-label') || el.textContent || el.tagName)
        .trim()
        .replace(/\s+/g, ' ')
        .slice(0, 40);
    for (const el of scope.querySelectorAll(SELECTOR)) {
      // A checkbox or radio is tapped through its label, so the label's box is what counts.
      const input = el as HTMLInputElement;
      const box =
        el.tagName === 'INPUT' && (input.type === 'checkbox' || input.type === 'radio')
          ? (el.closest('label') ?? el)
          : el;
      const r = box.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      // A visually hidden control (the file picker behind a button) is not something a thumb taps.
      if (r.width <= 1 && r.height <= 1) continue;
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || el.closest('[aria-hidden="true"]')) continue;
      const cls = String(el.getAttribute('class') ?? '');
      // A number that only responds to a long press (Num.tsx); its ⓘ sibling is not exempt.
      scanned++;
      // GDD §9.21 (M7, D507 (6)): a control inside a self-contained scroll box (the Arrange Hold grid
      // below 352 px) may sit past the screen's edge; it is still measured for size and cover.
      const inOwnScroll = el.closest('[data-internal-scroll="true"]') !== null;
      if (!inOwnScroll && (r.left < -0.5 || r.right > innerWidth + 0.5))
        outside.push(
          `${label(el)} (${Math.round(r.left)} to ${Math.round(r.right)} of ${innerWidth})`,
        );
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      if (cx >= 0 && cy >= 0 && cx < innerWidth && cy < innerHeight) {
        const hit = document.elementFromPoint(cx, cy);
        // Content scrolling under the fixed tab bar or the resource bar is normal; only cover by something else counts.
        // A number's own ⓘ may overlap the number's edge: both open the same breakdown.
        const own = /_num_/.test(cls) && !/_info_/.test(cls);
        const itsInfo =
          own &&
          /_info_/.test(String(hit?.getAttribute('class') ?? '')) &&
          hit?.parentElement === el.parentElement;
        if (
          hit &&
          hit !== box &&
          !box.contains(hit) &&
          !hit.contains(box) &&
          !fixedOrSticky(hit) &&
          !itsInfo
        )
          covered.push(`${label(el)} (under ${hit.tagName.toLowerCase()} "${label(hit)}")`);
      }
      if (el.tagName === 'BUTTON' && /_num_/.test(cls) && !/_info_/.test(cls)) continue;
      // An inline text link inside a sentence.
      if (
        el.tagName === 'A' &&
        [...(el.parentElement?.childNodes ?? [])].some(
          (n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim() !== '',
        )
      )
        continue;
      if (r.width >= limit - 0.05 && r.height >= limit - 0.05) continue;
      const name = (
        el.getAttribute('aria-label') ||
        el.textContent ||
        el.getAttribute('placeholder') ||
        el.tagName
      )
        .trim()
        .replace(/\s+/g, ' ')
        .slice(0, 40);
      out.push({
        tag: el.tagName.toLowerCase(),
        name,
        width: Math.round(r.width * 10) / 10,
        height: Math.round(r.height * 10) / 10,
        disabled: (el as HTMLButtonElement).disabled === true,
      });
    }
    return { scanned, small: out, covered, outside };
  }, min);
