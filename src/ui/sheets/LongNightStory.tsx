import { useEffect } from 'preact/hooks';
import { emberRemembers } from '../../content/skills';
import { arvidArrival } from '../../content/story/act3';
import { act4Arrival } from '../../content/story/act4';
import { act5Arrival } from '../../content/story/act5';
import { bandLabels, ilseReturns } from '../../content/story/scenes';
import { skillViews } from '../../core/skills/skills';
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

/** The act's testament (with any line the stand adds after it), or the unwritten-act line. */
export const Testament = ({
  act,
  note = null,
}: {
  act: DocumentDef | string | null;
  note?: string | null;
}) => {
  const doc = typeof act === 'object' && act !== null && isFound(game(), act.id) ? act : null;
  useRead(doc ? [doc.id] : []);
  if (doc)
    return (
      <>
        <DocumentReader id={doc.id} />
        {note && (
          <p class={styles.small}>
            <em>{note}</em>
          </p>
        )}
      </>
    );
  return (
    <p>
      <em>{typeof act === 'string' || act === null ? UNWRITTEN_ACT_LINE : ''}</em>
    </p>
  );
};

/** The closing scene the new warden's arrival brought, Ilse's return (with Arvid when Act III begins), then D3-01. */
export const WardenScenes = ({ stand }: { stand: StandRecord }) => {
  const s = game();
  const ids = s.story.documents
    .filter((d) => d.via === 'warden' && d.at === stand.at)
    .map((d) => d.id);
  useRead(ids);
  // D3-01 plays after Ilse's line, which names Arvid (GDD §5.14.3, D211).
  const arvid = ids.includes('D3-01');
  // D4-01 and D5-01 play after Pechko's line, which names the oilcloth bundle or the crack (GDD §5.14.3, D245, D302).
  const opening = ids.includes('D5-01') ? 'D5-01' : ids.includes('D4-01') ? 'D4-01' : null;
  return (
    <>
      {ids
        .filter((id) => id !== 'D3-01' && id !== opening)
        .map((id) => (
          <DocumentReader key={id} id={id} />
        ))}
      {s.story.ilseAt !== null && (
        <p class={styles.small}>
          <em>
            {opening === 'D5-01'
              ? act5Arrival
              : opening === 'D4-01'
                ? act4Arrival
                : arvid
                  ? arvidArrival
                  : ilseReturns}
          </em>
        </p>
      )}
      {arvid && <DocumentReader id="D3-01" />}
      {opening && <DocumentReader id={opening} />}
      <p class={styles.small}>
        {emberRemembers(skillViews(s).map((v) => ({ name: v.name, level: v.level })))}
      </p>
    </>
  );
};
