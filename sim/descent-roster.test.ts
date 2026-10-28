// Plan TD.8a (technical design §22.7, M5, M10): the two reference rosters the Descent probe uses.
import { describe, expect, it } from 'vitest';
import { HUNTER_IDS } from '../src/content/hunters';
import { INGREDIENT_IDS } from '../src/content/ingredients';
import { ORDER_IDS } from '../src/content/orders';
import { RELIC_IDS } from '../src/content/relics';
import { DELVE_RELIC_IDS } from '../src/content/delves/relics';
import { CONTRACT_SPECIES } from '../src/content/remembering';
import { SKILL_IDS } from '../src/content/skills';
import { num } from '../src/core/balance-access';
import { encodeSaveFile, loadEnvelope, makeEnvelope } from '../src/core/save';
import { createNewGame } from '../src/core/state/new-game';
import type { GameState } from '../src/core/state/game-state';
import { levelFor, maxSkillLevel } from '../src/core/skills/skills';
import { endingChoosable } from '../src/core/story/remembering';
import { descentAvailable, eligibleForDescent } from '../src/core/systems/descent-record';
import { buildEndgameRoster, ROSTER_PROFILES } from './descent-roster';

const fresh = (): GameState => createNewGame('descent-roster', 0);
const built = (p: (typeof ROSTER_PROFILES)[number]): GameState => {
  const s = fresh();
  buildEndgameRoster(s, p);
  return s;
};

describe('buildEndgameRoster', () => {
  it('names exactly the two profiles', () => {
    expect([...ROSTER_PROFILES]).toEqual(['minimal', 'maxed']);
  });

  for (const p of ROSTER_PROFILES) {
    it(`${p}: opens the gate, reaches Bastion and can start a Descent`, () => {
      const s = built(p);
      expect(endingChoosable(s)).toBe(true);
      expect(s.cycle.age).toBe('bastion');
      expect(descentAvailable(s)).toBe(true);
      expect(eligibleForDescent(s).length).toBeGreaterThan(0);
    });

    it(`${p}: is deterministic and a valid saved state`, () => {
      const a = built(p);
      expect(JSON.stringify(a)).toBe(JSON.stringify(built(p)));
      const again = loadEnvelope(JSON.parse(encodeSaveFile(makeEnvelope(a, a.time))));
      expect(again.ok).toBe(true);
    });

    it(`${p}: is idempotent`, () => {
      const s = built(p);
      const once = JSON.stringify(s);
      buildEndgameRoster(s, p);
      expect(JSON.stringify(s)).toBe(once);
    });
  }

  it('minimal: 16 species Studied, none Mastered, no chapters read', () => {
    const s = built('minimal');
    expect(CONTRACT_SPECIES).toHaveLength(16);
    for (const m of CONTRACT_SPECIES) {
      expect(s.bestiary[m]?.level).toBe(3);
      expect(s.bestiary[m]?.kills).toBe(num('knowledge.studiedKills'));
    }
    for (const o of ORDER_IDS) expect(s.orders.chaptersRead[o]).toBe(0);
  });

  it('minimal: leaves the natural roster, skills and relics alone', () => {
    const before = fresh();
    const s = built('minimal');
    for (const id of HUNTER_IDS) expect(s.hunters[id]?.rank).not.toBe('masterWright');
    expect(SKILL_IDS.every((k) => levelFor(s.skills[k]) === maxSkillLevel())).toBe(false);
    expect(s.relics).toEqual(before.relics);
    expect(s.delve.relics).toEqual(before.delve.relics);
  });

  it('maxed: the whole endgame', () => {
    const s = built('maxed');
    expect(HUNTER_IDS).toHaveLength(14);
    for (const id of HUNTER_IDS) {
      const h = s.hunters[id];
      expect(h?.level).toBe(num('rank.masterLevel'));
      expect(h?.rank).toBe('masterWright');
      expect(h?.stars).toBe(num('star.max'));
      expect(h?.talents).toHaveLength(5);
      expect(h?.weapon && h?.armor).toBeTruthy();
    }
    for (const m of CONTRACT_SPECIES)
      expect(s.bestiary[m]?.kills).toBeGreaterThanOrEqual(num('knowledge.masteredKills'));
    for (const m of CONTRACT_SPECIES) expect(s.bestiary[m]?.level).toBe(4);
    expect(INGREDIENT_IDS.length * 3).toBe(36);
    for (const i of INGREDIENT_IDS) expect(s.book.properties[i]).toEqual([0, 1, 2]);
    expect(SKILL_IDS.length * maxSkillLevel()).toBe(40);
    for (const k of SKILL_IDS) expect(levelFor(s.skills[k])).toBe(maxSkillLevel());
    for (const o of ORDER_IDS) expect(s.orders.chaptersRead[o]).toBe(num('orders.levels'));
    expect(ORDER_IDS.length * num('orders.levels')).toBe(16);
    expect(RELIC_IDS.every((r) => s.relics.some((x) => x.id === r))).toBe(true);
    expect(DELVE_RELIC_IDS.every((r) => s.delve.relics.some((x) => x.id === r))).toBe(true);
    expect(RELIC_IDS.length + DELVE_RELIC_IDS.length).toBe(12);
  });
});
