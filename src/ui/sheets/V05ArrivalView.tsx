import { useState } from 'preact/hooks';
import { allDocuments } from '../../content/story/acts';
import { ilseArrival, ilseArrivalOldSave } from '../../content/story/scenes';
import { rollOfWardens } from '../../core/story/wardens';
import { dispatch, game, version } from '../app/runtime';
import { openSheet, closeSheet } from '../app/sheets';
import styles from '../styles/ui.module.css';
import { WardenNameField } from '../widgets/WardenNameField';

// GDD §5.14.1, §5.14.3 (D149, D152, D182): a save from before v0.5 meets Ilse on load,
// after any v0.4 arrival. This takes the Hold screen's place until she's been met; only
// More stays open (to export the save first). One name field per warden so far.

/** What Ilse handed over: the documents found in her arrival scene. */
const HandedOver = () => {
  const found = game().story.documents.filter((d) => d.via === 'arrival');
  return (
    <div>
      {found.length === 0 ? (
        <p>She has nothing new for you yet.</p>
      ) : (
        <>
          <p>She hands over what the hold already knows:</p>
          <ul class={styles.list}>
            {found.map((f) => (
              <li key={f.id}>{allDocuments.find((d) => d.id === f.id)?.heading ?? f.id}</li>
            ))}
          </ul>
        </>
      )}
      <p class={styles.small}>Everything she keeps is in the Archive tab.</p>
      <button
        type="button"
        class={styles.btnPrimary}
        style={{ width: '100%' }}
        onClick={closeSheet}
      >
        Onward
      </button>
    </div>
  );
};

export const V05ArrivalView = () => {
  void version.value;
  const lines = rollOfWardens(game());
  const [names, setNames] = useState<Record<number, string>>({});
  const nameOf = (cycle: number): string => names[cycle] ?? '';
  return (
    <div class={styles.card}>
      <h2 class={styles.cardTitle}>Ilse Marrow</h2>
      <p>{ilseArrival}</p>
      <p>
        <em>“{ilseArrivalOldSave}”</em>
      </p>
      <p class={styles.small}>
        Name the wardens who kept the hearth before you. A name left blank is carved “the warden
        before”.
      </p>
      {lines.map((l, i) => (
        <WardenNameField
          key={l.cycle}
          label={`Warden of cycle ${l.cycle} (years ${l.fromYear}–${l.toYear})${l.current ? ', yours' : ''}`}
          value={nameOf(l.cycle)}
          onChange={(v) => setNames({ ...names, [l.cycle]: v })}
          taken={Object.entries(names)
            .filter(([c]) => Number(c) !== l.cycle)
            .map(([, n]) => n)}
          slot={i + 1}
        />
      ))}
      <button
        type="button"
        class={styles.btnPrimary}
        style={{ width: '100%' }}
        onClick={() => {
          if (!dispatch({ type: 'story.arrive', names }).ok) return;
          // Ilse's scene is this view; the opening sheet is for new games only.
          dispatch({ type: 'scene.seen', scene: 'ilse' });
          dispatch({ type: 'scene.seen', scene: 'opening' });
          openSheet('Ilse Marrow', () => <HandedOver />);
        }}
      >
        Begin
      </button>
    </div>
  );
};
