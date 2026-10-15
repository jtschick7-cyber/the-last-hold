import { resultView } from '../../core/delves/view-run';
import { dispatch, game, version } from '../app/runtime';
import { closeSheet, openSheet } from '../app/sheets';
import styles from '../styles/ui.module.css';
import css from './Delve.module.css';
import { EchoReader } from './EchoReader';

// GDD §9.15 Result: floors cleared; Riftglass earned and the allowance left (or "The rift is
// quiet tonight"); reagents; any Ember-echo (opens in the reader) or relic; a Pechko line.
export const ResultView = () => {
  void version.value;
  const v = resultView(game());
  if (!v) return <p>The rift is quiet.</p>;
  return (
    <div>
      <h3 class={styles.cardTitle}>{v.headline}</h3>
      <p>Floors cleared: {v.floors}</p>
      <p>
        {v.quiet ? (
          <em>The rift is quiet tonight</em>
        ) : (
          <>
            Riftglass earned: <strong>{v.riftglass}</strong>
            <span class={styles.dim}> · waiting for the next run: {v.allowanceLeft}</span>
          </>
        )}
      </p>
      {v.reagents.length > 0 && (
        <p>Reagents: {v.reagents.map((r) => `${r.units} ${r.name}`).join(', ')}</p>
      )}
      {v.xp > 0 && (
        <p>
          Each hunter earned <strong>{v.xp} XP</strong>.
        </p>
      )}
      {v.itemLine && <p class={styles.good}>{v.itemLine}</p>}
      {v.relics.map((r) => (
        <p key={r.name} class={styles.good}>
          <strong>Found: {r.name}.</strong> <span class={styles.dim}>{r.line}</span>
        </p>
      ))}
      {v.echoes.map((e) => (
        <button
          type="button"
          key={e.id}
          class={styles.linkRow}
          onClick={() => openSheet('An Ember-echo', () => <EchoReader echo={e} />)}
        >
          <span class={styles.grow}>
            <strong>An Ember-echo</strong>
            <span class={`${styles.small} ${styles.dim}`}>
              {' '}
              · {e.patronName}, {e.rarityName}
            </span>
          </span>
        </button>
      ))}
      <p class={css.line}>
        <strong>Pechko:</strong> “{v.pechko}”
      </p>
      <button
        type="button"
        class={styles.btnPrimary}
        style={{ width: '100%' }}
        onClick={() => {
          dispatch({ type: 'delve.ackResult' });
          closeSheet();
        }}
      >
        Done
      </button>
    </div>
  );
};
