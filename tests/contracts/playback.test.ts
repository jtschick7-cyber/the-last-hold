// v1.7 (plan VB.3, D606, D607): read-only contract fight playback view and zero-math Arena step callouts.
import { describe, expect, it } from 'vitest';
import {
  hunterPortraitId,
  hunterSpriteId,
  monsterPortraitId,
  monsterSpriteId,
} from '../../src/content/assets';
import { contractPlayback, findFight, replayFight } from '../../src/core/contracts/playback';
import { playbackSteps, type FloorCombatant } from '../../src/core/delves/view';
import { OLDER_RULES_NOTE } from '../../src/core/replay-check';
import { advance } from '../../src/core/sim';
import type { ContractInstance, FightRef } from '../../src/core/state/game-state';
import { HOUR, hamletWithMine, keepRich, run } from './helpers';

const addContract = (
  s: ReturnType<typeof hamletWithMine>,
  over: Partial<ContractInstance> = {},
): ContractInstance => {
  const c: ContractInstance = {
    id: `watch-${s.board.open.length}-${over.monster ?? 'wolf'}-${over.tier ?? 1}`,
    village: 'mirograd',
    monster: 'wolf',
    tier: 1,
    location: 'field',
    arrivedAt: s.time,
    revealed: 3,
    ...over,
  };
  s.board.open.push(c);
  return c;
};

describe('contractPlayback and findFight (GDD §9.4, technical design §24.2)', () => {
  it('finds a kept contract fight by id and returns undefined once evicted or unknown', () => {
    const s = keepRich('watch-find');
    const c = addContract(s, { monster: 'wolf', tier: 2 });
    expect(findFight(s, c.id)).toBeUndefined();
    expect(run(s, { type: 'contract.launch', contract: c.id, party: ['halvar', 'zora'] }).ok).toBe(
      true,
    );
    advance(s, s.time + 4 * HOUR);
    const ref = findFight(s, c.id);
    expect(ref?.contractId).toBe(c.id);
    expect(findFight(s, 'missing-contract')).toBeUndefined();

    s.log.recentFights = [];
    expect(findFight(s, c.id)).toBeUndefined();
  });

  it('builds a deterministic, read-only FloorPlayback matching replayFight line for line', () => {
    const s = keepRich('watch-pb');
    const c = addContract(s, { monster: 'bies', tier: 3 });
    expect(
      run(s, { type: 'contract.launch', contract: c.id, party: ['halvar', 'zora', 'ostap'] }).ok,
    ).toBe(true);
    advance(s, s.time + 6 * HOUR);
    const ref = findFight(s, c.id);
    if (!ref) throw new Error('expected recent fight ref');

    const stateBefore = JSON.stringify(s);
    const refBefore = JSON.stringify(ref);
    const pb = contractPlayback(s, ref);
    expect(JSON.stringify(s)).toBe(stateBefore);
    expect(JSON.stringify(ref)).toBe(refBefore);

    expect(pb.title).toBe('Bies · T3');
    expect(pb.floor).toBe(0);
    expect(pb.guardian).toBe(false);
    expect(pb.differs).toBe(false);
    expect(pb.olderNote).toBeNull();

    const direct = replayFight(ref);
    expect(pb.result).toBe(direct.result);
    expect(pb.log).toEqual(direct.log.map((l) => ({ tick: l.tick, text: l.text })));
    expect(pb.steps).toHaveLength(direct.log.length);

    expect(pb.combatants.filter((x) => x.side === 'hunter')).toEqual([
      {
        id: 'halvar',
        name: 'Halvar',
        side: 'hunter',
        spriteId: hunterSpriteId('halvar'),
        portraitId: hunterPortraitId('halvar'),
        start: 1,
      },
      {
        id: 'zora',
        name: 'Zora',
        side: 'hunter',
        spriteId: hunterSpriteId('zora'),
        portraitId: hunterPortraitId('zora'),
        start: 1,
      },
      {
        id: 'ostap',
        name: 'Ostap',
        side: 'hunter',
        spriteId: hunterSpriteId('ostap'),
        portraitId: hunterPortraitId('ostap'),
        start: 1,
      },
    ]);
    const foes = pb.combatants.filter((x) => x.side === 'monster');
    expect(foes).toHaveLength(1);
    expect(foes[0]).toMatchObject({
      side: 'monster',
      spriteId: monsterSpriteId('bies'),
      portraitId: monsterPortraitId('bies'),
      start: 1,
    });

    // Later hunter level-ups never change a frozen contract playback.
    if (s.hunters.halvar) s.hunters.halvar.level = 10;
    expect(contractPlayback(s, ref)).toEqual(pb);
  });

  it('flags differs and exposes OLDER_RULES_NOTE when the recorded result disagrees with replay', () => {
    const s = hamletWithMine('watch-diff');
    const c = addContract(s, { monster: 'wolf', tier: 1 });
    expect(run(s, { type: 'contract.launch', contract: c.id, party: ['halvar', 'zora'] }).ok).toBe(
      true,
    );
    advance(s, s.time + 2 * HOUR);
    const ref = findFight(s, c.id);
    if (!ref) throw new Error('expected fight ref');

    const flipped: FightRef = {
      ...ref,
      rulesVersion: 1,
      result: ref.result === 'win' ? 'loss' : 'win',
    };
    const pb = contractPlayback(s, flipped);
    expect(pb.differs).toBe(true);
    expect(pb.olderNote).toBe(OLDER_RULES_NOTE);
  });

  it('rejects an event fight reference passed to contractPlayback', () => {
    const s = hamletWithMine('watch-err');
    const c = addContract(s);
    run(s, { type: 'contract.launch', contract: c.id, party: ['halvar', 'zora'] });
    advance(s, s.time + 2 * HOUR);
    const ref = findFight(s, c.id);
    if (!ref) throw new Error('expected fight ref');
    const eventRef: FightRef = {
      ...ref,
      monster: { event: 'lindworm-of-velk-fjord', tier: 4 },
    };
    expect(() => contractPlayback(s, eventRef)).toThrow(/contract fight/i);
  });
});

describe('playbackSteps zero-math step callouts (GDD §9.15, D607, D610)', () => {
  const combatants: readonly FloorCombatant[] = [
    {
      id: 'halvar',
      name: 'Halvar',
      side: 'hunter',
      spriteId: 'sprite.hunter.halvar',
      portraitId: 'portrait.hunter.halvar',
      start: 1,
    },
    {
      id: 'wolf',
      name: 'Gaunt Wolf',
      side: 'monster',
      spriteId: 'sprite.monster.wolf',
      portraitId: 'portrait.monster.wolf',
      start: 1,
    },
  ];

  it('derives -{n}, ★ -{n}, +{n}, and MISS directly from LogEntry without UI math', () => {
    const { steps } = playbackSteps(
      {
        hunters: [{ id: 'halvar', health: 75, maxHealth: 100, downed: false }],
        monsters: [{ id: 'wolf', name: 'Gaunt Wolf', health: 49, maxHealth: 100 }],
        log: [
          {
            tick: 1,
            actor: 'halvar',
            target: 'wolf',
            kind: 'hit',
            text: 'Halvar hits the Gaunt Wolf',
            rolls: [],
            amount: 19,
            targetHealth: 81,
          },
          {
            tick: 2,
            actor: 'halvar',
            target: 'wolf',
            kind: 'crit',
            text: 'Halvar crits the Gaunt Wolf',
            rolls: [],
            amount: 32,
            targetHealth: 49,
          },
          {
            tick: 3,
            actor: 'wolf',
            target: 'halvar',
            kind: 'miss',
            text: 'Gaunt Wolf misses Halvar',
            rolls: [],
            amount: 0,
            targetHealth: 61,
          },
          {
            tick: 4,
            actor: 'halvar',
            target: 'halvar',
            kind: 'heal',
            text: 'Halvar heals for 14',
            rolls: [],
            amount: 14,
            targetHealth: 75,
          },
          {
            tick: 5,
            actor: 'wolf',
            target: 'halvar',
            kind: 'ability',
            text: 'Gaunt Wolf leads Halvar astray',
            rolls: [],
          },
          {
            tick: 6,
            actor: 'wolf',
            kind: 'ability',
            text: 'Root-Wall mends it',
            rolls: [],
            amount: 8,
            targetHealth: 57,
          },
        ],
      },
      combatants,
    );

    expect(steps[0]?.callout).toEqual({ target: 'wolf', tone: 'hit', text: '-19' });
    expect(steps[1]?.callout).toEqual({ target: 'wolf', tone: 'crit', text: '★ -32' });
    expect(steps[2]?.callout).toEqual({ target: 'halvar', tone: 'miss', text: 'MISS' });
    expect(steps[3]?.callout).toEqual({ target: 'halvar', tone: 'heal', text: '+14' });
    expect(steps[4]?.callout).toBeUndefined();
    expect(steps[5]?.callout).toBeUndefined();
  });
});
