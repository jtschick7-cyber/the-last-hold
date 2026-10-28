import { DESCENT_STRINGS } from '../../content/descent-text';
import { rememberingCard } from '../../content/text/remembering';
import { rememberingCardView } from '../../core/story/remembering-view';
import { dispatch, game, version } from '../app/runtime';
import { openArchiveSection } from '../screens/ArchiveScreen';
import { playEnding } from './ReadingScene';
import { openDescentSheet } from '../sheets/DescentSheet';
import { openVigilScene } from './VigilScene';
import styles from '../styles/ui.module.css';

// GDD §5.15.2, §9.19 (D450): the quiet card on the Hold screen. Plain lines, no bar, no percentage,
// no countdown. Hidden until Pechko's scene has been seen. The after-choice forms do not depend on the gate (D461 (5)).
export const RememberingCard = () => {
  void version.value;
  const v = rememberingCardView(game());
  if (!v) return null;
  const c = rememberingCard;
  return (
    <section class={styles.card} aria-label={c.title}>
      <h2 class={styles.cardTitle}>{c.title}</h2>
      {v.form === 'notOpen' && (
        <>
          {v.counts.map((line) => (
            <p key={line}>{line}</p>
          ))}
          {v.missing && <p>{v.missing}</p>}
          <p>
            <em>{c.notOpen.near}</em>
          </p>
          <div class={styles.row}>
            <button type="button" class={styles.btn} onClick={() => openArchiveSection('Names')}>
              {c.notOpen.names} ▸
            </button>
            <button type="button" class={styles.btn} onClick={() => openArchiveSection('Bestiary')}>
              {c.notOpen.bestiary} ▸
            </button>
          </div>
        </>
      )}
      {v.form === 'open' && (
        <>
          <p>{c.open.line}</p>
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <button
              type="button"
              class={styles.btnPrimary}
              onClick={() => {
                if (dispatch({ type: 'remembering.choose', ending: 'remember' }).ok) playEnding();
              }}
            >
              {c.open.remember.name}
            </button>
            <p class={styles.small}>{c.open.remember.text}</p>
            {v.descentAvailable && (
              <button type="button" class={styles.btn} onClick={openDescentSheet}>
                {DESCENT_STRINGS.button}
              </button>
            )}
            <button
              type="button"
              class={styles.btn}
              onClick={() => {
                if (dispatch({ type: 'remembering.choose', ending: 'vigil' }).ok) openVigilScene();
              }}
            >
              {c.open.vigil.name}
            </button>
            <p class={styles.small}>{c.open.vigil.text}</p>
          </div>
        </>
      )}
      {v.form === 'afterVigil' && (
        <>
          <p>{c.afterVigil.line}</p>
          <button
            type="button"
            class={styles.btnPrimary}
            onClick={() => {
              if (dispatch({ type: 'remembering.choose', ending: 'remember' }).ok) playEnding();
            }}
          >
            {c.afterVigil.remember}
          </button>
          {v.descentAvailable && (
            <button type="button" class={styles.btn} onClick={openDescentSheet}>
              {DESCENT_STRINGS.button}
            </button>
          )}
        </>
      )}
      {v.form === 'afterRemember' && (
        <>
          <p>{c.afterRemember.line}</p>
          {v.descentWon && <p>{DESCENT_STRINGS.scattered}</p>}
          <div class={styles.row} style={{ flexWrap: 'wrap' }}>
            <button type="button" class={styles.btn} onClick={playEnding}>
              {c.afterRemember.again}
            </button>
            {v.descentAvailable && (
              <button type="button" class={styles.btn} onClick={openDescentSheet}>
                {v.descentWon ? DESCENT_STRINGS.again : DESCENT_STRINGS.button}
              </button>
            )}
          </div>
        </>
      )}
      {v.form === 'afterDescent' && (
        <>
          <p>{DESCENT_STRINGS.scattered}</p>
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            {v.descentAvailable && (
              <button type="button" class={styles.btn} onClick={openDescentSheet}>
                {DESCENT_STRINGS.again}
              </button>
            )}
            <button
              type="button"
              class={styles.btnPrimary}
              onClick={() => {
                if (dispatch({ type: 'remembering.choose', ending: 'remember' }).ok) playEnding();
              }}
            >
              {c.afterVigil.remember}
            </button>
            {!v.vigilChosen && (
              <button
                type="button"
                class={styles.btn}
                onClick={() => {
                  if (dispatch({ type: 'remembering.choose', ending: 'vigil' }).ok)
                    openVigilScene();
                }}
              >
                {c.open.vigil.name}
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
};
