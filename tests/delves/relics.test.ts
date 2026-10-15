// Plan T7.11 (GDD §8.10a, §5.10.7, D20, D261–D263): the six Delve relics from either source, their
// effects only inside Delves, echoes on the first Faint / Warm / Bright per patron, and the Deep's
// knowledge kept apart from the bestiary.
import { describe, expect, it } from 'vitest';
import { echoes } from '../../src/content/delves/echoes';
import { DELVE_RELIC_IDS, delveRelics } from '../../src/content/delves/relics';
import { OPEN_PATRON_IDS } from '../../src/content/delves/patrons';
import { MONSTER_IDS, monsters } from '../../src/content/monsters';
import { INGREDIENT_IDS } from '../../src/content/ingredients';
import {
  grantIdleDelveRelics,
  noteBlessingTaken,
  recordDeepFight,
} from '../../src/core/delves/rewards';
import { recordFight } from '../../src/core/investigation/knowledge';
import { advance } from '../../src/core/sim/advance';
import type { GameState } from '../../src/core/state/game-state';
import { HOUR, T0, run } from '../contracts/helpers';
import { cmd, playRun, strongKeep } from './helpers';

const studyFamily = (s: GameState, family: string): void => {
  for (const m of MONSTER_IDS)
    if (monsters[m].family === family) s.bestiary[m] = { level: 3, kills: 4 };
};
const ids = (s: GameState) => s.delve.relics.map((r) => r.id);

describe('relics from the idle sources (D261)', () => {
  it('a family with every species Studied finds its relic, once, with no Delve', () => {
    const s = strongKeep('idle');
    expect(ids(s)).toEqual([]);
    studyFamily(s, 'restless-dead');
    grantIdleDelveRelics(s);
    expect(ids(s)).toEqual(['cold-iron-nail']);
    grantIdleDelveRelics(s);
    expect(ids(s)).toEqual(['cold-iron-nail']);
  });

  it('a family one species short finds nothing', () => {
    const s = strongKeep('short');
    const family = delveRelics['salt-ring'].idleSource;
    if (family.kind !== 'familyStudied') throw new Error('unexpected source');
    const members = MONSTER_IDS.filter((m) => monsters[m].family === family.family);
    for (const m of members.slice(1)) s.bestiary[m] = { level: 3, kills: 4 };
    grantIdleDelveRelics(s);
    expect(ids(s)).not.toContain('salt-ring');
  });

  it('is checked when a contract fight makes the last species Studied', () => {
    const s = strongKeep('event');
    studyFamily(s, 'cursed');
    const last = MONSTER_IDS.find((m) => monsters[m].family === 'cursed');
    if (!last) throw new Error('no cursed species');
    s.bestiary[last] = { level: 2, kills: 3 };
    expect(ids(s)).toEqual([]);
    recordFight(s, last, true);
    expect(ids(s)).toEqual(['salt-ring']);
  });

  it('the recipe book complete finds the Horn Spoon', () => {
    const s = strongKeep('book');
    for (const i of INGREDIENT_IDS) s.book.properties[i] = [0, 1, 2];
    grantIdleDelveRelics(s);
    expect(ids(s)).toEqual(['horn-spoon']);
  });

  it('a run that starts after the sources were met finds the relic then', () => {
    const s = strongKeep('before');
    studyFamily(s, 'water-spirits');
    expect(cmd(s, { type: 'delve.start', party: ['halvar', 'zora', 'ostap'] }).ok).toBe(true);
    expect(ids(s)).toEqual(['rift-lantern']);
  });
});

describe('relics from the Delves (D261)', () => {
  it('the first guardian beaten in a run from the Keep finds the Spindle Whorl, once', () => {
    const s = strongKeep('whole');
    cmd(s, { type: 'delve.start', party: ['halvar', 'zora', 'ostap'] });
    playRun(s);
    const r = s.delve.result;
    expect(r?.guardianBeaten).toBe(true);
    expect(ids(s)).toContain('spindle-whorl');
    expect(r?.relics).toContain('spindle-whorl');
  });

  it('a relic already owned from the idle source is not found twice', () => {
    const s = strongKeep('whole');
    s.delve.relics.push({ id: 'spindle-whorl', cycle: 1 });
    cmd(s, { type: 'delve.start', party: ['halvar', 'zora', 'ostap'] });
    playRun(s);
    expect(ids(s).filter((x) => x === 'spindle-whorl')).toHaveLength(1);
    expect(s.delve.result?.relics).not.toContain('spindle-whorl');
  });

  it('every relic has a Delve source and an idle source of its own', () => {
    const delve = new Set(DELVE_RELIC_IDS.map((r) => JSON.stringify(delveRelics[r].delveSource)));
    const idle = new Set(DELVE_RELIC_IDS.map((r) => JSON.stringify(delveRelics[r].idleSource)));
    expect(delve.size).toBe(6);
    expect(idle.size).toBe(6);
  });
});

describe('relics work only inside Delves (D261)', () => {
  const withRelics = (s: GameState): GameState => {
    for (const id of DELVE_RELIC_IDS) s.delve.relics.push({ id, cycle: 1 });
    return s;
  };
  const contract = (s: GameState): void => {
    s.board.open = [
      {
        id: 'a',
        village: 'velkvik',
        monster: 'nix',
        tier: 3,
        location: 'river',
        arrivedAt: T0,
        revealed: 3,
      },
    ];
    expect(
      run(s, { type: 'contract.launch', contract: 'a', party: ['halvar', 'zora', 'ostap'] }).ok,
    ).toBe(true);
  };
  const stripRelics = (s: GameState): unknown => {
    const c = JSON.parse(JSON.stringify(s)) as GameState;
    c.delve.relics = [];
    return c;
  };

  it('a contract fight comes out the same with all six owned', () => {
    const plain = strongKeep('same');
    const rich = withRelics(strongKeep('same'));
    contract(plain);
    contract(rich);
    advance(plain, plain.time + 12 * HOUR);
    advance(rich, rich.time + 12 * HOUR);
    expect(plain.running).toHaveLength(0);
    expect(plain.stats.kills).not.toEqual({});
    expect(stripRelics(rich)).toEqual(stripRelics(plain));
  });

  it('the Last Stand comes out the same with all six owned', () => {
    const make = (own: boolean): GameState => {
      const s = strongKeep('stand-same', 'bastion');
      if (own) withRelics(s);
      s.buildings.walls = 6;
      expect(
        run(s, {
          type: 'stand.make',
          party: ['halvar', 'zora', 'ostap'],
          prep: { oils: {}, potions: {} },
        }).ok,
      ).toBe(true);
      return s;
    };
    const a = make(false);
    const b = make(true);
    const stand = (s: GameState) => s.cycles.find((c) => c.stand)?.stand;
    expect(stand(b)).toBeDefined();
    expect(stand(b)).toEqual(stand(a));
  });
});

describe('echoes (D263)', () => {
  it('the first Faint, Warm and Bright of each patron finds one echo each, never twice', () => {
    const s = strongKeep('echo');
    for (const patron of OPEN_PATRON_IDS) {
      for (const rarity of ['faint', 'warm', 'bright'] as const) {
        const found = noteBlessingTaken(s, patron, rarity, null);
        const def = echoes.find((e) => e.patron === patron && e.rarity === rarity);
        expect(def).toBeDefined();
        expect(found).toBe(def?.id);
        expect(noteBlessingTaken(s, patron, rarity, null)).toBeNull();
      }
    }
    expect(s.delve.echoes).toHaveLength(OPEN_PATRON_IDS.length * 3);
  });

  it('a run records the echoes it found', () => {
    const s = strongKeep('echo-run');
    cmd(s, { type: 'delve.start', party: ['halvar', 'zora', 'ostap'] });
    playRun(s);
    expect(s.delve.echoes.length).toBeGreaterThan(0);
    expect(s.delve.result?.echoes.length).toBe(s.delve.echoes.length);
  });
});

describe('the Deep bestiary (GDD §5.6.2, D262)', () => {
  it('guardian fights teach the Deep species, apart from the contract bestiary', () => {
    const s = strongKeep('deep');
    const before = JSON.stringify(s.bestiary);
    const levels = s.story;
    for (let i = 0; i < 4; i++) recordDeepFight(s, 'dross-tide', true);
    expect(s.delve.deep['dross-tide']).toEqual({ level: 3, kills: 4 });
    for (let i = 0; i < 6; i++) recordDeepFight(s, 'dross-tide', true);
    expect(s.delve.deep['dross-tide']?.level).toBe(4);
    recordDeepFight(s, 'the-forgotten', false);
    expect(s.delve.deep['the-forgotten']).toEqual({ level: 2, kills: 0 });
    expect(JSON.stringify(s.bestiary)).toBe(before);
    expect(s.story).toBe(levels);
  });

  it('a whole run leaves the contract bestiary and the Studied/Mastered counts as they were', () => {
    const s = strongKeep('whole');
    const before = JSON.stringify(s.bestiary);
    cmd(s, { type: 'delve.start', party: ['halvar', 'zora', 'ostap'] });
    playRun(s);
    expect(Object.keys(s.delve.deep).length).toBeGreaterThan(0);
    expect(JSON.stringify(s.bestiary)).toBe(before);
  });
});
