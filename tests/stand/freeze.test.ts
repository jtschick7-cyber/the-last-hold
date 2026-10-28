// Plan TB.6 (technical design §23.3, §23.4, D584, D587, D593 (f)): Start freezes the lane table on the
// stand's record, and nothing else about the layout changes. The logs rebuild from the saved table.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { balance } from '../../src/content/balance';
import { clearNumCache } from '../../src/core/balance-access';
import { apply } from '../../src/core/commands/apply';
import { allowNoTableStart } from '../../src/core/commands/stand';
import { loadEnvelope } from '../../src/core/save';
import { replayStand } from '../../src/core/stand/replay';
import { standInputFor } from '../../src/core/stand/from-state';
import type { GameState, StandRecord } from '../../src/core/state/game-state';
import { BREACH_TEXT } from '../../src/content/breach-text';
import { laneTableFor } from '../../src/core/systems/breach';

const load = (): GameState => {
  const env = JSON.parse(
    readFileSync(new URL('../saves/fixtures/v15.json', import.meta.url), 'utf8'),
  ) as unknown;
  const r = loadEnvelope(env);
  if (!r.ok) throw new Error(r.error);
  return r.value.state;
};
const party = (s: GameState) => s.roster.active.slice(0, 6);
const stand = (s: GameState): StandRecord => {
  const rec = s.cycles.find((c) => c.stand && c.stand.at === s.time)?.stand;
  if (!rec) throw new Error('no stand was made');
  return rec;
};
const make = (s: GameState, extra: Record<string, unknown> = {}) =>
  apply(s, { type: 'stand.make', party: party(s), ...extra } as never, s.time);

describe('Start freezes the table (§23.3)', () => {
  it('saves the table the layout gives now, and stamps the stand version 6', () => {
    const s = load();
    const want = laneTableFor(s);
    expect(want.pieces.some((n) => n > 0)).toBe(true);
    expect(make(s).ok).toBe(true);
    const rec = stand(s);
    expect(rec.lanes).toEqual(want);
    expect(rec.rulesVersion).toBe(6);
  });

  it('places, moves and trays nothing: the layout is identical before and after', () => {
    const s = load();
    const before = JSON.stringify(s.layout);
    expect(make(s).ok).toBe(true);
    expect(JSON.stringify(s.layout)).toBe(before);
  });

  it('cannot freeze two tables: a second Start is refused and the first record is untouched', () => {
    const s = load();
    const input = standInputFor(s, party(s), { oils: {}, potions: {} });
    expect(input.lanes).toEqual(laneTableFor(s));
    const record = s.cycles[s.cycles.length - 1];
    expect(make(s).ok).toBe(true);
    const first = JSON.stringify(record?.stand?.lanes);
    expect(make(s).ok).toBe(false);
    expect(JSON.stringify(record?.stand?.lanes)).toBe(first);
  });

  it('the preview is fought with the table the layout gives now, and changes nothing', () => {
    const s = load();
    const before = JSON.stringify(s.layout);
    const a = standInputFor(s, party(s), { oils: {}, potions: {} });
    expect(JSON.stringify(s.layout)).toBe(before);
    expect(a.lanes).toEqual(laneTableFor(s));
    apply(s, { type: 'layout.clear' }, s.time);
    expect(standInputFor(s, party(s), { oils: {}, potions: {} }).lanes?.pieces).toEqual([
      0, 0, 0, 0, 0, 0, 0, 0,
    ]);
  });

  it('a stand made below Bastion freezes no table and takes the version 5 path', () => {
    const s = load();
    s.cycle.age = 'citadel';
    s.arrivalDue = true; // the v0.4 arrival: a stand at whatever Rank the save has
    expect(standInputFor(s, party(s), { oils: {}, potions: {} }).lanes).toBeUndefined();
    expect(make(s).ok).toBe(true);
    expect(stand(s).lanes).toBeUndefined();
  });
});

describe('the log rebuild uses the saved table (§23.4)', () => {
  it('gives identical logs after the layout changes and after balance.breach changes', () => {
    const s = load();
    expect(make(s).ok).toBe(true);
    const rec = stand(s);
    const first = JSON.stringify(replayStand(rec));
    apply(s, { type: 'layout.clear' }, s.time);
    expect(JSON.stringify(replayStand(rec))).toBe(first);
    const b = balance.breach as unknown as Record<string, { value: unknown }>;
    const saved = {
      cover: b.coverOwn?.value,
      step: b.depthStep?.value,
      scale: b.volleyScale?.value,
    };
    try {
      (b.coverOwn as { value: unknown }).value = 0.1;
      (b.depthStep as { value: unknown }).value = 0;
      (b.volleyScale as { value: unknown }).value = 3;
      clearNumCache();
      expect(JSON.stringify(replayStand(rec))).toBe(first);
    } finally {
      (b.coverOwn as { value: unknown }).value = saved.cover;
      (b.depthStep as { value: unknown }).value = saved.step;
      (b.volleyScale as { value: unknown }).value = saved.scale;
      clearNumCache();
    }
  });

  it('a record without lanes rebuilds under version 5, with no Breach lines', () => {
    const s = load();
    allowNoTableStart(true);
    try {
      expect(make(s, { noLanes: true }).ok).toBe(true);
    } finally {
      allowNoTableStart(false);
    }
    const rec = stand(s);
    expect(rec.lanes).toBeUndefined();
    for (const w of replayStand(rec).waves) expect(w.breach).toBeUndefined();
  });

  it('a version 6 log opens with the header line, Lane {n} · cover {p}% (GDD §9.25)', () => {
    const s = load();
    expect(make(s).ok).toBe(true);
    const rec = stand(s);
    const waves = replayStand(rec).waves;
    expect(waves.length).toBeGreaterThan(0);
    for (const w of waves) expect(w.breach?.header).toMatch(/^Lane [1-8] · cover \d+%$/);
    const gdd = readFileSync(new URL('../../docs/gdd.md', import.meta.url), 'utf8');
    expect(gdd).toContain(`\`${BREACH_TEXT.logHeader('{n}', '{p}')}\``);
  });
});

describe('the test-only start option (D593 (f))', () => {
  it('is refused in a normal build, honoured where it is switched on, and then marks debugUsed', () => {
    const s = load();
    expect(make(s, { noLanes: true }).ok).toBe(false);
    expect(s.cycles[s.cycles.length - 1]?.stand ?? null).toBeNull();
    expect(s.meta.debugUsed).toBe(false);
    allowNoTableStart(true);
    try {
      expect(make(s, { noLanes: true }).ok).toBe(true);
    } finally {
      allowNoTableStart(false);
    }
    expect(s.meta.debugUsed).toBe(true);
  });
});
