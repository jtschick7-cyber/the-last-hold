import { useState } from 'preact/hooks';
import { roleNames, type HunterId } from '../../content/hunters';
import { entryView } from '../../core/delves/view';
import { dispatch, game, version } from '../app/runtime';
import { closeSheet, openSheet } from '../app/sheets';
import styles from '../styles/ui.module.css';
import { Num } from '../widgets/Num';
import { DelveView } from './DelveView';
import css from './Delve.module.css';

// GDD §9.15 Entry sheet: three slots with the suggested three, hunters who cannot go greyed with
// the reason, the depth, the allowance, and Start.
export const EntrySheet = () => {
  void version.value;
  const v = entryView(game());
  const [party, setParty] = useState<HunterId[]>([...v.suggested]);
  const [error, setError] = useState<string | null>(null);
  const toggle = (id: HunterId): void => {
    setError(null);
    setParty((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : p.length < v.partySize ? [...p, id] : p,
    );
  };
  const ready = party.length === v.partySize;
  return (
    <div>
      <p>{v.depth}</p>
      <p class={styles.small}>
        {v.quiet ? (
          <span class={styles.dim}>
            The rift is quiet tonight: a run pays no Riftglass, but still pays reagents.
          </span>
        ) : (
          <>
            <Num
              text={`Riftglass waiting: ${v.allowance.value}`}
              breakdown={() => v.allowance.breakdown}
            />{' '}
            <span class={styles.dim}>pays out as floors are cleared</span>
          </>
        )}
      </p>
      {v.chosenStart && (
        <p class={styles.small}>Chosen start: you will pick the first patron after Start.</p>
      )}
      <div class={css.slots}>
        {Array.from({ length: v.partySize }, (_, i) => {
          const id = party[i];
          const row = v.rows.find((r) => r.id === id);
          return (
            <div key={i} class={`${css.slot} ${id ? css.slotFull : ''}`}>
              {row ? row.name.split(' ')[0] : 'Empty'}
            </div>
          );
        })}
      </div>
      <div class={styles.row}>
        <h3 class={`${styles.cardTitle} ${styles.grow}`}>
          Party ({party.length}/{v.partySize})
        </h3>
        <button type="button" class={styles.btn} onClick={() => setParty([...v.suggested])}>
          Suggest
        </button>
      </div>
      <ul class={styles.list}>
        {v.rows.map((r) => (
          <li key={r.id} class={styles.divider}>
            <label class={styles.row} style={r.problem ? { opacity: 0.55 } : undefined}>
              <input
                type="checkbox"
                checked={party.includes(r.id)}
                disabled={r.problem !== null}
                onChange={() => toggle(r.id)}
              />
              <span class={styles.grow}>
                {r.name}{' '}
                <span class={`${styles.small} ${styles.dim}`}>
                  {roleNames[r.role as keyof typeof roleNames]} · Lv {r.level}
                  {r.problem ? ` · ${r.problem}` : ''}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      {error && <p class={styles.warn}>{error}</p>}
      <button
        type="button"
        class={styles.btnPrimary}
        style={{ width: '100%', marginTop: 'var(--space-3)' }}
        disabled={!ready}
        onClick={() => {
          const r = dispatch({ type: 'delve.start', party });
          if (!r.ok) return setError(r.reason);
          closeSheet();
          openSheet('Delve', () => <DelveView />);
        }}
      >
        Start
      </button>
    </div>
  );
};
