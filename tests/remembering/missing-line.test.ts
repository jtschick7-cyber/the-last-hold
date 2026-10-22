// v1.0 (D493, owner's answer to Q46 (c)): the Remembering card names the contract species the
// warden has met but not yet Studied, in one plain line, while the ending is not open.
import { describe, expect, it } from 'vitest';
import { CONTRACT_SPECIES } from '../../src/content/remembering';
import { creaturesMissingLine } from '../../src/content/text/remembering';
import type { CycleRecord, GameState } from '../../src/core/state/game-state';
import { createNewGame } from '../../src/core/state/new-game';
import { freshAct } from '../../src/core/state/story-state';
import { rememberingCardView } from '../../src/core/story/remembering-view';

const T0 = Date.UTC(2026, 9, 21, 8);
const seen = (): GameState => {
  const s = createNewGame('missing', T0);
  s.story.acts.push(freshAct(6, 1, T0));
  const c = s.cycles[0];
  if (!c) throw new Error('no cycle');
  c.stand = {} as CycleRecord['stand'];
  s.remembering.nearSeen = true;
  return s;
};

describe('the missing-species line on the Remembering card', () => {
  it('says what the line says, word for word', () => {
    expect(creaturesMissingLine(['Draugr', 'Leshy'])).toBe('Not yet known well: Draugr, Leshy.');
  });

  it('is absent when no species has been met and not yet Studied', () => {
    expect(rememberingCardView(seen())?.missing).toBeNull();
  });

  it('names the species met (Identified or better) and not yet Studied, in the Bestiary order', () => {
    const s = seen();
    s.bestiary.leshy = { level: 2, kills: 1 };
    s.bestiary.draugr = { level: 2, kills: 0 };
    s.bestiary.wolf = { level: 4, kills: 90 }; // Studied: not named
    s.bestiary.strzyga = { level: 1, kills: 0 }; // not yet Identified: not named
    expect(rememberingCardView(s)?.missing).toBe('Not yet known well: Draugr, Leshy.');
  });

  it('leaves the counts unchanged and is gone once every species is Studied (the card is open)', () => {
    const s = seen();
    s.bestiary.nix = { level: 3, kills: 4 };
    expect(rememberingCardView(s)?.counts).toHaveLength(2);
    for (const m of CONTRACT_SPECIES) s.bestiary[m] = { level: 3, kills: 4 };
    s.story.names = Array.from({ length: 40 }, (_, i) => ({ n: i + 1, cycle: 1, at: T0 }));
    const v = rememberingCardView(s);
    expect(v?.form).toBe('open');
    expect(v?.missing).toBeNull();
  });

  it('is never worked out for the forms after a choice', () => {
    const s = seen();
    s.bestiary.leshy = { level: 2, kills: 1 };
    s.remembering.endings.push({ ending: 'vigil' } as GameState['remembering']['endings'][number]);
    expect(rememberingCardView(s)?.missing).toBeNull();
  });
});
