// Plan T18.5 (GDD §5.12.12, §6.5, §9.26, technical design §25.4, D622): 6 permanent Event
// Courtyard Marks, cross-reset persistence, migration/load backfill, Hold Look per-item visibility
// toggles (`layout.toggleCosmetic`), layout.ts view selectors, and <= 0.3 KB save growth.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  COURTYARD_MARK_IDS,
  COURTYARD_MARKS,
  type CourtyardMarkId,
} from '../../src/content/courtyard-marks';
import { COSMETIC_IDS, type CosmeticId } from '../../src/content/delves/shop';
import { HUNT_IDS, hunts, type TrackId } from '../../src/content/hunts';
import { apply } from '../../src/core/commands/apply';
import { resetForNewCycle } from '../../src/core/long-night/reset';
import { encodeSaveFile, loadEnvelope, makeEnvelope } from '../../src/core/save';
import { migrations } from '../../src/core/save/migrations';
import { createNewGame } from '../../src/core/state/new-game';
import type { GameState } from '../../src/core/state/game-state';
import {
  buildHoldGridView,
  holdLookView,
  visibleShopCosmetics,
} from '../../src/core/systems/layout';
import { poolNow } from '../../src/core/systems/boss';
import { legalHunters, trackOf } from '../../src/core/systems/hunt';

const NOW = 1_700_000_000_000;

const bastionEventsReady = (seed: string): GameState => {
  const s = createNewGame(seed, NOW);
  apply(s, { type: 'debug.prepareEndgameRoster' }, NOW);
  s.cycle.age = 'bastion';
  s.events.opened = true;
  apply(s, { type: 'debug.fillBank' }, NOW);
  return s;
};

describe('Event Courtyard Marks & Hold Look toggles (T18.5, T19.5)', () => {
  it('defines the 8 Courtyard Marks mapped 1:1 to Great Beasts & Legendary Hunts', () => {
    expect(COURTYARD_MARK_IDS).toEqual([
      'fjord-bone-standard',
      'barrow-brazier',
      'river-reed-basin',
      'thorn-antler-rack',
      'beacon-iron-urn',
      'stoneback-cairn',
      'kettle-barrow-wreath',
      'watch-fire-sconce',
    ]);
    expect(COURTYARD_MARKS).toHaveLength(8);
    expect(COURTYARD_MARKS.map((m) => m.name)).toEqual([
      'Fjord-Bone Standard',
      'Barrow Brazier',
      'River-Reed Basin',
      'Thorn-Antler Rack',
      'Beacon-Iron Urn',
      'Stoneback Cairn',
      'Kettle-Barrow Wreath',
      'Watch-Fire Sconce',
    ]);
  });

  it('unlocks each Great Beast mark only when killed, not on partial damage', () => {
    const s = bastionEventsReady('boss-marks');
    const party = s.roster.active.slice(0, 4);
    expect(s.cosmetics.marks).toEqual({});

    // Weak 1-hunter attempt leaves boss alive: mark stays locked.
    const weakParty = party.slice(0, 1);
    const partial = apply(s, { type: 'boss.attempt', party: weakParty }, NOW);
    expect(partial.ok).toBe(true);
    if ((s.events.boss.pool ?? poolNow(s)) > 0 && s.events.boss.visit === 0) {
      expect(s.cosmetics.marks).toEqual({});
    }

    // Finish each of the 5 Great Beasts in turn.
    const expectedOrder: CourtyardMarkId[] = [
      'fjord-bone-standard',
      'barrow-brazier',
      'river-reed-basin',
      'thorn-antler-rack',
      'beacon-iron-urn',
    ];
    for (let i = 0; i < expectedOrder.length; i++) {
      while (s.events.boss.visit <= i) {
        apply(s, { type: 'debug.fillBank' }, NOW);
        apply(s, { type: 'debug.endRests' }, NOW);
        expect(apply(s, { type: 'boss.attempt', party }, NOW).ok).toBe(true);
      }
      const markId = expectedOrder[i];
      if (!markId) throw new Error('missing mark id');
      expect(s.cosmetics.marks[markId]).toBe(true);
    }
  });

  it('unlocks each Legendary Hunt mark only on clear/unlock, not partial progress', () => {
    const s = bastionEventsReady('hunt-marks');
    // Remove the three Hunt legendary hunters so clearing each Hunt triggers their real arrival.
    for (const h of HUNT_IDS) {
      const legendary = hunts[h].hunter;
      Reflect.deleteProperty(s.hunters, legendary);
      s.roster.active = s.roster.active.filter((id) => id !== legendary);
    }

    // Partial progress below 100 points unlocks nothing.
    s.events.hunts.stoneback.points = 10;
    const partialParty = legalHunters(s, trackOf('stoneback-1').track, NOW).slice(0, 4);
    const partial = apply(
      s,
      { type: 'hunt.attempt', track: 'stoneback-1', party: partialParty },
      NOW,
    );
    expect(partial.ok).toBe(true);
    expect(s.events.hunts.stoneback.unlocked).toBe(false);
    expect(s.cosmetics.marks['stoneback-cairn']).toBeUndefined();

    // Reaching unlock threshold permanently grants each Hunt mark.
    const huntPairs: [TrackId, CourtyardMarkId, 'stoneback' | 'mara' | 'likho'][] = [
      ['stoneback-3', 'stoneback-cairn', 'stoneback'],
      ['mara-3', 'kettle-barrow-wreath', 'mara'],
      ['likho-3', 'watch-fire-sconce', 'likho'],
    ];
    for (const [track, markId, huntId] of huntPairs) {
      s.events.hunts[huntId].points = 98;
      apply(s, { type: 'debug.fillBank' }, NOW);
      apply(s, { type: 'debug.endRests' }, NOW);
      const trackParty = legalHunters(s, trackOf(track).track, NOW).slice(0, 4);
      expect(apply(s, { type: 'hunt.attempt', track, party: trackParty }, NOW).ok).toBe(true);
      expect(s.events.hunts[huntId].unlocked).toBe(true);
      expect(s.cosmetics.marks[markId]).toBe(true);
    }
  });

  it('survives Long Night resets alongside shop cosmetics and per-item visibility toggles', () => {
    const s = bastionEventsReady('long-night-cosmetics');
    s.events.boss.visit = 2;
    s.events.hunts.stoneback.unlocked = true;
    const migrated = loadEnvelope(JSON.parse(encodeSaveFile(makeEnvelope(s, NOW))));
    expect(migrated.ok).toBe(true);
    if (!migrated.ok) throw new Error(migrated.error);
    const st = migrated.value.state;

    st.delve.shop.cosmetics = ['gatehouse-banners', 'wall-lanterns'];
    expect(
      apply(st, { type: 'layout.toggleCosmetic', id: 'fjord-bone-standard', visible: false }, NOW)
        .ok,
    ).toBe(true);
    expect(
      apply(st, { type: 'layout.toggleCosmetic', id: 'wall-lanterns', visible: false }, NOW).ok,
    ).toBe(true);

    resetForNewCycle(st);

    expect(st.cosmetics.marks['fjord-bone-standard']).toBe(false);
    expect(st.cosmetics.marks['barrow-brazier']).toBe(true);
    expect(st.cosmetics.marks['stoneback-cairn']).toBe(true);
    expect(st.cosmetics.hidden).toEqual(['wall-lanterns']);
    expect(st.delve.shop.cosmetics).toEqual(['gatehouse-banners', 'wall-lanterns']);
  });

  it('backfills cleared events in migration-v16.ts and load.ts idempotently while keeping toggles', () => {
    const v15Owner = JSON.parse(
      readFileSync(new URL('../saves/fixtures/v15-owner.json', import.meta.url), 'utf8'),
    ) as { state: Record<string, unknown> };
    const snap = structuredClone(v15Owner.state);
    const step = migrations[15];
    if (!step) throw new Error('missing v15 migration');
    const migrated = step(v15Owner.state) as unknown as GameState;
    expect(v15Owner.state).toEqual(snap);

    // Owner v15 fixture has boss.visit=1 (Lindworm defeated) & all 3 Hunts unlocked.
    expect(migrated.cosmetics).toEqual({
      marks: {
        'fjord-bone-standard': true,
        'stoneback-cairn': true,
        'kettle-barrow-wreath': true,
        'watch-fire-sconce': true,
      },
      hidden: [],
    });

    // Reloading v16.json (which predates cosmetics field) backfills identically with 0 warnings.
    const v16Raw = JSON.parse(
      readFileSync(new URL('../saves/fixtures/v16.json', import.meta.url), 'utf8'),
    ) as unknown;
    const loadedV16 = loadEnvelope(v16Raw);
    expect(loadedV16.ok).toBe(true);
    if (!loadedV16.ok) throw new Error(loadedV16.error);
    expect(loadedV16.value.warnings).toEqual([]);
    expect(loadedV16.value.state.cosmetics).toEqual(migrated.cosmetics);

    // Player hides one mark and one shop cosmetic -> save/load preserves both false toggles!
    loadedV16.value.state.delve.shop.cosmetics = ['wall-lanterns'];
    expect(
      apply(
        loadedV16.value.state,
        { type: 'layout.toggleCosmetic', id: 'stoneback-cairn', visible: false },
        NOW,
      ).ok,
    ).toBe(true);
    expect(
      apply(
        loadedV16.value.state,
        { type: 'layout.toggleCosmetic', id: 'wall-lanterns', visible: false },
        NOW,
      ).ok,
    ).toBe(true);
    const reloaded = loadEnvelope(
      JSON.parse(encodeSaveFile(makeEnvelope(loadedV16.value.state, NOW))),
    );
    expect(reloaded.ok).toBe(true);
    if (!reloaded.ok) throw new Error(reloaded.error);
    expect(reloaded.value.warnings).toEqual([]);
    expect(reloaded.value.state.cosmetics.marks['stoneback-cairn']).toBe(false);
    expect(reloaded.value.state.cosmetics.hidden).toEqual(['wall-lanterns']);
  });

  it('toggles individual Courtyard Marks & COSMETIC_IDS independently and updates selectors', () => {
    const s = createNewGame('toggle-selectors', NOW);
    // Refuses locked mark & unbought shop item & unknown id.
    expect(apply(s, { type: 'layout.toggleCosmetic', id: 'barrow-brazier' }, NOW).ok).toBe(false);
    expect(apply(s, { type: 'layout.toggleCosmetic', id: 'gatehouse-banners' }, NOW).ok).toBe(
      false,
    );
    expect(
      apply(
        s,
        {
          type: 'layout.toggleCosmetic',
          id: 'not-a-cosmetic' as CosmeticId,
        },
        NOW,
      ).ok,
    ).toBe(false);

    s.delve.shop.cosmetics = ['gatehouse-banners', 'wall-lanterns', 'watchtower-bell'];
    s.cosmetics.marks = { 'fjord-bone-standard': true, 'kettle-barrow-wreath': true };

    const vBefore = buildHoldGridView(s);
    expect(vBefore.cosmetics).toEqual({
      door: false,
      banners: true,
      bell: 'border',
      lanterns: 'border',
    });
    expect(vBefore.courtyardMarks).toEqual(['fjord-bone-standard', 'kettle-barrow-wreath']);
    expect(visibleShopCosmetics(s)).toEqual([
      'gatehouse-banners',
      'wall-lanterns',
      'watchtower-bell',
    ]);

    // Toggle off one mark and one shop cosmetic; others remain visible and view memo invalidates.
    expect(apply(s, { type: 'layout.toggleCosmetic', id: 'wall-lanterns' }, NOW).ok).toBe(true);
    expect(apply(s, { type: 'layout.toggleCosmetic', id: 'fjord-bone-standard' }, NOW).ok).toBe(
      true,
    );

    const vAfter = buildHoldGridView(s);
    expect(vAfter).not.toBe(vBefore);
    expect(vAfter.cosmetics).toEqual({
      door: false,
      banners: true,
      bell: 'border',
      lanterns: null,
    });
    expect(vAfter.courtyardMarks).toEqual(['kettle-barrow-wreath']);
    expect(visibleShopCosmetics(s)).toEqual(['gatehouse-banners', 'watchtower-bell']);

    const look = holdLookView(s);
    expect(look.marks.find((m) => m.id === 'fjord-bone-standard')).toMatchObject({
      unlocked: true,
      visible: false,
      source: 'The Lindworm of Velk Fjord',
    });
    expect(look.marks.find((m) => m.id === 'barrow-brazier')).toMatchObject({
      unlocked: false,
      visible: false,
      source: 'The Barrow-King',
    });
    expect(look.marks.find((m) => m.id === 'stoneback-cairn')).toMatchObject({
      source: 'Stoneback the Fell Troll',
    });
    expect(look.shop.find((c) => c.id === 'wall-lanterns')).toMatchObject({
      unlocked: true,
      visible: false,
      source: 'Riftglass shop',
    });
    expect(look.shop.find((c) => c.id === 'gatehouse-banners')).toMatchObject({
      unlocked: true,
      visible: true,
      source: 'Riftglass shop',
    });

    // Toggle back on explicitly and verify save-size budget <= 0.3 KB (307 B) at max occupancy.
    expect(
      apply(s, { type: 'layout.toggleCosmetic', id: 'wall-lanterns', visible: true }, NOW).ok,
    ).toBe(true);
    expect(visibleShopCosmetics(s)).toContain('wall-lanterns');
  });

  it('keeps state.cosmetics save growth within 0.3 KB (307 B) when all 8 marks & 4 cosmetics are tracked', () => {
    const s = createNewGame('cosmetic-size', NOW);
    for (const id of COURTYARD_MARK_IDS) s.cosmetics.marks[id] = false;
    s.cosmetics.hidden = [...COSMETIC_IDS];
    const bytes = new TextEncoder().encode(JSON.stringify(s.cosmetics)).length;
    expect(bytes).toBeLessThanOrEqual(307);
  });

  it('drops unknown saved cosmetic IDs with warnings and refuses invalid cosmetic types', () => {
    const s = createNewGame('cosmetic-validate', NOW);
    const raw = JSON.parse(encodeSaveFile(makeEnvelope(s, NOW))) as {
      state: { cosmetics: { marks: Record<string, unknown>; hidden: unknown[] } };
    };
    raw.state.cosmetics.marks['phantom-banner'] = true;
    raw.state.cosmetics.hidden = ['ghost-lantern', 'wall-lanterns'];

    const ok = loadEnvelope(raw);
    expect(ok.ok).toBe(true);
    if (!ok.ok) throw new Error(ok.error);
    expect(ok.value.warnings).toHaveLength(2);
    expect(ok.value.state.cosmetics).toEqual({ marks: {}, hidden: ['wall-lanterns'] });

    raw.state.cosmetics.marks['fjord-bone-standard'] = 'yes';
    const bad = loadEnvelope(raw);
    expect(bad.ok).toBe(false);
  });
});
