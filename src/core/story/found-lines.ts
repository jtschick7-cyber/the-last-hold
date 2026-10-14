import { hunters, HUNTER_IDS } from '../../content/hunters';
import { allDocuments } from '../../content/story/acts';
import { documentTypeNames } from '../../content/story/documents';
import { roll } from '../../content/story/roll';
import { firstRibbon, laterRibbon, plainRibbon } from '../../content/story/scenes';
import { trustStepLine } from '../../content/story/trust';
import { villages } from '../../content/villages';
import { letters } from '../../content/story/letters';
import type { GameState } from '../state/game-state';
import { ribbonName } from './names';
import { parseTrustKey } from './trust';

// GDD §5.14.2, §5.14.4, §5.14.6: a contract result lists what the story brought as
// keys (`doc:`, `ribbon:`, `letter:`, `trust:`, `name:`); this turns them into the
// one-line texts the away sheet and the results list show. Names have no line of
// their own: the document, ribbon or letter that carries one says it.

export const foundLines = (_state: GameState, keys: readonly string[]): string[] => {
  const out: string[] = [];
  for (const key of keys) {
    const [tag, a, b] = key.split(':');
    if (tag === 'doc') {
      const doc = allDocuments.find((d) => d.id === a);
      if (doc) {
        out.push(
          `A ${documentTypeNames[doc.type].toLowerCase()} came with the bounty: '${doc.heading}'.`,
        );
      }
    } else if (tag === 'ribbon') {
      const count = Number(a);
      const n = ribbonName(count);
      const name = n === null ? null : (roll.find((r) => r.n === n)?.name ?? null);
      out.push(count === 1 ? firstRibbon : name === null ? plainRibbon : laterRibbon(name));
    } else if (tag === 'letter') {
      const id = HUNTER_IDS.find((h) => h === a);
      const written = letters.find((l) => l.hunter === id && String(l.slot) === b)?.body;
      if (id && written) out.push(`${hunters[id].shortName} wrote you a letter.`);
    } else if (tag === 'trust') {
      const step = parseTrustKey(key);
      if (step) out.push(trustStepLine(villages[step.village].name, step.level));
    }
  }
  return out;
};
