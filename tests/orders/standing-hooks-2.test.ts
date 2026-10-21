// Plan T10.4 (GDD §5.13.2, D410, D418): standing hooks, part 2 — brews, experiments and properties
// revealed (Grey Wives); documents, hunter letters and names found (Bell-Watchers). The Long Night
// keeps everything; a boss attempt and a hunt add nothing.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { balance } from '../../src/content/balance';
import { CONSUMABLE_IDS } from '../../src/content/consumables';
import { ORDER_IDS } from '../../src/content/orders';
import { allDocuments } from '../../src/content/story/acts';
import { num } from '../../src/core/balance-access';
import { apply } from '../../src/core/commands/apply';
import { resetForNewCycle } from '../../src/core/long-night/reset';
import { loadEnvelope } from '../../src/core/save';
import { advance } from '../../src/core/sim/advance';
import { catchUpNow } from '../../src/core/sim/offline';
import type { GameState } from '../../src/core/state/game-state';
import { findDocument } from '../../src/core/story/documents';
import { notePeak } from '../../src/core/story/letters';
import { eligibleHunters } from '../../src/core/systems/events';
import { legalHunters, trackOf } from '../../src/core/systems/hunt';
import { orderLevel, orderStanding } from '../../src/core/systems/orders';
import { keepRich, run } from '../contracts/helpers';

const W = balance.orders.standing;
const BREW = num('brew.time') * 1000;
const EXPERIMENT = num('experiment.time') * 1000;

const hut = (): GameState => {
  const s = keepRich('orders-2');
  s.buildings['alchemists-hut'] = 2;
  for (const k of Object.keys(s.stores)) {
    s.stores[k as keyof typeof s.stores] = (CONSUMABLE_IDS as readonly string[]).includes(k)
      ? 0
      : 20;
  }
  return s;
};

describe('Grey Wives: brews, experiments and properties revealed', () => {
  it('a finished brew adds exactly the brew weight, once', () => {
    const s = hut();
    expect(run(s, { type: 'brew.queue', item: 'grave-oil' }).ok).toBe(true);
    expect(s.orders.counts.greyWives.brew).toBe(0); // queued is not finished
    advance(s, s.time + BREW + 1000);
    expect(s.orders.counts.greyWives.brew).toBe(1);
    expect(orderStanding(s, 'greyWives')).toBe(W.greyWives.value.brew);
    advance(s, s.time + 10 * BREW);
    expect(s.orders.counts.greyWives.brew).toBe(1); // nothing more is queued
  });

  it('a finished experiment adds its weight plus one per property it revealed', () => {
    const s = hut();
    expect(run(s, { type: 'experiment.queue', a: 'yarrow', b: 'pitch' }).ok).toBe(true);
    const shownBefore = Object.values(s.book.properties).reduce((n, p) => n + p.length, 0);
    advance(s, s.time + EXPERIMENT + 1000);
    const revealed =
      Object.values(s.book.properties).reduce((n, p) => n + p.length, 0) - shownBefore;
    expect(revealed).toBeGreaterThan(0);
    expect(s.orders.counts.greyWives.experiment).toBe(1);
    expect(s.orders.counts.greyWives.property).toBe(revealed);
    expect(orderStanding(s, 'greyWives')).toBe(
      W.greyWives.value.experiment + revealed * W.greyWives.value.property,
    );
  });

  it('a catch-up counts the same as the same time in one-hour steps', () => {
    const make = (): GameState => {
      const s = hut();
      run(s, { type: 'brew.queue', item: 'grave-oil' });
      run(s, { type: 'experiment.queue', a: 'yarrow', b: 'pitch' });
      return s;
    };
    const a = make();
    const b = make();
    const end = a.time + 30 * 3_600_000;
    advance(a, end);
    for (let t = b.time + 3_600_000; t <= end; t += 3_600_000) advance(b, t);
    expect(a.orders.counts).toEqual(b.orders.counts);
  });

  it('adds nothing to the other three Orders', () => {
    const s = hut();
    run(s, { type: 'brew.queue', item: 'grave-oil' });
    advance(s, s.time + BREW + 1000);
    for (const id of ORDER_IDS) if (id !== 'greyWives') expect(orderStanding(s, id)).toBe(0);
  });
});

describe('Bell-Watchers: documents, hunter letters and names found', () => {
  it('a document adds the document weight and 10 per new name it carries, once', () => {
    const s = keepRich('orders-doc');
    const doc = allDocuments.find((d) => d.id === 'D1-03');
    if (!doc) throw new Error('missing document');
    expect(doc.names.length).toBeGreaterThan(0);
    findDocument(s, doc, 'contract');
    const w = W.bellWatchers.value;
    expect(s.orders.counts.bellWatchers).toMatchObject({
      document: 1,
      name: doc.names.length,
    });
    expect(orderStanding(s, 'bellWatchers')).toBe(w.document + doc.names.length * w.name);
    findDocument(s, doc, 'contract'); // already found: nothing
    expect(s.orders.counts.bellWatchers.document).toBe(1);
    expect(s.orders.counts.bellWatchers.name).toBe(doc.names.length);
  });

  it('a hunter letter adds the letter weight (and its name, if new), once', () => {
    const s = keepRich('orders-letter');
    notePeak(s, 'ostap', 5);
    const letters = s.story.letters.length;
    expect(letters).toBeGreaterThan(0);
    expect(s.orders.counts.bellWatchers.letter).toBe(letters);
    expect(s.orders.counts.bellWatchers.name).toBe(s.story.names.length);
    expect(s.orders.counts.bellWatchers.document).toBe(0);
    notePeak(s, 'ostap', 5);
    expect(s.orders.counts.bellWatchers.letter).toBe(letters);
  });

  it('counts every document the story holds, and the other Orders gain nothing', () => {
    const s = keepRich('orders-all');
    for (const doc of allDocuments) findDocument(s, doc, 'contract');
    expect(s.orders.counts.bellWatchers.document).toBe(s.story.documents.length);
    expect(s.orders.counts.bellWatchers.name).toBe(s.story.names.length);
    for (const id of ORDER_IDS) if (id !== 'bellWatchers') expect(orderStanding(s, id)).toBe(0);
  });

  it('raises the saved level when the thresholds are reached', () => {
    const s = keepRich('orders-level');
    for (const doc of allDocuments) findDocument(s, doc, 'contract');
    expect(s.orders.levelHigh.bellWatchers).toBe(orderLevel(s, 'bellWatchers'));
    expect(s.orders.levelHigh.bellWatchers).toBeGreaterThan(0);
  });
});

describe('the Long Night keeps all of it', () => {
  it('keeps counts, start, flags, Triumphant stands and the highest level', () => {
    const s = hut();
    run(s, { type: 'brew.queue', item: 'grave-oil' });
    advance(s, s.time + BREW + 1000);
    for (const doc of allDocuments) findDocument(s, doc, 'contract');
    s.orders.start.moot = 3;
    s.orders.triumphant = 1;
    s.orders.thirdSeat = true;
    s.orders.opened.moot = { at: s.time };
    const before = structuredClone(s.orders);
    resetForNewCycle(s);
    expect(s.orders).toEqual(before);
  });
});

describe('events add nothing', () => {
  const owner = (): GameState => {
    const env = JSON.parse(
      readFileSync(new URL('../saves/fixtures/v8-owner.json', import.meta.url), 'utf8'),
    );
    const r = loadEnvelope(env);
    if (!r.ok) throw new Error(r.error);
    catchUpNow(r.value.state, r.value.state.time);
    return r.value.state;
  };

  it('a boss attempt and a hunt leave every count and standing as they were', () => {
    const s = owner();
    const now = s.time;
    apply(s, { type: 'debug.fillBank' }, now);
    const before = structuredClone(s.orders);
    const bossParty = eligibleHunters(s, now).slice(0, 4);
    expect(apply(s, { type: 'boss.attempt', party: bossParty }, now).ok).toBe(true);
    const track = 'stoneback-1' as const;
    const huntParty = legalHunters(s, trackOf(track).track, now).slice(0, 4);
    expect(huntParty.length).toBeGreaterThan(0);
    expect(apply(s, { type: 'hunt.attempt', track, party: huntParty }, now).ok).toBe(true);
    expect(s.orders).toEqual(before);
  });
});
