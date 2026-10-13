// GDD §9.1 / technical design §10: the CC0 pixel font for headings and the
// resource bar (Q1, D55). Served from public/fonts/ and credited in credits.md.
export interface FontEntry {
  readonly name: string;
  readonly file: string;
  readonly pack: string;
  readonly url: string;
  readonly license: 'CC0';
  readonly credit: string;
}

export const fonts: readonly FontEntry[] = [
  {
    name: 'Kenney Pixel',
    file: 'fonts/kenney-pixel.ttf',
    pack: 'Kenney Fonts',
    url: 'https://kenney.nl/assets/kenney-fonts',
    license: 'CC0',
    credit: 'Kenney (www.kenney.nl)',
  },
];
