// Plan T19.4 (decisions D632, D634; technical design §26.3):
// Strengthened 40-Riftglass alternate traits and Emberwright Plate (−25% Fire taken under
// rulesVersion >= 8 while keeping legacy rulesVersion <= 7 fights bit-for-bit at −10%).
import { describe, expect, it } from 'vitest';
import { alternateTraits } from '../../src/content/delves/alternate-traits';
import { gear } from '../../src/content/gear';
import { hunters } from '../../src/content/hunters';
import { runFight } from '../../src/core/combat';
import { buildHunter } from '../../src/core/combat/build';
import { hitChance, outgoingPct, type FightContext } from '../../src/core/combat/stats';
import { provisions } from '../../src/core/contracts/rewards';
import { baseText } from '../../src/core/systems/slot-picker';
import { keepRich } from '../contracts/helpers';
import { cyclic, lines, snap, sponge } from './helpers';

const ctx = (location: FightContext['location']): FightContext => ({
  location,
  family: 'restless-dead',
  monsterId: 'upyr',
  attacks: 1,
  hitCut: 0,
  oilBonus: 0.35,
});

describe('v1.9 strengthened 40-Riftglass alternate traits (D634, GDD §8.5a)', () => {
  it('Dipped Knife (Stanko): +30% Venom damage dealt (outgoing%)', () => {
    const def = alternateTraits.find((t) => t.id === 'dipped-knife');
    expect(def?.text).toBe('+30% Venom damage dealt (outgoing%)');
    expect(def?.effect).toEqual({ kind: 'damageType', type: 'venom', dealt: 0.3, taken: 0 });

    const stanko = buildHunter(snap('stanko', { traits: ['wolf-friend', 'dipped-knife'] }), 1);
    expect(outgoingPct(stanko, 'venom', ctx('field'))).toBeCloseTo(0.3, 9);
    expect(outgoingPct(stanko, 'steel', ctx('field'))).toBe(0);

    const plain = snap('stanko', { traits: [], base: { ...hunters.stanko.stats, speed: 30 } });
    const dipped = snap('stanko', {
      traits: ['dipped-knife'],
      base: { ...hunters.stanko.stats, speed: 30 },
    });
    const baseDealt =
      lines(
        runFight({
          party: [plain],
          monster: { monster: 'wolf', tier: 1 },
          location: 'field',
          rolls: cyclic([0.5]),
        }),
        'hit',
        'stanko',
      )[0]?.dealt ?? 0;
    const dippedDealt =
      lines(
        runFight({
          party: [dipped],
          monster: { monster: 'wolf', tier: 1 },
          location: 'field',
          rolls: cyclic([0.5]),
        }),
        'hit',
        'stanko',
      )[0]?.dealt ?? 0;
    expect(dippedDealt).toBeCloseTo(baseDealt * 1.3, 9);
  });

  it('Thrifty (Toma): −40% provisions on contracts he joins', () => {
    const def = alternateTraits.find((t) => t.id === 'thrifty');
    expect(def?.text).toBe('Provisions for contracts he joins −40%');
    expect(def?.effect).toEqual({ kind: 'provisionsMult', mult: 0.6 });

    const s = keepRich('v19-thrifty');
    s.delve.shop.traitsBought.push('toma');
    const plain = provisions(s, 3, 2, ['halvar', 'zora', 'toma']).value;
    s.delve.shop.traitsActive.push('toma');
    const thrifty = provisions(s, 3, 2, ['halvar', 'zora', 'toma']).value;
    expect(thrifty).toBeCloseTo(plain * 0.6, 6);
  });

  it('Rock-Footed (Herdis): +4 flat Armor', () => {
    const def = alternateTraits.find((t) => t.id === 'rock-footed');
    expect(def?.text).toBe('+4 Armor (flat)');
    expect(def?.effect).toEqual({ kind: 'armorFlat', amount: 4 });

    const h = buildHunter(snap('herdis', { traits: ['tracker', 'rock-footed'] }), 1);
    expect(h.flat.armor).toBe(4);
  });

  it('Fjord-born (Bjarna): +20% Might on river contracts', () => {
    const def = alternateTraits.find((t) => t.id === 'fjord-born');
    expect(def?.text).toBe('+20% Might on river contracts');
    expect(def?.effect).toEqual({ kind: 'mightOnLocation', location: 'river', amount: 0.2 });

    const b = buildHunter(snap('bjarna', { traits: ['cold-blooded', 'fjord-born'] }), 1);
    expect(outgoingPct(b, 'frost', ctx('river'))).toBeCloseTo(0.2, 9);
    expect(outgoingPct(b, 'frost', ctx('field'))).toBe(0);
  });

  it('Field-born (Vesna): +20% Might on field contracts', () => {
    const def = alternateTraits.find((t) => t.id === 'field-born');
    expect(def?.text).toBe('+20% Might on field contracts');
    expect(def?.effect).toEqual({ kind: 'mightOnLocation', location: 'field', amount: 0.2 });

    const v = buildHunter(snap('vesna', { traits: ['herbwise', 'field-born'] }), 1);
    expect(outgoingPct(v, 'fire', ctx('field'))).toBeCloseTo(0.2, 9);
    expect(outgoingPct(v, 'fire', ctx('river'))).toBe(0);
  });

  it('Forge-Eyed (Sigrun): +8 points party hit chance on ruin contracts', () => {
    const def = alternateTraits.find((t) => t.id === 'forge-eyed');
    expect(def?.text).toBe('Party hit chance +8 points on ruin contracts');
    expect(def?.effect).toEqual({ kind: 'partyHitOnLocation', location: 'ruin', amount: 0.08 });

    const sigrun = buildHunter(snap('sigrun', { traits: ['fire-touched', 'forge-eyed'] }), 1);
    const zora = buildHunter(snap('zora', { traits: [] }), 2);
    expect(hitChance(zora, [sigrun, zora], ctx('ruin'))).toBeCloseTo(0.98, 9);
    expect(hitChance(zora, [sigrun, zora], ctx('field'))).toBeCloseTo(0.9, 9);
  });
});

describe('Emberwright Plate dual rulesVersion Fire mitigation (D632, D634)', () => {
  it('sets fireTakenReduction to 0.25 in content and slot-picker base text', () => {
    expect(gear['emberwright-plate'].fireTakenReduction).toBe(0.25);
    expect(baseText(gear['emberwright-plate'])).toContain('−25% Fire taken');
  });

  it('applies −25% Fire taken under rulesVersion >= 8 and preserves −10% under rulesVersion <= 7', () => {
    const plated = sponge('halvar', {
      base: { health: 1000, might: 1, armor: 50, speed: 7 },
      armorGear: 'emberwright-plate',
    });
    expect(buildHunter(plated, 1, undefined, undefined, 8).fireTakenReduction).toBe(0.25);
    expect(buildHunter(plated, 1, undefined, undefined, 7).fireTakenReduction).toBe(0.1);
    expect(buildHunter(plated, 1, undefined, undefined, 5).fireTakenReduction).toBe(0.1);

    const v8 = runFight({
      party: [plated],
      monster: { monster: 'poludnitsa', tier: 2 },
      location: 'field',
      rolls: cyclic([0.5, 0.5, 0.9]),
      rulesVersion: 8,
    });
    const v7 = runFight({
      party: [plated],
      monster: { monster: 'poludnitsa', tier: 2 },
      location: 'field',
      rolls: cyclic([0.5, 0.5, 0.9]),
      rulesVersion: 7,
    });
    const v6 = runFight({
      party: [plated],
      monster: { monster: 'poludnitsa', tier: 2 },
      location: 'field',
      rolls: cyclic([0.5, 0.5, 0.9]),
      rulesVersion: 6,
    });
    expect(lines(v8, 'ability', 'poludnitsa')[0]?.amount).toBe(23); // 30 × 0.75 = 22.5 -> 23
    expect(lines(v7, 'ability', 'poludnitsa')[0]?.amount).toBe(27); // 30 × 0.90 = 27
    expect(lines(v6, 'ability', 'poludnitsa')[0]?.amount).toBe(27);
  });
});
