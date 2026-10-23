// Reads docs/flesh-out/v1.2/sound-marks.md: the map from audition number to pack, original file and
// slot, and the owner's picks (D524 (2), technical design §20.2).
export const SOUND_IDS = [
  'build',
  'launch',
  'place',
  'win',
  'lose',
  'fanfare',
  'nightfall',
] as const;
export type SoundId = (typeof SOUND_IDS)[number];

export interface Candidate {
  n: number;
  slot: SoundId;
  pack: string;
  /** Path inside the unzipped pack, e.g. `Audio/impactWood_heavy_000.ogg`. */
  file: string;
  /** Longest length for this slot in seconds (D524 (2)). */
  maxSeconds: number;
}

export interface SoundMarks {
  candidates: Candidate[];
  /** One entry per slot: the picked candidate number, or null while not chosen. */
  picks: Record<SoundId, number | null>;
}

const isSlot = (s: string): s is SoundId => (SOUND_IDS as readonly string[]).includes(s);

const cells = (line: string): string[] =>
  line
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim());

export const parseSoundMarks = (md: string): SoundMarks => {
  const candidates: Candidate[] = [];
  const picks = Object.fromEntries(SOUND_IDS.map((s) => [s, null])) as Record<
    SoundId,
    number | null
  >;
  let inPicks = false;
  for (const line of md.split('\n')) {
    if (line.startsWith('## Pick')) inPicks = true;
    if (!line.startsWith('|')) continue;
    const c = cells(line);
    if (inPicks) {
      const slot = c[0] ?? '';
      if (isSlot(slot)) {
        const n = Number(c[1]);
        picks[slot] = c[1] !== '' && Number.isInteger(n) ? n : null;
      }
      continue;
    }
    const [n, slot, pack, file, max] = c;
    if (!/^\d+$/.test(n ?? '') || !slot || !isSlot(slot) || !pack || !file || !max) continue;
    candidates.push({
      n: Number(n),
      slot,
      pack,
      file: file.replaceAll('`', ''),
      maxSeconds: Number(max),
    });
  }
  return { candidates, picks };
};
