import { rememberingCard } from '../../content/text/remembering';
import { rememberingCardView } from '../../core/story/remembering-view';
import { dispatch, game, version } from '../app/runtime';
import { openArchiveSection } from '../screens/ArchiveScreen';
import styles from '../styles/ui.module.css';

// GDD §5.15.2, §9.19 (D450): the quiet card on the Hold screen. Plain lines, no bar, no percentage,
// no countdown. Hidden until Pechko's scene has been seen. The two choices of the open form and the
// "Read it again" button are wired with the ending itself (T11.5, T11.13).
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
              onClick={() => dispatch({ type: 'remembering.choose', ending: 'remember' })}
            >
              {c.open.remember.name}
            </button>
            <p class={styles.small}>{c.open.remember.text}</p>
            <button
              type="button"
              class={styles.btn}
              onClick={() => dispatch({ type: 'remembering.choose', ending: 'vigil' })}
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
            onClick={() => dispatch({ type: 'remembering.choose', ending: 'remember' })}
          >
            {c.afterVigil.remember}
          </button>
        </>
      )}
      {v.form === 'afterRemember' && <p>{c.afterRemember.line}</p>}
    </section>
  );
};
