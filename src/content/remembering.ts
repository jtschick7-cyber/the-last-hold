import type { MonsterId } from './monsters';

// GDD §5.15.1 (D449, D461 (6)): the species the Remembering's gate counts. They are the 16 species
// that appear in contracts (the twelve monsters and the four Cursed); the base Last Stand pool is
// exactly these (GDD §5.9.3, §8.3.1), so there is no stand-only species. Not counted: the Great
// Beasts, hunt quarries, Delve-only species and the Dross-Tide (lore §8, D363, D365).
// A content test pins this list; changing it needs a decisions row.
export const CONTRACT_SPECIES: readonly MonsterId[] = [
  'wolf',
  'kikimora',
  'upyr',
  'rusalka',
  'poludnitsa',
  'vodyanoy',
  'draugr',
  'bies',
  'leshy',
  'strzyga',
  'huldra',
  'nix',
  'gloam-moths',
  'ribbonshade',
  'anvil-wight',
  'rimewrought',
];
