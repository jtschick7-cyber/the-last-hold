// Plan T2.18: the Suggested party (GDD §6.5, §5.4.1).
import { describe, expect, it } from 'vitest';
import { maxPartySize } from '../../src/core/contracts/party';
import { computeOdds } from '../../src/core/contracts/odds';
import { legalParties, suggestParty } from '../../src/core/contracts/suggest';
import { snap } from '../combat/helpers';

describe('party size (GDD §5.4.1)', () => {
  it('tiers 1–3 allow 3, tiers 4–5 allow 4, and Hamlet allows at most 2', () => {
    expect([1, 2, 3, 4, 5].map((t) => maxPartySize(t, 'keep'))).toEqual([3, 3, 3, 4, 4]);
    expect([1, 2, 3].map((t) => maxPartySize(t, 'hamlet'))).toEqual([2, 2, 2]);
  });
});

describe('legal parties', () => {
  const five = (['halvar', 'zora', 'ostap', 'bjarna', 'radek'] as const).map((id) => snap(id));

  it('are every non-empty selection up to the size cap, in roster order', () => {
    expect(legalParties(five, 3)).toHaveLength(5 + 10 + 10);
    expect(legalParties(five, 4)).toHaveLength(5 + 10 + 10 + 5);
    expect(legalParties(five, 2)).toHaveLength(15);
    const first = legalParties(five, 2)[0];
    expect(first?.map((h) => h.id)).toEqual(['halvar']);
    for (const p of legalParties(five, 3)) {
      const idx = p.map((h) => five.findIndex((f) => f.id === h.id));
      expect([...idx].sort((a, b) => a - b)).toEqual(idx);
    }
  });
});

describe('suggestParty', () => {
  const available = (['halvar', 'zora', 'ostap', 'bjarna'] as const).map((id) => snap(id));
  const base = {
    gameSeed: 'seed',
    contractId: 'c1',
    available,
    monster: { monster: 'upyr' as const, tier: 2 },
    location: 'field' as const,
    rank: 'keep' as const,
    maxParty: 3,
  };

  it('returns a legal party with its full 500-sample odds', () => {
    const s = suggestParty(base);
    expect(s).not.toBeNull();
    expect(s?.party.length).toBeGreaterThan(0);
    expect(s?.party.length).toBeLessThanOrEqual(3);
    expect(s?.odds.samples).toBe(500);
    expect(s?.considered).toBe(4 + 6 + 4);
  });

  it('is reproducible and never worse than the plain first-three', () => {
    const a = suggestParty(base);
    expect(suggestParty(base)).toEqual(a);
    const naive = legalParties(available, 3).find((p) => p.length === 3);
    expect(naive).toBeDefined();
    // The suggestion's stage-2 odds are at least as good as most parties; compare to a weak party.
    const weak = suggestParty({ ...base, available: [available[1] as never] });
    expect(weak?.party).toHaveLength(1);
    expect((a?.odds.winChance ?? 0) + 1e-9).toBeGreaterThanOrEqual(0.5);
  });

  it('with nobody free there is no suggestion', () => {
    expect(suggestParty({ ...base, available: [] })).toBeNull();
  });

  it('prefers the smaller party when the odds tie', () => {
    // Against an easy monster every party wins every sample, so a lone hunter is as good and cheaper.
    const easy = suggestParty({ ...base, monster: { monster: 'kikimora' as const, tier: 1 } });
    expect(easy?.party).toHaveLength(1);
  });

  it('forwards input.prep consistently through Stage 2 finalist ranking and final odds', () => {
    // Bare Zora beats bare Halvar vs tier-2 Kikimora; giving Halvar oil + potion flips Stage 2 to Halvar.
    const two = (['halvar', 'zora'] as const).map((id) => snap(id, { traits: [], level: 1 }));
    const prep = {
      oils: { halvar: 'thornbane-oil' as const },
      potions: { halvar: 'hardwood-tonic' as const },
      bombs: ['fire-pot' as const],
    };
    const hunterPrepOnly = {
      oils: { halvar: 'thornbane-oil' as const },
      potions: { halvar: 'hardwood-tonic' as const },
      bombs: [],
    };
    const tough = {
      gameSeed: 'prep-suggest',
      contractId: 'c-prep',
      available: two,
      monster: { monster: 'kikimora' as const, tier: 2 },
      location: 'field' as const,
      rank: 'keep' as const,
      maxParty: 1,
      prep,
      alchemy: 4,
    };
    const barePick = suggestParty({ ...tough, prep: undefined });
    const hunterPicked = suggestParty({ ...tough, prep: hunterPrepOnly });
    const picked = suggestParty(tough);
    expect(picked).not.toBeNull();
    if (!picked) return;
    // Returned odds (with oils, potions, bombs) must equal computeOdds with the same input.prep.
    const withPrep = computeOdds({
      gameSeed: tough.gameSeed,
      contractId: tough.contractId,
      party: picked.party,
      monster: tough.monster,
      location: tough.location,
      rank: tough.rank,
      prep,
      alchemy: tough.alchemy,
    });
    const withoutPrep = computeOdds({
      gameSeed: tough.gameSeed,
      contractId: tough.contractId,
      party: picked.party,
      monster: tough.monster,
      location: tough.location,
      rank: tough.rank,
      alchemy: tough.alchemy,
    });
    expect(picked.odds.winChance).toBe(withPrep.winChance);
    expect(picked.odds.why).toEqual(withPrep.why);
    expect(picked.odds.winChance).toBeGreaterThan(withoutPrep.winChance);
    expect(barePick?.party.map((h) => h.id)).toEqual(['zora']);
    expect(hunterPicked?.party.map((h) => h.id)).toEqual(['halvar']);
  });
});
