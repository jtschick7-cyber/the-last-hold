import { HUNTER_IDS } from '../../content/hunters';
import { allDocuments } from '../../content/story/acts';
import { ROLL_SIZE } from '../../content/story/roll';
import { WARDEN_NAME_MAX } from '../../content/story/scenes';
import { TRUST_LEVELS, type TrustLevel } from '../../content/story/trust';
import { VILLAGE_IDS, type VillageId } from '../../content/villages';
import {
  FOUND_VIA,
  type ActProgress,
  type FoundDocument,
  type FoundName,
  type ReachedLetter,
  type StoryState,
  type VillageTrust,
} from '../state/story-state';
import {
  arr,
  bool,
  count,
  finite,
  Invalid,
  obj,
  oneOf,
  orNull,
  sparseCounts,
  str,
  type Obj,
} from './guards';

// Technical design §5.2 (v5, plan T5.3): the story's part of the save guard.

const LETTER_HUNTERS = [...HUNTER_IDS, 'arvid'] as const;
const DOCUMENT_IDS = new Set(allDocuments.map((d) => d.id));

const unique = <T>(items: readonly T[], key: (x: T) => string, what: string): void => {
  if (new Set(items.map(key)).size !== items.length) throw new Invalid(`${what} lists one twice.`);
};

const act = (v: unknown, where: string, warnings: string[]): ActProgress => {
  const o = obj(v, where);
  return {
    act: count(o.act, `${where}.act`),
    cycle: count(o.cycle, `${where}.cycle`),
    startedAt: finite(o.startedAt, `${where}.startedAt`),
    wins: count(o.wins, `${where}.wins`),
    winsByVillage: sparseCounts(o.winsByVillage, VILLAGE_IDS, `${where}.winsByVillage`, warnings),
    ruinWins: count(o.ruinWins, `${where}.ruinWins`),
  };
};

const documents = (v: unknown, warnings: string[]): FoundDocument[] => {
  const out: FoundDocument[] = [];
  arr(v, 'story.documents').forEach((x, i) => {
    const where = `story.documents[${i}]`;
    const o = obj(x, where);
    const id = str(o.id, `${where}.id`);
    if (!DOCUMENT_IDS.has(id)) {
      warnings.push(`Dropped unknown document "${id}".`);
      return;
    }
    out.push({
      id,
      cycle: count(o.cycle, `${where}.cycle`),
      at: finite(o.at, `${where}.at`),
      via: oneOf(o.via, FOUND_VIA, `${where}.via`),
    });
  });
  unique(out, (d) => d.id, 'story.documents');
  return out;
};

const names = (v: unknown): FoundName[] => {
  const out = arr(v, 'story.names').map((x, i) => {
    const where = `story.names[${i}]`;
    const o = obj(x, where);
    const n = count(o.n, `${where}.n`);
    if (n < 1 || n > ROLL_SIZE) throw new Invalid(`${where}.n isn't a name on the roll.`);
    return { n, cycle: count(o.cycle, `${where}.cycle`), at: finite(o.at, `${where}.at`) };
  });
  unique(out, (x) => String(x.n), 'story.names');
  return out;
};

const letters = (v: unknown): ReachedLetter[] => {
  const out = arr(v, 'story.letters').map((x, i) => {
    const where = `story.letters[${i}]`;
    const o = obj(x, where);
    const slot = count(o.slot, `${where}.slot`);
    if (slot !== 0 && slot !== 1) throw new Invalid(`${where}.slot isn't 0 or 1.`);
    return {
      hunter: oneOf(o.hunter, LETTER_HUNTERS, `${where}.hunter`),
      slot,
      cycle: count(o.cycle, `${where}.cycle`),
      at: finite(o.at, `${where}.at`),
    } as ReachedLetter;
  });
  unique(out, (l) => `${l.hunter}:${l.slot}`, 'story.letters');
  return out;
};

const trust = (v: unknown): Record<VillageId, VillageTrust> => {
  const o = obj(v, 'story.trust');
  return Object.fromEntries(
    VILLAGE_IDS.map((id) => {
      const where = `story.trust.${id}`;
      const t = obj(o[id], where);
      return [
        id,
        {
          level: oneOf<TrustLevel>(t.level, TRUST_LEVELS, `${where}.level`),
          progress: count(t.progress, `${where}.progress`),
          won: count(t.won, `${where}.won`),
          triumphs: count(t.triumphs, `${where}.triumphs`),
        },
      ];
    }),
  ) as Record<VillageId, VillageTrust>;
};

/** A cycle's warden name (D152): text up to 24 characters, or null while unnamed. */
export const wardenName = (v: unknown, where: string): string | null =>
  orNull(v, (x) => {
    const name = str(x, where);
    if (name.length > WARDEN_NAME_MAX)
      throw new Invalid(`${where} is longer than ${WARDEN_NAME_MAX} characters.`);
    return name;
  });

/** The v5 story part of a save. */
export const storyFrom = (s: Obj, warnings: string[]): StoryState => {
  const o = obj(s.story, 'story');
  const acts = arr(o.acts, 'story.acts').map((x, i) => act(x, `story.acts[${i}]`, warnings));
  unique(acts, (a) => String(a.act), 'story.acts');
  return {
    arrivalDue: bool(o.arrivalDue, 'story.arrivalDue'),
    ilseAt: orNull(o.ilseAt, (x) => finite(x, 'story.ilseAt')),
    acts,
    documents: documents(o.documents, warnings),
    names: names(o.names),
    ribbonshades: count(o.ribbonshades, 'story.ribbonshades'),
    peakLevels: sparseCounts(o.peakLevels, LETTER_HUNTERS, 'story.peakLevels', warnings),
    letters: letters(o.letters),
    trust: trust(o.trust),
    unread: arr(o.unread, 'story.unread').map((x, i) => str(x, `story.unread[${i}]`)),
  };
};
