// Plan T11.4 (GDD §5.15.2, §9.19, D450, D459 (6), D461 (4), D466 (1)): Pechko's near-scene, the quiet
// card and the ready line. The texts are lore §34.1 and §34.2, word for word.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CONTRACT_SPECIES } from '../../src/content/remembering';
import { roll, ROLL_SIZE } from '../../src/content/story/roll';
import {
  nearSceneClosed,
  nearSceneOpen,
  rememberingCard,
  rememberingReadyLine,
} from '../../src/content/text/remembering';
import { apply } from '../../src/core/commands';
import { levelOf } from '../../src/core/investigation/knowledge';
import type { CycleRecord, GameState } from '../../src/core/state/game-state';
import { createNewGame } from '../../src/core/state/new-game';
import { freshAct } from '../../src/core/state/story-state';
import { namesView } from '../../src/core/story/archive';
import {
  rememberingCardView,
  rememberingNearPending,
  rememberingNearScene,
  rememberingReadyNote,
} from '../../src/core/story/remembering-view';

const T0 = Date.UTC(2026, 9, 21, 8);

const afterStand = (s: GameState): GameState => {
  s.story.acts.push(freshAct(6, 1, T0));
  const c = s.cycles[0];
  if (!c) throw new Error('no cycle');
  c.stand = {} as CycleRecord['stand'];
  return s;
};
const withNames = (s: GameState, n: number): GameState => {
  s.story.names = Array.from({ length: n }, (_, i) => ({ n: i + 1, cycle: 1, at: T0 }));
  return s;
};
const studyAll = (s: GameState, species = CONTRACT_SPECIES): GameState => {
  for (const m of species) s.bestiary[m] = { level: 3, kills: 4 };
  return s;
};
const lore = readFileSync(new URL('../../docs/lore-secrets.md', import.meta.url), 'utf8')
  .split('\n')
  .map((l) =>
    l
      .replace(/^> ?/, '')
      .replace(/^\*(.*)\*$/, '$1')
      .trim(),
  );
const inLore = (text: string): boolean => lore.some((l) => l === text || l.endsWith(text));

describe('Pechko’s near-scene (R-01, R-02)', () => {
  it('waits for Act VI’s Last Stand result, then picks R-01 or R-02 by the gate', () => {
    const s = createNewGame('near', T0);
    expect(rememberingNearPending(s)).toBe(false);
    expect(rememberingNearScene(s)).toBeNull();
    afterStand(s);
    expect(rememberingNearScene(s)).toBe(nearSceneClosed);
    expect(nearSceneClosed.id).toBe('R-01');
    studyAll(withNames(s, ROLL_SIZE));
    expect(rememberingNearScene(s)).toBe(nearSceneOpen);
    expect(nearSceneOpen.id).toBe('R-02');
  });

  it('a save already past the stand has it waiting, once', () => {
    const s = afterStand(createNewGame('late', T0));
    expect(rememberingNearPending(s)).toBe(true);
    expect(apply(s, { type: 'remembering.seeNear' }, T0).ok).toBe(true);
    expect(s.remembering.nearSeen).toBe(true);
    expect(rememberingNearPending(s)).toBe(false);
    expect(rememberingNearScene(s)).toBeNull();
  });

  it('is not seen until Continue: leaving it with the ✕ sends no command and leaves it waiting', () => {
    const s = afterStand(createNewGame('x', T0));
    expect(s.remembering.nearSeen).toBe(false);
    expect(rememberingNearPending(s)).toBe(true);
  });

  it('seeNear is refused before Act VI’s stand, and is harmless twice', () => {
    const s = createNewGame('early', T0);
    expect(apply(s, { type: 'remembering.seeNear' }, T0).ok).toBe(false);
    expect(s.remembering.nearSeen).toBe(false);
    afterStand(s);
    expect(apply(s, { type: 'remembering.seeNear' }, T0).ok).toBe(true);
    expect(apply(s, { type: 'remembering.seeNear' }, T0).ok).toBe(true);
  });

  it('has no second scene when the gate opens later: only the card changes', () => {
    const s = afterStand(createNewGame('later', T0));
    apply(s, { type: 'remembering.seeNear' }, T0);
    studyAll(withNames(s, ROLL_SIZE));
    expect(rememberingNearScene(s)).toBeNull();
    expect(rememberingCardView(s)?.form).toBe('open');
  });
});

describe('the card', () => {
  const seen = (): GameState => {
    const s = afterStand(createNewGame('card', T0));
    s.remembering.nearSeen = true;
    return s;
  };

  it('is hidden until the scene has been seen', () => {
    expect(rememberingCardView(afterStand(createNewGame('hidden', T0)))).toBeNull();
    expect(rememberingCardView(createNewGame('hidden', T0))).toBeNull();
  });

  it('shows two live counts that equal the Names view and the contract species known well', () => {
    const s = studyAll(withNames(seen(), 17), CONTRACT_SPECIES.slice(0, 5));
    s.bestiary.nix = { level: 4, kills: 12 };
    s.bestiary.wolf = { level: 2, kills: 3 };
    const v = rememberingCardView(s);
    expect(v?.form).toBe('notOpen');
    const known = CONTRACT_SPECIES.filter((m) => levelOf(s, m) >= 3).length;
    expect(v?.counts).toEqual([`${namesView(s).title}.`, `Creatures known well: ${known} of 16.`]);
    expect(v?.counts[0]).toBe('Names found: 17 of 40.');
    expect(v?.counts[1]).toBe('Creatures known well: 5 of 16.');
  });

  it('has no bar, no percentage and no countdown in any text it can show', () => {
    const texts = JSON.stringify(rememberingCard);
    expect(texts).not.toMatch(/%|percent|countdown|remaining|left to go/i);
    const v = rememberingCardView(seen());
    expect(v?.counts.join(' ')).not.toMatch(/%/);
  });

  it('is open when the gate is, and the forms after a choice do not depend on it', () => {
    const s = studyAll(withNames(seen(), ROLL_SIZE));
    expect(rememberingCardView(s)?.form).toBe('open');
    s.remembering.endings = [{ ending: 'vigil', at: 1, cycle: 1 }];
    expect(rememberingCardView(s)?.form).toBe('afterVigil');
    s.bestiary = {};
    expect(rememberingCardView(s)?.form).toBe('afterVigil');
    s.remembering.endings.push({ ending: 'remember', at: 2, cycle: 1 });
    expect(rememberingCardView(s)?.form).toBe('afterRemember');
  });
});

describe('the ready line', () => {
  const ready = (): GameState => {
    const s = studyAll(withNames(afterStand(createNewGame('ready', T0)), ROLL_SIZE));
    s.remembering.nearSeen = true;
    return s;
  };

  it('is not there before the scene, or while the gate is closed', () => {
    const s = ready();
    s.remembering.nearSeen = false;
    expect(rememberingReadyNote(s)).toBeNull();
    const closed = ready();
    closed.story.names.pop();
    expect(rememberingReadyNote(closed)).toBeNull();
  });

  it('shows once, then never again', () => {
    const s = ready();
    expect(rememberingReadyNote(s)).toBe(rememberingReadyLine);
    expect(apply(s, { type: 'remembering.noteReady' }, T0).ok).toBe(true);
    expect(rememberingReadyNote(s)).toBeNull();
    expect(apply(s, { type: 'remembering.noteReady' }, T0).ok).toBe(false);
  });

  it('is refused when there is nothing to note, and gone once an ending is recorded', () => {
    const s = createNewGame('none', T0);
    expect(apply(s, { type: 'remembering.noteReady' }, T0).ok).toBe(false);
    const e = ready();
    e.remembering.endings = [{ ending: 'vigil', at: 1, cycle: 1 }];
    expect(rememberingReadyNote(e)).toBeNull();
  });
});

describe('the texts (lore §34.1, §34.2)', () => {
  const all = [
    ...nearSceneClosed.paragraphs,
    ...nearSceneOpen.paragraphs,
    rememberingReadyLine,
    rememberingCard.notOpen.near,
    rememberingCard.open.line,
    rememberingCard.open.remember.text,
    rememberingCard.open.vigil.text,
    rememberingCard.afterVigil.line,
    rememberingCard.afterRemember.line,
  ];

  it('are word for word as the lore has them', () => {
    for (const t of all) expect(inLore(t), t).toBe(true);
    expect(inLore(nearSceneClosed.title)).toBe(false); // titles are headings in the lore, not quotes
    expect(lore.some((l) => l.includes(`R-01 · ${nearSceneClosed.title}`))).toBe(true);
    expect(lore.some((l) => l.includes(`R-02 · ${nearSceneOpen.title}`))).toBe(true);
  });

  it('say, ask for and begin none of the Sent’s names, and use none of the forbidden phrases', () => {
    const joined = [...all, nearSceneClosed.title, nearSceneOpen.title].join('\n');
    for (const r of roll) expect(joined, r.name).not.toContain(r.name);
    expect(joined).not.toMatch(
      /say the names|speak the names|read the names|their names|the forty|the Sent|Sending|seal|Deep|Forge|Drowned Bell/i,
    );
  });
});
