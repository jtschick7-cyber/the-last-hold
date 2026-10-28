// Plan TD.3 (GDD §8.3, D560): The Unlit's definition equals the GDD row; its Health reads the balance
// key; it is flagged descentOnly and sits in no id list.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { balance } from '../../src/content/balance';
import { monsters, unlit } from '../../src/content/monsters';

const gdd = readFileSync(new URL('../../docs/gdd.md', import.meta.url), 'utf8');
const row = gdd.split('\n').find((l) => l.startsWith('| The Unlit *(v1.4)* |')) ?? '';
const abilityRow = gdd.split('\n').find((l) => l.startsWith('| The Unlit | *First Cold:*')) ?? '';

describe('The Unlit (GDD §8.3)', () => {
  it('has the stats of the table row', () => {
    expect(row).toContain('| 5+ (base 5) |');
    expect(row).toContain('| 42 | 12 | 10 | 1 |');
    expect(unlit).toMatchObject({
      id: 'unlit',
      name: 'The Unlit',
      family: 'deep',
      baseTier: 5,
      might: 42,
      armor: 12,
      speed: 10,
      attacks: 1,
      descentOnly: true,
    });
  });

  it('reads its Health from descent.unlitBaseHealth', () => {
    expect(unlit.health).toBe(balance.descent.unlitBaseHealth.value);
  });

  it('has the resistances 0.75 / 1.25 / 1.5 / 0 / 1.5 / 0', () => {
    expect(unlit.resist).toEqual({
      steel: 0.75,
      silver: 1.25,
      fire: 1.5,
      frost: 0,
      rune: 1.5,
      venom: 0,
    });
  });

  it('has First Cold and Heavy Dark with Chill, as the GDD words them', () => {
    expect(abilityRow).toContain('3% of max Health as Frost damage');
    expect(abilityRow).toContain('turn meter knocked back 15');
    expect(abilityRow).toContain('every 3rd action');
    expect(abilityRow).toContain('50%');
    expect(abilityRow).toContain('next 2 actions');
    expect(unlit.abilities).toEqual([
      {
        kind: 'firstCold',
        name: 'First Cold',
        maxHealthFraction: 0.03,
        meterKnockBack: 15,
        smokeLungedFactor: 0.5,
      },
      {
        kind: 'heavyDark',
        name: 'Heavy Dark',
        every: 3,
        chill: { healingLoss: 0.5, actions: 2 },
      },
    ]);
    expect(unlit.saltburstBlockActions).toBe(3);
  });

  it('has the Great Beasts shelf lines word for word', () => {
    expect(abilityRow).toContain(unlit.whatItWas);
    expect(abilityRow).toContain(unlit.blurb);
  });

  it('is not one of the bestiary species', () => {
    expect(Object.keys(monsters)).not.toContain('unlit');
  });
});
