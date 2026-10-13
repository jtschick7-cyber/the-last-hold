// Plan T1.17–T1.19 (technical design §9): fixtures, round trip, export codes,
// corrupted codes, unknown IDs, newer versions, and the storage slots.
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  decodeSaveCode,
  decodeSaveFile,
  encodeSaveCode,
  encodeSaveFile,
  IMPORT_ERRORS,
  loadEnvelope,
  makeEnvelope,
  migrations,
  NEWER_VERSION,
} from '../../src/core/save';
import { fnv1a, fromBase64Url, toBase64Url } from '../../src/core/save/code';
import { SCHEMA_VERSION } from '../../src/core/state/game-state';
import { createNewGame } from '../../src/core/state/new-game';
import { browserCodec } from '../../src/platform/compression';
import { createSaveStore, SAVE_KEYS } from '../../src/platform/save-store';
import { createChannelStorage } from '../../src/platform/storage';
import { memoryBackend } from '../helpers/memory-storage';

const FIXTURES = new URL('./fixtures/', import.meta.url);
const fixtures = readdirSync(FIXTURES).filter((f) => /^v\d+(-[a-z]+)?\.json$/.test(f));
const readFixture = (f: string): unknown => JSON.parse(readFileSync(new URL(f, FIXTURES), 'utf8'));
const codec = browserCodec();

describe('fixtures and migrations (CLAUDE.md "Saves")', () => {
  it('has a fixture for every schema version up to the current one', () => {
    for (let v = 1; v <= SCHEMA_VERSION; v++) expect(fixtures).toContain(`v${v}.json`);
  });

  it('has a migration for every version below the current one', () => {
    for (let v = 1; v < SCHEMA_VERSION; v++)
      expect(migrations[v], `migration ${v}`).toBeTypeOf('function');
  });

  it.each(fixtures)('%s loads, migrates, validates and round-trips equal', (f) => {
    const first = loadEnvelope(readFixture(f));
    if (!first.ok) throw new Error(first.error);
    expect(first.value.warnings).toEqual([]);
    expect(first.value.state.meta.schemaVersion).toBe(SCHEMA_VERSION);
    const again = loadEnvelope(JSON.parse(encodeSaveFile(makeEnvelope(first.value.state, 0))));
    if (!again.ok) throw new Error(again.error);
    expect(again.value.state).toEqual(first.value.state);
  });

  it('refuses a save from a newer version', () => {
    const env = { ...(readFixture('v1.json') as object), schemaVersion: SCHEMA_VERSION + 1 };
    expect(loadEnvelope(env)).toEqual({ ok: false, error: NEWER_VERSION });
  });
});

describe('validation (technical design §9.4)', () => {
  const env = (): { state: Record<string, Record<string, unknown>> } & Record<string, unknown> =>
    structuredClone(readFixture('v1.json')) as never;
  /** One section of a fixture's state, for breaking it on purpose. */
  const part = (e: ReturnType<typeof env>, name: string): Record<string, unknown> =>
    e.state[name] as Record<string, unknown>;

  it('drops unknown IDs with a warning, never a crash', () => {
    const e = env();
    part(e, 'buildings')['wizard-tower'] = 3;
    part(e, 'resources').mana = 10;
    const r = loadEnvelope(e);
    if (!r.ok) throw new Error(r.error);
    expect(r.value.warnings.join(' ')).toContain('wizard-tower');
    expect(r.value.warnings.join(' ')).toContain('mana');
    expect(r.value.state.buildings).not.toHaveProperty('wizard-tower');
  });

  it('repairs a broken priority list and invalid settings, with warnings', () => {
    const e = env();
    (e.state.peasants as Record<string, unknown>).priority = ['miner', 'miner', 'baker'];
    (e.state.settings as Record<string, unknown>).theme = 'neon';
    const r = loadEnvelope(e);
    if (!r.ok) throw new Error(r.error);
    expect(r.value.state.peasants.priority).toEqual([
      'miner',
      'farmer',
      'woodcutter',
      'silver-digger',
    ]);
    expect(r.value.state.settings.theme).toBe('dark');
    expect(r.value.warnings.length).toBe(2);
  });

  it.each([
    ['a negative resource', (e: ReturnType<typeof env>) => void (part(e, 'resources').food = -5)],
    [
      'a fractional building count',
      (e: ReturnType<typeof env>) => void (part(e, 'buildings').farm = 1.5),
    ],
    ['an unknown Age', (e: ReturnType<typeof env>) => void (part(e, 'cycle').age = 'empire')],
    [
      'more workers than peasants',
      (e: ReturnType<typeof env>) => void (part(e, 'peasants').total = 1),
    ],
    ['a missing section', (e: ReturnType<typeof env>) => void delete e.state.meta],
    [
      'a non-number time',
      (e: ReturnType<typeof env>) => void ((e.state as Record<string, unknown>).time = 'soon'),
    ],
  ])('rejects %s with a plain reason', (_, breakIt) => {
    const e = env();
    breakIt(e);
    const r = loadEnvelope(e);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toMatch(/^This save has invalid data: /);
  });

  it("rejects things that aren't saves", () => {
    expect(loadEnvelope(null).ok).toBe(false);
    expect(loadEnvelope({ app: 'other-game', schemaVersion: 1, state: {} })).toEqual({
      ok: false,
      error: "This isn't a Last Hold save.",
    });
  });
});

describe('export codes (technical design §9.3)', () => {
  const state = createNewGame('code-test', 1_760_000_000_000);

  it('base64url round-trips every length', () => {
    for (let n = 0; n < 20; n++) {
      const bytes = Uint8Array.from({ length: n }, (_, i) => (i * 37 + n) & 255);
      expect(fromBase64Url(toBase64Url(bytes))).toEqual(bytes);
    }
    expect(toBase64Url(new TextEncoder().encode('hello?>'))).toBe('aGVsbG8_Pg');
  });

  it('FNV-1a matches its published test values', () => {
    expect(fnv1a('')).toBe('811c9dc5');
    expect(fnv1a('a')).toBe('e40c292c');
    expect(fnv1a('foobar')).toBe('bf9cf968');
  });

  it('LH1 (compressed) round-trips', async () => {
    expect(codec).not.toBeNull();
    const code = await encodeSaveCode(makeEnvelope(state, 0), codec);
    expect(code).toMatch(/^LH1\.[A-Za-z0-9_-]+\.[0-9a-f]{8}$/);
    const r = await decodeSaveCode(code, codec);
    expect(r.ok && r.value.state).toEqual(state);
  });

  it('LH0 (uncompressed) round-trips, and imports even with compression available', async () => {
    const code = await encodeSaveCode(makeEnvelope(state, 0), null);
    expect(code.startsWith('LH0.')).toBe(true);
    expect((await decodeSaveCode(code, codec)).ok).toBe(true);
    expect((await decodeSaveCode(code, null)).ok).toBe(true);
  });

  it('tolerates spaces and line breaks from copy and paste', async () => {
    const code = await encodeSaveCode(makeEnvelope(state, 0), codec);
    const messy = `  ${code.slice(0, 20)}\n${code.slice(20, 50)} ${code.slice(50)}\n`;
    expect((await decodeSaveCode(messy, codec)).ok).toBe(true);
  });

  it('the save file round-trips', () => {
    const r = decodeSaveFile(encodeSaveFile(makeEnvelope(state, 0)));
    expect(r.ok && r.value.state).toEqual(state);
    expect(decodeSaveFile('not json').ok).toBe(false);
  });

  describe('corrupted codes are refused with a reason', async () => {
    const good = await encodeSaveCode(makeEnvelope(state, 0), codec);
    const [, payload = ''] = good.split('.');
    const flip = (s: string, i: number): string =>
      s.slice(0, i) + (s[i] === 'A' ? 'B' : 'A') + s.slice(i + 1);
    const withChecksum = (prefix: string, p: string): string => `${prefix}${p}.${fnv1a(p)}`;
    const garbage = toBase64Url(Uint8Array.from([1, 2, 3, 4, 5, 6, 7]));
    const notJson = toBase64Url(new TextEncoder().encode('{"app":'));

    it.each([
      ['empty', '', IMPORT_ERRORS.prefix],
      ['wrong prefix', `XX1.${payload}.00000000`, IMPORT_ERRORS.prefix],
      ['truncated', good.slice(0, good.length - 30), IMPORT_ERRORS.checksum],
      ['one character changed', flip(good, 10), IMPORT_ERRORS.checksum],
      ['wrong checksum', `${good.slice(0, -8)}00000000`, IMPORT_ERRORS.checksum],
      ['no checksum', `LH1.${payload}`, IMPORT_ERRORS.checksum],
      ['bad characters', withChecksum('LH1.', '!!!!'), IMPORT_ERRORS.checksum],
      ['not deflate data', withChecksum('LH1.', garbage), IMPORT_ERRORS.unpack],
      ['not JSON', withChecksum('LH0.', notJson), IMPORT_ERRORS.parse],
    ])('%s', async (_, code, reason) => {
      expect(await decodeSaveCode(code, codec)).toEqual({ ok: false, error: reason });
    });

    it('a compressed code where compression is missing', async () => {
      expect(await decodeSaveCode(good, null)).toEqual({
        ok: false,
        error: IMPORT_ERRORS.unsupported,
      });
    });
  });
});

describe('save store (technical design §9.1)', () => {
  const setup = (channel: 'live' | 'preview' = 'live') => {
    const backend = memoryBackend();
    let clock = 1_000_000;
    const store = createSaveStore(createChannelStorage(channel, backend), () => clock);
    return { backend, store, tick: (ms: number) => (clock += ms) };
  };

  it('saves to the main slot and loads it back', () => {
    const { backend, store } = setup();
    const s = createNewGame('store', 0);
    expect(store.save(s)).toBe(true);
    expect(Object.keys(backend.dump())).toEqual(['lasthold:save']);
    const out = store.load();
    expect(out.kind === 'loaded' && out.source).toBe('main');
    expect(out.kind === 'loaded' && out.loaded.state).toEqual(s);
  });

  it('keeps preview and live saves apart', () => {
    const backend = memoryBackend();
    const live = createSaveStore(createChannelStorage('live', backend), () => 0);
    const preview = createSaveStore(createChannelStorage('preview', backend), () => 0);
    live.save(createNewGame('live-seed', 0));
    expect(preview.load().kind).toBe('empty');
    preview.save(createNewGame('preview-seed', 0));
    const l = live.load();
    expect(l.kind === 'loaded' && l.loaded.state.meta.gameSeed).toBe('live-seed');
  });

  it('copies the last good main save to the backup every 10 minutes', () => {
    const { backend, store, tick } = setup();
    const s = createNewGame('store', 0);
    store.save(s); // nothing to back up yet
    expect(backend.getItem('lasthold:backup')).toBeNull();
    s.resources.food = 111;
    store.save(s); // first backup of the session: the previous main
    expect(backend.getItem('lasthold:backup')).toContain('"food":50');
    s.resources.food = 222;
    tick(5 * 60 * 1000);
    store.save(s); // too soon for another backup
    expect(backend.getItem('lasthold:backup')).toContain('"food":50');
    tick(5 * 60 * 1000);
    store.save(s); // 10 minutes since the last backup
    expect(backend.getItem('lasthold:backup')).toContain('"food":222');
  });

  it('quarantines a broken main save and falls back to the backup', () => {
    const { backend, store } = setup();
    const s = createNewGame('store', 0);
    store.save(s);
    store.save(s); // makes a backup
    backend.setItem('lasthold:save', '{"broken":');
    const out = store.load();
    expect(out.kind === 'loaded' && out.source).toBe('backup');
    expect(out.kind === 'loaded' && out.problems[0]).toMatch(/main save couldn't load/);
    const keys = Object.keys(backend.dump());
    expect(keys.some((k) => k.startsWith(`lasthold:${SAVE_KEYS.corruptPrefix}`))).toBe(true);
    expect(keys).not.toContain('lasthold:save');
  });

  it('starts empty, with the reason, when nothing loads', () => {
    const { backend, store } = setup();
    backend.setItem('lasthold:save', 'nonsense');
    const out = store.load();
    expect(out.kind).toBe('empty');
    expect(out.kind === 'empty' && out.problems).toHaveLength(1);
  });

  it('never touches a save from a newer version', () => {
    const { backend, store } = setup();
    const env = { ...makeEnvelope(createNewGame('new', 0), 0), schemaVersion: SCHEMA_VERSION + 1 };
    backend.setItem('lasthold:save', JSON.stringify(env));
    expect(store.load()).toEqual({ kind: 'newer', message: NEWER_VERSION });
    expect(backend.getItem('lasthold:save')).toBe(JSON.stringify(env));
  });

  it('reports a full disk instead of throwing', () => {
    const { backend, store } = setup();
    backend.failWrites = true;
    expect(store.save(createNewGame('x', 0))).toBe(false);
  });
});

describe('the v1 → v2 migration (plan T2.4)', () => {
  const load = (f: string) => {
    const r = loadEnvelope(readFixture(f));
    if (!r.ok) throw new Error(r.error);
    return r.value.state;
  };

  it("upgrades the owner's real v0.1 save without losing anything the player had", () => {
    const before = readFixture('v1-owner.json') as { state: Record<string, unknown> };
    const after = load('v1-owner.json');
    const old = before.state as {
      resources: unknown;
      peasants: unknown;
      buildings: Record<string, number>;
      stats: { buildingsBought: number; peasantsSettled: number };
      time: number;
      cycle: unknown;
    };
    expect(after.resources).toEqual(old.resources);
    expect(after.peasants).toEqual(old.peasants);
    expect(after.cycle).toEqual(old.cycle);
    expect(after.time).toBe(old.time);
    for (const [id, n] of Object.entries(old.buildings)) {
      expect(after.buildings[id as keyof typeof after.buildings]).toBe(n);
    }
    expect(after.stats.buildingsBought).toBe(old.stats.buildingsBought);
    expect(after.stats.peasantsSettled).toBe(old.stats.peasantsSettled);
  });

  it('gives the two free starting hunters, new buildings at 0, and an empty contract state', () => {
    const s = load('v1-owner.json');
    expect(Object.keys(s.hunters).sort()).toEqual(['halvar', 'zora']);
    expect(s.roster.active).toEqual(['halvar', 'zora']);
    expect(s.hunters.halvar).toMatchObject({ level: 1, xp: 0, weapon: null, recovery: null });
    expect(s.buildings.barracks).toBe(0);
    expect(s.buildings['trophy-hall']).toBe(0);
    expect(s.running).toEqual([]);
    expect(s.results).toEqual([]);
    expect(s.fallen).toEqual([]);
    expect(s.log.recentFights).toEqual([]);
    expect(s.stats).toMatchObject({
      contractsWon: 0,
      contractsLost: 0,
      trophies: 0,
      bountySilver: 0,
    });
  });

  it('opens the board at once when a Mine already stands, and leaves it closed otherwise', () => {
    const owner = load('v1-owner.json'); // four Mines
    expect(owner.board).toEqual({
      opened: true,
      open: [],
      nextArrivalAt: owner.time,
      arrivals: 0,
      tierWins: [0, 0, 0, 0, 0],
    });
    const plain = readFixture('v1.json') as { state: { buildings: Record<string, number> } };
    const mines = plain.state.buildings.mine ?? 0;
    expect(load('v1.json').board.opened).toBe(mines > 0);
  });

  it('a new game starts with the same two hunters and a closed board', () => {
    const g = createNewGame('seed', 0);
    expect(Object.keys(g.hunters).sort()).toEqual(['halvar', 'zora']);
    expect(g.board.opened).toBe(false);
  });
});
