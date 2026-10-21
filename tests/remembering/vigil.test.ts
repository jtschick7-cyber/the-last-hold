// Plan T11.6 (GDD §5.15.3, D453, lore §34.4, §34.8): Keep the Vigil changes nothing in the game; its
// scene R-10 plays once, on choosing, and the Library's shelf "The Remembering" replays it as "Later".
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { roll } from '../../src/content/story/roll';
import {
  rememberingShelfEntries,
  rememberingShelfTitle,
  vigilScene,
} from '../../src/content/text/remembering';
import { apply } from '../../src/core/commands';
import { loadEnvelope } from '../../src/core/save';
import { catchUpNow } from '../../src/core/sim/offline';
import type { GameState } from '../../src/core/state/game-state';
import { rememberingShelf } from '../../src/core/story/remembering-view';

const ready = (): GameState => {
  const env = JSON.parse(
    readFileSync(new URL('../saves/fixtures/v11.json', import.meta.url), 'utf8'),
  );
  const r = loadEnvelope(env);
  if (!r.ok) throw new Error(r.error);
  const s = r.value.state;
  catchUpNow(s, s.time);
  for (const type of [
    'debug.rememberingFinishActVI',
    'remembering.seeNear',
    'debug.rememberingOpenGate',
  ] as const)
    expect(apply(s, { type }, s.time).ok).toBe(true);
  return s;
};

/** What a diff outside `remembering` may ignore: the clocks the game folds in on every command (T11.6). */
const stripped = (s: GameState): unknown => {
  const c = structuredClone(s) as unknown as Record<string, Record<string, unknown>>;
  delete c.remembering;
  if (c.meta) {
    delete c.meta.lastSeen;
    delete c.meta.clockHighWater;
  }
  if (c.events) delete c.events.clock;
  return c;
};

describe('Keep the Vigil changes nothing', () => {
  it('leaves the whole state outside `remembering` as it was, at the same time', () => {
    const s = ready();
    const before = stripped(s);
    expect(apply(s, { type: 'remembering.choose', ending: 'vigil' }, s.time).ok).toBe(true);
    expect(stripped(s)).toEqual(before);
    expect(s.remembering.endings).toHaveLength(1);
  });

  it('is recorded once: a second choice is refused, so R-10 plays only once', () => {
    const s = ready();
    expect(apply(s, { type: 'remembering.choose', ending: 'vigil' }, s.time).ok).toBe(true);
    expect(apply(s, { type: 'remembering.choose', ending: 'vigil' }, s.time).ok).toBe(false);
  });
});

describe('the shelf “The Remembering”', () => {
  it('is empty (hidden) until an entry is reached, then offers “Later”, and keeps it', () => {
    const s = ready();
    expect(rememberingShelf(s)).toEqual([]);
    apply(s, { type: 'remembering.choose', ending: 'vigil' }, s.time);
    expect(rememberingShelf(s)).toEqual([{ id: 'later', ...rememberingShelfEntries.later }]);
    expect(rememberingShelf(s)[0]?.title).toBe(vigilScene.title);
    apply(s, { type: 'remembering.choose', ending: 'remember' }, s.time);
    expect(rememberingShelf(s).map((e) => e.id)).toEqual(['later']);
    expect(rememberingShelfTitle).toBe('The Remembering');
  });
});

describe('R-10 “Later”', () => {
  const lore = readFileSync(new URL('../../docs/lore-secrets.md', import.meta.url), 'utf8')
    .split('\n')
    .map((l) => l.replace(/^> ?/, '').trim());

  it('is word for word as lore §34.4 has it', () => {
    for (const p of vigilScene.paragraphs) expect(lore, p).toContain(p);
    expect(lore.some((l) => l.includes(`R-10 · ${vigilScene.title}`))).toBe(true);
    expect(lore.some((l) => l.includes(rememberingShelfEntries.later.blurb))).toBe(true);
  });

  it('says none of the Sent’s names and uses no avoid-list word', () => {
    const text = vigilScene.paragraphs.join('\n');
    for (const r of roll) expect(text, r.name).not.toContain(r.name);
    expect(text).not.toMatch(
      /\b(ash|ashen|ashes|cinders?|kindled?|tithe|bonfire|throne|souls?|fed|feeding)\b/i,
    );
  });
});
