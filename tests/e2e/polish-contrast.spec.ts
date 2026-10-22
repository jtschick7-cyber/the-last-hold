import { writeFileSync } from 'node:fs';
import { expect, test, type Browser, type Page } from '@playwright/test';
import { FLOWS, home, loadFixture, tolerantClicks, type Flow, type Visit } from './polish-screens';
import { scanContrast, type ContrastScan } from './polish-contrast';

// Plan TV.6 (GDD §9.20): every screen on the list, in both themes, at 360 px. CONTRAST_REPORT=<file>
// writes the report; CONTRAST_STRICT=1 makes it fail (it becomes the default once the owner has approved the fixes).

const BASE = 'http://localhost:4173/the-last-hold/';
const THEMES = ['dark', 'light'] as const;

test('the contrast scan finds a planted low-contrast pair and spares good ones', async ({
  page,
}) => {
  await page.setContent(`
    <div style="background:#ffffff"><p style="color:#bbbbbb;margin:0">pale grey on white</p></div>
    <div style="background:#000000"><p style="color:#ffffff;margin:0">white on black</p></div>
    <div style="background:#ffffff"><p style="color:#888888;font-size:30px;margin:0">large</p></div>
    <div style="background:#ffffff"><span style="color:#cccccc">ⓘ</span></div>`);
  const scan = await scanContrast(page);
  expect(scan.failing.map((f) => f.text).sort()).toEqual(['pale grey on white', 'ⓘ']);
  expect(scan.failing.find((f) => f.text === 'ⓘ')?.kind).toBe('glyph');
});

interface Row {
  id: string;
  theme: string;
  scan: ContrastScan;
}
const rows: Row[] = [];
const failures: string[] = [];

const visitor =
  (page: Page): Visit =>
  async (id) => {
    await page.waitForTimeout(250);
    for (const theme of THEMES) {
      await page.evaluate((t) => {
        (window as unknown as { __theme?: string }).__theme = t;
        document.documentElement.dataset.theme = t;
      }, theme);
      await page.waitForTimeout(60);
      rows.push({ id, theme, scan: await scanContrast(page) });
    }
    await page.evaluate(() => {
      (window as unknown as { __theme?: string }).__theme = 'dark';
      document.documentElement.dataset.theme = 'dark';
    });
  };

const newPage = async (browser: Browser): Promise<{ page: Page; close: () => Promise<void> }> => {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, baseURL: BASE });
  const page = await ctx.newPage();
  page.setDefaultTimeout(6000);
  tolerantClicks(page);
  // The app re-applies the saved theme whenever its state changes; hold the one being measured.
  await page.addInitScript(() => {
    const w = window as unknown as { __theme?: string };
    setInterval(() => {
      const root = document.documentElement;
      if (w.__theme && root && root.dataset.theme !== w.__theme) root.dataset.theme = w.__theme;
    }, 5);
  });
  return { page, close: () => ctx.close() };
};

const attempt = async (id: string, body: () => Promise<void>): Promise<void> => {
  try {
    await body();
  } catch (e) {
    failures.push(`${id}: ${String(e).split('\n')[0]?.slice(0, 200)}`);
  }
};

const reads = FLOWS.filter((f) => !f.mutates && !f.onLoad);
for (const fixture of [...new Set(reads.map((f) => f.fixture))]) {
  test(`contrast: the ${fixture} screens`, async ({ browser }) => {
    test.setTimeout(600_000);
    const { page, close } = await newPage(browser);
    await loadFixture(page, fixture);
    for (const flow of reads.filter((f) => f.fixture === fixture)) {
      await attempt(flow.id, () => flow.run(page, visitor(page)));
      await home(page);
    }
    await close();
  });
}

const own = (flow: Flow): void => {
  test(`contrast: ${flow.id}`, async ({ browser }) => {
    test.setTimeout(400_000);
    const { page, close } = await newPage(browser);
    const visit = visitor(page);
    await attempt(flow.id, async () => {
      await loadFixture(page, flow.fixture, async (label) => {
        const hit = flow.onLoad?.[label];
        if (hit) await visit(hit.id, hit.group);
      });
      if (!flow.onLoad) await flow.run(page, visit);
    });
    await close();
  });
};
for (const flow of FLOWS.filter((f) => f.mutates || f.onLoad)) own(flow);

test.afterAll(() => {
  const lines: string[] = [];
  let count = 0;
  for (const r of rows)
    for (const f of r.scan.failing) {
      lines.push(
        `${r.id} [${r.theme}]: ${f.kind} ${f.ratio}:1 (needs ${f.needs}) ${f.fg} on ${f.bg} ${f.sizePx}px ${f.tag} "${f.text}"`,
      );
      count++;
    }
  const measured = rows.reduce((n, r) => n + r.scan.measured, 0);
  const report = [
    `CONTRAST: ${count} failing pairs; ${measured} text elements measured over ${new Set(rows.map((r) => r.id)).size} screens in both themes`,
    ...lines,
    `FLOW FAILURES: ${failures.length}`,
    ...failures,
  ].join('\n');
  console.log(report);
  if (process.env.CONTRAST_REPORT) writeFileSync(process.env.CONTRAST_REPORT, `${report}\n`);
  if (process.env.CONTRAST_STRICT === '1') expect(count, 'failing contrast pairs').toBe(0);
});
