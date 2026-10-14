import { useEffect } from 'preact/hooks';
import { bandLabels, ilseReturns } from '../../content/story/scenes';
import { trustStepLine } from '../../content/story/trust';
import { UNWRITTEN_ACT_LINE } from '../../content/story/acts';
import type { DocumentDef } from '../../content/story/documents';
import { villages } from '../../content/villages';
import type { StandRecord } from '../../core/state/game-state';
import { docKey, isFound } from '../../core/story/documents';
import { parseTrustKey } from '../../core/story/trust';
import { residentLines } from '../../core/story/wardens';
import { dispatch, game } from '../app/runtime';
import styles from '../styles/ui.module.css';
import { DocumentReader } from '../screens/ArchiveScreen';

// GDD §5.14.8–§5.14.9 (D145): what the story adds to the Long Night sheets, in order:
// the stand's band, the residents' lines and any trust steps; the act's testament;
// on the new-warden sheet, the act's closing scene and Ilse's return.

/** The stand's band, from the waves it held. */
export const BandLine = ({ stand }: { stand: StandRecord }) => (
  <p>
    <strong>{bandLabels[stand.band]}</strong>
  </p>
);

/** One line each from Pechko and Brana for the band, then any trust steps the stand brought. */
export const ResidentsAndTrust = ({ stand }: { stand: StandRecord }) => {
  const lines = residentLines(stand.seed, stand.band);
  return (
    <>
      <p class={styles.small}>
        <strong>Pechko:</strong> “{lines.pechko}”
      </p>
      <p class={styles.small}>
        <strong>Brana:</strong> “{lines.brana}”
      </p>
      {stand.trustSteps.length > 0 && (
        <ul class={styles.list}>
          {stand.trustSteps.map((k) => {
            const step = parseTrustKey(k);
            return step ? (
              <li key={k} class={styles.small}>
                {trustStepLine(villages[step.village].name, step.level)}
              </li>
            ) : null;
          })}
        </ul>
      )}
    </>
  );
};

/** Opening a document in the Long Night view counts as reading it (clears its badge). */
const useRead = (ids: readonly string[]): void => {
  useEffect(() => {
    for (const id of ids) {
      if (game().story.unread.includes(docKey(id))) {
        dispatch({ type: 'archive.read', key: docKey(id) });
      }
    }
  }, [ids.join()]);
};

/** The act's testament, or the unwritten-act line. */
export const Testament = ({ act }: { act: DocumentDef | string | null }) => {
  const doc = typeof act === 'object' && act !== null && isFound(game(), act.id) ? act : null;
  useRead(doc ? [doc.id] : []);
  if (doc) return <DocumentReader id={doc.id} />;
  return (
    <p>
      <em>{typeof act === 'string' || act === null ? UNWRITTEN_ACT_LINE : ''}</em>
    </p>
  );
};

/** The closing scene the new warden's arrival brought, and Ilse's return. */
export const WardenScenes = ({ stand }: { stand: StandRecord }) => {
  const s = game();
  const ids = s.story.documents
    .filter((d) => d.via === 'warden' && d.at === stand.at)
    .map((d) => d.id);
  useRead(ids);
  return (
    <>
      {ids.map((id) => (
        <DocumentReader key={id} id={id} />
      ))}
      {s.story.ilseAt !== null && (
        <p class={styles.small}>
          <em>{ilseReturns}</em>
        </p>
      )}
    </>
  );
};
