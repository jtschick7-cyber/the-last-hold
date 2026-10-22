import { writeFileSync } from 'node:fs';
import { expect, test, type Browser, type Page } from '@playwright/test';
import { scanTappables, MIN_TAP_PX, type SmallTarget } from './polish-tap';
import { FLOWS, home, loadFixture, tolerantClicks, type Flow, type Visit } from './polish-screens';

// Plan TV.3a/TV.3b (GDD §9.20): every screen on the list at 320 and 360 px (and, from TV.4a, at each
// Text size): nothing tappable under 44 × 44 px. The sweep is strict since TV.3b (set TAP_STRICT=0 to
// only report). TAP_REPORT=<file> writes the findings.

const WIDTHS = [320, 360];
const STRICT = process.env.TAP_STRICT !== '0';
const BASE = 'http://localhost:4173/the-last-hold/';

test('the sweep finds a planted 30 px button and spares the allowed ones', async ({ page }) => {
  await page.setContent(`
    <button style="width:30px;height:30px">tiny</button>
    <button style="width:44px;height:44px">ok</button>
    <p>Read the <a href="#x" style="font-size:12px">inline link</a> in this sentence.</p>
    <a href="#y" style="display:inline-block;width:20px;height:20px">lone</a>`);
  const found = (await scanTappables(page)).small;
  expect(found.map((f) => f.name).sort()).toEqual(['lone', 'tiny']);
  expect(MIN_TAP_PX).toBe(44);
});

interface Row {
  id: string;
  group: string;
  width: number;
  where: string;
  scanned: number;
  small: SmallTarget[];
  covered: string[];
  outside: string[];
  missing: string[];
}
const rows: Row[] = [];
const failures: string[] = [];

const visitor =
  (page: Page, width: number): Visit =>
  async (id, group, expectText = []) => {
    await page.waitForTimeout(250);
    const dlg = page.getByRole('dialog').last();
    const inDialog = await dlg.isVisible().catch(() => false);
    const text = await (inDialog ? dlg : page.locator('main')).innerText().catch(() => '');
    const scan = await scanTappables(page);
    const where = inDialog ? `sheet "${(await dlg.getAttribute('aria-label')) ?? ''}"` : 'page';
    rows.push({
      id,
      group,
      width,
      where,
      scanned: scan.scanned,
      small: scan.small,
      covered: scan.covered,
      outside: scan.outside,
      missing: expectText.filter((r) => !r.test(text)).map(String),
    });
  };

const newPage = async (
  browser: Browser,
  width = 360,
): Promise<{ page: Page; close: () => Promise<void> }> => {
  const ctx = await browser.newContext({ viewport: { width, height: 740 }, baseURL: BASE });
  const page = await ctx.newPage();
  page.setDefaultTimeout(6000);
  // TAP_TEXT=large|largest runs the whole sweep at that Text size (GDD §9.20: every step).
  if (process.env.TAP_TEXT)
    await page.addInitScript((size) => {
      for (const prefix of ['lasthold:', 'lasthold-preview:'])
        localStorage.setItem(`${prefix}settings`, JSON.stringify({ textSize: size }));
    }, process.env.TAP_TEXT);
  tolerantClicks(page);
  return { page, close: () => ctx.close() };
};

const attempt = async (id: string, body: () => Promise<void>): Promise<void> => {
  try {
    await body();
  } catch (e) {
    failures.push(
      `${id}: ${
        String(e)
          .split('\n')
          .filter((l) => /waiting for|intercepts|not visible|resolved to/.test(l))
          .slice(0, 3)
          .join(' / ')
          .slice(0, 300) || String(e).slice(0, 160)
      }`,
    );
  }
};

const reads = FLOWS.filter((f) => !f.mutates && !f.onLoad);
for (const fixture of [...new Set(reads.map((f) => f.fixture))]) {
  test(`tap targets: the ${fixture} screens`, async ({ browser }) => {
    test.setTimeout(600_000);
    const { page, close } = await newPage(browser);
    await loadFixture(page, fixture);
    for (const flow of reads.filter((f) => f.fixture === fixture)) {
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 740 });
        await attempt(`${flow.id}@${width}`, () => flow.run(page, visitor(page, width)));
        await home(page);
      }
    }
    await close();
  });
}

const own = (flow: Flow): void => {
  test(`tap targets: ${flow.id}`, async ({ browser }) => {
    test.setTimeout(400_000);
    for (const width of WIDTHS) {
      const { page, close } = await newPage(browser);
      const visit = visitor(page, width);
      await attempt(`${flow.id}@${width}`, async () => {
        await loadFixture(page, flow.fixture, async (label) => {
          if (page.viewportSize()?.width !== width)
            await page.setViewportSize({ width, height: 740 });
          const hit = flow.onLoad?.[label];
          if (hit) await visit(hit.id, hit.group);
        });
        await page.setViewportSize({ width, height: 740 });
        if (!flow.onLoad) await flow.run(page, visit);
      });
      await close();
    }
  });
};
for (const flow of FLOWS.filter((f) => f.mutates || f.onLoad)) own(flow);

test.afterAll(() => {
  const lines: string[] = [];
  let count = 0;
  for (const r of rows) {
    const tag = `${r.id} @${r.width}`;
    for (const f of r.small)
      lines.push(
        `${tag}: ${f.tag} "${f.name}" ${f.width}×${f.height}${f.disabled ? ' (disabled)' : ''}`,
      );
    for (const c of r.covered) lines.push(`${tag}: COVERED ${c}`);
    for (const o of r.outside) lines.push(`${tag}: OUTSIDE ${o}`);
    count += r.small.length + r.covered.length + r.outside.length;
  }
  const notReached = rows
    .filter((r) => r.missing.length)
    .map((r) => `${r.id} @${r.width}: expected ${r.missing.join(' ')}`);
  const screens = [...new Map(rows.map((r) => [r.id, r])).values()].map(
    (r) =>
      `${r.id} | ${r.group} | ${rows
        .filter((x) => x.id === r.id)
        .map((x) => `${x.width}:${x.scanned} in ${x.where}`)
        .join(' ; ')}`,
  );
  const report = [
    `TAP SWEEP: ${count} findings over ${screens.length} screens`,
    ...lines,
    `NOT REACHED / MISSING TEXT: ${notReached.length}`,
    ...notReached,
    `FLOW FAILURES: ${failures.length}`,
    ...failures,
    'SCREENS (id | list line | tappables scanned per width)',
    ...screens,
  ].join('\n');
  console.log(report);
  if (process.env.TAP_REPORT) writeFileSync(process.env.TAP_REPORT, `${report}\n`);
  if (STRICT) {
    expect(count, 'tappable things under 44 × 44 px').toBe(0);
    expect(failures, 'flows that could not be walked').toEqual([]);
  }
});
