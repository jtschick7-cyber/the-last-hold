// Plan T10.9, lore §33 Part F: the automated checks on the Orders' texts. `checkText` returns the
// violations it finds in one text (an empty list means it passes); the content test runs it on every
// text and on planted bad texts to prove each check can fail.
import { CONSUMABLE_IDS, consumables } from '../../src/content/consumables';
import { hunters, HUNTER_IDS } from '../../src/content/hunters';
import { roll } from '../../src/content/story/roll';
import { villages } from '../../src/content/villages';

export type TextKind = 'opening' | 'chapter' | 'perk';

const FORBIDDEN = [
  'ash',
  'ashen',
  'ashes',
  'cinder',
  'cinders',
  'kindle',
  'kindled',
  'tithe',
  'bonfire',
  'throne',
  'soul',
  'souls',
  'fed',
  'feeding',
];
const RELATIVE_YEAR =
  /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|twenty)\s+(years?|springs?|winters?)\s+(ago|before|since|later)\b|\byears ago\b|\blong ago\b/i;
const SENT_PHRASES = [
  'say the names',
  'speak the names',
  'read the names',
  'their names',
  'the forty',
  'the sent',
];
const OPENING_WORDS = ['Sent', 'Sending', 'Deep', 'Forge', 'Drowned Bell'];

/** People who may speak or be named in an Orders text (Part F, check 5). */
export const ALLOWED_PEOPLE = [
  'Marta Dubska',
  'Marta',
  'Bohdan Kozel',
  'Bohdan',
  'Ilona Sváteková',
  'Ilona',
  'Gunnar Ravnsson',
  'Gunnar',
  'Sólveig Arnadóttir',
  'Sólveig',
  'Vesna',
  'Ostap',
  'Brana',
  'Pechko',
  'Halina',
  'Dana Lisová',
  'Dana',
  'Věra',
  'Ilse',
  'Ilse Marrow',
];
const PLACES = [...Object.values(villages).map((v) => v.name), 'Stanholm'];
/** Capitalised phrases that are not people: the Orders and the village names. */
const noPossessive = (s: string): string => s.replace(/['’]s\b/g, '');
const ALLOWED_PHRASES = [
  ...ALLOWED_PEOPLE,
  ...PLACES,
  'Grey Wife',
  'Grey Wives',
  'Roll of Honor',
  ...CONSUMABLE_IDS.map((id) => consumables[id].name), // brews are named in the Grey Wives' hints
].map(noPossessive);

const escape = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hasWord = (text: string, word: string, caseSensitive = false): boolean =>
  new RegExp(`(?<![\\p{L}-])${escape(word)}(?![\\p{L}-])`, caseSensitive ? 'u' : 'iu').test(text);

/** The forty names, whole, and the surname alone for the four whose surname is distinctive. */
export const sentNames = (): string[] => {
  const full = roll.map((r) => r.name);
  const surnames = full
    .filter((n) => ['Tomek Lis', 'Eirik Varn', 'Jaro Studnička', 'Sigrun Ormsdóttir'].includes(n))
    .map((n) => n.split(' ').slice(1).join(' '));
  return [...full, ...surnames];
};

/** Other named people in the game (the hunters) who may not turn up in an Orders text. */
const otherPeople = (): string[] =>
  HUNTER_IDS.flatMap((id) => [hunters[id].name, hunters[id].shortName]).filter(
    (n) => !ALLOWED_PEOPLE.includes(n) && n !== 'Vesna of the Weir',
  );

const CAPITAL_RUN = /(?:[\p{Lu}][\p{L}'’-]*)(?: [\p{Lu}][\p{L}'’-]*)+/gu;

export const checkText = (text: string, kind: TextKind): string[] => {
  const bad: string[] = [];
  for (const w of FORBIDDEN) if (hasWord(text, w)) bad.push(`forbidden word "${w}"`);
  for (const m of text.matchAll(/\bhollow\b/gi)) {
    const at = m.index ?? 0;
    const ok =
      /Kozly $/.test(text.slice(0, at)) ||
      (m[0] === 'Hollow' && /\bthe $/i.test(text.slice(0, at)));
    if (!ok) bad.push('"hollow" outside Kozly Hollow or the Hollow');
  }
  if (RELATIVE_YEAR.test(text)) bad.push('a relative year');
  for (const n of sentNames()) if (hasWord(text, n, true)) bad.push(`a name from the roll: ${n}`);
  for (const p of SENT_PHRASES) if (text.toLowerCase().includes(p)) bad.push(`the phrase "${p}"`);
  for (const n of otherPeople()) if (hasWord(text, n, true)) bad.push(`an unknown person: ${n}`);
  for (const run of text.matchAll(CAPITAL_RUN)) {
    // A leading article only starts a sentence ("The Roll"), and a possessive is not part of a name.
    const words = noPossessive(run[0]).split(' ');
    while (words[0] !== undefined && ['The', 'A', 'An'].includes(words[0])) words.shift();
    if (words.length < 2) continue;
    // A run is fine if it splits into allowed phrases; any other run of capitals reads as an unknown person.
    const unknown = (ws: string[]): boolean => {
      let rest = ws.join(' ');
      for (const a of [...ALLOWED_PHRASES].sort((x, y) => y.length - x.length))
        rest = rest.split(a).join('|');
      return rest.replace(/[| ]/g, '') !== '';
    };
    if (!unknown(words)) continue;
    // An ordinary word that only starts a sentence ("Then Marta") is not part of the name after it.
    const at = run.index ?? 0;
    const startsSentence = /(^|[.?!"“]\s*)$/.test(text.slice(0, at));
    if (startsSentence && !unknown(words.slice(1))) continue;
    bad.push(`an unknown person or name: ${words.join(' ')}`);
  }
  if (kind === 'opening') {
    for (const w of OPENING_WORDS)
      if (hasWord(text, w, true)) bad.push(`opening-scene word "${w}"`);
    if (hasWord(text, 'seal')) bad.push('opening-scene word "seal"');
  }
  return bad;
};
