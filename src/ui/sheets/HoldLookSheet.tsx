import { V18_TEXT } from '../../content/v18-text';
import { holdLookView, type HoldLookEntry } from '../../core/systems/cosmetics';
import { dispatch, game, version } from '../app/runtime';
import { openSheet } from '../app/sheets';
import styles from '../styles/ui.module.css';

// Plan T18.7 (GDD §9.26, Q79): Hold Look sheet lets the warden toggle owned Courtyard Marks
// and bought Riftglass shop cosmetics Shown or Hidden across both HoldGrid and HoldScene.

export const openHoldLook = (): void => {
  openSheet(V18_TEXT.holdLookTitle, () => <HoldLookSheet />);
};

const LookRow = ({ entry }: { readonly entry: HoldLookEntry }) => {
  const sub =
    entry.kind === 'mark'
      ? entry.unlocked
        ? V18_TEXT.earnedSource(entry.source)
        : V18_TEXT.lockedSource(entry.source)
      : entry.unlocked
        ? V18_TEXT.boughtShop
        : V18_TEXT.buyShop;
  const stateLabel = entry.visible ? V18_TEXT.shown : V18_TEXT.hidden;
  return (
    <li
      key={entry.id}
      class={`${styles.row} ${styles.divider}`}
      data-hold-look-row={entry.id}
      style={{ flexWrap: 'wrap', gap: '0.5rem' }}
    >
      <span class={styles.grow} style={{ flex: '1 1 9rem' }}>
        <strong>{entry.name}</strong>
        <br />
        <span class={`${styles.small} ${styles.dim}`}>{sub}</span>
      </span>
      {entry.unlocked ? (
        <button
          type="button"
          class={entry.visible ? styles.segmentOn : styles.btn}
          data-cosmetic-toggle={entry.id}
          aria-pressed={entry.visible}
          aria-label={`${entry.name}: ${stateLabel}`}
          style={{ minWidth: '5.25rem', minHeight: '44px' }}
          onClick={() => dispatch({ type: 'layout.toggleCosmetic', id: entry.id })}
        >
          {stateLabel}
        </button>
      ) : (
        <span
          class={styles.small}
          data-cosmetic-locked={entry.id}
          style={{
            padding: '0.35rem 0.65rem',
            border: '1px solid var(--c-border)',
            borderRadius: '999px',
          }}
        >
          {V18_TEXT.locked}
        </span>
      )}
    </li>
  );
};

export const HoldLookSheet = () => {
  void version.value;
  const look = holdLookView(game());
  return (
    <div data-hold-look-sheet="true">
      <p class={styles.small}>{V18_TEXT.holdLookIntro}</p>
      <section role="region" aria-label={V18_TEXT.courtyardMarks}>
        <h3 class={styles.cardTitle}>{V18_TEXT.courtyardMarks}</h3>
        <ul class={styles.list}>
          {look.marks.map((entry) => (
            <LookRow key={entry.id} entry={entry} />
          ))}
        </ul>
      </section>
      <section role="region" aria-label={V18_TEXT.riftglassShop}>
        <h3 class={styles.cardTitle}>{V18_TEXT.riftglassShop}</h3>
        <ul class={styles.list}>
          {look.shop.map((entry) => (
            <LookRow key={entry.id} entry={entry} />
          ))}
        </ul>
      </section>
    </div>
  );
};
