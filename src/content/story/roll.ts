import type { HunterId } from '../hunters';
import type { VillageId } from '../villages';

// lore-secrets §20 (D162): the forty names, one apprentice Sent every second
// spring from year 200 to 276, and Sigrun entered as the 40th for 278. Each has
// exactly one source (lore §8): act documents 28, Ribbonshades 6, hunter letters
// 5, Sigrun's confession 1. Acts III–VI aren't written yet; their names are fixed
// now and go into their documents when those acts are written (lore §20 note 5).

/** Where a name is found (GDD §5.14.4). */
export type NameSource =
  | { readonly kind: 'document'; readonly id: string }
  /** The nth Ribbonshade defeated carries it; the first is Jaro's (lore §20 note 1). */
  | { readonly kind: 'ribbonshade'; readonly order: number }
  /** A hunter's letter: slot 0 at the first of letters.levels, slot 1 at the second. */
  | { readonly kind: 'letter'; readonly hunter: HunterId | 'arvid'; readonly slot: 0 | 1 }
  /** Sigrun's own name, from her confession (counted apart from the act documents). */
  | { readonly kind: 'confession'; readonly id: string }
  /** A document of an act not yet written (Acts III–VI). */
  | { readonly kind: 'laterAct'; readonly act: number };

export interface RollName {
  /** Roll number, 1–40, in the order the Names view lists them. */
  readonly n: number;
  /** Year of the order. */
  readonly year: number;
  readonly name: string;
  readonly village: VillageId;
  readonly source: NameSource;
  /** Shown while the name is missing (lore §20). Never says what "onward" means. */
  readonly hint: string;
}

export const ROLL_SIZE = 40;

export const roll: readonly RollName[] = [
  {
    n: 1,
    year: 200,
    name: 'Milena Horská',
    village: 'mirograd',
    source: { kind: 'laterAct', act: 6 },
    hint: 'No one living remembers this one.',
  },
  {
    n: 2,
    year: 202,
    name: 'Ketil Ormsson',
    village: 'velkvik',
    source: { kind: 'laterAct', act: 6 },
    hint: 'No one living remembers this one.',
  },
  {
    n: 3,
    year: 204,
    name: 'Mirek Bárta',
    village: 'kozly-hollow',
    source: { kind: 'laterAct', act: 6 },
    hint: 'No one living remembers this one.',
  },
  {
    n: 4,
    year: 206,
    name: 'Hild Aslaugsdóttir',
    village: 'ravenfell',
    source: { kind: 'laterAct', act: 5 },
    hint: 'Letters went down. Not all of them were about the dark.',
  },
  {
    n: 5,
    year: 208,
    name: 'Radim Tkadlec',
    village: 'mirograd',
    source: { kind: 'laterAct', act: 5 },
    hint: 'Letters went down. Not all of them were about the dark.',
  },
  {
    n: 6,
    year: 210,
    name: 'Ragna Leifsdóttir',
    village: 'velkvik',
    source: { kind: 'laterAct', act: 5 },
    hint: 'Letters went down. Not all of them were about the dark.',
  },
  {
    n: 7,
    year: 212,
    name: 'Vít Brodský',
    village: 'dubno-ford',
    source: { kind: 'laterAct', act: 5 },
    hint: 'Letters went down. Not all of them were about the dark.',
  },
  {
    n: 8,
    year: 214,
    name: 'Danica Mlynářová',
    village: 'mirograd',
    source: { kind: 'document', id: 'D1-03' },
    hint: "The order's clerk kept a roll for every village.",
  },
  {
    n: 9,
    year: 216,
    name: 'Sten Ulfsson',
    village: 'ravenfell',
    source: { kind: 'document', id: 'D2-03' },
    hint: 'Cut into a beam, somewhere cold in the fells.',
  },
  {
    n: 10,
    year: 218,
    name: 'Eyvind Stensson',
    village: 'velkvik',
    source: { kind: 'document', id: 'D2-03' },
    hint: 'Cut into a beam, somewhere cold in the fells.',
  },
  {
    n: 11,
    year: 220,
    name: 'Vojtěch Sládek',
    village: 'mirograd',
    source: { kind: 'document', id: 'D2-03' },
    hint: 'Cut into a beam, somewhere cold in the fells.',
  },
  {
    n: 12,
    year: 222,
    name: 'Jarka Habrová',
    village: 'kozly-hollow',
    source: { kind: 'document', id: 'D2-03' },
    hint: 'Cut into a beam, somewhere cold in the fells.',
  },
  {
    n: 13,
    year: 224,
    name: 'Libor Kovář',
    village: 'mirograd',
    source: { kind: 'document', id: 'D1-03' },
    hint: "The order's clerk kept a roll for every village.",
  },
  {
    n: 14,
    year: 226,
    name: 'Asta Hallsdóttir',
    village: 'velkvik',
    source: { kind: 'document', id: 'D2-03' },
    hint: 'Cut into a beam, somewhere cold in the fells.',
  },
  {
    n: 15,
    year: 228,
    name: 'Signy Hrafnsdóttir',
    village: 'ravenfell',
    source: { kind: 'ribbonshade', order: 2 },
    hint: 'Something in an old forge still wears a ribbon.',
  },
  {
    n: 16,
    year: 230,
    name: 'Zdena Rybová',
    village: 'mirograd',
    source: { kind: 'ribbonshade', order: 3 },
    hint: 'Something in an old forge still wears a ribbon.',
  },
  {
    n: 17,
    year: 232,
    name: 'Pavel Lesák',
    village: 'kozly-hollow',
    source: { kind: 'ribbonshade', order: 4 },
    hint: 'Something in an old forge still wears a ribbon.',
  },
  {
    n: 18,
    year: 234,
    name: 'Kazimír Plachý',
    village: 'mirograd',
    source: { kind: 'document', id: 'D1-03' },
    hint: "The order's clerk kept a roll for every village.",
  },
  {
    n: 19,
    year: 236,
    name: 'Orm Ketilsson',
    village: 'velkvik',
    source: { kind: 'ribbonshade', order: 5 },
    hint: 'Something in an old forge still wears a ribbon.',
  },
  {
    n: 20,
    year: 238,
    name: 'Torgils Torkelsson',
    village: 'ravenfell',
    source: { kind: 'ribbonshade', order: 6 },
    hint: 'Something in an old forge still wears a ribbon.',
  },
  {
    n: 21,
    year: 240,
    name: 'Ludmila Hrubá',
    village: 'mirograd',
    source: { kind: 'laterAct', act: 4 },
    hint: 'Someone kept a second ledger.',
  },
  {
    n: 22,
    year: 242,
    name: 'Anežka Vrbová',
    village: 'kozly-hollow',
    source: { kind: 'laterAct', act: 4 },
    hint: 'Someone kept a second ledger.',
  },
  {
    n: 23,
    year: 244,
    name: 'Ondřej Vlček',
    village: 'mirograd',
    source: { kind: 'document', id: 'D1-03' },
    hint: "The order's clerk kept a roll for every village.",
  },
  {
    n: 24,
    year: 246,
    name: 'Brynja Torsdóttir',
    village: 'velkvik',
    source: { kind: 'laterAct', act: 4 },
    hint: 'Someone kept a second ledger.',
  },
  {
    n: 25,
    year: 248,
    name: 'Halla Runólfsdóttir',
    village: 'ravenfell',
    source: { kind: 'laterAct', act: 4 },
    hint: 'Someone kept a second ledger.',
  },
  {
    n: 26,
    year: 250,
    name: 'Božena Stará',
    village: 'mirograd',
    source: { kind: 'laterAct', act: 4 },
    hint: 'Someone kept a second ledger.',
  },
  {
    n: 27,
    year: 252,
    name: 'Štěpán Koláček',
    village: 'mirograd',
    source: { kind: 'laterAct', act: 4 },
    hint: 'Someone kept a second ledger.',
  },
  {
    n: 28,
    year: 254,
    name: 'Lubomír Přívozník',
    village: 'dubno-ford',
    source: { kind: 'letter', hunter: 'ostap', slot: 0 },
    hint: 'Old Ostap had a friend at the ford, once.',
  },
  {
    n: 29,
    year: 256,
    name: 'Ivka Rohová',
    village: 'kozly-hollow',
    source: { kind: 'letter', hunter: 'toma', slot: 0 },
    hint: 'Toma Kettle sold someone his last blue thread.',
  },
  {
    n: 30,
    year: 258,
    name: 'Finn Aslaksson',
    village: 'velkvik',
    source: { kind: 'laterAct', act: 3 },
    hint: 'A Velkvik net-mender knows more than he says.',
  },
  {
    n: 31,
    year: 260,
    name: 'Tadeáš Kopecký',
    village: 'kozly-hollow',
    source: { kind: 'letter', hunter: 'ostap', slot: 1 },
    hint: 'Old Ostap set a broken arm, the winter before a feast.',
  },
  {
    n: 32,
    year: 262,
    name: 'Ulf Sigvaldsson',
    village: 'ravenfell',
    source: { kind: 'laterAct', act: 3 },
    hint: 'A Velkvik net-mender knows more than he says.',
  },
  {
    n: 33,
    year: 264,
    name: 'Hana Dvorská',
    village: 'mirograd',
    source: { kind: 'laterAct', act: 3 },
    hint: 'A Velkvik net-mender knows more than he says.',
  },
  {
    n: 34,
    year: 266,
    name: 'Leif Sveinsson',
    village: 'velkvik',
    source: { kind: 'letter', hunter: 'arvid', slot: 0 },
    hint: "A hunter who hasn't come to the hold yet had a friend called Leif.",
  },
  {
    n: 35,
    year: 268,
    name: 'Tomek Lis',
    village: 'kozly-hollow',
    source: { kind: 'document', id: 'D2-06' },
    hint: 'A journal was left behind in the fells.',
  },
  {
    n: 36,
    year: 270,
    name: 'Tova Eyvindsdóttir',
    village: 'velkvik',
    source: { kind: 'laterAct', act: 3 },
    hint: 'A Velkvik net-mender knows more than he says.',
  },
  {
    n: 37,
    year: 272,
    name: 'Eirik Varn',
    village: 'velkvik',
    source: { kind: 'laterAct', act: 3 },
    hint: 'Someone tore a page out of a ledger.',
  },
  {
    n: 38,
    year: 274,
    name: 'Ylva Ketilsdóttir',
    village: 'ravenfell',
    source: { kind: 'letter', hunter: 'sigrun', slot: 0 },
    hint: "Sigrun Halfhand had a cousin. She doesn't talk about her.",
  },
  {
    n: 39,
    year: 276,
    name: 'Jaro Studnička',
    village: 'mirograd',
    source: { kind: 'ribbonshade', order: 1 },
    hint: 'A mother in Mirograd still writes to the hold.',
  },
  {
    n: 40,
    year: 278,
    name: 'Sigrun Ormsdóttir',
    village: 'ravenfell',
    source: { kind: 'confession', id: 'D2-08' },
    hint: "Halfhand won't say the vow. Ask her again later.",
  },
];

/** The Names view's line for a found name: "Eirik Varn — Velkvik — onward, year 272 of the order." */
export const foundNameLine = (name: string, village: string, year: number): string =>
  `${name} — ${village} — onward, year ${year} of the order.`;

export const MISSING_NAME = '— a name not yet found —';

export const namesFoundLine = (found: number): string => `Names found: ${found} of ${ROLL_SIZE}`;
