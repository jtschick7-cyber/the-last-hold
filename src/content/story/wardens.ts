// GDD §5.14.5 (D152): Suggest offers a warden's name from this short list of
// Slavic and Nordic given names. Drafted in T5.1b, collision-checked in T5.2, and
// for the owner's approval in T5.12. None is a name the story already uses, and
// none matches any named character in the influences, even a minor one (D173).

export const wardenNames: readonly string[] = [
  // Slavic
  'Dobromila',
  'Jaromír',
  'Lidmila',
  'Radmila',
  'Slavomír',
  'Svatava',
  'Zbyněk',
  'Drahomíra',
  'Hostivít',
  // Nordic
  'Åsa',
  'Torgny',
  'Steinunn',
  'Sæmund',
  'Sigtrygg',
  'Alfdís',
  'Thorgerd',
  'Gunnvor',
];

// Proper nouns that appear only inside the story's texts (tests/content/find-names.ts).
export const properNouns: readonly string[] = [
  ...wardenNames,
  'Ilse Marrow',
  'Ilse',
  'Halina',
  'Jaro',
  'Věra',
  'Dana Lisová',
  'Tomek',
  'Master Hrafn',
  'Hallvard',
  'Master Bielik',
  'Lubo',
  'Kamenfell',
  'Deep Forge',
  'Varn',
  'Bohdan',
  'Gloamreach',
  'Bořek Hrubý',
  'Ota Sládek',
  'Marie Tkadlecová',
  'Josef Plachý',
];
