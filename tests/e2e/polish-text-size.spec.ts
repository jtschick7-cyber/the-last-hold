import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { expect, test, type Browser, type Page } from '@playwright/test';
import { begin, tab } from './helpers';
import { FLOWS, home, loadFixture, tolerantClicks, type Flow, type Visit } from './polish-screens';
import { measure, overflow, type Measured, type Overflow } from './polish-text';

// Plan TV.4a (GDD §9.20): the three Text sizes. (1) The setting works and is remembered.
// (2) At Match phone, named screens measure the same as the build before Text size existed.
// (3) At Large and Largest body text grows by 115% / 130%; the pixel font, pictures and the two
// bars do not. (4) At 320 px at Largest every screen on the list is scanned and the overflow is
// REPORTED (TV.4b fixes it): TEXT_REPORT=<file> writes the report; TEXT_STRICT=1 makes it fail.

const BASE = 'http://localhost:4173/the-last-hold/';
const BASELINE = new URL('./baselines/text-size-match.json', import.meta.url);
const NAMED = ['rates', 'hunters-roster', 'hunter-sheet', 'bestiary', 'archive-library'];
const SCALE = { large: 1.15, largest: 1.3 } as const;

const newPage = async (
  browser: Browser,
  width: number,
  textSize?: string,
): Promise<{ page: Page; close: () => Promise<void> }> => {
  const ctx = await browser.newContext({ viewport: { width, height: 740 }, baseURL: BASE });
  const page = await ctx.newPage();
  page.setDefaultTimeout(6000);
  tolerantClicks(page);
  if (textSize)
    await page.addInitScript((size) => {
      for (const prefix of ['lasthold:', 'lasthold-preview:'])
        localStorage.setItem(
          `${prefix}settings`,
          JSON.stringify({ textSize: size, backupReminder: true }),
        );
    }, textSize);
  return { page, close: () => ctx.close() };
};

test('the overflow scan finds planted overflow', async ({ page }) => {
  await page.setContent(`
    <div style="width:80px;overflow:hidden;white-space:nowrap"><span>x</span> a very long clipped line of text</div>
    <p style="width:5000px;margin:0">wide</p>`);
  const found = await overflow(page);
  expect(found.clipped.some((c) => c.includes('clipped line'))).toBe(true);
  expect(found.page).not.toBeNull();
});

test('Text size is a setting, remembered across a reload', async ({ browser }) => {
  const { page, close } = await newPage(browser, 360);
  await page.goto('./');
  await begin(page, 'Mira');
  await expect(page.locator('html')).toHaveAttribute('data-text-size', 'match');
  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Settings/ }).click();
  const group = page.getByRole('group', { name: 'Text size' });
  for (const [label, key] of [
    ['Largest', 'largest'],
    ['Large', 'large'],
    ['Match phone', 'match'],
    ['Largest', 'largest'],
  ] as const) {
    await group.getByRole('button', { name: label, exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-text-size', key);
    await expect(group.getByRole('button', { name: label, exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  }
  const stored = await page.evaluate(() =>
    Object.keys(localStorage)
      .filter((k) => k.endsWith(':settings'))
      .map((k) => JSON.parse(localStorage.getItem(k) ?? '{}')),
  );
  expect(stored).toHaveLength(1);
  expect(stored[0].textSize).toBe('largest');
  expect(typeof stored[0].firstSeenAt).toBe('number');
  await page.reload();
  await page.waitForTimeout(800);
  await expect(page.locator('html')).toHaveAttribute('data-text-size', 'largest');
  // Reset everything keeps the Text size and clears the three times.
  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Save/ }).first().click();
  await page.getByRole('button', { name: 'Reset everything…' }).click();
  await page.getByRole('button', { name: 'I understand' }).click();
  await page.getByRole('button', { name: 'Yes, start over' }).click();
  await page.waitForTimeout(500);
  const after = await page.evaluate(() =>
    Object.keys(localStorage)
      .filter((k) => k.endsWith(':settings'))
      .map((k) => JSON.parse(localStorage.getItem(k) ?? '{}')),
  );
  expect(after[0]).toMatchObject({
    textSize: 'largest',
    backupReminder: true,
    lastExportAt: null,
    snoozeUntil: null,
    firstSeenAt: null,
  });
  await expect(page.locator('html')).toHaveAttribute('data-text-size', 'largest');
  await close();
});

// BASELINE_WRITE=1 (run on the build from before Text size existed) records the Match phone numbers.
const writing = process.env.BASELINE_WRITE === '1';
const named = FLOWS.filter((f) => NAMED.includes(f.id) && !f.mutates && !f.onLoad);
const key = (m: Measured): string => `${m.key}|${m.kind}`;

test('Match phone is unchanged; Large and Largest scale body text only', async ({ browser }) => {
  test.setTimeout(300_000);
  expect(named.map((f) => f.id).sort()).toEqual([...NAMED].sort());
  const { page, close } = await newPage(browser, 360);
  const seen: Record<string, Measured[]> = {};
  const setSize = (s: string) =>
    page.evaluate((v) => (document.documentElement.dataset.textSize = v), s);
  const visit =
    (id: string): Visit =>
    async () => {
      await page.waitForTimeout(250);
      await setSize('match');
      const base = await measure(page);
      seen[id] = base;
      const byKey = new Map(base.map((m) => [key(m), m]));
      let scaledText = 0;
      for (const step of writing ? [] : (['large', 'largest'] as const)) {
        await setSize(step);
        await page.waitForTimeout(100);
        for (const m of await measure(page)) {
          const was = byKey.get(key(m));
          if (!was) continue;
          const where = `${id} ${step} ${m.key}`;
          if (m.kind === 'text') {
            if (was.fontSize >= 10) {
              expect(Math.abs(m.fontSize - was.fontSize * SCALE[step]), where).toBeLessThan(0.6);
              scaledText++;
            }
          } else {
            if (m.kind !== 'picture') expect(m.fontSize, `${where} font`).toBe(was.fontSize);
            if (m.kind === 'picture') {
              expect([m.width, m.height], `${where} picture size`).toEqual([was.width, was.height]);
            }
          }
        }
      }
      if (!writing) expect(scaledText, `${id}: some body text scaled`).toBeGreaterThan(3);
      await setSize('match');
    };
  await loadFixture(page, 'v11');
  for (const flow of named) {
    await flow.run(page, visit(flow.id));
    await home(page);
  }
  await close();

  if (writing) {
    mkdirSync(new URL('./baselines/', import.meta.url), { recursive: true });
    writeFileSync(BASELINE, `${JSON.stringify(seen, null, 1)}\n`);
  } else {
    expect(existsSync(BASELINE), 'baseline file').toBe(true);
    const was = JSON.parse(readFileSync(BASELINE, 'utf8')) as Record<string, Measured[]>;
    for (const id of NAMED) {
      expect(seen[id]?.length, `${id} measured`).toBeGreaterThan(5);
      expect(seen[id], `${id} at Match phone`).toEqual(was[id]);
    }
  }
});

// 320 px at Largest over the whole screen list: report only until TV.4b.
interface Row {
  id: string;
  over: Overflow;
}
/** Pixel-font text, pictures and the two bars that changed size between Match phone and Largest. */
const scaled: string[] = [];
const rows: Row[] = [];
const failures: string[] = [];
const WIDTH = 320;

const visitor =
  (page: Page): Visit =>
  async (id) => {
    await page.waitForTimeout(250);
    rows.push({ id, over: await overflow(page) });
    // The same screen at Match phone: only body text may differ (GDD §9.20).
    const big = new Map((await measure(page)).map((m) => [key(m), m]));
    await page.evaluate(() => (document.documentElement.dataset.textSize = 'match'));
    await page.waitForTimeout(80);
    for (const m of await measure(page)) {
      const b = big.get(key(m));
      if (!b || m.kind === 'text') continue;
      const same =
        m.kind === 'picture'
          ? m.width === b.width && m.height === b.height
          : m.fontSize === b.fontSize;
      if (!same) scaled.push(`${id}: ${m.kind} ${m.key} ${m.fontSize} → ${b.fontSize}`);
    }
    await page.evaluate(() => (document.documentElement.dataset.textSize = 'largest'));
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
  test(`largest at 320 px: the ${fixture} screens`, async ({ browser }) => {
    test.setTimeout(600_000);
    const { page, close } = await newPage(browser, WIDTH, 'largest');
    await loadFixture(page, fixture);
    for (const flow of reads.filter((f) => f.fixture === fixture)) {
      await attempt(flow.id, () => flow.run(page, visitor(page)));
      await home(page);
    }
    await close();
  });
}

const own = (flow: Flow): void => {
  test(`largest at 320 px: ${flow.id}`, async ({ browser }) => {
    test.setTimeout(400_000);
    const { page, close } = await newPage(browser, WIDTH, 'largest');
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
  for (const r of rows) {
    const found = [...(r.over.page ? [r.over.page] : []), ...r.over.clipped];
    for (const f of found) lines.push(`${r.id}: ${f}`);
    count += found.length;
  }
  const report = [
    `TEXT SIZE LARGEST AT ${WIDTH} PX: ${count} findings over ${new Set(rows.map((r) => r.id)).size} screens`,
    ...lines,
    `SCALED WHEN THEY MUST NOT: ${scaled.length}`,
    ...scaled,
    `FLOW FAILURES: ${failures.length}`,
    ...failures,
  ].join('\n');
  console.log(report);
  if (process.env.TEXT_REPORT) writeFileSync(process.env.TEXT_REPORT, `${report}\n`);
  expect(scaled, 'pixel-font text, pictures and bars that scaled with Text size').toEqual([]);
  if (process.env.TEXT_STRICT === '1') expect(count).toBe(0);
});
