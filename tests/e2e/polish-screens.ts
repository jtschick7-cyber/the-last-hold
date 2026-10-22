import { readFileSync } from 'node:fs';
import type { Locator, Page } from '@playwright/test';
import { begin, tab } from './helpers';

// Plan TV.3a (GDD §9.20): the screen list that the tap sweep, and later the Text size, contrast and
// layout checks, walk. Each screen names its save fixture and a read-only way to reach it.

export const loadFixture = async (
  page: Page,
  name: string,
  onSheet?: (label: string) => Promise<void>,
): Promise<void> => {
  // GDD §9.20: the away sheet carries the backup reminder, so every load pretends the game was
  // first seen 20 days ago (keeps any other value already in the settings key, such as Text size).
  await page.addInitScript(() => {
    for (const prefix of ['lasthold:', 'lasthold-preview:']) {
      const key = `${prefix}settings`;
      const old = JSON.parse(localStorage.getItem(key) ?? '{}');
      if (typeof old.firstSeenAt !== 'number')
        localStorage.setItem(
          key,
          JSON.stringify({ ...old, firstSeenAt: Date.now() - 20 * 86_400_000 }),
        );
    }
  });
  if (name === 'new') {
    await page.goto('./?debug');
    await begin(page, 'Mira');
    await dismiss(page, onSheet);
    return;
  }
  const [base, variant] = name.split(':');
  const save = JSON.parse(
    readFileSync(new URL(`../saves/fixtures/${base}.json`, import.meta.url), 'utf8'),
  );
  // A variant is a test-only edit of a real fixture: v11:candidate sends Herdis back to the candidates.
  if (variant === 'candidate') {
    delete save.state.hunters.herdis;
    save.state.roster.active = save.state.roster.active.filter((h: string) => h !== 'herdis');
    delete save.state.story.peakLevels.herdis;
    for (const it of save.state.items) if (it.where?.hunter === 'herdis') it.where = null;
  }
  await page.goto('./?debug');
  await begin(page, 'Mira');
  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Save/ }).first().click();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'save.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(save)),
  });
  await page.getByRole('button', { name: 'Yes, load it' }).click();
  await page.waitForTimeout(1000);
  await dismiss(page, onSheet);
  await tab(page, 'Hold')
    .click()
    .catch(() => {});
};

const CLOSERS = /^(Got it|Close|Onward|Not now|Continue|Skip|Done|Back)$/;

/** Closes every open sheet and scene, without choosing anything (Not now, Skip, Close). */
export const dismiss = async (
  page: Page,
  onSheet?: (label: string) => Promise<void>,
): Promise<void> => {
  for (let i = 0; i < 16; i++) {
    await page.waitForTimeout(onSheet ? 450 : 120);
    const dlg = page.getByRole('dialog').last();
    if (!(await dlg.isVisible().catch(() => false))) return;
    if (onSheet) await onSheet((await dlg.getAttribute('aria-label')) ?? '');
    const btn = dlg.getByRole('button', { name: CLOSERS }).last();
    if (await btn.isVisible().catch(() => false)) await btn.click();
    else {
      const skip = dlg.getByText('Skip', { exact: true });
      if (await skip.isVisible().catch(() => false)) await skip.click();
      else await page.keyboard.press('Escape');
    }
  }
};

/** Reports one screen to the sweep: its id, and the list line it belongs to. */
export type Visit = (id: string, group: string, expect?: readonly RegExp[]) => Promise<void>;

export interface Flow {
  readonly id: string;
  readonly fixture: string;
  /** A flow that changes the save (debug commands, a played fight) runs on its own fresh load. */
  readonly mutates?: boolean;
  /** The sheets that open on their own while the fixture loads, by the label of the sheet. */
  readonly onLoad?: Readonly<Record<string, { id: string; group: string }>>;
  /** How it is reached, in plain words, for the table in progress.md. */
  readonly how: string;
  readonly run: (page: Page, visit: Visit) => Promise<void>;
}

const btn = (page: Page, name: string | RegExp) => page.getByRole('button', { name }).first();
const tabTo = async (page: Page, name: string): Promise<void> => {
  await page.evaluate(() => window.scrollTo(0, 0));
  // A tab can sit under something at the narrowest widths; that is a finding of the sweep, not a reason to stop.
  const t = tab(page, name);
  await t.click({ timeout: 2000 }).catch(() => t.dispatchEvent('click'));
  await page.waitForTimeout(200);
};
const more = async (page: Page, row: string): Promise<void> => {
  await tabTo(page, 'More');
  await btn(page, new RegExp(`^${row}`)).click();
};
const archive = async (page: Page, section: string): Promise<void> => {
  await tabTo(page, 'Archive');
  await page.getByRole('button', { name: section, exact: true }).click();
};
const debug = async (page: Page, ...buttons: string[]): Promise<void> => {
  await tabTo(page, 'More');
  await btn(page, /^Debug/).click();
  for (const b of buttons) await page.getByRole('button', { name: b, exact: true }).click();
  await page.getByRole('button', { name: 'Close' }).click();
};
const top = (page: Page) => page.getByRole('dialog').last();

/** Closes whatever is open, back to the Hold. Reloads if the page is stuck. */
export const home = async (page: Page): Promise<void> => {
  try {
    await dismiss(page);
    await tabTo(page, 'Hold');
  } catch {
    await page.reload();
    await page.waitForTimeout(800);
    await dismiss(page);
  }
};

/** A plain screen: some read-only steps from the clean Hold, then one look. */
const plain = (
  id: string,
  group: string,
  how: string,
  expect: readonly RegExp[],
  reach: (page: Page) => Promise<void>,
  fixture = 'v11',
): Flow => ({
  id,
  fixture,
  how,
  run: async (page, visit) => {
    await reach(page);
    await visit(id, group, expect);
  },
});

const READ = 'v11';
export const FLOWS: readonly Flow[] = [
  plain('hold-bastion', 'Hold (Bastion)', 'fixture v11, nothing', [/Stanholm/], async () => {}),
  plain('rates', 'rates sheet', 'the resource bar', [/per minute/i], (p) =>
    btn(p, /Food.*Wood/).click(),
  ),
  plain('breakdown', 'breakdown sheet', 'first "Show breakdown" on the Hold', [/./], (p) =>
    btn(p, 'Show breakdown').click(),
  ),
  plain(
    'rank',
    'Rank screen (Hearth, Roll of Wardens, Riftglass shop, the ember)',
    'Hold, Rank ▸',
    [/Embers/, /Roll of Wardens/i, /Riftglass shop/i],
    (p) => btn(p, /^Rank/).click(),
  ),
  plain('hunters-roster', 'Hunters (roster)', 'Hunters tab', [/By slot/], (p) =>
    tabTo(p, 'Hunters'),
  ),
  plain(
    'hunters-candidates',
    'Hunters (candidates)',
    'fixture v11 with Herdis sent back to the candidates (a test-only edit), Hunters tab',
    [/candidates/i],
    (p) => tabTo(p, 'Hunters'),
    'v11:candidate',
  ),
  plain(
    'hunter-sheet',
    'hunter sheet (talents, slots, alternate traits, letters)',
    'Hunters tab, Halvar',
    [/Halvar/],
    async (p) => {
      await tabTo(p, 'Hunters');
      await btn(p, /^Halvar/).click();
    },
  ),
  plain('slot-picker', 'slot picker', 'Hunters tab, Halvar, first Change', [/./], async (p) => {
    await tabTo(p, 'Hunters');
    await btn(p, /^Halvar/).click();
    await top(p).getByRole('button', { name: 'Change' }).first().click();
  }),
  plain('stores', 'Stores and Salvage', 'Hunters tab, By slot', [/./], async (p) => {
    await tabTo(p, 'Hunters');
    await btn(p, 'By slot').click();
  }),
  plain('contracts-board', 'Contracts (board)', 'Contracts tab', [/Prepare/], (p) =>
    tabTo(p, 'Contracts'),
  ),
  plain(
    'villages',
    'Contracts (Villages panel)',
    'Contracts tab, open Villages',
    [/./],
    async (p) => {
      await tabTo(p, 'Contracts');
      await p.locator('summary', { hasText: 'Villages' }).click();
    },
  ),
  plain(
    'launch-sheet',
    'Contracts (launch sheet)',
    'Contracts tab, first Prepare',
    [/Send hunters|Suggest best/],
    async (p) => {
      await tabTo(p, 'Contracts');
      await btn(p, 'Prepare').click();
    },
  ),
  plain(
    'bestiary',
    'Bestiary (with the Great Beasts shelf)',
    'Archive tab, Bestiary',
    [/Upyr/],
    (p) => archive(p, 'Bestiary'),
  ),
  plain('bestiary-entry', 'Bestiary entry', 'Archive, Bestiary, Upyr', [/Upyr/], async (p) => {
    await archive(p, 'Bestiary');
    await btn(p, /^Upyr/).click();
  }),
  plain(
    'archive-library',
    'Archive (Library, with the Rime shelf)',
    'Archive, Library',
    [/the fall/i],
    (p) => archive(p, 'Library'),
  ),
  plain('archive-accounts', 'Archive (Accounts)', 'Archive, Accounts', [/./], (p) =>
    archive(p, 'Accounts'),
  ),
  plain('archive-names', 'Archive (Names)', 'Archive, Names', [/./], (p) => archive(p, 'Names')),
  plain(
    'document-reader',
    'Archive (document reader)',
    'Archive, Library, a letter',
    [/./],
    async (p) => {
      await archive(p, 'Library');
      await btn(p, /My boy writes/).click();
    },
  ),
  plain(
    'document-note',
    "Archive (document reader with Ilse's note)",
    "Archive, Library, the first letter that has Ilse's note under it",
    [/./],
    async (p) => {
      await archive(p, 'Library');
      const rows = p.locator('button[class*="linkRow"]');
      const n = Math.min(await rows.count(), 60);
      for (let i = 0; i < n; i++) {
        await rows.nth(i).click();
        await p.waitForTimeout(150);
        if ((await p.getByRole('dialog').last().locator('em').count()) > 0) return;
        await p.getByRole('button', { name: 'Close' }).last().click();
      }
      throw new Error("no document with Ilse's note found");
    },
  ),
  plain('orders-seats', 'Orders (card, seats)', 'Hold, Change seats ▸', [/Seat/], (p) =>
    btn(p, /^Change seats/).click(),
  ),
  plain('order-sheet', 'Orders (sheets)', "Hold, Thanes' Moot", [/Seat/], (p) =>
    btn(p, /^Thanes' Moot/).click(),
  ),
  plain(
    'last-stand',
    'Last Stand screen',
    'Hold, Rank ▸, Make the Last Stand',
    [/Start/],
    async (p) => {
      await btn(p, /^Rank/).click();
      await btn(p, 'Make the Last Stand').click();
    },
  ),
  plain('delve-entry', 'a Delve (entry)', 'Hold, Delve', [/Start/], (p) => btn(p, 'Delve').click()),
  plain('more-menu', 'More', 'More tab', [/Reports/], (p) => tabTo(p, 'More')),
  plain('more-reports', 'More (Reports)', 'More, Reports', [/./], (p) => more(p, 'Reports')),
  plain('more-fallen', 'More (Hall of the Fallen)', 'More, Hall of the Fallen', [/./], (p) =>
    more(p, 'Hall of the Fallen'),
  ),
  plain('more-save', 'More (Save & Data)', 'More, Save & Data', [/Backup/i], (p) =>
    more(p, 'Save'),
  ),
  plain('more-settings', 'More (Settings)', 'More, Settings', [/Theme|Reduce/i], (p) =>
    more(p, 'Settings'),
  ),
  plain('more-about', 'More (About & Credits)', 'More, About & Credits', [/./], (p) =>
    more(p, 'About'),
  ),
  plain('more-diagnostics', 'More (Diagnostics)', 'More, Diagnostics', [/./], (p) =>
    more(p, 'Diagnostics'),
  ),
  {
    id: 'hold-ages',
    fixture: 'new',
    mutates: true,
    how: 'a new game (Hamlet); More, Debug, Unlock Keep, then Unlock Citadel, then Unlock Bastion',
    run: async (page, visit) => {
      await tabTo(page, 'Hold');
      await visit('hold-hamlet', 'Hold (Hamlet)', [/Stanholm — Hamlet/]);
      for (const [age, name] of [
        ['Keep', 'hold-keep'],
        ['Citadel', 'hold-citadel'],
      ] as const) {
        await debug(page, `Unlock ${age}`);
        await dismiss(page);
        await tabTo(page, 'Hold');
        await visit(name, `Hold (${age})`, [new RegExp(`Stanholm — ${age}`)]);
      }
    },
  },
  {
    id: 'chapter-scene',
    fixture: READ,
    mutates: true,
    how: 'More, Debug, Play chapter (an Orders chapter scene)',
    run: async (page, visit) => {
      await debug(page, 'Play chapter');
      await tabTo(page, 'Hold');
      await page.waitForTimeout(600);
      await visit('chapter-scene', 'Orders (chapter scene)');
    },
  },
  {
    id: 'onload-v11',
    fixture: READ,
    how: 'loading fixture v11 (the sheets open by themselves, one after the other)',
    onLoad: {
      'While you were away': { id: 'away-sheet', group: 'away sheet (with the reminder)' },
      'Three notes from the gate': { id: 'events-scene', group: 'Events (introduction scene)' },
      'A seat at the table': { id: 'orders-opening-moot', group: 'Orders (opening scene)' },
      'A basket on the step': { id: 'orders-opening-wives', group: 'Orders (opening scene)' },
      'Who keeps the bells': { id: 'orders-opening-bells', group: 'Orders (opening scene)' },
      'Seat your Orders': { id: 'orders-seat-step', group: 'Orders (seat step)' },
    },
    run: async () => {},
  },
  {
    id: 'onload-v10-played',
    fixture: 'v10-played',
    how: 'loading fixture v10-played',
    onLoad: {
      'Named for the metal': { id: 'orders-opening-quenchers', group: 'Orders (opening scene)' },
    },
    run: async () => {},
  },
  {
    id: 'onload-v6',
    fixture: 'v6',
    how: 'loading fixture v6',
    onLoad: { 'The way down': { id: 'delve-scene', group: 'a Delve (the way-down scene)' } },
    run: async () => {},
  },
  {
    id: 'delve-run',
    fixture: READ,
    mutates: true,
    how: 'Hold, Delve, Start, then doors, blessings, Fight, Skip, Continue until Done',
    run: async (page, visit) => {
      await btn(page, 'Delve').click();
      const sheet = page.getByRole('dialog', { name: 'Delve' });
      await sheet.getByRole('button', { name: 'Start' }).click();
      const seen = new Set<string>();
      const once = async (id: string, group: string): Promise<void> => {
        if (seen.has(id)) return;
        seen.add(id);
        await visit(id, group);
      };
      for (let i = 0; i < 80; i++) {
        if (await sheet.getByRole('button', { name: 'Done' }).isVisible()) {
          await once('delve-result', 'a Delve (result)');
          break;
        }
        if (await sheet.getByRole('button', { name: 'Take this blessing' }).isVisible()) {
          await once('delve-blessing', 'a Delve (blessing)');
          await sheet.locator('button[aria-pressed="false"]').first().click();
          await sheet.getByRole('button', { name: 'Take this blessing' }).click();
        } else if (await sheet.getByText(/Two doors/).isVisible()) {
          await once('delve-doors', 'a Delve (doors)');
          await sheet.getByRole('button').filter({ hasText: 'Ahead:' }).first().click();
        } else if (await sheet.getByRole('button', { name: 'Fight', exact: true }).isVisible()) {
          const guardian = await sheet
            .getByText(/guardian/i)
            .first()
            .isVisible()
            .catch(() => false);
          await once(
            guardian ? 'delve-guardian' : 'delve-floor-ready',
            guardian ? 'a Delve (guardian)' : 'a Delve (floor)',
          );
          await sheet.getByRole('button', { name: 'Fight', exact: true }).click();
          await page.waitForTimeout(500);
          await once(
            guardian ? 'delve-guardian-playback' : 'delve-floor-playback',
            'a Delve (floor playback)',
          );
          await sheet.getByRole('button', { name: 'Skip' }).click();
          await sheet.getByRole('button', { name: 'Continue' }).click();
        } else await page.waitForTimeout(150);
      }
    },
  },
  {
    id: 'events-boss',
    fixture: READ,
    mutates: true,
    how: 'More, Debug, Fill the attempt bank; Hold, The Great Beast, Send a party, Suggest best, Send the hunters, Log, Skip, See the result',
    run: async (page, visit) => {
      await debug(page, 'Fill the attempt bank');
      await tabTo(page, 'Hold');
      await btn(page, /^The Great Beast/).click();
      await visit('events-boss-sheet', 'Events (boss sheet)');
      await top(page).getByRole('button', { name: 'Send a party' }).click();
      const party = page.getByRole('dialog', { name: 'Send a party' });
      await party.getByRole('button', { name: 'Suggest best' }).click();
      await page.waitForTimeout(1500);
      await visit('events-boss-party', 'Events (boss sheet)');
      await party.getByRole('button', { name: 'Send the hunters' }).click();
      await page.waitForTimeout(500);
      await visit('events-boss-playback', 'Events (boss playback)');
      await top(page).getByRole('button', { name: 'Log' }).click();
      await visit('events-fight-log', 'Contracts (fight log)');
      await page.getByRole('button', { name: 'Close' }).last().click();
      await top(page).getByRole('button', { name: 'Skip' }).click();
      await top(page).getByRole('button', { name: 'See the result' }).click();
      await visit('events-boss-result', 'Events (boss playback)');
    },
  },
  {
    id: 'events-hunt',
    fixture: READ,
    mutates: true,
    how: 'More, Debug, Fill the attempt bank; Hold, Legendary Hunts, The Toll Road, Suggest best, Send the hunters, Skip, See the result',
    run: async (page, visit) => {
      await debug(page, 'Fill the attempt bank');
      await tabTo(page, 'Hold');
      await btn(page, /^Legendary Hunts/).click();
      await visit('events-hunt-list', 'Events (hunt sheet)');
      await top(page)
        .getByRole('button', { name: /The Toll Road/ })
        .first()
        .click();
      await visit('events-hunt-track', 'Events (hunt sheet)');
      await top(page).getByRole('button', { name: 'Suggest best' }).click();
      await page.waitForTimeout(1500);
      await top(page).getByRole('button', { name: 'Send the hunters' }).click();
      await page.waitForTimeout(500);
      await visit('events-hunt-playback', 'Events (hunt playback)');
      await top(page).getByRole('button', { name: 'Skip' }).click();
      await top(page).getByRole('button', { name: 'See the result' }).click();
      await visit('events-hunt-result', 'Events (hunt playback)');
    },
  },
  {
    id: 'hut',
    fixture: READ,
    how: "Hold, the Alchemist's Hut row, Open",
    run: async (page, visit) => {
      await page.getByRole('button', { name: 'Open' }).first().click();
      await visit('hut-book', "Alchemist's Hut (the 12 × 3 Book grid)", [/./]);
      const exp = top(page)
        .getByRole('button', { name: /Experiment/ })
        .first();
      if (await exp.isVisible().catch(() => false)) {
        await exp.click();
        await visit('hut-experiment', "Alchemist's Hut (Experiment)");
      }
    },
  },
  {
    id: 'remembering-remember',
    fixture: READ,
    mutates: true,
    how: 'More, Debug, Finish Act VI; the near scene; Open the gate; Remember Them; the reading; the ending cards; the Library shelf',
    run: async (page, visit) => {
      await debug(page, 'Finish Act VI');
      await tabTo(page, 'Hold');
      const near = page.getByRole('dialog', { name: 'The line along the wall' });
      await near.waitFor({ timeout: 15_000 });
      await visit('remembering-near-scene', 'Remembering (near scene)');
      await near.getByRole('button', { name: 'Continue' }).click();
      await dismiss(page);
      const card = page.getByRole('region', { name: 'The Remembering' });
      await card.scrollIntoViewIfNeeded();
      await visit('remembering-card-not-ready', 'Remembering (card, not ready)');
      await debug(page, 'Open the gate');
      await tabTo(page, 'Hold');
      await card.scrollIntoViewIfNeeded();
      await visit('remembering-card-open', 'Remembering (card, open)');
      await card.getByRole('button', { name: 'Remember Them' }).click();
      const roller = page.getByRole('dialog', { name: 'The roll' });
      await roller.waitFor();
      await visit('remembering-roller', 'Remembering (scenes)');
      await roller.getByRole('button', { name: 'Continue' }).click();
      const reading = page.getByRole('dialog', { name: 'The reading' });
      await reading.waitFor();
      await page.waitForTimeout(600);
      await visit('remembering-reading', 'Remembering (the reading)');
      for (let i = 0; i < 41; i++)
        await reading
          .getByText('Tap for the next name.')
          .click({ timeout: 3000 })
          .catch(() => {});
      await reading
        .getByRole('button', { name: 'Continue' })
        .click({ timeout: 8000 })
        .catch(() => {});
      for (let i = 0; i < 12; i++) {
        const dlg = page.getByRole('dialog').first();
        if (!(await dlg.isVisible().catch(() => false))) break;
        const label = (await dlg.getAttribute('aria-label')) ?? `card ${i}`;
        await visit(`remembering-ending-${i}`, `Remembering (ending cards: ${label})`);
        await dlg.getByRole('button', { name: 'Continue' }).click();
        await page.waitForTimeout(200);
      }
      await tabTo(page, 'Hold');
      await card.scrollIntoViewIfNeeded();
      await visit('remembering-card-after', 'Remembering (card, after Remember Them)');
      await archive(page, 'Library');
      await visit('remembering-library', 'Remembering (Library shelf)');
      // The Rime shelf's warm entry opens the Rime reader (pale text on its dark card).
      await page.getByRole('region', { name: 'Rime' }).getByRole('button').last().click();
      await visit('rime-reader', 'Archive (the Rime reader)');
    },
  },
  {
    id: 'remembering-vigil',
    fixture: READ,
    mutates: true,
    how: 'More, Debug, Finish Act VI, Open the gate; Hold, Keep the Vigil',
    run: async (page, visit) => {
      await debug(page, 'Finish Act VI');
      await tabTo(page, 'Hold');
      await dismiss(page);
      await debug(page, 'Open the gate');
      await tabTo(page, 'Hold');
      const card = page.getByRole('region', { name: 'The Remembering' });
      await card.scrollIntoViewIfNeeded();
      await card.getByRole('button', { name: /Keep the Vigil/ }).click();
      await page.waitForTimeout(600);
      await visit('remembering-vigil-scene', "Remembering (Pechko's scene)");
      await dismiss(page);
      await tabTo(page, 'Hold');
      await card.scrollIntoViewIfNeeded();
      await visit('remembering-card-after-vigil', 'Remembering (card, after Keep the Vigil)');
    },
  },
  {
    id: 'long-night',
    fixture: READ,
    mutates: true,
    how: "More, Debug, Finish Act VI (plays the Last Stand and the Long Night); the sheets that follow, then the new warden's arrival",
    run: async (page, visit) => {
      await debug(page, 'Finish Act VI');
      await tabTo(page, 'Hold');
      await page.waitForTimeout(600);
      for (let i = 0; i < 10; i++) {
        const dlg = page.getByRole('dialog').last();
        if (!(await dlg.isVisible().catch(() => false))) break;
        const label = (await dlg.getAttribute('aria-label')) ?? `sheet ${i}`;
        await visit(`long-night-${i}`, `Long Night sheets (${label})`);
        const next = dlg
          .getByRole('button', { name: /^(Continue|Onward|Close|Got it|Not now)$/ })
          .last();
        if (!(await next.isVisible().catch(() => false))) break;
        await next.click();
        await page.waitForTimeout(300);
      }
      const lnb = page.getByRole('button', { name: /^The Long Night/ }).first();
      if (await lnb.isVisible().catch(() => false)) {
        await lnb.click();
        await visit('long-night-view', 'Long Night sheets (what happened)');
      }
    },
  },
];

/**
 * At the narrowest widths a button can sit past the edge of the window or under something; that is a
 * finding of the sweep (reported by polish-tap.ts), not a reason to stop walking. So a click that
 * cannot be made the usual way is sent straight to the element.
 */
export const tolerantClicks = (page: Page): void => {
  const proto = Object.getPrototypeOf(page.locator('body')) as {
    click: (this: Locator, o?: object) => Promise<void>;
    dispatchEvent: (this: Locator, t: string) => Promise<void>;
  };
  const original = proto.click;
  if ((original as { tolerant?: boolean }).tolerant) return;
  const tolerant = async function (this: Locator, o?: object): Promise<void> {
    try {
      await original.call(this, { timeout: 2500, ...o });
    } catch {
      await proto.dispatchEvent.call(this, 'click');
    }
  };
  (tolerant as { tolerant?: boolean }).tolerant = true;
  proto.click = tolerant;
};
