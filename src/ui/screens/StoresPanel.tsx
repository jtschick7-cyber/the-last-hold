import { useState } from 'preact/hooks';
import { storesView, type StoresSort } from '../../core/systems/stores-view';
import { dispatch, game, version } from '../app/runtime';
import { ItemLines } from '../sheets/SlotPickerSheet';
import styles from '../styles/ui.module.css';

// GDD §9.16 (v0.8, D326): Stores under Hunters: "23 of 40", sortable by slot and rarity, each item
// with a Salvage button that says exactly what it returns; then the Legendaries found. Items are
// put on from a hunter's sheet (the slot picker).
export const StoresPanel = () => {
  void version.value;
  const [sort, setSort] = useState<StoresSort>('slot');
  const [note, setNote] = useState<string | null>(null);
  const view = storesView(game(), sort);
  return (
    <section class={styles.card}>
      <h2 class={styles.cardTitle}>
        Stores {view.count} of {view.cap}
      </h2>
      <div class={styles.segmented} role="group" aria-label="Sort Stores">
        {(['slot', 'rarity'] as const).map((k) => (
          <button
            type="button"
            key={k}
            class={sort === k ? styles.segmentOn : styles.segment}
            aria-pressed={sort === k}
            onClick={() => setSort(k)}
          >
            By {k}
          </button>
        ))}
      </div>
      {view.rows.length === 0 ? (
        <p class={`${styles.small} ${styles.dim}`}>
          Nothing in Stores. Loot and the Smithy's work wait here until a hunter wears them.
        </p>
      ) : (
        <ul class={styles.list}>
          {view.rows.map((r) => (
            <li key={r.item.id} class={`${styles.row} ${styles.divider}`}>
              <span class={styles.grow}>
                <ItemLines item={r.item} />
              </span>
              <button
                type="button"
                class={styles.btn}
                aria-label={`Salvage ${r.item.name}`}
                onClick={() => {
                  const res = dispatch({ type: 'item.salvage', item: r.item.id });
                  setNote(res.ok ? null : res.reason);
                }}
              >
                Salvage
                <div class={styles.small}>+{r.salvage}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
      {note && <p class={`${styles.small} ${styles.warn}`}>{note}</p>}
      {view.legendaries.length > 0 && (
        <div>
          <h3 class={styles.cardTitle}>Legendaries</h3>
          <ul class={styles.list}>
            {view.legendaries.map((l) => (
              <li key={l.id} class={styles.divider}>
                <strong>{l.name}</strong>{' '}
                <span class={styles.dim}>{l.keptBy ? `· kept by ${l.keptBy}` : '· in Stores'}</span>
                <div class={`${styles.small} ${styles.dim}`}>{l.text}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
