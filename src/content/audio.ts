// Technical design §20.2, D520, D524: the seven sounds, one manifest row per file. CC0 only.
// The ids repeat platform/sound's SOUND_IDS (content/ may not import platform/); a test keeps them equal.
export const AUDIO_IDS = [
  'build',
  'launch',
  'place',
  'win',
  'lose',
  'fanfare',
  'nightfall',
] as const;
export type AudioId = (typeof AUDIO_IDS)[number];

export interface AudioEntry {
  readonly id: AudioId;
  /** Under public/assets/. */
  readonly file: string;
  /** Size of the committed file, in bytes. */
  readonly bytes: number;
  readonly pack: string;
  readonly url: string;
  readonly license: 'CC0';
  readonly credit: string;
  /** The clip's file name inside the pack. */
  readonly original: string;
}

const KENNEY = 'Kenney (www.kenney.nl)';

export const audio: readonly AudioEntry[] = [
  {
    id: 'build',
    file: 'audio/build.mp3',
    bytes: 2194,
    pack: 'Impact Sounds',
    url: 'https://kenney.nl/assets/impact-sounds',
    license: 'CC0',
    credit: KENNEY,
    original: 'impactWood_medium_002.ogg',
  },
  {
    id: 'launch',
    file: 'audio/launch.mp3',
    bytes: 2664,
    pack: 'RPG Audio',
    url: 'https://kenney.nl/assets/rpg-audio',
    license: 'CC0',
    credit: KENNEY,
    original: 'drawKnife1.ogg',
  },
  {
    id: 'place',
    file: 'audio/place.mp3',
    bytes: 1410,
    pack: 'Interface Sounds',
    url: 'https://kenney.nl/assets/interface-sounds',
    license: 'CC0',
    credit: KENNEY,
    original: 'drop_003.ogg',
  },
  {
    id: 'win',
    file: 'audio/win.mp3',
    bytes: 5015,
    pack: 'Music Jingles',
    url: 'https://kenney.nl/assets/music-jingles',
    license: 'CC0',
    credit: KENNEY,
    original: 'jingles_PIZZI11.ogg',
  },
  {
    id: 'lose',
    file: 'audio/lose.mp3',
    bytes: 3448,
    pack: 'Interface Sounds',
    url: 'https://kenney.nl/assets/interface-sounds',
    license: 'CC0',
    credit: KENNEY,
    original: 'error_003.ogg',
  },
  {
    id: 'fanfare',
    file: 'audio/fanfare.mp3',
    bytes: 7053,
    pack: 'Music Jingles',
    url: 'https://kenney.nl/assets/music-jingles',
    license: 'CC0',
    credit: KENNEY,
    original: 'jingles_PIZZI03.ogg',
  },
  {
    id: 'nightfall',
    file: 'audio/nightfall.mp3',
    bytes: 7366,
    pack: 'Impact Sounds',
    url: 'https://kenney.nl/assets/impact-sounds',
    license: 'CC0',
    credit: KENNEY,
    original: 'impactBell_heavy_000.ogg',
  },
];

/** D523: all sound files together, at most 30 KB (1 KB = 1,024 bytes). */
export const AUDIO_BYTES_CAP = 30 * 1024;
