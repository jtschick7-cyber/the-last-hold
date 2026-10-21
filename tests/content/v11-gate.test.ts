// Plan T11.2 (GDD §5.15.1, §5.15.7, lore §8, D458, D461 (6)): the content tests behind the
// Remembering's gate. Every one of the 40 names and every contract species has a source that is not
// an Order, a Delve or an event; the contract-species list is pinned; the base stand pool equals it.
import { describe, expect, it } from 'vitest';
import { BOSS_IDS } from '../../src/content/great-beasts';
import { GUARDIAN_IDS } from '../../src/content/delves/guardians';
import { LOCATION_IDS } from '../../src/content/damage';
import { MONSTER_IDS, monsters, type MonsterId } from '../../src/content/monsters';
import { CONTRACT_SPECIES } from '../../src/content/remembering';
import { QUARRY_IDS } from '../../src/content/hunts';
import { CHAPTERS } from '../../src/content/orders-chapters';
import { allDocuments } from '../../src/content/story/acts';
import { letters } from '../../src/content/story/letters';
import { roll } from '../../src/content/story/roll';
import { candidatesFor } from '../../src/core/contracts/candidates';
import { DROSS_TIDE, speciesForTier } from '../../src/core/stand/waves';

/** Where a requirement can come from. Only the first three are open to every player (lore §8). */
type Source = 'contract' | 'rank' | 'letter' | 'order' | 'delve' | 'event';
const FREE: readonly Source[] = ['contract', 'rank', 'letter'];
const hasFreeSource = (sources: readonly Source[]): boolean =>
  sources.some((s) => FREE.includes(s));

/** The sources a species has, read from the content that makes it appear. */
const speciesSources = (id: MonsterId): Source[] => {
  const m = monsters[id];
  const inContracts = m.locations.some((loc) =>
    Array.from({ length: m.tiers[1] - m.tiers[0] + 1 }, (_, i) => m.tiers[0] + i).some((tier) =>
      candidatesFor(loc, tier).includes(id),
    ),
  );
  return inContracts ? ['contract'] : [];
};

/** The sources a name has: the free ones its roll entry names, plus any Order, Delve or event carrier. */
const nameSources = (n: number): Source[] => {
  const r = roll.find((x) => x.n === n);
  if (!r) return [];
  const out: Source[] = [];
  if (r.source.kind === 'document') out.push('contract');
  if (r.source.kind === 'ribbonshade') out.push('contract');
  if (r.source.kind === 'letter') out.push('letter');
  if (r.source.kind === 'confession') out.push('contract');
  if (r.source.kind === 'laterAct') out.push('rank');
  return out;
};

describe('the contract-species list (D461 (6))', () => {
  it('is pinned: the sixteen species of the contracts; changing it needs a decisions row', () => {
    expect([...CONTRACT_SPECIES].sort()).toEqual(
      [
        'anvil-wight',
        'bies',
        'draugr',
        'gloam-moths',
        'huldra',
        'kikimora',
        'leshy',
        'nix',
        'poludnitsa',
        'rimewrought',
        'ribbonshade',
        'rusalka',
        'strzyga',
        'upyr',
        'vodyanoy',
        'wolf',
      ].sort(),
    );
    expect(new Set(CONTRACT_SPECIES).size).toBe(16);
  });

  it('equals every species a contract can name', () => {
    const named = new Set<MonsterId>();
    for (const loc of LOCATION_IDS)
      for (let t = 1; t <= 5; t++) candidatesFor(loc, t).forEach((m) => named.add(m));
    expect([...named].sort()).toEqual([...CONTRACT_SPECIES].sort());
    expect([...MONSTER_IDS].sort()).toEqual([...CONTRACT_SPECIES].sort());
  });

  it('equals the base Last Stand pool: there is no stand-only species (Q39, closed)', () => {
    const pool = new Set<string>();
    for (let tier = 1; tier <= 12; tier++) speciesForTier(tier).forEach((m) => pool.add(m));
    expect([...pool].sort()).toEqual([...CONTRACT_SPECIES].sort());
  });

  it('leaves out the Great Beasts, the quarries, the Delve guardians and the Dross-Tide', () => {
    for (const id of [...BOSS_IDS, ...QUARRY_IDS, ...GUARDIAN_IDS, DROSS_TIDE])
      expect(CONTRACT_SPECIES as readonly string[], id).not.toContain(id);
  });
});

describe('no requirement is Order-only, Delve-only or event-only (lore §8, D458)', () => {
  it('every contract species has a contract source', () => {
    for (const id of CONTRACT_SPECIES) expect(hasFreeSource(speciesSources(id)), id).toBe(true);
  });

  it('every one of the 40 names has a source that is not an Order, a Delve or an event', () => {
    for (let n = 1; n <= 40; n++) expect(hasFreeSource(nameSources(n)), `#${n}`).toBe(true);
  });

  it('no Order chapter carries a name or a document', () => {
    for (const c of CHAPTERS as readonly object[])
      expect(Object.keys(c)).not.toEqual(expect.arrayContaining(['names']));
    const carriers = [...allDocuments.filter((d) => d.names.length > 0)];
    expect(carriers.length).toBeGreaterThan(0);
    expect(letters.filter((l) => l.name !== undefined).length).toBeGreaterThan(0);
  });

  it('fails when a source is planted that only an Order, a Delve or an event gives', () => {
    expect(hasFreeSource(['order'])).toBe(false);
    expect(hasFreeSource(['delve', 'event'])).toBe(false);
    expect(hasFreeSource(['order', 'contract'])).toBe(true);
    expect(hasFreeSource([])).toBe(false);
  });
});
