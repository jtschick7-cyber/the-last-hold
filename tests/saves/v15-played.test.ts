// Plan TB.10 (technical design §23.6): v15-played.json is made with the real commands
// (scripts/make-v15-played-fixture.ts): the owner's migrated save, then four stands from Bastion with a
// spread of holds (one with a wall and a tower in the Tray), then debug.breach.freeze read once.
// It loads, validates, round-trips (saves.test.ts runs it too) and every stand log rebuilds line for line.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadEnvelope } from '../../src/core/save';
import { standReplayDiffers } from '../../src/core/replay-check';
import { RULES_VERSION } from '../../src/core/rules-version';
import { replayStand } from '../../src/core/stand/replay';

const load = () => {
  const r = loadEnvelope(
    JSON.parse(readFileSync(new URL('./fixtures/v15-played.json', import.meta.url), 'utf8')),
  );
  if (!r.ok) throw new Error(r.error);
  return r.value.state;
};

describe('v15-played.json', () => {
  const s = load();
  const stands = s.cycles.flatMap((c) => (c.stand ? [c.stand] : []));
  const withLanes = stands.filter((x) => x.lanes);

  it('was played: the debug mark is set, and four stands carry a lane table', () => {
    expect(s.meta.debugUsed).toBe(true);
    expect(withLanes).toHaveLength(4);
    for (const st of withLanes) expect(st.rulesVersion).toBe(RULES_VERSION);
  });

  it('the four tables are a spread: the Tray stand counts fewer pieces than the canonical one', () => {
    const counted = withLanes.map((x) => (x.lanes?.pieces ?? []).reduce((a, b) => a + b, 0));
    expect(new Set(withLanes.map((x) => JSON.stringify(x.lanes))).size).toBe(4);
    expect(counted[2]).toBeLessThan(counted[0] ?? 0);
  });

  it('every stand log rebuilds line for line, with the header only on a stand that has a table', () => {
    for (const st of stands) {
      const a = replayStand(st);
      const b = replayStand(st);
      expect(standReplayDiffers(st, a)).toBe(false);
      expect(JSON.stringify(b.waves.map((w) => w.fight.log))).toBe(
        JSON.stringify(a.waves.map((w) => w.fight.log)),
      );
      for (const w of a.waves) {
        if (st.lanes) expect(w.breach?.header).toMatch(/^Lane [1-8] · cover \d+%$/);
        else expect(w.breach).toBeUndefined();
      }
    }
  });
});
